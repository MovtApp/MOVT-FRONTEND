package com.dsvmTechnology.movtapp

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import android.util.Log
import androidx.core.app.NotificationCompat

/**
 * MOVTForegroundService — Foreground Service do treino (Android).
 *
 * WAKELOCK NO PROCESSO NATIVO
 * O WakeLock parcial agora vive AQUI, dentro do serviço nativo, e não no
 * módulo JS (MOVTServiceModule). Isso é crítico: quando o Android suspende o
 * processo JS (Hermes) com Doze/App Standby, o WakeLock criado no JS é
 * liberado automaticamente junto com o processo. Um WakeLock criado no
 * Foreground Service, por outro lado, persiste enquanto o serviço estiver
 * em foreground — que é exatamente o comportamento correto durante um treino.
 *
 * O MOVTServiceModule ainda expõe acquireWakeLock/releaseWakeLock para
 * compatibilidade e como fallback, mas o lock primário é este aqui.
 *
 * START_REDELIVER_INTENT
 * Retorna START_REDELIVER_INTENT em vez de START_STICKY: o SO re-entrega o
 * último Intent ao reiniciar o serviço após uma morte, garantindo que title/body
 * da notificação sejam restaurados. Como fallback adicional, salvamos title/body
 * em SharedPreferences no onStartCommand e os lemos quando o intent vier null.
 */
class MOVTForegroundService : Service() {

    // WakeLock parcial: mantém a CPU acordada durante o treino mesmo com a tela
    // apagada (Doze). Adquirido ao entrar em foreground, liberado no onDestroy.
    private var wakeLock: PowerManager.WakeLock? = null

