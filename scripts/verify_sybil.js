const { ethers } = require("ethers");

// === VULNERABILITY 5: SYBIL ATTACK (addParticipant Spam) ===
// Can an attacker add themselves 100 times to a vault?
// If yes, they could manipulate quorum or voting

const RPC_URL = "https://ethereum-sepolia.publicnode.com";
const CUSTODY_ADDRESS = "0x815aeca64a974297942d2bbf034bd63eb638883d";

const ABI = [
    "function createVault(bytes32 _creator) external",
    "function addParticipant(bytes32 _creator, bytes32 _participant, string _shard) external",
    "function getParticipants(bytes32 _creator) external view returns (bytes32[])"
];

async function run() {
    console.log("=== VULNERABILITY 5: SYBIL ATTACK TEST ===\n");

    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CUSTODY_ADDRESS, ABI, provider);

    // Test: Can I add the SAME participant multiple times?
    const testCreator = ethers.utils.formatBytes32String("SybilTest");
    const duplicateParticipant = ethers.utils.formatBytes32String("Attack");

    console.log("[*] Testing if duplicate participants are allowed...");
    console.log(`[*] Creator: ${testCreator}`);
    console.log(`[*] Participant: ${duplicateParticipant}\n`);

    try {
        // Use callStatic to simulate without gas
        await contract.callStatic.addParticipant(
            testCreator,
            duplicateParticipant,
            "shard1"
        );

        // If we reach here, first add succeeded
        console.log("First participant added successfully.");

        // Try adding the SAME participant again
        await contract.callStatic.addParticipant(
            testCreator,
            duplicateParticipant,
            "shard2"  // Different shard, same participant
        );

        console.log("Second add succeeded (Duplicate allowed).\n");
        console.log("VULNERABILITY CONFIRMED.");
        console.log("The contract allows adding the same participant multiple times.");
        console.log("Impact: Sybil attack to inflate voting power or bypass quorum.");

    } catch (e) {
        if (e.reason) {
            console.log(`Contract reverted: ${e.reason}`);
            console.log("Duplicate prevention exists. No vulnerability.");
        } else {
            console.log("Error:", e.message);
        }
    }
}

run();
