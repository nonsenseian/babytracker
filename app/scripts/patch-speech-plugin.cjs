const fs = require('fs');
const path = require('path');

const pluginDir = path.join(__dirname, '..', 'node_modules', '@capgo', 'capacitor-speech-recognition', 'ios', 'Sources', 'SpeechRecognitionPlugin');

if (!fs.existsSync(pluginDir)) {
    console.log('[patch-speech-plugin] Plugin directory not found, skipping patch.');
    process.exit(0);
}

const filesToPatch = [
    'SpeechAnalyzerRecognitionSession.swift',
    'SpeechRecognitionPlugin.swift'
];

let totalPatched = 0;

for (const file of filesToPatch) {
    const filePath = path.join(pluginDir, file);
    if (!fs.existsSync(filePath)) continue;

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // 1. Fix unreleased/invalid iOS version 26.0 -> iOS 18.0 (Apple's official SpeechAnalyzer SDK release)
    if (content.includes('26.0')) {
        content = content.replace(/iOS 26\.0/g, 'iOS 18.0');
        modified = true;
    }

    // 2. Fix compiler version check: Xcode 16 is Swift 6.0, not >= 6.2
    if (content.includes('compiler(>=6.2)')) {
        content = content.replace(/compiler\(>=6\.2\)/g, 'compiler(>=6.0)');
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`[patch-speech-plugin] Successfully patched ${file}`);
        totalPatched++;
    } else {
        console.log(`[patch-speech-plugin] ${file} already clean.`);
    }
}

console.log(`[patch-speech-plugin] Completed. Patched ${totalPatched} file(s).`);
