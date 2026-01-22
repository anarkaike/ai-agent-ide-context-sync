const WorkflowManager = require('../workflows/workflow-manager');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const child_process = require('child_process');

jest.mock('fs');
jest.mock('js-yaml');
jest.mock('child_process');

describe('WorkflowManager', () => {
    let manager;
    const mockProjectRoot = '/mock/root';

    beforeEach(() => {
        jest.clearAllMocks();
        fs.existsSync.mockReturnValue(false);
        manager = new WorkflowManager(mockProjectRoot);
    });

    test('executeStep should handle append_file action', async () => {
        const step = {
            action: 'append_file',
            path: 'src/log.txt',
            content: 'New Log Entry'
        };
        
        // Mock path resolution
        jest.spyOn(path, 'join').mockImplementation((...args) => args.join('/'));
        jest.spyOn(path, 'dirname').mockReturnValue('/mock/root/src');
        
        fs.existsSync.mockReturnValue(true);
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        
        await manager.executeStep(step, {});
        
        expect(fs.appendFileSync).toHaveBeenCalledWith(
            expect.stringContaining('src/log.txt'),
            'New Log Entry'
        );
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Appended to'));
    });

    test('parseWorkflow should return null for invalid content', () => {
        yaml.load.mockImplementation(() => { throw new Error('Invalid YAML'); });
        const result = manager.parseWorkflow('invalid content');
        expect(result).toBeNull();
    });
    
    test('parseWorkflow should return null if no steps', () => {
        yaml.load.mockReturnValue({ name: 'No Steps' });
        const result = manager.parseWorkflow('name: No Steps');
        expect(result).toBeNull();
    });
});
