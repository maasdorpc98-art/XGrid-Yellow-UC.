.class public final Lorg/xgrid/orange/OrangeHook;
.super Ljava/lang/Object;


# static fields
.field private static resumingNativeMenu:Z

.field private static script:Ljava/lang/String;


# direct methods
.method public static inject(Lcom/uc/webview/export/WebView;Ljava/lang/String;)V
    .registers 10

    invoke-static {p0, p1}, Lcom/xgrid/yellowuc/UCHost;->onDocument(Landroid/view/View;Ljava/lang/String;)V

    if-eqz p0, :cond_55

    if-eqz p1, :cond_55

    :try_start_4
    invoke-static {p1}, Landroid/net/Uri;->parse(Ljava/lang/String;)Landroid/net/Uri;

    move-result-object v0

    invoke-virtual {v0}, Landroid/net/Uri;->getHost()Ljava/lang/String;

    move-result-object v0

    if-eqz v0, :cond_55

    const-string v1, "(?i)(?:[a-z0-9-]+\\.)*google\\.[a-z.]+"

    invoke-virtual {v0, v1}, Ljava/lang/String;->matches(Ljava/lang/String;)Z

    move-result v0

    if-eqz v0, :cond_55

    sget-object v0, Lorg/xgrid/orange/OrangeHook;->script:Ljava/lang/String;

    if-nez v0, :cond_48

    invoke-virtual {p0}, Landroid/view/View;->getContext()Landroid/content/Context;

    move-result-object v0

    invoke-virtual {v0}, Landroid/content/Context;->getAssets()Landroid/content/res/AssetManager;

    move-result-object v0

    const-string/jumbo v1, "xgrid/orange.js"

    invoke-virtual {v0, v1}, Landroid/content/res/AssetManager;->open(Ljava/lang/String;)Ljava/io/InputStream;

    move-result-object v1

    new-instance v2, Ljava/io/ByteArrayOutputStream;

    invoke-direct {v2}, Ljava/io/ByteArrayOutputStream;-><init>()V

    const/16 v3, 0x2000

    new-array v3, v3, [B

    :goto_32
    invoke-virtual {v1, v3}, Ljava/io/InputStream;->read([B)I

    move-result v4

    if-lez v4, :cond_3d

    const/4 v5, 0x0

    invoke-virtual {v2, v3, v5, v4}, Ljava/io/ByteArrayOutputStream;->write([BII)V

    goto :goto_32

    :cond_3d
    invoke-virtual {v1}, Ljava/io/InputStream;->close()V

    const-string v1, "UTF-8"

    invoke-virtual {v2, v1}, Ljava/io/ByteArrayOutputStream;->toString(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v0

    sput-object v0, Lorg/xgrid/orange/OrangeHook;->script:Ljava/lang/String;

    :cond_48
    const/4 v1, 0x0

    invoke-virtual {p0, v0, v1}, Lcom/uc/webview/export/WebView;->evaluateJavascript(Ljava/lang/String;Landroid/webkit/ValueCallback;)V
    :try_end_4c
    .catch Ljava/lang/Exception; {:try_start_4 .. :try_end_4c} :catch_4d

    goto :goto_55

    :catch_4d
    move-exception v0

    const-string v1, "XGridOrange"

    const-string v2, "Feature injection failed"

    invoke-static {v1, v2, v0}, Landroid/util/Log;->w(Ljava/lang/String;Ljava/lang/String;Ljava/lang/Throwable;)I

    :cond_55
    :goto_55
    return-void
.end method

.method public static resumeLongPress(Lcom/uc/browser/webwindow/WebWindow;Landroid/view/View;)V
    .registers 5

    const/4 v0, 0x1

    sput-boolean v0, Lorg/xgrid/orange/OrangeHook;->resumingNativeMenu:Z

    :try_start_3
    invoke-virtual {p0, p1}, Lcom/uc/browser/webwindow/WebWindow;->onLongClick(Landroid/view/View;)Z
    :try_end_6
    .catchall {:try_start_3 .. :try_end_6} :catchall_a

    const/4 v0, 0x0

    sput-boolean v0, Lorg/xgrid/orange/OrangeHook;->resumingNativeMenu:Z

    return-void

    :catchall_a
    move-exception v0

    const/4 v1, 0x0

    sput-boolean v1, Lorg/xgrid/orange/OrangeHook;->resumingNativeMenu:Z

    const-string v1, "XGridOrange"

    const-string v2, "Native image menu fallback failed"

    invoke-static {v1, v2, v0}, Landroid/util/Log;->w(Ljava/lang/String;Ljava/lang/String;Ljava/lang/Throwable;)I

    return-void
.end method

.method public static routeLongPress(Lcom/uc/browser/webwindow/WebWindow;Landroid/view/View;)Z
    .registers 12

    const/4 v7, 0x0

    :try_start_1
    sget-boolean v0, Lorg/xgrid/orange/OrangeHook;->resumingNativeMenu:Z

    if-nez v0, :cond_b7

    if-eqz p0, :cond_b7

    iget-boolean v0, p0, Lcom/uc/browser/webwindow/WebWindow;->C0:Z

    if-eqz v0, :cond_b7

    iget-object v0, p0, Lcom/uc/browser/webwindow/WebWindow;->K:Lgd0/s;

    if-eqz v0, :cond_b7

    invoke-virtual {v0}, Lcom/uc/webview/export/WebView;->getUrl()Ljava/lang/String;

    move-result-object v1

    if-eqz v1, :cond_b7

    invoke-static {v1}, Landroid/net/Uri;->parse(Ljava/lang/String;)Landroid/net/Uri;

    move-result-object v2

    invoke-virtual {v2}, Landroid/net/Uri;->getHost()Ljava/lang/String;

    move-result-object v3

    if-eqz v3, :cond_b7

    const-string v4, "(?i)(?:[a-z0-9-]+\\.)*google\\.(?:com|[a-z]{2,3}|(?:co|com)\\.[a-z]{2})"

    invoke-virtual {v3, v4}, Ljava/lang/String;->matches(Ljava/lang/String;)Z

    move-result v3

    if-eqz v3, :cond_b7

    invoke-virtual {v2}, Landroid/net/Uri;->getPath()Ljava/lang/String;

    move-result-object v3

    const-string v4, "/search"

    invoke-virtual {v4, v3}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v3

    if-eqz v3, :cond_b7

    const-string/jumbo v3, "udm"

    invoke-virtual {v2, v3}, Landroid/net/Uri;->getQueryParameter(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v3

    const-string v4, "2"

    invoke-virtual {v4, v3}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v3

    if-nez v3, :cond_50

    const-string v3, "tbm"

    invoke-virtual {v2, v3}, Landroid/net/Uri;->getQueryParameter(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v3

    const-string v4, "isch"

    invoke-virtual {v4, v3}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v3

    if-eqz v3, :cond_b7

    :cond_50
    invoke-virtual {v0}, Lcom/uc/webview/export/WebView;->getHitTestResult()Lcom/uc/webview/export/WebView$HitTestResult;

    move-result-object v2

    if-eqz v2, :cond_b7

    invoke-virtual {v2}, Lcom/uc/webview/export/WebView$HitTestResult;->getType()I

    move-result v3

    const/4 v4, 0x5

    if-eq v3, v4, :cond_74

    const/4 v4, 0x6

    if-eq v3, v4, :cond_74

    const/16 v4, 0x8

    if-eq v3, v4, :cond_74

    invoke-virtual {v2}, Lcom/uc/webview/export/WebView$HitTestResult;->innerResult()Lcom/uc/webview/internal/interfaces/IWebView$IHitTestResult;

    move-result-object v3

    instance-of v4, v3, Lcom/uc/webview/internal/interfaces/IEnhancedHitTestResult;

    if-eqz v4, :cond_b7

    check-cast v3, Lcom/uc/webview/internal/interfaces/IEnhancedHitTestResult;

    invoke-interface {v3}, Lcom/uc/webview/internal/interfaces/IEnhancedHitTestResult;->hasImage()Z

    move-result v3

    if-eqz v3, :cond_b7

    :cond_74
    invoke-virtual {v2}, Lcom/uc/webview/export/WebView$HitTestResult;->getExtra()Ljava/lang/String;

    move-result-object v3

    invoke-static {v3}, Lorg/json/JSONObject;->quote(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v3

    new-instance v2, Ljava/lang/StringBuilder;

    invoke-direct {v2}, Ljava/lang/StringBuilder;-><init>()V

    const-string v4, "Boolean(window.__xgridUcOpenImageMenu && window.__xgridUcOpenImageMenu("

    invoke-virtual {v2, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v2, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string v3, ","

    invoke-virtual {v2, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-static {}, Ljava/lang/System;->currentTimeMillis()J

    move-result-wide v4

    const-wide/16 v8, 0x258

    add-long/2addr v4, v8

    invoke-virtual {v2, v4, v5}, Ljava/lang/StringBuilder;->append(J)Ljava/lang/StringBuilder;

    const-string v3, "))"

    invoke-virtual {v2, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v2}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v2

    new-instance v6, Lorg/xgrid/orange/OrangeLongPress;

    invoke-direct {v6, p0, p1, v0, v1}, Lorg/xgrid/orange/OrangeLongPress;-><init>(Lcom/uc/browser/webwindow/WebWindow;Landroid/view/View;Lcom/uc/webview/export/WebView;Ljava/lang/String;)V

    move-object v7, v6

    invoke-virtual {v7}, Lorg/xgrid/orange/OrangeLongPress;->start()V

    invoke-virtual {v0, v2, v7}, Lcom/uc/webview/export/WebView;->evaluateJavascript(Ljava/lang/String;Landroid/webkit/ValueCallback;)V
    :try_end_ad
    .catch Ljava/lang/Exception; {:try_start_1 .. :try_end_ad} :catch_af

    const/4 v0, 0x1

    return v0

    :catch_af
    move-exception v0

    if-eqz v7, :cond_b7

    invoke-virtual {v7}, Lorg/xgrid/orange/OrangeLongPress;->run()V

    const/4 v0, 0x1

    return v0

    :cond_b7
    const/4 v0, 0x0

    return v0
.end method
