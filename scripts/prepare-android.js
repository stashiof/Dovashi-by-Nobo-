import fs from 'fs';
import path from 'path';

console.log('--- Preparing Android Native Files & Assets ---');

// 1. Update AndroidManifest.xml permissions
const manifestPath = path.resolve('android/app/src/main/AndroidManifest.xml');
if (fs.existsSync(manifestPath)) {
  let content = fs.readFileSync(manifestPath, 'utf8');
  const perms = `    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />`;

  if (!content.includes('android.permission.RECORD_AUDIO')) {
    content = content.replace('<application', `${perms}\n    <application`);
    fs.writeFileSync(manifestPath, content, 'utf8');
    console.log('✓ Injected Audio & Network permissions into AndroidManifest.xml');
  }
}

// 2. Create MainActivity.java with Runtime Audio WebChromeClient handler
const mainActivityDir = path.resolve('android/app/src/main/java/com/nobo/dovashi');
fs.mkdirSync(mainActivityDir, { recursive: true });
const mainActivityPath = path.join(mainActivityDir, 'MainActivity.java');

const activityCode = `package com.nobo.dovashi;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, new String[]{
                Manifest.permission.RECORD_AUDIO,
                Manifest.permission.MODIFY_AUDIO_SETTINGS
            }, 101);
        }
    }

    @Override
    public void onStart() {
        super.onStart();
        if (this.bridge != null && this.bridge.getWebView() != null) {
            this.bridge.getWebView().setWebChromeClient(new WebChromeClient() {
                @Override
                public void onPermissionRequest(final PermissionRequest request) {
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            request.grant(request.getResources());
                        }
                    });
                }
            });
        }
    }
}
`;

fs.writeFileSync(mainActivityPath, activityCode, 'utf8');
console.log('✓ Injected runtime audio permission handler into MainActivity.java');

// 2.1 Ensure strings.xml contains Native Google Auth configuration
const stringsDir = path.resolve('android/app/src/main/res/values');
fs.mkdirSync(stringsDir, { recursive: true });
const stringsPath = path.join(stringsDir, 'strings.xml');
const stringsContent = `<?xml version='1.0' encoding='utf-8'?>
<resources>
    <string name="app_name">Dovashi</string>
    <string name="title_activity_main">Dovashi</string>
    <string name="package_name">com.nobo.dovashi</string>
    <string name="custom_url_scheme">com.nobo.dovashi</string>
    <string name="server_client_id">348785349910-o3e8g44mvdn85t03l8b7k8q29g65r1u9.apps.googleusercontent.com</string>
</resources>
`;
fs.writeFileSync(stringsPath, stringsContent, 'utf8');
console.log('✓ Configured native strings.xml for Google Sign-In');

// 3. Inject App Icons into all mipmap folders
const resDir = path.resolve('android/app/src/main/res');

const densities = [
  { folder: 'mipmap-mdpi', src: 'assets/icon-48.png' },
  { folder: 'mipmap-hdpi', src: 'assets/icon-72.png' },
  { folder: 'mipmap-xhdpi', src: 'assets/icon-96.png' },
  { folder: 'mipmap-xxhdpi', src: 'assets/icon-144.png' },
  { folder: 'mipmap-xxxhdpi', src: 'assets/icon-512.png' },
];

for (const { folder, src } of densities) {
  const targetDir = path.join(resDir, folder);
  fs.mkdirSync(targetDir, { recursive: true });
  const srcPath = path.resolve(src);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, path.join(targetDir, 'ic_launcher.png'));
    fs.copyFileSync(srcPath, path.join(targetDir, 'ic_launcher_round.png'));
    fs.copyFileSync(srcPath, path.join(targetDir, 'ic_launcher_foreground.png'));
    console.log(`✓ Injected icons into ${folder}`);
  }
}

// 4. Inject Splash Screens into all drawable folders
const splashDensities = [
  'drawable',
  'drawable-port-mdpi',
  'drawable-port-hdpi',
  'drawable-port-xhdpi',
  'drawable-port-xxhdpi',
  'drawable-port-xxxhdpi',
  'drawable-land-mdpi',
  'drawable-land-hdpi',
  'drawable-land-xhdpi',
  'drawable-land-xxhdpi',
  'drawable-land-xxxhdpi',
];