    override fun onCreate() {
        super.onCreate()
        ensureChannel(this)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // Lê title/body do intent. Se o intent vier null (restart pelo SO com
        // START_STICKY/REDELIVER), cai nas SharedPreferences salvas anteriormente.
        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val title = intent?.getStringExtra("title")
            ?: prefs.getString(PREF_TITLE, "MOVT - Treino em Andamento")
            ?: "MOVT - Treino em Andamento"
        val body = intent?.getStringExtra("body")
            ?: prefs.getString(PREF_BODY, "Acompanhando seus dados e localização...")
            ?: "Acompanhando seus dados e localização..."

        // Persiste para sobreviver ao restart do serviço.
        prefs.edit()
            .putString(PREF_TITLE, title)
            .putString(PREF_BODY, body)
            .apply()

        val notification = buildNotification(this, title, body)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            var foregroundType = 0

            val hasLocation = androidx.core.content.ContextCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION) == android.content.pm.PackageManager.PERMISSION_GRANTED ||
                              androidx.core.content.ContextCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_COARSE_LOCATION) == android.content.pm.PackageManager.PERMISSION_GRANTED
            if (hasLocation) {
                foregroundType = foregroundType or ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION
            }

            // O tipo connectedDevice só pode ser usado se BLUETOOTH_CONNECT/SCAN
            // estiverem concedidos em runtime (exigência do Android 12+). Em
            // Android 14/15 o sistema lança SecurityException fatal se o tipo for
            // declarado sem a permissão correspondente.
            val hasBluetooth = androidx.core.content.ContextCompat.checkSelfPermission(this, android.Manifest.permission.BLUETOOTH_CONNECT) == android.content.pm.PackageManager.PERMISSION_GRANTED ||
                               androidx.core.content.ContextCompat.checkSelfPermission(this, android.Manifest.permission.BLUETOOTH_SCAN) == android.content.pm.PackageManager.PERMISSION_GRANTED
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                if (hasBluetooth) {
                    foregroundType = foregroundType or ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE
                }
            } else if (hasBluetooth) {
                // Em Android 10/11 o BLUETOOTH legado é normal-permission (sempre
                // concedida), então só adicionamos o tipo se houver BT disponível.
                foregroundType = foregroundType or ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE
            }

            startForegroundSafely(notification, foregroundType)
        } else {
            startForegroundSafely(notification, 0)
        }

        // Adquire o WakeLock nativo logo após startForeground. Se já estiver
        // adquirido (onStartCommand chamado para atualizar a notificação), é
        // idempotente (setReferenceCounted=false).
        acquireNativeWakeLock()

        // START_REDELIVER_INTENT: o SO re-entrega o último Intent ao reiniciar
        // o serviço. É mais robusto que START_STICKY (que entrega intent=null).
        return START_REDELIVER_INTENT
    }

    /**
     * Adquire o WakeLock parcial neste processo de serviço (nativo). Idempotente.
     * Timeout de 4 h como safety net (nenhum treino dura mais que isso normalmente);
     * o onDestroy libera antes se o serviço for parado corretamente.
     */
    private fun acquireNativeWakeLock() {
        try {
            if (wakeLock?.isHeld == true) return
            val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
            val wl = pm.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK,
                "MOVT:WorkoutForegroundService"
            )
            wl.setReferenceCounted(false)
            // Safety timeout: 4 horas. Evita leak se o serviço for morto abruptamente
            // sem passar pelo onDestroy (ex.: force-stop pelo usuário).
            wl.acquire(4 * 60 * 60 * 1000L)
            wakeLock = wl
            Log.d("MOVTForegroundService", "WakeLock nativo adquirido.")
        } catch (e: Exception) {
            Log.w("MOVTForegroundService", "Falha ao adquirir WakeLock nativo: ${e.message}")
        }
    }

    /**
     * Libera o WakeLock nativo. Chamado no onDestroy para garantir que o lock
     * não vaze após o fim do treino.
     */
    private fun releaseNativeWakeLock() {
        try {
            wakeLock?.let { if (it.isHeld) it.release() }
            wakeLock = null
            Log.d("MOVTForegroundService", "WakeLock nativo liberado.")
        } catch (e: Exception) {
            Log.w("MOVTForegroundService", "Falha ao liberar WakeLock nativo: ${e.message}")
        }
    }

    override fun onDestroy() {
        releaseNativeWakeLock()
        // Limpa as SharedPreferences salvas (treino encerrado).
        getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).edit().clear().apply()
        super.onDestroy()
    }

    /**
     * Inicia o serviço em foreground tolerando falhas. Em Android 14+ o sistema
     * pode lançar SecurityException se o tipo declarado exigir uma permissão que
     * não está concedida no exato momento do start. Em vez de derrubar o app,
     * tentamos degradar o tipo (location-only -> sem tipo) e, em último caso,
     * encerramos o serviço silenciosamente.
     */
    private fun startForegroundSafely(notification: Notification, foregroundType: Int) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && foregroundType != 0) {
                startForeground(NOTIFICATION_ID, notification, foregroundType)
            } else {
                startForeground(NOTIFICATION_ID, notification)
            }
        } catch (e: Exception) {
            Log.w("MOVTForegroundService", "Falha ao iniciar FGS com tipo=$foregroundType: ${e.message}")
            // Fallback 1: tenta apenas com LOCATION (se fazia parte do tipo original)
            val locationOnly = foregroundType and ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && locationOnly != 0 && locationOnly != foregroundType) {
                    startForeground(NOTIFICATION_ID, notification, locationOnly)
                    return
                }
            } catch (e2: Exception) {
                Log.w("MOVTForegroundService", "Falha no fallback location-only: ${e2.message}")
            }
            // Fallback 2: tenta sem tipo
            try {
                startForeground(NOTIFICATION_ID, notification)
            } catch (e3: Exception) {
                // Fallback final: não foi possível iniciar em foreground; encerra
                // para evitar crash e deixa o app continuar em background.
                Log.e("MOVTForegroundService", "Não foi possível iniciar FGS, encerrando: ${e3.message}")
                stopSelf()
            }
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    companion object {
        const val CHANNEL_ID = "movt_workout_channel"
        const val NOTIFICATION_ID = 1001

        // SharedPreferences para persistir title/body entre restarts do serviço.
        private const val PREFS_NAME = "movt_fgs_prefs"
        private const val PREF_TITLE = "notif_title"
        private const val PREF_BODY = "notif_body"

        /** Cria o canal de notificação do treino (idempotente). */
        fun ensureChannel(context: Context) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val serviceChannel = NotificationChannel(
                    CHANNEL_ID,
                    "Monitoramento de Treinos MOVT",
                    NotificationManager.IMPORTANCE_LOW
                )
                val manager = context.getSystemService(NotificationManager::class.java)
                manager?.createNotificationChannel(serviceChannel)
            }
        }

        /**
         * Constrói o card ("live activity") do treino. Compartilhado entre o serviço
         * (startForeground, no início) e o MOVTServiceModule.updateNotification
         * (NotificationManagerCompat.notify, a cada atualização de stats). Manter o
         * MESMO CHANNEL_ID/NOTIFICATION_ID faz a atualização substituir o card
         * existente — inclusive com a tela bloqueada, sem re-tocar no estado do FGS
         * (o que dispararia ForegroundServiceStartNotAllowed em background).
         * `setOnlyAlertOnce` evita som/vibração a cada atualização por segundo.
         */
        fun buildNotification(context: Context, title: String, body: String): Notification {
            val notificationIntent = Intent(context, MainActivity::class.java)
            val pendingIntent = PendingIntent.getActivity(
                context,
                0,
                notificationIntent,
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
            )
            return NotificationCompat.Builder(context, CHANNEL_ID)
                .setContentTitle(title)
                .setContentText(body)
                .setSmallIcon(context.applicationContext.resources.getIdentifier("ic_launcher", "mipmap", context.packageName))
                .setContentIntent(pendingIntent)
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .build()
        }
    }
}
