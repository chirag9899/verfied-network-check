const { ethers } = require("ethers");

// === REAL VAULT TEST ===
// Create an actual vault and test Sybil + Quorum on it

const RPC_URL = "https://ethereum-sepolia.publicnode.com";
const CUSTODY_ADDRESS = "0x815aeca64a974297942d2bbf034bd63eb638883d";
const PRIVATE_KEY = "0xa12f4dc456a8fa989f093604e702384f9691f99c3242f615fc9a1ba0d3b3eaf2";

const ABI = [
    "function createVault(bytes32 _creator) external",
    "function addParticipant(bytes32 _creator, bytes32 _participant, string _shard) external",
    "function defineQuorum(bytes32 _creator, uint256 _minParticipants) external",
    "function getQuorum(bytes32 _creator) external view returns (uint256)"
];

async function run() {
    console.log("=== TESTING ON REAL VAULT ===\n");

    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CUSTODY_ADDRESS, ABI, wallet);

    const VAULT_ID = ethers.utils.formatBytes32String("RealTest" + Date.now());

    try {
        console.log("1. Creating Vault...");
        const tx = await contract.createVault(VAULT_ID, { gasLimit: 500000 });
        await tx.wait();
        console.log("Vault created successfully.\n");
    } catch (e) {
        console.log("Failed:", e.message);
        return;
    }

    // Test Sybil
    try {
        console.log("2. Testing Sybil Attack...");
        const p1 = ethers.utils.formatBytes32String("Alice");

        await (await contract.addParticipant(VAULT_ID, p1, "shard1", { gasLimit: 500000 })).wait();
        console.log("First participant added.");

        await (await contract.addParticipant(VAULT_ID, p1, "shard2", { gasLimit: 500000 })).wait();
        console.log("Second participant added - Sybil attack successful.\n");

    } catch (e) {
        console.log("Blocked:", e.reason || e.message, "\n");
    }

    // Test Quorum
    try {
        console.log("3. Testing Quorum Manipulation...");
        // Try setting quorum to 0
        const quorum = 0;
        await (await contract.defineQuorum(VAULT_ID, quorum, { gasLimit: 500000 })).wait();
        console.log(`Quorum set to: ${quorum} - Exploit successful.\n`);

    } catch (e) {
        console.log("Blocked:", e.reason || e.message, "\n");
    }
}

run();
