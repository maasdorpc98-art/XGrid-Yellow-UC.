# XGrid Yellow UC

This project turns the supplied working Orange UC browser into Yellow. It replaces Orange's search controller with Yellow's GIF-only XSearch and connects the actual MediaPipe/OpenCV worker to UC's own browser view.

## Build architecture

- The supplied `XGrid_Orange_v29.0.0_UC_TEST1.apk` is the host, verified by SHA-256 before use.
- `native` is a compile container for the visual engine. Its manifest, activity, and resources are never used as the installed application.
- The final APK retains UC's application class, launcher, services, providers, internal package name, and every original UC native library.
- Three integration classes from UC's seventh DEX are moved into an additional DEX with the native hook. This avoids overflowing the existing DEX reference table.
- Yellow's native adapter uses `com.uc.webview.export.WebView`. It handles main-frame navigation, document readiness, tab suspension, authenticated requests, and stale callbacks.
- Visual signatures use the `native-subject-pose-flow-v3` contract. Geometry supplies 70% and real GIF motion 30% when both signatures contain valid motion. Still previews use geometry alone.
- The pose model is shared across tabs; analysis jobs, media bytes, timeouts, and signature caches are bounded. Optional engine telemetry is removed to avoid conflicting support components in UC.

## Reproduce

Run the **Yellow UC build** GitHub Actions workflow. It verifies the original UC input, compiles the ARM64 native engine, runs controller contract tests, packages Yellow into UC, checks duplicate classes and preserved UC bytes, and aligns the APK.

The `Yellow-UC-unsigned-and-audit` artifact contains the complete UC-based APK before signing. It must be signed before installation. The engine build-input artifact is an intermediate component and is not the Yellow UC application.

Signing happens with Android SDK `apksigner`, using the original Orange certificate. `scripts/sign_uc.py` checks that certificate and verifies v1/v2/v3 signatures and ZIP alignment. Private signing material stays outside this repository.

## Installation identity

The final application is **XGrid Yellow**, version **29.4.0**, ARM64, Android 8.0+. Its internal package remains `org.xgrid.orange` so UC's compiled identity references remain intact. A correctly signed build can update the original Orange installation with certificate SHA-256 `b0e8b0cf257ba5ad833e54096c6d4beaf56ef17637af10f6d57227c76f5bfed4`. Experimental builds signed with other keys are not compatible with that update identity.

## Verification limits

CI compilation, controller behavior checks, package preservation checks, DEX integrity, native model inclusion, Android signing, and alignment can be verified here. Installation, UC startup, actual GIF throughput, and MediaPipe/OpenCV inference still require an ARM64 Android device. Do not describe this as device-tested until those checks are recorded.
