package com.coolreader.app;

import android.os.Bundle;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private boolean screenshotPreventionEnabled = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Register custom plugin for screenshot prevention
        registerPlugin(ScreenshotPreventionPlugin.class);
    }

    /**
     * Enable screenshot prevention by setting FLAG_SECURE.
     * This prevents the screen from being captured by screenshots or screen recorders.
     */
    public void enableScreenshotPrevention() {
        if (!screenshotPreventionEnabled) {
            getWindow().setFlags(
                WindowManager.LayoutParams.FLAG_SECURE,
                WindowManager.LayoutParams.FLAG_SECURE
            );
            screenshotPreventionEnabled = true;
        }
    }

    /**
     * Disable screenshot prevention by clearing FLAG_SECURE.
     */
    public void disableScreenshotPrevention() {
        if (screenshotPreventionEnabled) {
            getWindow().clearFlags(WindowManager.LayoutParams.FLAG_SECURE);
            screenshotPreventionEnabled = false;
        }
    }

    /**
     * Check if screenshot prevention is enabled.
     */
    public boolean isScreenshotPreventionEnabled() {
        return screenshotPreventionEnabled;
    }
}
