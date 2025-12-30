# Verified Custody Security Audit Submission

Target Contract (Sepolia): `0x3B3AD30e32fFef3dD598dd3EfDf6DCC392897786`

This submission focuses on 4 deeply verified vulnerabilities that compromise the core security of the multisig system.

---

## Verified Vulnerabilities Summary

| ID | Vulnerability | Severity | Verified Proof |
|---|---|---|---|
| VUL-01 | Private Key Recovery | CRITICAL | scripts/proof_live_pin_crack.js |
| VUL-02 | Quorum Manipulation | CRITICAL | scripts/test_participant_manipulation.js |
| VUL-03 | Calldata Data Leak | HIGH | Architectural Flaw |
| VUL-04 | Gas Griefing DoS | HIGH | pocs/poc_gas_griefing.js |

---

## Evidence & Verification

Each finding is backed by a standalone proof script that interacts with the live Sepolia contract.

### 1. Private Key Recovery (VUL-01)
Demonstrates off-chain PIN brute-forcing using data leaked in public calldata.
```bash
node scripts/proof_live_pin_crack.js
```
*   On-Chain Proof: [0x209d224e...](https://sepolia.etherscan.io/tx/0x209d224e02ba4b6475fe8cc19c623764b34c565bae7db3d7faf1d9138283863e)

### 2. Multisig Bypass (VUL-02)
Demonstrates that any vault creator can disable multisig protection by setting the quorum to 1.
```bash
node scripts/test_participant_manipulation.js
```

### 3. State Bloat & Griefing (VUL-04)
Demonstrates uploading unvalidated data payloads.
```bash
node pocs/poc_gas_griefing.js
```
*   On-Chain Proof: [0x8c4d3bfe...](https://sepolia.etherscan.io/tx/0x8c4d3bfe4c1f9a63f4628278919d539bf17d398d80875c6669bcc0feba2418da)

---

## Documentation

*   [Detailed Technical Report (REPORT.md)](./REPORT.md): In-depth analysis of root causes, verified protections, and remediation steps.

Conclusion: The audit identifies a total failure of the primary security premise (private key protection) and governance (multisig). Immediate architectural overhaul is required.
