package com.xgrid.yellowuc;

import android.view.View;
import android.webkit.ValueCallback;
import android.util.Log;
import android.os.Handler;
import android.os.Looper;
import android.net.Uri;
import java.lang.ref.WeakReference;
import java.lang.reflect.Method;
import java.util.WeakHashMap;
import java.util.LinkedHashMap;
import java.util.Map;

/** Adapter for the actual com.uc.webview.export.WebView used by the supplied UC APK. */
public final class UCHost implements UCVisualBridge.TrustedPageHost, View.OnAttachStateChangeListener {
    private static final WeakHashMap<View, UCHost> pages = new WeakHashMap<>();
    private static final Handler ui = new Handler(Looper.getMainLooper());
    // One bounded recovery reload per distinct search, even if UC recreates the
    // WebView on reload. Never retry recursively on an unsupported UC runtime.
    private static final Map<String,Boolean> reloadAttempts =
        new LinkedHashMap<String,Boolean>(32,.75f,true) {
            @Override protected boolean removeEldestEntry(Map.Entry<String,Boolean> e) {
                return size()>48;
            }
        };
    private final WeakReference<View> page;
    private final Method url, attach, remove, evaluate, reload;
    private final UCVisualBridge bridge;
    private String probedUrl="";

    private UCHost(View view) throws Exception {
        Class<?> uc = Class.forName("com.uc.webview.export.WebView");
        if (!uc.isInstance(view)) throw new IllegalArgumentException("UC view required");
        page = new WeakReference<>(view);
        url = uc.getMethod("getUrl");
        attach = uc.getMethod("addJavascriptInterface", Object.class, String.class);
        remove = uc.getMethod("removeJavascriptInterface", String.class);
        evaluate = uc.getMethod("evaluateJavascript", String.class, ValueCallback.class);
        reload = uc.getMethod("reload");
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
            host.probedUrl="";
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
            if (host != null) {
                host.bridge.trustedDocumentReady();
                host.verifyBridgeVisibility(pageUrl);
            }
        } catch (Throwable error) { Log.w("XGridYellowUC", "UC document bridge failed", error); }
    }

    /**
     * UC's addJavascriptInterface often becomes visible only after the NEXT
     * document starts. If the first Google Images document missed it, reload
     * exactly once after the page settles. All probes stay on trusted, top-level
     * Google Images pages. We never reload the UC browser startup/splash.
     */
    private static boolean imagesSearch(String pageUrl) {
        if(!UCVisualBridge.googleSearch(pageUrl)) return false;
        try{
            Uri u=Uri.parse(pageUrl);
            return "/imghp".equals(u.getPath()) ||
                "2".equals(u.getQueryParameter("udm")) ||
                "isch".equals(u.getQueryParameter("tbm"));
        }catch(Throwable ignored){return false;}
    }

    private static String reloadKey(String pageUrl) {
        try {
            Uri u=Uri.parse(pageUrl);
            return String.valueOf(u.getHost())+"|"+String.valueOf(u.getPath())+"|"+
                String.valueOf(u.getQueryParameter("q"))+"|"+
                String.valueOf(u.getQueryParameter("udm"))+"|"+
                String.valueOf(u.getQueryParameter("tbm"));
        }catch(Throwable ignored){return pageUrl;}
    }

    private void verifyBridgeVisibility(String expectedUrl) {
        if(!imagesSearch(expectedUrl) || expectedUrl.equals(probedUrl))return;
        probedUrl=expectedUrl;
        ui.postDelayed(()->{
            final View view=page.get();
            if(view==null || !expectedUrl.equals(activeTopLevelUrl()) ||
                !imagesSearch(activeTopLevelUrl()))return;
            final String test="(function(){var ok=(window===top && !!window.xgridUCVision " +
                "&& typeof window.xgridUCVision.status==='function' " +
                "&& typeof window.xgridUCVision.analyzeVisual==='function');" +
                "window.__xgridNativeProbe={visible:!!ok,checked:true};return !!ok;})()";
            try {
                evaluate.invoke(view,test,(ValueCallback<String>) answer -> ui.post(()->{
                    if(!expectedUrl.equals(activeTopLevelUrl()) ||
                        !imagesSearch(activeTopLevelUrl()))return;
                    boolean visible="true".equals(String.valueOf(answer).replace("\"","").trim());
                    if(visible){
                        Log.i("XGridYellowUC","Native JavaScript interface visible on Google Images");
                        return;
                    }
                    String key=reloadKey(expectedUrl);
                    synchronized(reloadAttempts) {
                        if(reloadAttempts.containsKey(key)) {
                            Log.e("XGridYellowUC","Native interface still absent after one recovery reload; inspect UC interface support");
                            return;
                        }
                        reloadAttempts.put(key,true);
                    }
                    Log.w("XGridYellowUC","Native interface missing on first document; retrying one Google Images reload");
                    try {reload.invoke(current());}
                    catch(Throwable error){Log.e("XGridYellowUC","One-time native interface reload failed",error);}
                }));
            }catch(Throwable error){
                Log.w("XGridYellowUC","Native visibility probe failed",error);
            }
        },450);
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
