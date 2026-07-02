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
import android.os.Build;
import android.os.IBinder;
import androidx.annotation.OptIn;
import androidx.core.app.NotificationCompat;
import androidx.media3.common.AudioAttributes.Builder;
import androidx.media3.common.C;
import androidx.media3.common.MediaItem;
import androidx.media3.common.PlaybackException;
import androidx.media3.common.Player;
import androidx.media3.common.util.UnstableApi;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory;
import androidx.media3.datasource.okhttp.OkHttpDataSource;
import okhttp3.OkHttpClient;

import java.util.concurrent.TimeUnit;

public class RadioService extends Service {
    public static final String ACTION_PLAY = "ACTION_PLAY";
    public static final String ACTION_PAUSE = "ACTION_PAUSE";
    public static final String ACTION_RESUME = "ACTION_RESUME";
    public static final String ACTION_STOP = "ACTION_STOP";
    public static final String EXTRA_URL = "EXTRA_URL";
    public static final String EXTRA_STATION_NAME = "EXTRA_STATION_NAME";

    private static final String CHANNEL_ID = "radio_playback";
    private static final int NOTIFICATION_ID = 1;

    private ExoPlayer player;
    private String currentStationName = "RadioAjay";
    private AudioManager audioManager;
    private AudioFocusRequest audioFocusRequest;
    private boolean hasAudioFocus = false;

    private final AudioManager.OnAudioFocusChangeListener audioFocusListener = focusChange -> {
        if (player == null) return;
        switch (focusChange) {
            case AudioManager.AUDIOFOCUS_GAIN:
                hasAudioFocus = true;
                player.setVolume(1.0f);
                player.setPlayWhenReady(true);
                break;
            case AudioManager.AUDIOFOCUS_LOSS:
                hasAudioFocus = false;
                releasePlayer();
                abandonAudioFocus();
                stopForeground(true);
                stopSelf();
                break;
            case AudioManager.AUDIOFOCUS_LOSS_TRANSIENT:
                hasAudioFocus = false;
                player.setPlayWhenReady(false);
                break;
            case AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK:
                player.setVolume(0.3f);
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
                if (player != null) player.setPlayWhenReady(false);
                abandonAudioFocus();
                break;
            case ACTION_RESUME:
                if (requestAudioFocus() && player != null) player.setPlayWhenReady(true);
                break;
            case ACTION_STOP:
                releasePlayer();
                abandonAudioFocus();
                stopForeground(true);
                stopSelf();
                break;
        }
        return START_STICKY;
    }

    @OptIn(markerClass = UnstableApi.class)
    private void startPlayback(String url) {
        releasePlayer();
        startForeground(NOTIFICATION_ID, buildNotification(currentStationName));

        if (url == null || url.isEmpty()) { stopSelf(); return; }
        if (!requestAudioFocus()) { stopSelf(); return; }

        OkHttpClient httpClient = new OkHttpClient.Builder()
                .connectTimeout(10, TimeUnit.SECONDS)
                .readTimeout(10, TimeUnit.SECONDS)
                .build();
        OkHttpDataSource.Factory dataSourceFactory = new OkHttpDataSource.Factory(httpClient);

        player = new ExoPlayer.Builder(this)
                .setMediaSourceFactory(new DefaultMediaSourceFactory(dataSourceFactory))
                .build();

        player.setAudioAttributes(
                new Builder()
                        .setContentType(C.AUDIO_CONTENT_TYPE_MUSIC)
                        .setUsage(C.USAGE_MEDIA)
                        .build(),
                false // we manage audio focus ourselves
        );

        player.addListener(new Player.Listener() {
            @Override
            public void onPlayerError(PlaybackException error) {
                stopSelf();
            }
        });

        player.setMediaItem(MediaItem.fromUri(url));
        player.prepare();
        player.setPlayWhenReady(true);
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

    private void releasePlayer() {
        if (player != null) {
            player.stop();
            player.release();
            player = null;
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
        super.onDestroy();
    }
}
