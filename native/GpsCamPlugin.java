package co.mtic.f27;

import android.app.Activity;
import android.content.Intent;
import android.util.Base64;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;

@CapacitorPlugin(name = "GpsCam")
public class GpsCamPlugin extends Plugin {

    @PluginMethod
    public void capture(PluginCall call) {
        Intent i = new Intent(getContext(), CaptureGpsActivity.class);
        i.putExtra("line1", call.getString("line1", ""));
        i.putExtra("maxEdge", call.getInt("maxEdge", 1280));
        i.putExtra("quality", call.getInt("quality", 88));
        i.putExtra("minAcc", call.getFloat("minAcc", 30f));
        i.putExtra("gallery", call.getBoolean("gallery", true));
        startActivityForResult(call, i, "capResult");
    }

    @ActivityCallback
    private void capResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        Intent d = result.getData();
        if (result.getResultCode() != Activity.RESULT_OK || d == null || d.getStringExtra("path") == null) {
            JSObject o = new JSObject();
            o.put("canceled", true);
            call.resolve(o);
            return;
        }
        File f = new File(d.getStringExtra("path"));
        try {
            FileInputStream in = new FileInputStream(f);
            ByteArrayOutputStream bo = new ByteArrayOutputStream();
            byte[] buf = new byte[16384];
            int n;
            while ((n = in.read(buf)) > 0) bo.write(buf, 0, n);
            in.close();
            f.delete();
            JSObject o = new JSObject();
            o.put("data", Base64.encodeToString(bo.toByteArray(), Base64.NO_WRAP));
            o.put("w", d.getIntExtra("w", 0));
            o.put("h", d.getIntExtra("h", 0));
            o.put("lat", d.getDoubleExtra("lat", 0));
            o.put("lon", d.getDoubleExtra("lon", 0));
            o.put("acc", (double) d.getFloatExtra("acc", 0f));
            o.put("time", d.getLongExtra("time", 0L));
            o.put("mock", d.getBooleanExtra("mock", false));
            call.resolve(o);
        } catch (Exception e) {
            call.reject("No se pudo leer la foto: " + e.getMessage());
        }
    }
}
