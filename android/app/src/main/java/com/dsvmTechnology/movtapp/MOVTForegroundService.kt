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
import android.util.Log
import androidx.core.app.NotificationCompat

class MOVTForegroundService : Service() {

    private val CHANNEL_ID = "movt_workout_channel"
    private val NOTIFICATION_ID = 1001

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val title = intent?.getStringExtra("title") ?: "MOVT - Treino em Andamento"
        val body = intent?.getStringExtra("body") ?: "Acompanhando seus dados e localização..."

        val notificationIntent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            notificationIntent,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
        )

        val notification: Notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(body)
            .setSmallIcon(applicationContext.resources.getIdentifier("ic_launcher", "mipmap", packageName))
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build()

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

        return START_STICKY
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

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val serviceChannel = NotificationChannel(
                CHANNEL_ID,
                "Monitoramento de Treinos MOVT",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(serviceChannel)
        }
    }
}
