const HeuristicsEngine = require('../heuristics/engine');
const path = require('path');
const fs = require('fs');

jest.mock('fs');
// Mock os.homedir BEFORE requiring engine (if engine requires it at top level)
// But engine requires it at top level: const KERNEL_PATH = path.join(require('os').homedir(), ...);
// So we need to mock os in jest.mock
jest.mock('os', () => ({
    homedir: () => '/mock/home'
}));

describe('HeuristicsEngine', () => {
    let engine;

    beforeEach(() => {
        jest.clearAllMocks();
        fs.existsSync.mockReturnValue(false);
        engine = new HeuristicsEngine();
    });

    test('runCLI should print stats', () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        
        HeuristicsEngine.runCLI();
        
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Heurísticas do Kernel'));
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Total:'));
    });
});
