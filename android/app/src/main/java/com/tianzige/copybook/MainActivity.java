package com.tianzige.copybook;

import android.content.Context;
import android.os.Bundle;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.webkit.JavascriptInterface;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 注册原生打印接口，使 Android APK 内点击打印能直接调起系统 PrintManager
        this.bridge.getWebView().addJavascriptInterface(new Object() {
            @JavascriptInterface
            public void print() {
                runOnUiThread(() -> {
                    try {
                        PrintManager printManager = (PrintManager) getSystemService(Context.PRINT_SERVICE);
                        if (printManager != null) {
                            PrintDocumentAdapter printAdapter = bridge.getWebView().createPrintDocumentAdapter("汉字字帖打印");
                            printManager.print("汉字字帖打印", printAdapter, new PrintAttributes.Builder()
                                    .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
                                    .setMinMargins(PrintAttributes.Margins.NO_MARGINS)
                                    .build());
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                });
            }
        }, "AndroidPrinter");
    }
}
