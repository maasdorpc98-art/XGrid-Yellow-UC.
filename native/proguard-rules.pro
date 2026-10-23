-repackageclasses org.xgrid.yellow.internal
-keep class com.xgrid.yellowuc.** { *; }
-keepclasseswithmembers class * { native <methods>; }
-keepclassmembers class * { @android.webkit.JavascriptInterface <methods>; }
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod
-dontwarn javax.annotation.**
# Optional task telemetry is not part of visual inference. Removing these calls
# avoids a second Android data-transport runtime inside the existing UC host.
-assumenosideeffects class com.google.mediapipe.tasks.core.logging.** {
    *** *(...);
}
