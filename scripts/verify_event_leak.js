const { ethers } = require("ethers");

// === VULNERABILITY: EVENT LOG PRIVACY LEAK ===
// Even if getShards() is fixed, all shards are permanently visible in event logs

const RPC_URL = "https://base.llamarpc.com";
const CUSTODY_ADDRESS = "0xcB7282B16E381aA6A63b429170455CeDafBBc71C"; // Base Mainnet

const ABI = [
    "event NewParticipant(bytes32 indexed creator, bytes32 indexed participant, string _shard)"
];

async function run() {
    console.log("=== VULNERABILITY: PERMANENT EVENT LOG LEAK ===\n");

    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CUSTODY_ADDRESS, ABI, provider);

    console.log("[*] Scraping NewParticipant events from Base Mainnet...");
    console.log("[*] Searching last 100,000 blocks...\n");

    const latestBlock = await provider.getBlockNumber();
    const startBlock = Math.max(0, latestBlock - 100000);

    try {
        const events = await contract.queryFilter(
            contract.filters.NewParticipant(),
            startBlock,
            latestBlock
        );

        if (events.length === 0) {

            console.log("No events found in this range.");
            console.log("    (Contract might be new or inactive)");
            return;
        } else {
            console.log(`Found ${events.length} shard leaks:\n`);

            events.forEach((event) => {
                console.log(`Creator:     ${event.args.creator}`);
                console.log(`Participant: ${event.args.participant}`);
                console.log(`  Shard:       ${event.args._shard.substring(0, 60)}...`);
                console.log('');
            });
        }

        console.log("\nVULNERABILITY CONFIRMED:");
        console.log("All shards are permanently visible in event logs.");
        console.log("Historical data cannot be deleted even if the contract is upgraded.");

    } catch (e) {
        console.log("Error:", e.message);
    }
}

run();
