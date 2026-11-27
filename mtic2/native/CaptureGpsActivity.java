package co.mtic.f27;

import android.Manifest;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.Typeface;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Looper;
import android.provider.MediaStore;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.camera.core.CameraSelector;
import androidx.camera.core.ImageCapture;
import androidx.camera.core.ImageCaptureException;
import androidx.camera.core.Preview;
import androidx.camera.lifecycle.ProcessCameraProvider;
import androidx.camera.view.PreviewView;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.exifinterface.media.ExifInterface;

import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.GoogleApiAvailability;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.Priority;
import com.google.common.util.concurrent.ListenableFuture;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Camara nativa con GPS en vivo. Captura, corrige la orientacion, reduce el tamano,
 * dibuja la marca de agua (IB y sede, coordenadas, fecha y hora de la captura),
 * escribe el GPS en el EXIF y devuelve la ruta del archivo final.
 */
public class CaptureGpsActivity extends AppCompatActivity {

    private static final int REQ_PERMS = 77;
    private static final long MAX_FIX_AGE_MS = 15000L;

    private PreviewView previewView;
    private TextView tvGps;
    private Button btnCapture;
    private Button btnLow;
    private ImageCapture imageCapture;

    private String line1 = "";
    private int maxEdge = 1280;
    private int quality = 88;
    private float minAcc = 30f;
    private boolean gallery = true;

    private Location last;
    private long lastFixAt = 0L;
    private boolean busy = false;
    private boolean cameraStarted = false;

