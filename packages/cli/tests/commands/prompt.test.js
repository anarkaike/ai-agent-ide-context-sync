const prompt = require('../../commands/prompt');
const PromptGenerator = require('../../core/prompt-generator');
const MentionParser = require('../../parsers/mention-parser');

jest.mock('../../core/prompt-generator');
jest.mock('../../parsers/mention-parser');
// RulesManager is required but not used in the function directly, mocking it just in case to avoid side effects
jest.mock('../../core/rules-manager');

describe('Prompt Command', () => {
    let consoleLogSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
        jest.spyOn(process, 'cwd').mockReturnValue('/test/project');

        MentionParser.mockImplementation(() => ({
            parse: jest.fn().mockReturnValue({ files: [], rules: [] })
        }));

        PromptGenerator.mockImplementation(() => ({
            generate: jest.fn().mockResolvedValue('Generated Prompt Content')
        }));
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
    });

    test('should fail if no query provided', async () => {
        await prompt([]);
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Informe o prompt desejado'));
    });

    test('should generate prompt with empty context', async () => {
        await prompt(['My', 'Goal']);
        
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Analisando contexto'));
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Generated Prompt Content'));
        expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining('Contexto:'));
    });

    test('should generate prompt with detected context', async () => {
        MentionParser.mockImplementation(() => ({
            parse: jest.fn().mockReturnValue({ 
                files: ['file1.js'], 
                rules: ['rule1'] 
            })
        }));

        await prompt(['Refactor', '@file1.js']);

        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Generated Prompt Content'));
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Contexto: 1 arquivos, 1 regras'));
    });

    test('should pass correct params to generator', async () => {
        const mockGenerate = jest.fn().mockResolvedValue('Prompt');
        PromptGenerator.mockImplementation(() => ({
            generate: mockGenerate
        }));
        
        MentionParser.mockImplementation(() => ({
            parse: jest.fn().mockReturnValue({ 
                files: ['f1'], 
                rules: ['r1'] 
            })
        }));

        await prompt(['Goal']);

        expect(mockGenerate).toHaveBeenCalledWith({
            goal: 'Goal',
            contextFiles: ['f1'],
            mentions: ['r1'],
            history: [],
            autoContext: true
        });
    });

    test('should fail if modules are missing', async () => {
        jest.resetModules();
        jest.mock('../../core/prompt-generator', () => null);
        jest.mock('../../parsers/mention-parser', () => null);
        
        const promptWithMissingModules = require('../../commands/prompt');
        await promptWithMissingModules([]);
        
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Módulos Core não encontrados'));
    });

    test('should handle generator errors', async () => {
        PromptGenerator.mockImplementation(() => ({
            generate: jest.fn().mockRejectedValue(new Error('Generator error'))
        }));
        
        await prompt(['Goal']);
        
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Erro ao gerar prompt: Generator error'));
    });

    test('log function handles default color', () => {
        const { log } = require('../../commands/prompt');
        log('test message');
        expect(consoleLogSpy).toHaveBeenCalledWith('test message');
    });
});
