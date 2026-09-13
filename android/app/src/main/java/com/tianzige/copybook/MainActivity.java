package com.tianzige.copybook;

import android.content.Context;
import android.os.Bundle;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        try {
            if (getBridge() != null && getBridge().getWebView() != null) {
                WebView webView = getBridge().getWebView();
                webView.addJavascriptInterface(new AndroidPrinterInterface(this, webView), "AndroidPrinter");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static class AndroidPrinterInterface {
        private final Context context;
        private final WebView webView;

        public AndroidPrinterInterface(Context context, WebView webView) {
            this.context = context;
            this.webView = webView;
        }

        @JavascriptInterface
        public void print() {
            if (context instanceof MainActivity) {
                ((MainActivity) context).runOnUiThread(() -> {
                    try {
                        PrintManager printManager = (PrintManager) context.getSystemService(Context.PRINT_SERVICE);
                        if (printManager != null && webView != null) {
                            PrintDocumentAdapter printAdapter = webView.createPrintDocumentAdapter("汉字田字格字帖");
                            PrintAttributes.Builder builder = new PrintAttributes.Builder();
                            builder.setMediaSize(PrintAttributes.MediaSize.ISO_A4);
                            builder.setColorMode(PrintAttributes.COLOR_MODE_COLOR);
                            printManager.print("汉字田字格字帖", printAdapter, builder.build());
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                });
            }
        }
    }
}
