package com.dsvmTechnology.movtapp

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
