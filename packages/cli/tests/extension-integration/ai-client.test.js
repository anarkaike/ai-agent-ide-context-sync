
const AIClient = require('../../../extension/ai-client');
const fs = require('fs');
const { execFile } = require('child_process');
const path = require('path');

jest.mock('fs');
jest.mock('child_process');
jest.mock('vscode', () => ({
    workspace: {
        rootPath: '/mock/root'
    }
}), { virtual: true });

describe('AIClient', () => {
    let client;

    beforeEach(() => {
        client = new AIClient('/mock/project');
        jest.clearAllMocks();
    });

    test('should use local CLI if exists', async () => {
        fs.existsSync.mockReturnValue(true);
        execFile.mockImplementation((cmd, args, opts, cb) => cb(null, 'success', ''));

        await client.execute(['test']);

        // O AIClient resolve o path relativo a si mesmo (packages/extension)
        // ../cli/cli/ai-doc.js -> packages/cli/cli/ai-doc.js
        const expectedPath = path.resolve(__dirname, '../../../cli/cli/ai-doc.js');
        
        expect(execFile).toHaveBeenCalledWith(
            'node',
            [expectedPath, 'test'],
            expect.anything(),
            expect.anything()
        );
    });

    test('should fallback to global CLI if local does not exist', async () => {
        fs.existsSync.mockReturnValue(false);
        execFile.mockImplementation((cmd, args, opts, cb) => cb(null, 'success', ''));

        await client.execute(['test']);

        expect(execFile).toHaveBeenCalledWith(
            'ai-doc',
            ['test'],
            expect.anything(),
            expect.anything()
        );
    });

    test('should reject on error', async () => {
        fs.existsSync.mockReturnValue(false);
        execFile.mockImplementation((cmd, args, opts, cb) => cb(new Error('fail'), '', 'stderr error'));

        await expect(client.execute(['test'])).rejects.toMatch('stderr error');
    });

    test('should expose helper methods', async () => {
        execFile.mockImplementation((cmd, args, opts, cb) => cb(null, 'success', ''));

        await client.scanDocs();
        expect(execFile).toHaveBeenCalledWith(expect.anything(), expect.arrayContaining(['scan', '.']), expect.anything(), expect.anything());

        await client.runRitual();
        expect(execFile).toHaveBeenCalledWith(expect.anything(), expect.arrayContaining(['ritual']), expect.anything(), expect.anything());

        await client.evolveRules();
        expect(execFile).toHaveBeenCalledWith(expect.anything(), expect.arrayContaining(['rules', '--evolve']), expect.anything(), expect.anything());

        await client.listRules();
        expect(execFile).toHaveBeenCalledWith(expect.anything(), expect.arrayContaining(['rules', '--list']), expect.anything(), expect.anything());
    });
});