const splashSrc = path.resolve('assets/splash.png');
if (fs.existsSync(splashSrc)) {
  for (const drawFolder of splashDensities) {
    const drawDir = path.join(resDir, drawFolder);
    fs.mkdirSync(drawDir, { recursive: true });
    fs.copyFileSync(splashSrc, path.join(drawDir, 'splash.png'));
  }
  console.log('✓ Replaced all old splash screens with new logo');
}

// 5. Inject Vector Adaptive Drawables for Android 8+ (API 26+)
const drawableDir = path.join(resDir, 'drawable');
const drawableV24Dir = path.join(resDir, 'drawable-v24');
const anyDpiDir = path.join(resDir, 'mipmap-anydpi-v26');

fs.mkdirSync(drawableDir, { recursive: true });
fs.mkdirSync(drawableV24Dir, { recursive: true });
fs.mkdirSync(anyDpiDir, { recursive: true });

const bgXml = path.resolve('assets/ic_launcher_background.xml');
const fgXml = path.resolve('assets/ic_launcher_foreground.xml');

if (fs.existsSync(bgXml)) {
  fs.copyFileSync(bgXml, path.join(drawableDir, 'ic_launcher_background.xml'));
  fs.copyFileSync(bgXml, path.join(drawableV24Dir, 'ic_launcher_background.xml'));
}

if (fs.existsSync(fgXml)) {
  fs.copyFileSync(fgXml, path.join(drawableDir, 'ic_launcher_foreground.xml'));
  fs.copyFileSync(fgXml, path.join(drawableV24Dir, 'ic_launcher_foreground.xml'));
}

const adaptiveXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
</adaptive-icon>`;

fs.writeFileSync(path.join(anyDpiDir, 'ic_launcher.xml'), adaptiveXml, 'utf8');
fs.writeFileSync(path.join(anyDpiDir, 'ic_launcher_round.xml'), adaptiveXml, 'utf8');
console.log('✓ Configured Adaptive Vector Drawables for modern Android');

// 6. Update build.gradle & Proguard Rules
const buildGradlePath = path.resolve('android/app/build.gradle');
if (fs.existsSync(buildGradlePath)) {
  let gradleContent = fs.readFileSync(buildGradlePath, 'utf8');
  if (gradleContent.includes('minifyEnabled true')) {
    gradleContent = gradleContent.replace('minifyEnabled true', 'minifyEnabled false');
  }
  if (gradleContent.includes('shrinkResources true')) {
    gradleContent = gradleContent.replace('shrinkResources true', 'shrinkResources false');
  }
  const excludeRule = `
configurations.all {
    exclude group: 'org.jetbrains.kotlin', module: 'kotlin-stdlib-jdk7'
    exclude group: 'org.jetbrains.kotlin', module: 'kotlin-stdlib-jdk8'
}
`;
  if (!gradleContent.includes('kotlin-stdlib-jdk7')) {
    gradleContent += excludeRule;
  }
  fs.writeFileSync(buildGradlePath, gradleContent, 'utf8');
  console.log('✓ Updated build.gradle with safe plugin execution settings');
}

const proguardRulesPath = path.resolve('android/app/proguard-rules.pro');
if (fs.existsSync(proguardRulesPath)) {
  let rules = fs.readFileSync(proguardRulesPath, 'utf8');
  const securityRules = `
# Dovashi Google Auth & Capacitor Native Keep Rules
-keep public class com.getcapacitor.** { *; }
-keep public class * extends com.getcapacitor.Plugin { *; }
-keep class com.codetrixstudio.capacitor.GoogleAuth.** { *; }
-keep class com.google.android.gms.auth.** { *; }
-keep class com.google.android.gms.common.** { *; }
-keep class com.google.android.gms.tasks.** { *; }
-dontwarn com.google.android.gms.**
-dontwarn com.codetrixstudio.**
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod
`;
  if (!rules.includes('Dovashi Google Auth')) {
    rules += securityRules;
    fs.writeFileSync(proguardRulesPath, rules, 'utf8');
    console.log('✓ Injected Google Auth & Capacitor keep rules');
  }
}

console.log('--- Android Preparation Complete Successfully ---');
