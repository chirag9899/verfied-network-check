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
| **VUL-06** | Zero Vault ID Collision | 🟠 **HIGH** | `scripts/test_zero_values.js` |

---

## 🚀 Evidence & Verification

This repository contains standalone scripts to verify each finding on the live Sepolia testnet.

### 1. Live Key Recovery Demo (VUL-01)
This is the most critical finding. It proves that any shard uploaded to the contract can be cracked in under 1 second.
```bash
node scripts/proof_live_pin_crack.js
```
*   **Proof:** Captured from Tx `0x19fc8bae...`

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
*   **Proof:** Verified in Tx `0x61dab1f7...`

### 4. Vault Collision (VUL-06)
Demonstrates state corruption via unvalidated `0x0` vault IDs.
```bash
node scripts/test_zero_values.js
```

---

## 📄 Documentation

*   [**Detailed Technical Report (REPORT.md)**](./REPORT.md): Root cause analysis, remediation, and impact assessment.
*   **Scripts Directory**: Contains the 4 core proof-of-concept scripts.

---

> [!IMPORTANT]
> **Conclusion:** The audit identifies a total failure of the primary security premise (private key protection) and governance (multisig). Immediate architectural overhaul is required.
