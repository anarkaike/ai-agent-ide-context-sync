const WorkflowManager = require('../workflows/workflow-manager');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const os = require('os');

jest.mock('fs');
jest.mock('js-yaml');
jest.mock('os');
jest.mock('child_process', () => ({
    execSync: jest.fn()
}));
jest.mock('path', () => {
    const original = jest.requireActual('path');
    return {
        ...original,
        join: jest.fn(),
        dirname: jest.fn()
    };
});

describe('WorkflowManager', () => {
    let manager;
    const mockProjectRoot = '/mock/root';
    const mockHomeDir = '/mock/home';

    beforeEach(() => {
        jest.clearAllMocks();
        os.homedir.mockReturnValue(mockHomeDir);
        path.join.mockImplementation((...args) => args.join('/'));
        
        // Default fs mocks
        fs.existsSync.mockReturnValue(false);
        fs.readdirSync.mockReturnValue([]);
        
        manager = new WorkflowManager(mockProjectRoot);
    });

    test('should initialize with correct paths', () => {
        expect(manager.workflowsPath).toContain('.ai-context/workflows');
        expect(manager.globalWorkflowsPath).toContain('.ai-doc/workflows');
    });

    test('listWorkflows should return combined list', () => {
        // Mock global workflows
        fs.existsSync.mockImplementation(p => p.includes('workflows'));
        fs.readdirSync.mockImplementation(p => {
            if (p.includes('.ai-doc')) return ['g.yaml'];
            if (p.includes('.ai-context')) return ['p.md'];
            return [];
        });
        
        fs.readFileSync.mockReturnValue('content');
        
        // Mock parsing
        const mockParsed = { name: 'Workflow', steps: [] };
        // Spy on parseWorkflow to return mock
        jest.spyOn(manager, 'parseWorkflow').mockReturnValue(mockParsed);

        const workflows = manager.listWorkflows();
        
        expect(workflows).toHaveLength(2);
        expect(workflows.find(w => w.id === 'g')).toBeDefined();
        expect(workflows.find(w => w.id === 'p')).toBeDefined();
        expect(workflows[0].source).toBeDefined();
    });

    test('should initialize with default projectRoot', () => {
        const wm = new WorkflowManager();
        expect(wm.projectRoot).toBe(process.cwd());
    });

    test('listWorkflows should handle file read errors', () => {
        const dir = path.join(mockProjectRoot, '.ai-context', 'workflows');
        fs.existsSync.mockReturnValue(true);
        fs.readdirSync.mockReturnValue(['error.yaml']);
        fs.readFileSync.mockImplementation(() => { throw new Error('Read failed'); });
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        const workflows = manager.listWorkflows();
        
        expect(workflows).toHaveLength(0);
        expect(consoleSpy).toHaveBeenCalled();
    });

    test('executeStep should handle unknown action', async () => {
        const step = { name: 'Unknown', action: 'unknown_action' };
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
        
        await manager.executeStep(step, {});
        
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown action'));
    });

    test('executeStep should handle missing params in template', async () => {
        const step = { 
            name: 'Test', 
            action: 'create_file', 
            path: 'file-${missing}.txt', 
            content: 'content' 
        };
        fs.existsSync.mockReturnValue(true); // dir exists
        
        await manager.executeStep(step, {});
        
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            expect.stringContaining('file-.txt'), 
            'content'
        );
    });

    test('ensureDir should not mkdir if exists', () => {
        fs.existsSync.mockReturnValue(true);
        manager.ensureDir('/path/to/dir');
        expect(fs.mkdirSync).not.toHaveBeenCalled();
    });

    test('parseWorkflow should handle Frontmatter + Markdown', () => {
        const content = "---\nname: test\n---\nbody";
        const mockYaml = { name: 'test', steps: [] };
        yaml.load.mockReturnValue(mockYaml);

        const result = manager.parseWorkflow(content);
        
        expect(result).toEqual(mockYaml);
        expect(yaml.load).toHaveBeenCalledWith(expect.stringContaining('name: test'));
    });

    test('parseWorkflow should handle Pure YAML', () => {
        const content = "name: test";
        const mockYaml = { name: 'test', steps: [] };
        yaml.load.mockReturnValue(mockYaml);

        const result = manager.parseWorkflow(content);
        
        expect(result).toEqual(mockYaml);
    });

    test('parseWorkflow should return null on yaml error', () => {
        const content = "invalid: yaml:";
        yaml.load.mockImplementation(() => { throw new Error('YAML Error'); });

        const result = manager.parseWorkflow(content);
        
        expect(result).toBeNull();
    });

    test('parseWorkflow should return null on frontmatter error', () => {
        const content = "---\ninvalid\n---\nbody";
        yaml.load.mockImplementation(() => { throw new Error('YAML Error'); });

        const result = manager.parseWorkflow(content);
        
        expect(result).toBeNull();
    });

    test('runWorkflow should throw if required params are missing', async () => {
        const workflow = {
            id: 'test-req',
            steps: [],
            params: [{ name: 'req', required: true }]
        };
        
        jest.spyOn(manager, 'listWorkflows').mockReturnValue([workflow]);
        
        await expect(manager.runWorkflow('test-req', {}))
            .rejects.toThrow('Missing required params: req');
    });

    test('runWorkflow should use default params', async () => {
         const workflow = {
            id: 'test-default',
            steps: []
        };
        jest.spyOn(manager, 'listWorkflows').mockReturnValue([workflow]);
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        
        await manager.runWorkflow('test-default'); // No params
        
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Iniciando workflow'));
    });

    test('runWorkflow should execute steps', async () => {
        const workflowId = 'test-workflow';
        const workflow = {
            id: workflowId,
            name: 'Test Workflow',
            steps: [
                { name: 'Step 1', action: 'create_file', path: 'test.txt', content: 'content' },
                { name: 'Step 2', action: 'run_command', command: 'echo hello' }
            ]
        };
        
        // Spy on listWorkflows to return our workflow
        jest.spyOn(manager, 'listWorkflows').mockReturnValue([workflow]);
        
        // Mock executeStep to verify calls
        jest.spyOn(manager, 'executeStep').mockResolvedValue();
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        await manager.runWorkflow(workflowId);
        
        expect(manager.executeStep).toHaveBeenCalledTimes(2);
        expect(manager.executeStep).toHaveBeenCalledWith(workflow.steps[0], {});
        expect(manager.executeStep).toHaveBeenCalledWith(workflow.steps[1], {});
        
        consoleSpy.mockRestore();
    });

    test('runWorkflow should throw if not found', async () => {
        jest.spyOn(manager, 'listWorkflows').mockReturnValue([]);
        
        await expect(manager.runWorkflow('missing')).rejects.toThrow('not found');
    });

    test('runWorkflow should validate required params', async () => {
        const workflow = {
            id: 'param-test',
            params: [{ name: 'req', required: true }],
            steps: []
        };
        jest.spyOn(manager, 'listWorkflows').mockReturnValue([workflow]);
        
        await expect(manager.runWorkflow('param-test', {})).rejects.toThrow('Missing required params');
    });

    test('executeStep should create file', async () => {
        const step = { action: 'create_file', path: 'src/${name}.js', content: 'code' };
        const params = { name: 'test' };
        
        fs.existsSync.mockReturnValue(false);
        fs.mkdirSync.mockImplementation();
        fs.writeFileSync.mockImplementation();
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        await manager.executeStep(step, params);
        
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            expect.stringContaining('src/test.js'),
            'code'
        );
        expect(fs.mkdirSync).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });

    test('executeStep should run command', async () => {
        const step = { action: 'run_command', command: 'echo ${msg}' };
        const params = { msg: 'hello' };
        
        const { execSync } = require('child_process');
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        await manager.executeStep(step, params);
        
        expect(execSync).toHaveBeenCalledWith(
            expect.stringContaining('echo hello'),
            expect.anything()
        );
        consoleSpy.mockRestore();
    });

    test('executeStep should warn on unknown action', async () => {
        const step = { action: 'unknown' };
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
        
        await manager.executeStep(step, {});
        
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown action'));
        consoleSpy.mockRestore();
    });
});
