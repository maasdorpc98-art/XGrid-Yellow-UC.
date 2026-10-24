plugins { id("com.android.application") }
android {
    namespace = "org.xgrid.yellow.engine"
    compileSdk = 35
    defaultConfig {
        applicationId = "org.xgrid.yellow.engine.compileonly"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "29.4.3"
        ndk { abiFilters += "arm64-v8a" }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }
    androidResources { noCompress += listOf("task", "tflite") }
}
dependencies {
    implementation("com.google.mediapipe:tasks-vision:0.10.32")
    implementation("org.opencv:opencv:4.12.0")
}
