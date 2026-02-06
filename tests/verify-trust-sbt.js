const TrustSystem = require('../packages/cli/core/swarm/TrustSystem');
const VaultManager = require('../packages/cli/core/ethereum_bridge/VaultManager');
const SBT = require('../packages/cli/core/ethereum_bridge/SBT');
const assert = require('assert');

async function test() {
    console.log("🛡️  Testing TrustSystem integration with SBTs...\n");

    const trust = new TrustSystem();
    const vault = new VaultManager();

    // Case 1: Agent without SBTs
    const agentNoSBT = `agent-no-sbt-${Date.now()}`;
    console.log(`[1] Testing Agent without SBTs: ${agentNoSBT}`);
    
    const bond1 = trust.establishBond(agentNoSBT, 'Stranger Agent');
    console.log(`    Trust Score: ${bond1.trust_score}`);
    
    if (bond1.trust_score !== 0) {
        throw new Error(`Expected trust score 0, got ${bond1.trust_score}`);
    }
    console.log("    ✅ Passed (Score 0)\n");

    // Case 2: Agent WITH SBTs
    const agentWithSBT = `agent-with-sbt-${Date.now()}`;
    console.log(`[2] Testing Agent WITH SBTs: ${agentWithSBT}`);

    // Mint SBT for this agent BEFORE establishing bond
    const sbt = new SBT({
        title: "Verified Developer",
        description: "Has passed verification",
        type: "SKILL", // Worth 10 points
        issuer: { project_id: 'SYSTEM' },
        recipient: { id: agentWithSBT }
    });

    console.log(`    Minting SBT for ${agentWithSBT}...`);
    vault.storeSBT(sbt);

    // Now establish bond - should detect SBT
    const bond2 = trust.establishBond(agentWithSBT, 'Skilled Agent');
    console.log(`    Trust Score: ${bond2.trust_score}`);

    if (bond2.trust_score !== 10) {
        throw new Error(`Expected trust score 10 (SKILL), got ${bond2.trust_score}`);
    }
    console.log("    ✅ Passed (Score 10)\n");

    console.log("🎉 TrustSystem + SBT Integration Verified Successfully!");
}

test().catch(err => {
    console.error("❌ Test Failed:", err);
    process.exit(1);
});
