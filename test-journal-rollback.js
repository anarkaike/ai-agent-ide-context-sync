const fs = require('fs');
const path = require('path');
const ExecutionJournal = require('./packages/cli/core/reliability/ExecutionJournal');

const testFile = path.join(process.cwd(), 'test-undo-file.txt');
const journal = new ExecutionJournal(process.cwd());

// Cleanup
if (fs.existsSync(testFile)) fs.unlinkSync(testFile);

console.log('--- Starting Test ---');

// 1. Start Operation
const opId = journal.startOperation('TEST_OP', 'Testing Rollback');
console.log(`Operation started: ${opId}`);

// 2. Simulate File Creation
fs.writeFileSync(testFile, 'Hello World');
console.log('File created.');

// 3. Track File Creation
journal.trackFileCreation(opId, testFile);
console.log('File creation tracked.');

// 4. Verify File Exists
if (fs.existsSync(testFile)) {
    console.log('✅ File exists before rollback.');
} else {
    console.error('❌ File missing before rollback!');
    process.exit(1);
}

// 5. Rollback
console.log('Triggering rollback...');
journal.rollback(opId).then(() => {
    // 6. Verify File Deleted
    if (!fs.existsSync(testFile)) {
        console.log('✅ File deleted after rollback. SUCCESS.');
    } else {
        console.error('❌ File still exists after rollback! FAILED.');
    }
    
    // Cleanup Journal
    // fs.rmSync(path.join(process.cwd(), '.ai-workspace', 'journal', 'snapshots', opId), { recursive: true, force: true });
});