    private FusedLocationProviderClient fused;
    private LocationCallback fusedCb;
    private LocationManager lm;
    private LocationListener lmListener;
    private final ExecutorService worker = Executors.newSingleThreadExecutor();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Intent in = getIntent();
        line1 = in.getStringExtra("line1") == null ? "" : in.getStringExtra("line1");
        maxEdge = Math.max(320, in.getIntExtra("maxEdge", 1280));
        quality = Math.max(40, Math.min(100, in.getIntExtra("quality", 88)));
        minAcc = in.getFloatExtra("minAcc", 30f);
        gallery = in.getBooleanExtra("gallery", true);
        buildUi();
        if (hasCamera()) {
            startCamera();
        }
        if (!hasCamera() || !hasFineLocation()) {
            ActivityCompat.requestPermissions(this,
                    new String[]{Manifest.permission.CAMERA, Manifest.permission.ACCESS_FINE_LOCATION}, REQ_PERMS);
        }
    }

    private void buildUi() {
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.BLACK);
        root.setFitsSystemWindows(true);

        previewView = new PreviewView(this);
        root.addView(previewView, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        tvGps = new TextView(this);
        tvGps.setTextColor(Color.WHITE);
        tvGps.setTextSize(13f);
        tvGps.setBackgroundColor(Color.argb(160, 0, 0, 0));
        int pad = dp(12);
        tvGps.setPadding(pad, pad, pad, pad);
        tvGps.setText("Buscando se\u00f1al GPS...");
        FrameLayout.LayoutParams lpTop = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT, Gravity.TOP);
        lpTop.setMargins(dp(12), dp(12), dp(12), 0);
        root.addView(tvGps, lpTop);

        LinearLayout bar = new LinearLayout(this);
        bar.setOrientation(LinearLayout.VERTICAL);
        bar.setGravity(Gravity.CENTER_HORIZONTAL);
        bar.setPadding(dp(16), dp(8), dp(16), dp(24));

        btnLow = new Button(this);
        btnLow.setText("Capturar con precisi\u00f3n baja");
        btnLow.setVisibility(View.GONE);
        btnLow.setOnClickListener(v -> capture());
        bar.addView(btnLow, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setGravity(Gravity.CENTER);

        Button btnCancel = new Button(this);
        btnCancel.setText("Cancelar");
        btnCancel.setOnClickListener(v -> {
            setResult(RESULT_CANCELED);
            finish();
        });
        row.addView(btnCancel, new LinearLayout.LayoutParams(0, dp(56), 1f));

        btnCapture = new Button(this);
        btnCapture.setText("Esperando GPS...");
        btnCapture.setEnabled(false);
        btnCapture.setOnClickListener(v -> capture());
        LinearLayout.LayoutParams lpCap = new LinearLayout.LayoutParams(0, dp(56), 2f);
        lpCap.setMargins(dp(12), 0, 0, 0);
        row.addView(btnCapture, lpCap);

        bar.addView(row, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        root.addView(bar, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT, Gravity.BOTTOM));
        setContentView(root);
    }

    private int dp(int v) {
        return Math.round(v * getResources().getDisplayMetrics().density);
    }

    private boolean hasCamera() {
        return ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED;
    }

    private boolean hasFineLocation() {
        return ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode != REQ_PERMS) return;
        if (!hasCamera()) {
            Toast.makeText(this, "Se necesita el permiso de c\u00e1mara", Toast.LENGTH_LONG).show();
            setResult(RESULT_CANCELED);
            finish();
            return;
        }
        startCamera();
        if (hasFineLocation()) {
            startLocation();
        } else {
            tvGps.setText("Sin permiso de ubicaci\u00f3n precisa. Act\u00edvalo en los ajustes de la app.");
        }
    }

    @Override
    protected void onStart() {
        super.onStart();
        if (hasFineLocation()) startLocation();
    }

    @Override
    protected void onStop() {
        stopLocation();
        super.onStop();
    }

    @Override
    protected void onDestroy() {
        stopLocation();
        worker.shutdown();
        super.onDestroy();
    }

    private void startCamera() {
        if (cameraStarted) return;
        cameraStarted = true;
        final ListenableFuture<ProcessCameraProvider> future = ProcessCameraProvider.getInstance(this);
        future.addListener(() -> {
            try {
                ProcessCameraProvider provider = future.get();
                Preview preview = new Preview.Builder().build();
                preview.setSurfaceProvider(previewView.getSurfaceProvider());
                imageCapture = new ImageCapture.Builder()
                        .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
                        .build();
                provider.unbindAll();
                provider.bindToLifecycle(this, CameraSelector.DEFAULT_BACK_CAMERA, preview, imageCapture);
            } catch (Exception e) {
                cameraStarted = false;
                Toast.makeText(this, "No se pudo iniciar la c\u00e1mara: " + e.getMessage(), Toast.LENGTH_LONG).show();
            }
        }, ContextCompat.getMainExecutor(this));
    }

    private void startLocation() {
        if (fusedCb != null || lmListener != null) return;
        try {
            if (GoogleApiAvailability.getInstance().isGooglePlayServicesAvailable(this) == ConnectionResult.SUCCESS) {
                fused = LocationServices.getFusedLocationProviderClient(this);
                LocationRequest req = new LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 1000L)
                        .setMinUpdateIntervalMillis(500L)
                        .build();
                fusedCb = new LocationCallback() {
                    @Override
                    public void onLocationResult(@NonNull LocationResult result) {
                        Location l = result.getLastLocation();
                        if (l != null) onFix(l);
                    }
                };
                fused.requestLocationUpdates(req, fusedCb, Looper.getMainLooper());
            } else {
                lm = (LocationManager) getSystemService(LOCATION_SERVICE);
                lmListener = new LocationListener() {
                    @Override
                    public void onLocationChanged(@NonNull Location l) {
                        onFix(l);
                    }

                    @Override
                    public void onProviderEnabled(@NonNull String provider) {
                    }

                    @Override
                    public void onProviderDisabled(@NonNull String provider) {
                    }

                    @Override
                    public void onStatusChanged(String provider, int status, Bundle extras) {
                    }
                };
                lm.requestLocationUpdates(LocationManager.GPS_PROVIDER, 1000L, 0f, lmListener, Looper.getMainLooper());
            }
        } catch (SecurityException | IllegalArgumentException e) {
            tvGps.setText("No se pudo iniciar el GPS: " + e.getMessage());
        }
    }

    private void stopLocation() {
        if (fused != null && fusedCb != null) {
            fused.removeLocationUpdates(fusedCb);
        }
        fused = null;
        fusedCb = null;
        if (lm != null && lmListener != null) {
            lm.removeUpdates(lmListener);
        }
        lm = null;
        lmListener = null;
    }

    private void onFix(Location l) {
        last = l;
        lastFixAt = System.currentTimeMillis();
        boolean good = l.getAccuracy() <= minAcc;
        tvGps.setText(String.format(Locale.US, "GPS: %.6f, %.6f   precisi\u00f3n \u00b1%.0f m%s",
                l.getLatitude(), l.getLongitude(), l.getAccuracy(), good ? "" : "  (mejorando...)"));
        if (!busy) {
            btnCapture.setEnabled(good);
            btnCapture.setText(good ? "Capturar" : "Esperando precisi\u00f3n \u00b1" + Math.round(minAcc) + " m");
            btnLow.setVisibility(good ? View.GONE : View.VISIBLE);
        }
    }

    private void setBusy(boolean b) {
        busy = b;
        btnCapture.setEnabled(!b && last != null && last.getAccuracy() <= minAcc);
        btnLow.setEnabled(!b);
        if (b) btnCapture.setText("Procesando...");
    }

    private void capture() {
        if (busy || imageCapture == null) return;
        if (last == null || System.currentTimeMillis() - lastFixAt > MAX_FIX_AGE_MS) {
            Toast.makeText(this, "La ubicaci\u00f3n no est\u00e1 actualizada. Espera un momento.", Toast.LENGTH_SHORT).show();
            return;
        }
        setBusy(true);
        final long captureTime = System.currentTimeMillis();
        final Location loc = new Location(last);
        final File raw = new File(getCacheDir(), "raw_" + captureTime + ".jpg");
        imageCapture.takePicture(new ImageCapture.OutputFileOptions.Builder(raw).build(),
                ContextCompat.getMainExecutor(this),
                new ImageCapture.OnImageSavedCallback() {
                    @Override
                    public void onImageSaved(@NonNull ImageCapture.OutputFileResults results) {
                        worker.execute(() -> process(raw, loc, captureTime));
                    }

                    @Override
                    public void onError(@NonNull ImageCaptureException exception) {
                        setBusy(false);
                        Toast.makeText(CaptureGpsActivity.this,
                                "Error de captura: " + exception.getMessage(), Toast.LENGTH_LONG).show();
                    }
                });
    }

    private void process(final File raw, final Location loc, final long time) {
        try {
            String path = raw.getAbsolutePath();
            BitmapFactory.Options o = new BitmapFactory.Options();
            o.inJustDecodeBounds = true;
            BitmapFactory.decodeFile(path, o);
            int srcMax = Math.max(o.outWidth, o.outHeight);
            int sample = 1;
            while (srcMax / (sample * 2) >= maxEdge) sample *= 2;
            o.inJustDecodeBounds = false;
            o.inSampleSize = sample;
            o.inPreferredConfig = Bitmap.Config.ARGB_8888;
            Bitmap bmp = BitmapFactory.decodeFile(path, o);
            if (bmp == null) throw new IllegalStateException("No se pudo leer la foto capturada");

            int orientation = new ExifInterface(path).getAttributeInt(
                    ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL);
            float degrees = 0f;
            if (orientation == ExifInterface.ORIENTATION_ROTATE_90) degrees = 90f;
            else if (orientation == ExifInterface.ORIENTATION_ROTATE_180) degrees = 180f;
            else if (orientation == ExifInterface.ORIENTATION_ROTATE_270) degrees = 270f;

            float scale = Math.min(1f, (float) maxEdge / Math.max(bmp.getWidth(), bmp.getHeight()));
            Matrix m = new Matrix();
            if (degrees != 0f) m.postRotate(degrees);
            if (scale < 1f) m.postScale(scale, scale);
            Bitmap out = bmp;
            if (!m.isIdentity()) {
                out = Bitmap.createBitmap(bmp, 0, 0, bmp.getWidth(), bmp.getHeight(), m, true);
                if (out != bmp) bmp.recycle();
            }
            Bitmap mut = out;
            if (!out.isMutable()) {
                mut = out.copy(Bitmap.Config.ARGB_8888, true);
                if (mut != out) out.recycle();
            }
            if (mut == null) throw new IllegalStateException("No hay memoria suficiente para procesar la foto");

            drawWatermark(mut, loc, time);

            File fin = new File(getCacheDir(), "gps_" + time + ".jpg");
            try (FileOutputStream fo = new FileOutputStream(fin)) {
                mut.compress(Bitmap.CompressFormat.JPEG, quality, fo);
            }
            final int w = mut.getWidth();
            final int h = mut.getHeight();
            mut.recycle();

            ExifInterface ex = new ExifInterface(fin.getAbsolutePath());
            ex.setGpsInfo(loc);
            String exifDate = new SimpleDateFormat("yyyy:MM:dd HH:mm:ss", Locale.US).format(new Date(time));
            ex.setAttribute(ExifInterface.TAG_DATETIME_ORIGINAL, exifDate);
            ex.setAttribute(ExifInterface.TAG_DATETIME, exifDate);
            ex.saveAttributes();

            if (gallery && Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                try {
                    saveToGallery(fin, time);
                } catch (Exception ignored) {
                    // la copia en galeria es opcional
                }
            }
            raw.delete();

            boolean mock = Build.VERSION.SDK_INT >= 31 ? loc.isMock() : loc.isFromMockProvider();
            final Intent res = new Intent();
            res.putExtra("path", fin.getAbsolutePath());
            res.putExtra("w", w);
            res.putExtra("h", h);
            res.putExtra("lat", loc.getLatitude());
            res.putExtra("lon", loc.getLongitude());
            res.putExtra("acc", loc.getAccuracy());
            res.putExtra("time", time);
            res.putExtra("mock", mock);
            runOnUiThread(() -> {
                setResult(RESULT_OK, res);
                finish();
            });
        } catch (Throwable e) {
            final String msg = e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage();
            runOnUiThread(() -> {
                setBusy(false);
                Toast.makeText(CaptureGpsActivity.this, "No se pudo procesar la foto: " + msg, Toast.LENGTH_LONG).show();
            });
        }
    }

    private void drawWatermark(Bitmap bmp, Location loc, long time) {
        Canvas canvas = new Canvas(bmp);
        int w = bmp.getWidth();
        int h = bmp.getHeight();
        String[] lines = new String[]{
                line1,
                String.format(Locale.US, "%.6f, %.6f", loc.getLatitude(), loc.getLongitude()),
                new SimpleDateFormat("dd/MM/yyyy HH:mm:ss", Locale.US).format(new Date(time))
        };
        float fs = Math.max(12f, Math.max(w, h) / 40f);
        Paint fill = new Paint(Paint.ANTI_ALIAS_FLAG);
        fill.setColor(Color.WHITE);
        fill.setTypeface(Typeface.DEFAULT_BOLD);
        fill.setTextAlign(Paint.Align.RIGHT);
        Paint stroke = new Paint(fill);
        stroke.setStyle(Paint.Style.STROKE);
        stroke.setColor(Color.argb(217, 0, 0, 0));
        stroke.setStrokeJoin(Paint.Join.ROUND);
        for (int i = 0; i < lines.length; i++) {
            String text = lines[i];
            float size = fs;
            fill.setTextSize(size);
            while (fill.measureText(text) > w - fs && size > fs * 0.5f) {
                size -= 1f;
                fill.setTextSize(size);
            }
            stroke.setTextSize(size);
            stroke.setStrokeWidth(size / 5f);
            float y = h - fs / 2f - (lines.length - 1 - i) * fs * 1.2f - fill.descent();
            canvas.drawText(text, w - fs / 2f, y, stroke);
            canvas.drawText(text, w - fs / 2f, y, fill);
        }
    }

    private void saveToGallery(File f, long time) throws Exception {
        ContentValues v = new ContentValues();
        v.put(MediaStore.Images.Media.DISPLAY_NAME, "MinTIC_" + time + ".jpg");
        v.put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg");
        v.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/MinTIC");
        v.put(MediaStore.Images.Media.IS_PENDING, 1);
        Uri uri = getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, v);
        if (uri == null) return;
        try (OutputStream os = getContentResolver().openOutputStream(uri); InputStream in = new FileInputStream(f)) {
            if (os == null) return;
            byte[] buf = new byte[16384];
            int n;
            while ((n = in.read(buf)) > 0) os.write(buf, 0, n);
        }
        v.clear();
        v.put(MediaStore.Images.Media.IS_PENDING, 0);
        getContentResolver().update(uri, v, null, null);
    }
}
