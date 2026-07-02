package com.ajay.radioapp;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import androidx.core.app.NotificationCompat;

public class RadioService extends Service {
    public static final String ACTION_PLAY = "ACTION_PLAY";
    public static final String ACTION_PAUSE = "ACTION_PAUSE";
    public static final String ACTION_RESUME = "ACTION_RESUME";
    public static final String ACTION_STOP = "ACTION_STOP";
    public static final String EXTRA_URL = "EXTRA_URL";
    public static final String EXTRA_STATION_NAME = "EXTRA_STATION_NAME";

    private static final String CHANNEL_ID = "radio_playback";
    private static final int NOTIFICATION_ID = 1;

    private MediaPlayer mediaPlayer;
    private String currentStationName = "RadioAjay";
    private PowerManager.WakeLock wakeLock;
    private AudioManager audioManager;
    private AudioFocusRequest audioFocusRequest;
    private boolean hasAudioFocus = false;

    private final AudioManager.OnAudioFocusChangeListener audioFocusListener = focusChange -> {
        switch (focusChange) {
            case AudioManager.AUDIOFOCUS_GAIN:
                hasAudioFocus = true;
                if (mediaPlayer != null) {
                    try {
                        if (!mediaPlayer.isPlaying()) mediaPlayer.start();
                        mediaPlayer.setVolume(1.0f, 1.0f);
                    } catch (Exception ignored) {}
                }
                break;
            case AudioManager.AUDIOFOCUS_LOSS:
                // Permanent loss — another app took over; stop cleanly
                hasAudioFocus = false;
                releasePlayer();
                abandonAudioFocus();
                releaseWakeLock();
                stopForeground(true);
                stopSelf();
                break;
            case AudioManager.AUDIOFOCUS_LOSS_TRANSIENT:
                hasAudioFocus = false;
                if (mediaPlayer != null) {
                    try { if (mediaPlayer.isPlaying()) mediaPlayer.pause(); } catch (Exception ignored) {}
                }
                break;
            case AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK:
                if (mediaPlayer != null) {
                    try { mediaPlayer.setVolume(0.3f, 0.3f); } catch (Exception ignored) {}
                }
                break;
        }
    };

    @Override
    public void onCreate() {
        super.onCreate();
        audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) return START_STICKY;
        String action = intent.getAction();
        if (action == null) return START_STICKY;

        switch (action) {
            case ACTION_PLAY:
                String url = intent.getStringExtra(EXTRA_URL);
                String name = intent.getStringExtra(EXTRA_STATION_NAME);
                if (name != null && !name.isEmpty()) currentStationName = name;
                startPlayback(url);
                break;
            case ACTION_PAUSE:
                if (mediaPlayer != null) {
                    try { if (mediaPlayer.isPlaying()) mediaPlayer.pause(); } catch (Exception ignored) {}
                }
                abandonAudioFocus();
                break;
            case ACTION_RESUME:
                if (requestAudioFocus() && mediaPlayer != null) {
                    try { if (!mediaPlayer.isPlaying()) mediaPlayer.start(); } catch (Exception ignored) {}
                }
                break;
            case ACTION_STOP:
                releasePlayer();
                abandonAudioFocus();
                releaseWakeLock();
                stopForeground(true);
                stopSelf();
                break;
        }
        return START_STICKY;
    }

    private void startPlayback(String url) {
        releasePlayer();
        // Must call startForeground within 5 s of startForegroundService
        startForeground(NOTIFICATION_ID, buildNotification(currentStationName));

        if (url == null || url.isEmpty()) { stopSelf(); return; }
        if (!requestAudioFocus()) { stopSelf(); return; }

        acquireWakeLock();

        try {
            mediaPlayer = new MediaPlayer();
            mediaPlayer.setAudioAttributes(new AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .build());
            // Keep CPU awake during streaming even when screen is off
            mediaPlayer.setWakeMode(getApplicationContext(), PowerManager.PARTIAL_WAKE_LOCK);
            mediaPlayer.setDataSource(url);
            mediaPlayer.setOnPreparedListener(MediaPlayer::start);
            mediaPlayer.setOnErrorListener((mp, what, extra) -> {
                stopSelf();
                return true;
            });
            mediaPlayer.prepareAsync();
        } catch (Exception e) {
            stopSelf();
        }
    }

    private boolean requestAudioFocus() {
        if (hasAudioFocus) return true;
        int result;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            audioFocusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                    .setAudioAttributes(new android.media.AudioAttributes.Builder()
                            .setContentType(android.media.AudioAttributes.CONTENT_TYPE_MUSIC)
                            .setUsage(android.media.AudioAttributes.USAGE_MEDIA)
                            .build())
                    .setOnAudioFocusChangeListener(audioFocusListener)
                    .build();
            result = audioManager.requestAudioFocus(audioFocusRequest);
        } else {
            //noinspection deprecation
            result = audioManager.requestAudioFocus(
                    audioFocusListener, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN);
        }
        hasAudioFocus = result == AudioManager.AUDIOFOCUS_REQUEST_GRANTED;
        return hasAudioFocus;
    }

    private void abandonAudioFocus() {
        if (!hasAudioFocus) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && audioFocusRequest != null) {
            audioManager.abandonAudioFocusRequest(audioFocusRequest);
        } else {
            //noinspection deprecation
            audioManager.abandonAudioFocus(audioFocusListener);
        }
        hasAudioFocus = false;
    }

    private void acquireWakeLock() {
        if (wakeLock != null && wakeLock.isHeld()) return;
        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "RadioAjay:playback");
        wakeLock.acquire(4 * 60 * 60 * 1000L); // 4-hour ceiling; released on stop/destroy
    }

    private void releaseWakeLock() {
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
            wakeLock = null;
        }
    }

    private void releasePlayer() {
        if (mediaPlayer != null) {
            try { mediaPlayer.stop(); } catch (Exception ignored) {}
            mediaPlayer.release();
            mediaPlayer = null;
        }
    }

    private Notification buildNotification(String stationName) {
        Intent intent = new Intent(this, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pi = PendingIntent.getActivity(
                this, 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("RadioAjay")
                .setContentText(stationName)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentIntent(pi)
                .setOngoing(true)
                .setSilent(true)
                .build();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(
                    CHANNEL_ID, "Radio Playback", NotificationManager.IMPORTANCE_LOW);
            ch.setDescription("Shows currently playing radio station");
            ch.setShowBadge(false);
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) nm.createNotificationChannel(ch);
        }
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }

    @Override
    public void onDestroy() {
        releasePlayer();
        abandonAudioFocus();
        releaseWakeLock();
        super.onDestroy();
    }
}
