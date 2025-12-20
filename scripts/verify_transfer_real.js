const { ethers } = require("ethers");

// === VERIFY VAULT TRANSFER ON REAL VAULT ===

const RPC_URL = "https://ethereum-sepolia.publicnode.com";
const CUSTODY_ADDRESS = "0x815aeca64a974297942d2bbf034bd63eb638883d";
const PRIVATE_KEY = "0xa12f4dc456a8fa989f093604e702384f9691f99c3242f615fc9a1ba0d3b3eaf2";

// Use the vault we just created
const VAULT_ID = "0x5465737431373636363632323539303235000000000000000000000000000000";

const ABI = [
    "function transferVault(bytes32 _creator, address _transferee) external",
    "function getCreator(bytes32 _creator) external view returns (bool, address, uint256)"
];

async function run() {
    console.log("=== TESTING VAULT TRANSFER ON REAL VAULT ===\n");

    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CUSTODY_ADDRESS, ABI, wallet);

    console.log(`Vault ID: ${VAULT_ID}`);
    console.log(`Current Owner: ${wallet.address}`);

    const newOwner = "0x0000000000000000000000000000000000000001"; // Burn address
    console.log(`Attempting to transfer to: ${newOwner}\n`);

    try {
        // Try to transfer OUR OWN vault first (should work - we own it)
        const tx = await contract.transferVault(VAULT_ID, newOwner, { gasLimit: 500000 });
        const receipt = await tx.wait();

        console.log("Transfer succeeded.");
        console.log(`Transaction Hash: ${receipt.transactionHash}`);
        console.log(`Block Number: ${receipt.blockNumber}\n`);

        console.log("Note: We transferred our own vault.");
        console.log("Testing unauthorized transfer requires a second wallet or victim vault.\n");

    } catch (e) {
        console.log("Transfer failed:", e.reason || e.message);
    }
}

run();
