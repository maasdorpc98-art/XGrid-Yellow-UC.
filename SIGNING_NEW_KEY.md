# XGrid Yellow UC — permanent new signing key

This is a **new signing identity** for the existing package `org.xgrid.orange`. Android does NOT allow an APK signed with this key to replace a v29.4.1 installation signed with the old Orange key. Back up user data before uninstalling the existing app. Do NOT rename the package to simulate an update.

## One-time setup

1. In GitHub repository Settings → Secrets and variables → Actions, create a **repository secret** named `XGRID_NEW_SIGNER_PASSWORD`. Use a unique random password of 32 or more characters and save it in your password manager. Do not commit it or paste it into a GitHub issue.
2. Open Actions → `XGrid Yellow UC - New permanent signing key` → Run workflow; keep the default build run ID `39994923941` to sign the validated v29.4.2 source.
3. Download the artifact named `XGrid-Yellow-UC-SIGNED-NewPermanentKey`. Confirm the `apksigner verify` and `zipalign` checks succeeded.
4. Back up the encrypted `signing/yellow-uc-permanent.p12.enc` file **and** retain the password separately. The encrypted file is checked into this repo on first successful signing. Keep your password private. Losing either the backup or the password prevents future APK updates signed with this identity.

Subsequent successful `Yellow UC build` workflow runs trigger the new-key signing workflow automatically and reuse the same encrypted key. No new keys are generated once the encrypted backup exists.

The workflow never commits an unencrypted private key or signing password. GitHub Actions compiles and packages the UC APK first; only its validated unsigned artifact is signed. The resulting app keeps the same package ID and its versionCode progresses to 290402. Real-device startup and MediaPipe/OpenCV runtime operation remain to be tested.
