# 🦅 Verified Custody Security Audit Submission

Target Contract (Sepolia): `0x3B3AD30e32fFef3dD598dd3EfDf6DCC392897786`

> [!CAUTION]
> **CRITICAL SECURITY ALERT:** This system has been proven vulnerable to total private key recovery. **Do not use this contract for mainnet assets.**

---

## 🏆 Verified Vulnerabilities Summary

| ID | Vulnerability | Severity | Verified Proof |
|---|---|---|---|
| **VUL-01** | **Private Key Recovery** | 🔴 **CRITICAL** | `scripts/proof_live_pin_crack.js` |
| **VUL-02** | Sybil Attack | 🔴 **CRITICAL** | `scripts/test_participant_manipulation.js` |
| **VUL-03** | Quorum Manipulation | 🔴 **CRITICAL** | `scripts/test_participant_manipulation.js` |
| **VUL-04** | Calldata Data Leak | 🟠 **HIGH** | Architectural Flaw (Public Calldata) |
| **VUL-05** | Gas Griefing DoS | 🟠 **HIGH** | `pocs/poc_gas_griefing.js` |

---

## 🚀 Evidence & Verification

This repository contains standalone scripts to verify each finding on the live Sepolia testnet.

### 1. Live Key Recovery Demo (VUL-01)
This is the most critical finding. It proves that any shard uploaded to the contract can be cracked in under 1 second.
```bash
node scripts/proof_live_pin_crack.js
```
*   **Proof:** Verified on-chain: [0x209d224e...](https://sepolia.etherscan.io/tx/0x209d224e02ba4b6475fe8cc19c623764b34c565bae7db3d7faf1d9138283863e)

### 2. Multisig Logic Bypass (VUL-02, VUL-03)
Proves that the multisig protection can be completely disabled by a single user.
```bash
node scripts/test_participant_manipulation.js
```

### 3. State Bloat & Griefing (VUL-05)
Demonstrates uploading massive unvalidated payloads to the blockchain.
```bash
node pocs/poc_gas_griefing.js
```
*   **Proof:** Verified on-chain: [0x8c4d3bfe...](https://sepolia.etherscan.io/tx/0x8c4d3bfe4c1f9a63f4628278919d539bf17d398d80875c6669bcc0feba2418da)

---

## 📄 Documentation

*   [**Detailed Technical Report (REPORT.md)**](./REPORT.md): Root cause analysis, remediation, and impact assessment.
*   **Scripts Directory**: Contains the standalone proof-of-concept scripts.

---

> [!IMPORTANT]
> **Conclusion:** The audit identifies a total failure of the primary security premise (private key protection) and governance (multisig). Immediate architectural overhaul is required.
