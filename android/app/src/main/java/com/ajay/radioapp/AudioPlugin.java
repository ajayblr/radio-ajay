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

    private void send(String action, String url, String stationName) {
        Context ctx = getContext();
        Intent intent = new Intent(ctx, RadioService.class);
        intent.setAction(action);
        if (url != null) intent.putExtra(RadioService.EXTRA_URL, url);
        if (stationName != null) intent.putExtra(RadioService.EXTRA_STATION_NAME, stationName);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            ctx.startForegroundService(intent);
        } else {
            ctx.startService(intent);
        }
    }

    @PluginMethod
    public void play(PluginCall call) {
        String url = call.getString("url");
        if (url == null || url.isEmpty()) { call.reject("url is required"); return; }
        send(RadioService.ACTION_PLAY, url, call.getString("stationName", "RadioAjay"));
        call.resolve();
    }

    @PluginMethod
    public void pause(PluginCall call) {
        send(RadioService.ACTION_PAUSE, null, null);
        call.resolve();
    }

    @PluginMethod
    public void resume(PluginCall call) {
        send(RadioService.ACTION_RESUME, null, null);
        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        send(RadioService.ACTION_STOP, null, null);
        call.resolve();
    }
}
