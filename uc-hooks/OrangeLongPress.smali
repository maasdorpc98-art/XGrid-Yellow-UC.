.class public final Lorg/xgrid/orange/OrangeLongPress;
.super Ljava/lang/Object;

# interfaces
.implements Landroid/webkit/ValueCallback;
.implements Ljava/lang/Runnable;


# instance fields
.field private done:Z

.field private final handler:Landroid/os/Handler;

.field private final url:Ljava/lang/String;

.field private final view:Landroid/view/View;

.field private final webView:Lcom/uc/webview/export/WebView;

.field private final window:Lcom/uc/browser/webwindow/WebWindow;


# direct methods
.method public constructor <init>(Lcom/uc/browser/webwindow/WebWindow;Landroid/view/View;Lcom/uc/webview/export/WebView;Ljava/lang/String;)V
    .registers 7

    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    iput-object p1, p0, Lorg/xgrid/orange/OrangeLongPress;->window:Lcom/uc/browser/webwindow/WebWindow;

    iput-object p2, p0, Lorg/xgrid/orange/OrangeLongPress;->view:Landroid/view/View;

    iput-object p3, p0, Lorg/xgrid/orange/OrangeLongPress;->webView:Lcom/uc/webview/export/WebView;

    iput-object p4, p0, Lorg/xgrid/orange/OrangeLongPress;->url:Ljava/lang/String;

    invoke-static {}, Landroid/os/Looper;->getMainLooper()Landroid/os/Looper;

    move-result-object v0

    new-instance v1, Landroid/os/Handler;

    invoke-direct {v1, v0}, Landroid/os/Handler;-><init>(Landroid/os/Looper;)V

    iput-object v1, p0, Lorg/xgrid/orange/OrangeLongPress;->handler:Landroid/os/Handler;

    return-void
.end method


# virtual methods
.method public onReceiveValue(Ljava/lang/Object;)V
    .registers 4

    iget-boolean v0, p0, Lorg/xgrid/orange/OrangeLongPress;->done:Z

    if-nez v0, :cond_15

    const-string/jumbo v0, "true"

    invoke-virtual {v0, p1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    if-eqz v0, :cond_16

    const/4 v0, 0x1

    iput-boolean v0, p0, Lorg/xgrid/orange/OrangeLongPress;->done:Z

    iget-object v0, p0, Lorg/xgrid/orange/OrangeLongPress;->handler:Landroid/os/Handler;

    invoke-virtual {v0, p0}, Landroid/os/Handler;->removeCallbacks(Ljava/lang/Runnable;)V

    :cond_15
    return-void

    :cond_16
    invoke-virtual {p0}, Lorg/xgrid/orange/OrangeLongPress;->run()V

    return-void
.end method

.method public run()V
    .registers 4

    iget-boolean v0, p0, Lorg/xgrid/orange/OrangeLongPress;->done:Z

    if-nez v0, :cond_2a

    const/4 v0, 0x1

    iput-boolean v0, p0, Lorg/xgrid/orange/OrangeLongPress;->done:Z

    :try_start_7
    iget-object v0, p0, Lorg/xgrid/orange/OrangeLongPress;->handler:Landroid/os/Handler;

    invoke-virtual {v0, p0}, Landroid/os/Handler;->removeCallbacks(Ljava/lang/Runnable;)V

    iget-object v0, p0, Lorg/xgrid/orange/OrangeLongPress;->webView:Lcom/uc/webview/export/WebView;

    invoke-virtual {v0}, Lcom/uc/webview/export/WebView;->getUrl()Ljava/lang/String;

    move-result-object v0

    iget-object v1, p0, Lorg/xgrid/orange/OrangeLongPress;->url:Ljava/lang/String;

    invoke-virtual {v1, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    if-eqz v0, :cond_2a

    iget-object v0, p0, Lorg/xgrid/orange/OrangeLongPress;->window:Lcom/uc/browser/webwindow/WebWindow;

    iget-object v1, p0, Lorg/xgrid/orange/OrangeLongPress;->view:Landroid/view/View;

    invoke-static {v0, v1}, Lorg/xgrid/orange/OrangeHook;->resumeLongPress(Lcom/uc/browser/webwindow/WebWindow;Landroid/view/View;)V
    :try_end_21
    .catch Ljava/lang/Exception; {:try_start_7 .. :try_end_21} :catch_22

    goto :goto_2a

    :catch_22
    move-exception v0

    const-string v1, "XGridOrange"

    const-string v2, "Image menu fallback failed"

    invoke-static {v1, v2, v0}, Landroid/util/Log;->w(Ljava/lang/String;Ljava/lang/String;Ljava/lang/Throwable;)I

    :cond_2a
    :goto_2a
    return-void
.end method

.method public start()V
    .registers 4

    iget-object v0, p0, Lorg/xgrid/orange/OrangeLongPress;->handler:Landroid/os/Handler;

    const-wide/16 v1, 0x320

    invoke-virtual {v0, p0, v1, v2}, Landroid/os/Handler;->postDelayed(Ljava/lang/Runnable;J)Z

    return-void
.end method
