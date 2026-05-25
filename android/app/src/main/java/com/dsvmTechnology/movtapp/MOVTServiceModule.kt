package com.dsvmTechnology.movtapp

import android.content.Intent
import android.os.Build
import android.util.Log
import android.Manifest
import android.content.pm.PackageManager
import androidx.core.content.ContextCompat
import androidx.core.app.ActivityCompat
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class MOVTServiceModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

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
}
