const fs = require('fs');
const path = require('path');
const AIClient = require('../packages/cli/core/AIClient');

const PROJECT_ROOT = process.cwd();
const TONE_FILE = path.join(PROJECT_ROOT, '.ai-workspace', 'live-state', 'ui-tone.json');

// Ensure directory exists
const dir = path.dirname(TONE_FILE);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

// Backup existing tone
let backupTone = null;
if (fs.existsSync(TONE_FILE)) {
    backupTone = fs.readFileSync(TONE_FILE, 'utf-8');
}

function setTone(tone) {
    fs.writeFileSync(TONE_FILE, JSON.stringify({ tone, timestamp: Date.now() }));
}

async function test() {
    console.log("🧪 Testing AIClient -> Tone Integration...\n");

    const client = new AIClient(PROJECT_ROOT);

    const testCases = [
        {
            tone: 'creative',
            expectedTemp: 0.9,
            expectedModel: 'creative-reasoning'
        },
        {
            tone: 'focused',
            expectedTemp: 0.2,
            expectedModel: 'precise-coding'
        },
        {
            tone: 'urgent',
            expectedTemp: 0.1,
            expectedModel: 'fast-inference'
        },
        {
            tone: 'cautious',
            expectedTemp: 0.0, // AIClient handles 0.0 correctly as number
            expectedModel: 'robust-security'
        }
    ];

    let passed = 0;

    for (const test of testCases) {
        console.log(`\n📋 Testing Tone: ${test.tone.toUpperCase()}`);
        setTone(test.tone);
        
        // Simular chamada
        const result = await client.complete("Test prompt");
        const config = result.config_used;
        
        const tempMatch = config.temperature === test.expectedTemp;
        const modelMatch = config.model === test.expectedModel;
        const instructionMatch = config.system_instruction && config.system_instruction.includes('MODE:');

        if (tempMatch && modelMatch && instructionMatch) {
            console.log(`✅ Passed: Temp=${config.temperature}, Model=${config.model}`);
            console.log(`   Instruction: "${config.system_instruction.substring(0, 30)}..."`);
            passed++;
        } else {
            console.log(`❌ Failed:`);
            console.log(`   Expected Temp=${test.expectedTemp}, Found: ${config.temperature}`);
            console.log(`   Expected Model=${test.expectedModel}, Found: ${config.model}`);
            console.log(`   Instruction Present: ${!!config.system_instruction}`);
        }
    }

    // Restore backup
    if (backupTone) {
        fs.writeFileSync(TONE_FILE, backupTone);
    }

    console.log(`\n🎉 Result: ${passed}/${testCases.length} tests passed.`);
}

test();
