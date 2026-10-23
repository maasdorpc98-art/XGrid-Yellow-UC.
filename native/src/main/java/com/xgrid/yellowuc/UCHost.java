package com.xgrid.yellowuc;

import android.view.View;
import android.webkit.ValueCallback;
import android.util.Log;
import java.lang.ref.WeakReference;
import java.lang.reflect.Method;
import java.util.WeakHashMap;

/** Adapter for the actual com.uc.webview.export.WebView used by the supplied UC APK. */
public final class UCHost implements UCVisualBridge.TrustedPageHost, View.OnAttachStateChangeListener {
    private static final WeakHashMap<View, UCHost> pages = new WeakHashMap<>();
    private final WeakReference<View> page;
    private final Method url, attach, remove, evaluate;
    private final UCVisualBridge bridge;

    private UCHost(View view) throws Exception {
        Class<?> uc = Class.forName("com.uc.webview.export.WebView");
        if (!uc.isInstance(view)) throw new IllegalArgumentException("UC view required");
        page = new WeakReference<>(view);
        url = uc.getMethod("getUrl");
        attach = uc.getMethod("addJavascriptInterface", Object.class, String.class);
        remove = uc.getMethod("removeJavascriptInterface", String.class);
        evaluate = uc.getMethod("evaluateJavascript", String.class, ValueCallback.class);
        bridge = new UCVisualBridge(view.getContext().getApplicationContext(), this);
        view.addOnAttachStateChangeListener(this);
    }

    /** Called before the original UC onPageStarted body; UC startup stays untouched. */
    public static void onNavigation(View view, String nextUrl) {
        if (view == null) return;
        try {
            UCHost host = pages.get(view);
            if (!UCVisualBridge.googleSearch(nextUrl)) {
                if (host != null) host.release(view);
                return;
            }
            if (host == null) { host = new UCHost(view); pages.put(view, host); }
            host.bridge.trustedNavigation(nextUrl);
        } catch (Throwable error) { Log.w("XGridYellowUC", "UC bridge navigation failed", error); }
    }

    /** Called by the original Orange injection hook for page-finish and history events. */
    public static void onDocument(View view, String pageUrl) {
        if (view == null) return;
        try {
            UCHost host = pages.get(view);
            if (!UCVisualBridge.googleSearch(pageUrl)) {
                if (host != null) host.release(view);
                return;
            }
            if (host == null) {
                // A history-only callback can precede the first navigation callback.
                onNavigation(view, pageUrl);
                host = pages.get(view);
            }
            if (host != null) host.bridge.trustedDocumentReady();
        } catch (Throwable error) { Log.w("XGridYellowUC", "UC document bridge failed", error); }
    }

    private View current() {
        View view = page.get();
        if (view == null) throw new IllegalStateException("UC page released");
        return view;
    }
    @Override public String activeTopLevelUrl() {
        try { return (String) url.invoke(current()); } catch (Exception e) { return ""; }
    }
    @Override public void attachInterface(Object object, String name) {
        try { attach.invoke(current(), object, name); } catch (Exception e) { throw new IllegalStateException(e); }
    }
    @Override public void removeInterface(String name) {
        try { remove.invoke(current(), name); } catch (Exception ignored) { }
    }
    @Override public void evaluateMainFrame(String script) {
        try { evaluate.invoke(current(), script, null); } catch (Exception e) { throw new IllegalStateException(e); }
    }
    private void release(View view) {
        pages.remove(view);
        view.removeOnAttachStateChangeListener(this);
        bridge.close();
    }
    @Override public void onViewAttachedToWindow(View view) { bridge.resumeDocument(); }
    @Override public void onViewDetachedFromWindow(View view) { bridge.pauseDocument(); }
}
