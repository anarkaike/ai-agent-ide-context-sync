const path = require('path');

describe('PromptGenerator (Missing Optional Dependencies)', () => {
    let PromptGenerator;

    beforeEach(() => {
        jest.resetModules();
        
        // Mock RulesManager (required dependency)
        jest.mock('../core/rules-manager', () => {
            return jest.fn().mockImplementation(() => ({
                getApplicableRulesAsync: jest.fn().mockResolvedValue([])
            }));
        });

        // Mock optional dependencies to throw error
        jest.mock('../indexing/semantic-search', () => {
            throw new Error('Module not found');
        });
        
        jest.mock('../core/smart-cache', () => {
            throw new Error('Module not found');
        });

        PromptGenerator = require('../core/prompt-generator');
    });

    afterEach(() => {
        jest.unmock('../core/rules-manager');
        jest.unmock('../indexing/semantic-search');
        jest.unmock('../core/smart-cache');
    });

    test('should initialize without optional dependencies', () => {
        const generator = new PromptGenerator();
        
        expect(generator.semanticSearch).toBeNull();
        expect(generator.cache).toBeNull();
    });

    test('should work without optional dependencies', async () => {
        const generator = new PromptGenerator();
        
        const prompt = await generator.generate({
            goal: 'Test',
            autoContext: true // Should be ignored/handled safely
        });

        expect(prompt).toContain('🎯 OBJETIVO');
        expect(prompt).not.toContain('<!-- CACHED (SmartCache) -->');
    });
});
