package com.ajay.radioapp;

import android.content.IntentSender;
import android.os.Bundle;
import android.view.View;
import com.getcapacitor.BridgeActivity;
import com.google.android.material.snackbar.Snackbar;
import com.google.android.play.core.appupdate.AppUpdateInfo;
import com.google.android.play.core.appupdate.AppUpdateManager;
import com.google.android.play.core.appupdate.AppUpdateManagerFactory;
import com.google.android.play.core.install.InstallStateUpdatedListener;
import com.google.android.play.core.install.model.AppUpdateType;
import com.google.android.play.core.install.model.InstallStatus;
import com.google.android.play.core.install.model.UpdateAvailability;

public class MainActivity extends BridgeActivity {
    private static final int UPDATE_REQUEST_CODE = 100;
    private AppUpdateManager appUpdateManager;

    private final InstallStateUpdatedListener installStateListener = state -> {
        if (state.installStatus() == InstallStatus.DOWNLOADED) {
            showRestartSnackbar();
        }
    };

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AudioPlugin.class);
        super.onCreate(savedInstanceState);

        appUpdateManager = AppUpdateManagerFactory.create(this);
        appUpdateManager.registerListener(installStateListener);
        checkForUpdate();
    }

    private void checkForUpdate() {
        appUpdateManager.getAppUpdateInfo().addOnSuccessListener(info -> {
            if (info.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE
                    && info.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE)) {
                try {
                    appUpdateManager.startUpdateFlowForResult(
                            info, AppUpdateType.FLEXIBLE, this, UPDATE_REQUEST_CODE);
                } catch (IntentSender.SendIntentException ignored) {}
            } else if (info.installStatus() == InstallStatus.DOWNLOADED) {
                // Update finished downloading while app was in background
                showRestartSnackbar();
            }
        });
    }

    private void showRestartSnackbar() {
        View root = getWindow().getDecorView().getRootView();
        Snackbar.make(root, "Update ready to install.", Snackbar.LENGTH_INDEFINITE)
                .setAction("Restart now", v -> appUpdateManager.completeUpdate())
                .show();
    }

    @Override
    public void onResume() {
        super.onResume();
        // Re-check in case the update finished downloading while the app was backgrounded
        if (appUpdateManager != null) {
            appUpdateManager.getAppUpdateInfo().addOnSuccessListener(info -> {
                if (info.installStatus() == InstallStatus.DOWNLOADED) {
                    showRestartSnackbar();
                }
            });
        }
    }

    @Override
    public void onDestroy() {
        if (appUpdateManager != null) {
            appUpdateManager.unregisterListener(installStateListener);
        }
        super.onDestroy();
    }
}
