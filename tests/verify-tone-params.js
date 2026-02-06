
const os = require('os');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const PROJECT_ROOT = process.cwd();
const TONE_FILE = path.join(PROJECT_ROOT, '.ai-workspace', 'live-state', 'ui-tone.json');
console.log('Writing tone to:', TONE_FILE);
const CLI_PATH = path.resolve(__dirname, '../packages/cli/cli/ai-doc.js');

// Backup existing toneEnsure directory exists
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

function runPrompt(goal) {
    try {
        // Run CLI command
        const cmd = `node "${CLI_PATH}" prompt "${goal}"`;
        const output = execSync(cmd, { encoding: 'utf-8' });
        return output;
    } catch (e) {
        console.error("Error running CLI:", e.message);
        return "";
    }
}

async function test() {
    console.log("🧪 Testing Tone -> LLM Parameters mapping...\n");

    const testCases = [
        {
            tone: 'creative',
            expectedTemp: '0.9',
            expectedModel: 'creative-reasoning',
            goal: 'Write a poem about code'
        },
        {
            tone: 'focused',
            expectedTemp: '0.2',
            expectedModel: 'precise-coding',
            goal: 'Fix this bug'
        },
        {
            tone: 'urgent',
            expectedTemp: '0.1',
            expectedModel: 'fast-inference',
            goal: 'Server is down'
        },
        {
            tone: 'cautious',
            expectedTemp: '0.0',
            expectedModel: 'robust-security',
            goal: 'Review auth logic'
        }
    ];

    let passed = 0;

    for (const test of testCases) {
        console.log(`\n📋 Testing Tone: ${test.tone.toUpperCase()}`);
        setTone(test.tone);
        
        // Give fs a moment to sync (though sync write should be fine)
        await new Promise(r => setTimeout(r, 100));

        const output = runPrompt(test.goal);
        
        // Check for parameters in output
        const hasTemp = output.includes(`Temp=${test.expectedTemp}`);
        const hasModel = output.includes(`ModelHint=${test.expectedModel}`);
        
        if (hasTemp && hasModel) {
            console.log(`✅ Passed: Found Temp=${test.expectedTemp} and ModelHint=${test.expectedModel}`);
            passed++;
        } else {
            console.log(`❌ Failed:`);
            console.log(`   Expected Temp=${test.expectedTemp}, Found: ${output.match(/Temp=[\d.]+/)?.[0] || 'not found'}`);
            console.log(`   Expected ModelHint=${test.expectedModel}, Found: ${output.match(/ModelHint=[\w-]+/)?.[0] || 'not found'}`);
        }
    }

    // Restore backup
    if (backupTone) {
        fs.writeFileSync(TONE_FILE, backupTone);
    }

    console.log(`\n🎉 Result: ${passed}/${testCases.length} tests passed.`);
}

test();
