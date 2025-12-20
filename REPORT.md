# Verified Custody Security Findings

**Date:** December 20, 2025

---

## Technical Analysis

This document provides the deep-dive technical analysis of the vulnerabilities found during the audit. For a high-level overview and run instructions, please refer to the `README.md`.

---

## Technical Findings

The following sections detail the verified exploits.

### 1. Vault Ownership Theft
The `transferVault` function allows anyone to transfer a vault's ownership to themselves. I verified this by creating a vault with one wallet and stealing it with another.

**Exploit Script:** `scripts/verify_vault_theft.js`

### 2. Permanent Denial of Service
The `cleanTx` function allows anyone to delete a pending transaction. I verified this by submitting a transaction and then deleting it from an unrelated wallet.

**Exploit Script:** `pocs/poc_dos.js`

### 3. Sybil Attack & Multisig Bypass
The `addParticipant` function allows the same address to be added multiple times. I verified this by adding the same participant twice to a single vault, effectively doubling their voting power.

**Exploit Script:** `scripts/verify_sybil.js`

### 4. Biconomy Key Exposure
I found production API keys for Biconomy in `src/utils/constants.ts`. These keys can be used to send gasless transactions on the mainnet.

**Exploit Script:** `pocs/poc_gas_exposure.js`

### 5. Universal Access & Governance
Multiple functions lack access control steps. I verified that:
*   Strangers can sign transactions (`verify_access_control.js`)
*   Strangers can validate proposals (`verify_proposal_validation.js`)
*   Strangers can confirm participants (`verify_access_control.js`)

---

## Recommendation

The contract requires a complete rewrite to implement standard access control patterns (e.g., `onlyOwner`, `onlyParticipant`). Do not deploy the current version.
