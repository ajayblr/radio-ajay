package com.ajay.radioapp;

import android.content.Context;
import android.content.Intent;
import android.os.Build;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "Audio")
public class AudioPlugin extends Plugin {

    /**
     * Deliver a command to RadioService. Exceptions must not escape a plugin method -
     * Capacitor rethrows them and the whole app crashes - so failures reject the call.
     */
    private void send(PluginCall call, String action, String url, String stationName) {
        // Pause/stop with no service running: nothing to do, and starting the
        // service just to stop it is what used to trip the foreground-service timeout
        boolean control = RadioService.ACTION_PAUSE.equals(action) || RadioService.ACTION_STOP.equals(action);
        if (control && !RadioService.isRunning) { call.resolve(); return; }

        Context ctx = getContext();
        Intent intent = new Intent(ctx, RadioService.class);
        intent.setAction(action);
        if (url != null) intent.putExtra(RadioService.EXTRA_URL, url);
        if (stationName != null) intent.putExtra(RadioService.EXTRA_STATION_NAME, stationName);
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                ctx.startForegroundService(intent);
            } else {
                ctx.startService(intent);
            }
            call.resolve();
        } catch (Exception e) {
            // e.g. ForegroundServiceStartNotAllowedException when the app is in the background
            call.reject("Could not start playback service: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void play(PluginCall call) {
        String url = call.getString("url");
        if (url == null || url.isEmpty()) { call.reject("url is required"); return; }
        send(call, RadioService.ACTION_PLAY, url, call.getString("stationName", "RadioAjay"));
    }

    @PluginMethod
    public void pause(PluginCall call) {
        send(call, RadioService.ACTION_PAUSE, null, null);
    }

    @PluginMethod
    public void resume(PluginCall call) {
        send(call, RadioService.ACTION_RESUME, null, null);
    }

    @PluginMethod
    public void stop(PluginCall call) {
        send(call, RadioService.ACTION_STOP, null, null);
    }
}
