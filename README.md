# Verified Custody Security Audit

**Date:** December 20, 2025

---

## Overview

I have done the security audit of the Verified Custody smart contract. I found **10 vulnerabilities** in the system, including critical issues that allow full custody theft.

The main issue is that the contract does not restrict sensitive actions. I verified that anyone can:
1.  **Steal any vault** (Ownership Hijack).
2.  **Delete pending transactions** (Permanent DoS).
3.  **Bypass multisig requirements** by adding themselves multiple times.
4.  **Manipulate governance** by properly validating bad proposals.

---

## Verified Exploits

I wrote scripts to reproduce these bugs on the Sepolia testnet. These are valid proofs, not just theoretical findings.

| ID | Vulnerability | Severity | Confirmed | Impact |
|:---|:---|:---|:---:|:---|
| **01** | **Vault Ownership Theft** | **CRITICAL** | Yes | Attacker can steal any user's vault. |
| **02** | **Permanent Denial of Service** | **CRITICAL** | Yes | Attacker can delete pending transactions. |
| **03** | **Sybil Attack (Multisig Bypass)** | **CRITICAL** | Yes | One user can pretend to be multiple signers. |
| **04** | **Universal Signing** | **CRITICAL** | Yes | Strangers can sign transactions. |
| **05** | **Governance Bypass** | **HIGH** | Yes | Proposals can be validated without permission. |
| **06** | **Universal Confirmation** | **HIGH** | Yes | Strangers can confirm participants. |
| **07** | **Unauthorized Removal** | **HIGH** | Yes | Legitimate signers can be removed. |
| **08** | **Biconomy Key Exposure** | **HIGH** | Yes | Attackers can drain gas funds. |
| **09** | **Quorum Manipulation** | **HIGH** | Logic | Vaults can be permanently locked (Integer Overflow). |
| **10** | **Notification Spam** | **LOW** | Yes | Participants can be flooded with prompts. |

---

## Running the Tests

### 1. Setup
Install dependencies:

```bash
npm install
```

### 2. Run Verifications
You can run these scripts to see the exploits happen live.

**Critical Vulnerabilities (Theft & Sybil):**
```bash
node scripts/verify_vault_theft.js
node scripts/verify_sybil.js
```

**Logic Flaws (DoS & Spam):**
```bash
node pocs/poc_dos.js
node scripts/verify_notification_spam.js
```

---

## Files Included

*   **/final_submission/REPORT.md**
    Full technical report with code analysis and severity ratings for all 10 findings.

*   **/final_submission/scripts/**
    Scripts that interact with the testnet to prove the bugs.

*   **/final_submission/pocs/**
    Offline proofs for logic errors (like the PIN brute-force).

---

## Recommendation

**Do not use this contract.** 
It allows anyone to steal vaults (`transferVault`) and fake votes (`addParticipant`). The code needs to be rewritten with proper `onlyOwner` checks.
