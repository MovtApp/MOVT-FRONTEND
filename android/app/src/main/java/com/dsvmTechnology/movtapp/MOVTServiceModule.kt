package com.dsvmTechnology.movtapp

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import android.util.Log
import android.Manifest
import android.content.pm.PackageManager
import androidx.core.content.ContextCompat
import androidx.core.app.ActivityCompat
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class MOVTServiceModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    // WakeLock parcial mantido durante o treino: impede o SO (Doze) de suspender a
    // CPU com a tela apagada, garantindo que a task headless do expo-location
    // continue processando os fixes de GPS. Liberado no fim do treino.
    private var wakeLock: PowerManager.WakeLock? = null

    override fun getName(): String {
        return "MOVTServiceModule"
    }

    @ReactMethod
    fun startService(title: String, body: String) {
        val context = reactApplicationContext
        
        // Request POST_NOTIFICATIONS runtime permission for Android 13+ (API 33+)
        val activity = reactApplicationContext.currentActivity
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU && activity != null) {
            val hasPermission = ContextCompat.checkSelfPermission(
                activity,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
            if (!hasPermission) {
                ActivityCompat.requestPermissions(
                    activity,
                    arrayOf(Manifest.permission.POST_NOTIFICATIONS),
                    102
                )
            }
        }

        val intent = Intent(context, MOVTForegroundService::class.java).apply {
            putExtra("title", title)
            putExtra("body", body)
        }
        // startForegroundService pode lançar (ex.: ForegroundServiceStartNotAllowed
        // em Android 12+ quando iniciado de background). Protegemos para não
        // derrubar o app — o tratamento do tipo de FGS fica no próprio serviço.
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        } catch (e: Exception) {
            Log.e("MOVTServiceModule", "Falha ao iniciar MOVTForegroundService: ${e.message}")
        }
    }

    @ReactMethod
    fun stopService() {
        val context = reactApplicationContext
        val intent = Intent(context, MOVTForegroundService::class.java)
        context.stopService(intent)
    }

    // ─── Isenção de otimização de bateria ────────────────────────────────────────
    // Sem isenção, ROMs Android (Samsung/Motorola/Xiaomi…) congelam o processo do
    // app alguns minutos após a tela apagar — mesmo com foreground service — e o
    // rastreio do treino para. Estes métodos checam e pedem a isenção (diálogo do
    // sistema, 1 toque). Requer a permissão REQUEST_IGNORE_BATTERY_OPTIMIZATIONS.

    @ReactMethod
    fun isIgnoringBatteryOptimizations(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val pm = reactApplicationContext.getSystemService(Context.POWER_SERVICE) as PowerManager
                promise.resolve(pm.isIgnoringBatteryOptimizations(reactApplicationContext.packageName))
            } else {
                promise.resolve(true)
            }
        } catch (e: Exception) {
            // Em dúvida, não incomoda o usuário (assume isento).
            promise.resolve(true)
        }
    }

    @ReactMethod
    fun requestIgnoreBatteryOptimizations() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return
        try {
            val pm = reactApplicationContext.getSystemService(Context.POWER_SERVICE) as PowerManager
            if (pm.isIgnoringBatteryOptimizations(reactApplicationContext.packageName)) return
            val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                data = Uri.parse("package:${reactApplicationContext.packageName}")
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            val activity = reactApplicationContext.currentActivity
            if (activity != null) activity.startActivity(intent) else reactApplicationContext.startActivity(intent)
        } catch (e: Exception) {
            Log.w("MOVTServiceModule", "Falha ao pedir isenção de bateria: ${e.message}")
        }
    }

    // ─── Onboarding OEM (Autostart / gestão agressiva de background) ──────────────
    // ROMs como MIUI (Xiaomi), EMUI (Huawei), ColorOS (Oppo), FuntouchOS (Vivo),
    // etc. matam foreground services e ignoram wake locks a menos que o app esteja
    // na lista de "Autostart" / "iniciar automaticamente". A isenção de otimização
    // de bateria (padrão Android) NÃO cobre isso. Estes métodos deixam a UI detectar
    // o fabricante e abrir a tela correta (estilo dontkillmyapp / Strava).

    @ReactMethod
    fun getDeviceManufacturer(promise: Promise) {
        try {
            promise.resolve((Build.MANUFACTURER ?: "").lowercase())
        } catch (e: Exception) {
            promise.resolve("")
        }
    }

    // Lista de (pacote, atividade) de gerenciadores de Autostart por OEM. Tentamos
    // em ordem; o primeiro que existir e abrir vence.
    private val autoStartComponents = listOf(
        // Xiaomi / MIUI
        "com.miui.securitycenter" to "com.miui.permcenter.autostart.AutoStartManagementActivity",
        // Letv
        "com.letv.android.letvsafe" to "com.letv.android.letvsafe.AutobootManageActivity",
        // Huawei / EMUI
        "com.huawei.systemmanager" to "com.huawei.systemmanager.startupmgr.ui.StartupNormalAppListActivity",
        "com.huawei.systemmanager" to "com.huawei.systemmanager.optimize.process.ProtectActivity",
        // Oppo / ColorOS
        "com.coloros.safecenter" to "com.coloros.safecenter.permission.startup.StartupAppListActivity",
        "com.coloros.safecenter" to "com.coloros.safecenter.startupapp.StartupAppListActivity",
        "com.oppo.safe" to "com.oppo.safe.permission.startup.StartupAppListActivity",
        // Vivo / FuntouchOS
        "com.vivo.permissionmanager" to "com.vivo.permissionmanager.activity.BgStartUpManagerActivity",
        "com.iqoo.secure" to "com.iqoo.secure.ui.phoneoptimize.AddWhiteListActivity",
        "com.iqoo.secure" to "com.iqoo.secure.ui.phoneoptimize.BgStartUpManager",
        // Asus
        "com.asus.mobilemanager" to "com.asus.mobilemanager.autostart.AutoStartActivity",
        // OnePlus (OxygenOS)
        "com.oneplus.security" to "com.oneplus.security.chainlaunch.view.ChainLaunchAppListActivity"
    )

    /**
     * Abre a tela de Autostart do OEM (quando existe). Devolve true se conseguiu
     * abrir alguma; caso contrário abre os detalhes do app (fallback universal) e
     * devolve false, para a UI saber que caiu no genérico.
     */
    @ReactMethod
    fun openAutoStartSettings(promise: Promise) {
        val context = reactApplicationContext
        val activity = context.currentActivity
        val pm = context.packageManager
        for ((pkg, cls) in autoStartComponents) {
            try {
                val intent = Intent().apply {
                    component = ComponentName(pkg, cls)
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                // Só tenta se a atividade existir e for resolvível neste device.
                if (pm.resolveActivity(intent, 0) != null) {
                    if (activity != null) activity.startActivity(intent) else context.startActivity(intent)
                    promise.resolve(true)
                    return
                }
            } catch (e: Exception) {
                // tenta a próxima
            }
        }
        // Fallback: detalhes do app (o usuário chega em Bateria/Autostart a partir daí).
        openAppDetails(promise)
    }

    /** Abre a tela de detalhes do app nos Ajustes do sistema (fallback universal). */
    @ReactMethod
    fun openAppDetailsSettings(promise: Promise) {
        openAppDetails(promise)
    }

    private fun openAppDetails(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                data = Uri.parse("package:${reactApplicationContext.packageName}")
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            val activity = reactApplicationContext.currentActivity
            if (activity != null) activity.startActivity(intent) else reactApplicationContext.startActivity(intent)
            promise.resolve(false)
        } catch (e: Exception) {
            Log.w("MOVTServiceModule", "Falha ao abrir detalhes do app: ${e.message}")
            promise.resolve(false)
        }
    }

    // ─── WakeLock parcial (vida do treino) ───────────────────────────────────────

    @ReactMethod
    fun acquireWakeLock() {
        try {
            if (wakeLock?.isHeld == true) return
            val pm = reactApplicationContext.getSystemService(Context.POWER_SERVICE) as PowerManager
            val wl = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "MOVT:WorkoutTracking")
            wl.setReferenceCounted(false)
            wl.acquire()
            wakeLock = wl
        } catch (e: Exception) {
            Log.w("MOVTServiceModule", "Falha ao adquirir wakelock: ${e.message}")
        }
    }

    @ReactMethod
    fun releaseWakeLock() {
        try {
            wakeLock?.let { if (it.isHeld) it.release() }
            wakeLock = null
        } catch (e: Exception) {
            Log.w("MOVTServiceModule", "Falha ao liberar wakelock: ${e.message}")
        }
    }
}
