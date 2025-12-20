const { ethers } = require("ethers");

// === VULNERABILITY 6: QUORUM MANIPULATION ===
// Can quorum be changed after setup? Can it be set to 0 or higher than participant count?

const RPC_URL = "https://ethereum-sepolia.publicnode.com";
const CUSTODY_ADDRESS = "0x815aeca64a974297942d2bbf034bd63eb638883d";

const ABI = [
    "function createVault(bytes32 _creator) external",
    "function defineQuorum(bytes32 _creator, uint256 _minParticipants) external",
    "function getQuorum(bytes32 _creator) external view returns (uint256)"
];

async function run() {
    console.log("=== VULNERABILITY 6: QUORUM MANIPULATION TEST ===\n");

    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CUSTODY_ADDRESS, ABI, provider);

    const testCreator = ethers.utils.formatBytes32String("QuorumTest");

    console.log("Test 1: Can we set quorum to 0?");
    try {
        await contract.callStatic.defineQuorum(testCreator, 0);
        console.log("Success: Quorum = 0 is allowed.\n");
        console.log("Impact: Anyone can approve transactions (0 signatures needed).\n");
    } catch (e) {
        console.log(`Blocked: ${e.reason || e.message}\n`);
    }

    console.log("Test 2: Can we set quorum to 1000?");
    try {
        await contract.callStatic.defineQuorum(testCreator, 1000);
        console.log("Success: Quorum = 1000 is allowed.\n");
        console.log("Impact: Permanent DoS (impossible to reach consensus).\n");
    } catch (e) {
        console.log(`Blocked: ${e.reason || e.message}\n`);
    }

    console.log("Test 3: Can we change quorum after setting it once?");
    try {
        // Set to 3
        await contract.callStatic.defineQuorum(testCreator, 3);
        console.log("First call (quorum=3): Success.");

        // Try changing to 1
        await contract.callStatic.defineQuorum(testCreator, 1);
        console.log("Second call (quorum=1): Success.\n");
        console.log("Impact: Creator can reduce quorum at any time, bypassing agreed security.\n");
    } catch (e) {
        console.log(`Blocked: ${e.reason || e.message}\n`);
    }
}

run();

