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

The final application is **XGrid Yellow**, version **29.4.3**, ARM64, Android 8.0+. Its internal package remains `org.xgrid.orange` so UC's compiled identity references remain intact. A correctly signed build can update the original Orange installation with certificate SHA-256 `b0e8b0cf257ba5ad833e54096c6d4beaf56ef17637af10f6d57227c76f5bfed4`. Experimental builds signed with other keys are not compatible with that update identity.

## Verification limits

CI compilation, controller behavior checks, package preservation checks, DEX integrity, native model inclusion, Android signing, and alignment can be verified here. Installation, UC startup, actual GIF throughput, and MediaPipe/OpenCV inference still require an ARM64 Android device. Do not describe this as device-tested until those checks are recorded.

## Permanent native engines — v29.4.3

MediaPipe Pose Landmarker and OpenCV Farneback flow are mandatory for native FIND MORE ranking. The pose model and native binaries are packaged directly into UC (offline, not downloaded on demand). Native initialization runs off the UC startup thread. The runtime performs a real pose-detect call and optical-flow call before reporting ready. Failed initialization is retried with a bounded delay; the controller waits up to 8.5 seconds for initialization and reports a visible failure rather than silently accepting geometry-only or fabricated motion as native processing. A still image can correctly have no motion despite both engines being healthy. This is a source/CI contract, not a guarantee against incompatible devices or actual on-device test failures.

## UC native bridge recovery — 29.4.3

The native interface stays attached between **trusted Google search** navigations instead of being detached/re-added during page startup. Authentication capabilities are rotated and stale callbacks rejected on each navigation. A delayed JavaScript visibility probe runs only on Google Images, triggering **at most one reload per distinct search** if UC did not expose the newly attached native object in the first document. Further failures are explicitly logged under `XGridYellowUC` and the page exposes `window.__xgridNativeProbe` for XSearch diagnostics. The native engine remains mandatory for native FIND MORE ranking. This addresses a source-verified timing risk; actual MediaPipe/OpenCV operation still requires an Android device diagnostic.
