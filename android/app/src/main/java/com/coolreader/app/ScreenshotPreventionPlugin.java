package com.coolreader.app;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "ScreenshotPrevention")
public class ScreenshotPreventionPlugin extends Plugin {

    @PluginMethod
    public void enable(PluginCall call) {
        MainActivity activity = (MainActivity) getActivity();
        if (activity != null) {
            activity.runOnUiThread(() -> {
                activity.enableScreenshotPrevention();
                JSObject ret = new JSObject();
                ret.put("enabled", true);
                call.resolve(ret);
            });
        } else {
            call.reject("Activity not available");
        }
    }

    @PluginMethod
    public void disable(PluginCall call) {
        MainActivity activity = (MainActivity) getActivity();
        if (activity != null) {
            activity.runOnUiThread(() -> {
                activity.disableScreenshotPrevention();
                JSObject ret = new JSObject();
                ret.put("enabled", false);
                call.resolve(ret);
            });
        } else {
            call.reject("Activity not available");
        }
    }

    @PluginMethod
    public void isEnabled(PluginCall call) {
        MainActivity activity = (MainActivity) getActivity();
        if (activity != null) {
            JSObject ret = new JSObject();
            ret.put("enabled", activity.isScreenshotPreventionEnabled());
            call.resolve(ret);
        } else {
            call.reject("Activity not available");
        }
    }
}
