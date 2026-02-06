const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CLI_PATH = path.resolve(__dirname, '../packages/cli/cli/ai-doc.js');

function test() {
    console.log("🧪 Testing SBT (Soulbound Token) System...\n");

    try {
        // 1. Mint a Token
        const title = `Test Achievement ${Date.now()}`;
        console.log(`✨ Minting token: "${title}"...`);
        
        const mintCmd = `node "${CLI_PATH}" soul mint "${title}" --type="SKILL" --desc="Verified by Automated Test"`;
        const mintOutput = execSync(mintCmd).toString();
        console.log(mintOutput);

        if (!mintOutput.includes('SBT Minted')) {
            throw new Error('Minting failed output');
        }

        // 2. List Tokens (Resonate)
        console.log(`🔮 Resonating (Listing)...`);
        const listCmd = `node "${CLI_PATH}" soul resonate`;
        const listOutput = execSync(listCmd).toString();
        console.log(listOutput);

        if (!listOutput.includes(title)) {
            throw new Error('Minted token not found in list');
        }

        console.log(`✅ SBT Verification Passed!`);

    } catch (e) {
        console.error("❌ Test Failed:", e);
        if (e.stdout) console.log(e.stdout.toString());
        if (e.stderr) console.log(e.stderr.toString());
        process.exit(1);
    }
}

test();
