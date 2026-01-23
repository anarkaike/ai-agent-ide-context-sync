const fs = require('fs');

jest.mock('fs');
// Force require to fail for tracker
jest.mock('../../evolution/tracker', () => {
    throw new Error('Module missing');
});

describe('RulesManager Missing Deps', () => {
    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
        fs.existsSync.mockReturnValue(false);
    });

    test('should initialize without tracker if module missing', () => {
        const RulesManager = require('../../core/rules-manager');
        const manager = new RulesManager('/mock/root');
        
        expect(manager.tracker).toBeUndefined();
    });
});
