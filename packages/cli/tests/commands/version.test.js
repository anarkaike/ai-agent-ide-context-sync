const fs = require('fs');
const path = require('path');
const version = require('../../cli/commands/version');

jest.mock('fs');

describe('Version Command', () => {
    let consoleLogSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
    });

    test('should print version from package.json', async () => {
        fs.readFileSync.mockReturnValue('{"version": "1.0.0"}');
        
        await version();
        
        expect(fs.readFileSync).toHaveBeenCalledWith(expect.stringContaining('package.json'), 'utf-8');
        expect(consoleLogSpy).toHaveBeenCalledWith('v1.0.0');
    });

    test('should handle error reading package.json', async () => {
        fs.readFileSync.mockImplementation(() => {
            throw new Error('File not found');
        });
        
        await version();
        
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Versão desconhecida'));
    });
});
