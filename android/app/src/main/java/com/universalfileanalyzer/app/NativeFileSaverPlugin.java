package com.universalfileanalyzer.app;

import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.widget.Toast;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

@CapacitorPlugin(name = "NativeFileSaver")
public class NativeFileSaverPlugin extends Plugin {

    @PluginMethod
    public void saveToDownloads(PluginCall call) {
        String filename = call.getString("filename", "document.pdf");
        String base64Data = call.getString("base64Data", "");
        String mimeType = call.getString("mimeType", "application/pdf");

        if (base64Data == null || base64Data.isEmpty()) {
            call.reject("Base64 data is empty");
            return;
        }

        try {
            byte[] fileBytes = Base64.decode(base64Data, Base64.DEFAULT);
            Uri savedUri = null;
            Context context = getContext();
            String savedPath = "";

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentValues values = new ContentValues();
                values.put(MediaStore.MediaColumns.DISPLAY_NAME, filename);
                values.put(MediaStore.MediaColumns.MIME_TYPE, mimeType);
                values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);

                savedUri = context.getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                if (savedUri != null) {
                    try (OutputStream os = context.getContentResolver().openOutputStream(savedUri)) {
                        if (os != null) {
                            os.write(fileBytes);
                            os.flush();
                        }
                    }
                    savedPath = savedUri.toString();
                }
            } else {
                File downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                if (!downloadsDir.exists()) {
                    downloadsDir.mkdirs();
                }
                File targetFile = new File(downloadsDir, filename);
                try (FileOutputStream fos = new FileOutputStream(targetFile)) {
                    fos.write(fileBytes);
                    fos.flush();
                }
                savedUri = Uri.fromFile(targetFile);
                savedPath = targetFile.getAbsolutePath();
                MediaScannerConnection.scanFile(context, new String[]{targetFile.getAbsolutePath()}, new String[]{mimeType}, null);
            }

            // Show confirmation toast on Android UI thread
            final String finalFilename = filename;
            getActivity().runOnUiThread(() -> {
                Toast.makeText(context, "Saved to Downloads: " + finalFilename, Toast.LENGTH_LONG).show();
            });

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("path", savedPath);
            ret.put("uri", savedUri != null ? savedUri.toString() : "");
            ret.put("filename", filename);
            call.resolve(ret);

        } catch (Exception e) {
            call.reject("Failed to save file to Downloads: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void openFile(PluginCall call) {
        String uriString = call.getString("uri", "");
        String mimeType = call.getString("mimeType", "application/pdf");

        if (uriString == null || uriString.isEmpty()) {
            call.reject("URI is empty");
            return;
        }

        try {
            Uri fileUri = Uri.parse(uriString);
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(fileUri, mimeType);
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            Intent chooser = Intent.createChooser(intent, "Open File");
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(chooser);
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to open file: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void shareFile(PluginCall call) {
        String uriString = call.getString("uri", "");
        String filename = call.getString("filename", "document.pdf");
        String mimeType = call.getString("mimeType", "application/pdf");

        if (uriString == null || uriString.isEmpty()) {
            call.reject("URI is empty");
            return;
        }

        try {
            Uri fileUri = Uri.parse(uriString);
            Intent intent = new Intent(Intent.ACTION_SEND);
            intent.setType(mimeType);
            intent.putExtra(Intent.EXTRA_STREAM, fileUri);
            intent.putExtra(Intent.EXTRA_SUBJECT, filename);
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            Intent chooser = Intent.createChooser(intent, "Share " + filename);
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(chooser);
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to share file: " + e.getMessage(), e);
        }
    }
}
