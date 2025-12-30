# 📑 Security Audit Report: Verified Custody

**Date:** December 30, 2025  
**Version:** 1.1 (Final - Updated Evidence)  
**Target:** [0x3B3AD30e32fFef3dD598dd3EfDf6DCC392897786](https://sepolia.etherscan.io/address/0x3B3AD30e32fFef3dD598dd3EfDf6DCC392897786)  
**Status:** 🔴 **NON-PRODUCTION READY**

---

## 🔍 Executive Summary

The security audit of the **Verified Custody** contract uncovered **5 critical and high-severity vulnerabilities**. The most severe findings allow an external attacker to recover "protected" private keys from the blockchain in under one second. Furthermore, the multisig governance model can be completely bypassed through Sybil attacks and threshold manipulation.

### 🚩 Vulnerability Overview

| ID | Title | Severity | Likelihood | Impact |
|---|---|---|---|---|
| **VUL-01** | **Private Key Recovery (PIN Crack)** | 🔴 **CRITICAL** | High | Total Loss of Assets |
| **VUL-02** | Sybil Attack (Multi-ID) | 🔴 **CRITICAL** | High | Governance Takeover |
| **VUL-03** | Quorum manipulation (1-of-N) | 🔴 **CRITICAL** | High | Bypass of Security |
| **VUL-04** | Calldata Privacy Leak | 🟠 **HIGH** | Guaranteed | Permanent Exposure |
| **VUL-05** | Gas Griefing / State Bloat | 🟠 **HIGH** | Medium | Denial of Service |

---

## 🛠️ Technical Breakdown

### VUL-01: Private Key Recovery (PIN Brute-force)
> [!CAUTION]
> **Severity:** CRITICAL (CVSS 10.0) | **Likelihood:** HIGH

*   **Root Cause:** The contract relies on weak symmetric encryption (AES with 4-digit PIN) to "protect" shards on a public ledger. 
*   **Attack Vector:** An attacker captures the encrypted shard from public calldata and runs a local brute-force attack (10,000 combinations).
*   **Impact:** Complete recovery of any private key managed by the system.
*   **Proof:** `scripts/proof_live_pin_crack.js`
*   **Evidence:** [0x209d224e...](https://sepolia.etherscan.io/tx/0x209d224e02ba4b6475fe8cc19c623764b34c565bae7db3d7faf1d9138283863e)

---

### VUL-02 & VUL-03: Governance Bypass (Sybil & Quorum)
> [!IMPORTANT]
> **Severity:** CRITICAL (CVSS 9.1) | **Likelihood:** HIGH

*   **Root Cause:** `addParticipant` lacks identity verification, and `defineQuorum` allows any creator to set a threshold of `1` regardless of participant count.
*   **Attack Vector:** (1) A single attacker adds multiple participant IDs they control. (2) The attacker sets the quorum to 1 to bypass multisig checks.
*   **Impact:** A multisig vault is effectively reduced to a single-signature wallet, defeating the primary security purpose.
*   **Proof:** `scripts/test_participant_manipulation.js`

---

### VUL-04: Calldata Privacy Leak
> [!WARNING]
> **Severity:** HIGH (CVSS 8.6) | **Likelihood:** HIGH

*   **Root Cause:** Architectural reliance on public transaction calldata for storing "sensitive" recovery shards.
*   **Exploit:** All data sent to `addParticipant` is permanently indexed by blockchain explorers (e.g., Etherscan) and history nodes.
*   **Impact:** All shards are public forever, even if the contract state is later modified.

---

### VUL-05: Gas Griefing (DoS)
> [!NOTE]
> **Severity:** HIGH (CVSS 7.5) | **Likelihood:** MEDIUM

*   **Root Cause:** Lack of input size validation on the `_shard` string.
*   **Attack Vector:** Attacker submits massive strings (e.g., 50KB+) to the contract, causing state bloat and potential block-level gas pressure.
*   **Impact:** Increased costs for all users and potential disruption of the node network.
*   **Evidence:** [0x8c4d3bfe...](https://sepolia.etherscan.io/tx/0x8c4d3bfe4c1f9a63f4628278919d539bf17d398d80875c6669bcc0feba2418da)

---

## 🛡️ Remediation Roadmap

1.  **Immediate Deprecation:** The current contract should be considered compromised.
2.  **Asymmetric Encryption:** Replace PIN-based encryption with strong Asymmetric (RSA/ECC) or Zero-Knowledge systems.
3.  **Strict Validation:** Enforce Minimum Quorum (e.g., > 50% of participants) and validate input lengths.
4.  **Off-Chain Privacy:** Sensitive shards should never be stored in calldata. Use off-chain storage (IPFS/Arweave) with strong encryption if necessary.
