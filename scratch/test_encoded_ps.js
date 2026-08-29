const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function runPowerShell(script) {
    const buffer = Buffer.from(script, 'utf16le');
    const base64 = buffer.toString('base64');
    return execSync(`powershell -ExecutionPolicy Bypass -EncodedCommand ${base64}`, { encoding: 'utf-8' });
}

const out = runPowerShell(`Write-Output "ทดสอบภาษาไทย 100% สำเร็จ!"`);
console.log('Result:', out.trim());
