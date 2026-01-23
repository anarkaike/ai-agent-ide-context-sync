const run = require('../../commands/run');
const WorkflowManager = require('../../workflows/workflow-manager');

jest.mock('../../workflows/workflow-manager');

describe('Run Command', () => {
    let consoleLogSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
        // Default mock for WorkflowManager
        WorkflowManager.mockImplementation(() => ({
            listWorkflows: jest.fn().mockReturnValue([]),
            runWorkflow: jest.fn().mockResolvedValue(true)
        }));
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
    });

    test('should fail if no workflow ID provided', async () => {
        await run([]);
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Informe o nome do workflow'));
    });

    test('should list workflows if no ID provided', async () => {
        WorkflowManager.mockImplementation(() => ({
            listWorkflows: jest.fn().mockReturnValue([
                { id: 'test-flow', description: 'Test Workflow' },
                { id: 'no-desc-flow' }
            ])
        }));
        
        await run([]);
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Workflows disponíveis'));
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('test-flow'));
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('no-desc-flow: Sem descrição'));
    });

    test('should handle list workflows error silently', async () => {
        WorkflowManager.mockImplementation(() => ({
            listWorkflows: jest.fn().mockImplementation(() => { throw new Error('List Error'); })
        }));
        
        await run([]);
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Informe o nome do workflow'));
        // Should not crash
    });

    test('should execute workflow with params', async () => {
        const mockRun = jest.fn().mockResolvedValue(true);
        WorkflowManager.mockImplementation(() => ({
            runWorkflow: mockRun
        }));

        await run(['test-flow', 'param1=value1', 'param2=value2']);

        expect(mockRun).toHaveBeenCalledWith('test-flow', {
            param1: 'value1',
            param2: 'value2'
        });
    });

    test('should handle workflow execution error', async () => {
        WorkflowManager.mockImplementation(() => ({
            runWorkflow: jest.fn().mockRejectedValue(new Error('Execution failed'))
        }));

        await run(['test-flow']);
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Erro ao executar workflow'));
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Execution failed'));
    });

    test('should ignore params without value', async () => {
        const mockRun = jest.fn().mockResolvedValue(true);
        WorkflowManager.mockImplementation(() => ({
            runWorkflow: mockRun
        }));

        await run(['test-flow', 'invalid_param']);

        expect(mockRun).toHaveBeenCalledWith('test-flow', {});
    });

    test('should fail if WorkflowManager is missing', async () => {
        jest.resetModules();
        jest.mock('../../workflows/workflow-manager', () => null);
        
        // Re-require to pick up the mock
        const runWithMissingModule = require('../../commands/run');
        
        await runWithMissingModule([]);
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Módulo WorkflowManager não encontrado'));
    });
});
