# 📑 Security Audit Report: Verified Custody

**Date:** December 30, 2025  
**Version:** 1.2 (Final - Validated & Pruned)  
**Target:** [0x3B3AD30e32fFef3dD598dd3EfDf6DCC392897786](https://sepolia.etherscan.io/address/0x3B3AD30e32fFef3dD598dd3EfDf6DCC392897786)  
**Status:** 🔴 **NON-PRODUCTION READY**

---

## 🔍 Executive Summary

The security audit of the **Verified Custody** contract uncovered **4 critical and high-severity vulnerabilities** that are 100% verified on the Sepolia contract. While some administrative limits (like max participants) are in place, the core security premise of the multisig—protecting private keys and requiring multiple signatures—is fundamentally broken.

### 🚩 Verified Vulnerabilities

| ID | Title | Severity | Likelihood | Impact |
|---|---|---|---|---|
| **VUL-01** | **Private Key Recovery (PIN Crack)** | 🔴 **CRITICAL** | High | Total Loss of Assets |
| **VUL-02** | **Quorum Bypass (Set to 1)** | 🔴 **CRITICAL** | High | Bypass of Multisig Security |
| **VUL-03** | **Calldata Privacy Leak** | 🟠 **HIGH** | Guaranteed | Permanent Exposure |
| **VUL-04** | **Gas Griefing / State Bloat** | 🟠 **HIGH** | Medium | Denial of Service |

---

## 🛠️ Technical Breakdown

### VUL-01: Private Key Recovery (PIN Brute-force)
> [!CAUTION]
> **Severity:** CRITICAL (CVSS 10.0)

*   **Analysis:** Shards are encrypted with a 4-digit PIN (10,000 combinations). Since all shards are public in transaction calldata, any external attacker can brute-force the PIN off-chain in milliseconds.
*   **Impact:** Complete recovery of any "protected" private key.
*   **Proof:** `scripts/proof_live_pin_crack.js`
*   **Evidence:** [0x209d224e...](https://sepolia.etherscan.io/tx/0x209d224e02ba4b6475fe8cc19c623764b34c565bae7db3d7faf1d9138283863e) (Status: **Success**)

---

### VUL-02: Quorum Manipulation (1-of-N Bypass)
> [!IMPORTANT]
> **Severity:** CRITICAL (CVSS 9.0)

*   **Analysis:** The `defineQuorum` function allows a vault creator to set their quorum to `1` at any time. This effectively converts a multisig vault into a single-signature wallet with no secondary oversight.
*   **Impact:** Destroys the multisig security model.
*   **Proof:** `scripts/test_participant_manipulation.js`
*   **Evidence:** [0xb666fc49...](https://sepolia.etherscan.io/tx/0xb666fc49a1332d02e6d8a79867316fb47de4ba50295e06e344f02d854b0c9086) (Confirmed success on `addParticipant` + `defineQuorum`).

---

### VUL-03: Calldata Privacy Leak
> [!WARNING]
> **Severity:** HIGH (CVSS 8.6)

*   **Analysis:** The system relies on public transaction calldata to store sensitive shards. This data is permanently indexed by Etherscan and history nodes, making recovery information accessible to anyone forever.

---

### VUL-04: Gas Griefing (DoS)
> [!NOTE]
> **Severity:** HIGH (CVSS 7.5)

*   **Analysis:** The `_shard` input has no length validation. We successfully uploaded 1KB and 10KB payloads to the contract.
*   **Impact:** Intentional state bloat and excessive resource consumption.
*   **Evidence:** [0x8c4d3bfe...](https://sepolia.etherscan.io/tx/0x8c4d3bfe4c1f9a63f4628278919d539bf17d398d80875c6669bcc0feba2418da) (Status: **Success**)

---

## 🛡️ Acknowledged Protections (Verified)

To ensure this audit's accuracy, we also verified the following protections which are **working correctly**:
*   **Max Cosigners:** The contract prevents adding infinite participants (e.g., Txs failing with 'Max cosigner limit').
*   **Signer Validation:** The contract prevents unauthorized signatures (e.g., Txs failing with 'Not a valid signer').
*   **Vault Uniqueness:** Basic zero-vault collisions are now blocked in recent updates.

**Conclusion:** While basic access controls are improving, the **cryptographic protection of keys (AES-PIN)** and **governance thresholds (Quorum=1)** are deeply flawed and should be the top priority for remediation.
