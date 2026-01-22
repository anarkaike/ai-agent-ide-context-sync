const PromptGenerator = require('../core/prompt-generator');
const path = require('path');

// Mock dependencies
jest.mock('../core/rules-manager', () => {
    return class RulesManager {
        constructor() { }
        async getApplicableRulesAsync() {
            return [{ id: 'test-rule', level: 'project', content: 'Test Content' }];
        }
    };
});

jest.mock('../indexing/semantic-search', () => {
    return class SemanticSearch {
        constructor() { }
        async search() {
            return [{ path: 'src/utils.js', similarity: 0.9 }];
        }
    };
});

describe('PromptGenerator', () => {
    let generator;

    beforeEach(() => {
        generator = new PromptGenerator(process.cwd());
        // Disable cache for testing
        generator.cache = null;
    });

    test('should generate prompt with goal', async () => {
        const prompt = await generator.generate({
            goal: 'Test Goal',
            autoContext: false
        });

        expect(prompt).toContain('## 🎯 OBJETIVO');
        expect(prompt).toContain('Test Goal');
    });

    test('should include rules in context', async () => {
        const prompt = await generator.generate({
            goal: 'Test',
            autoContext: false
        });

        expect(prompt).toContain('## ⚠️ CONSTRAINTS');
        expect(prompt).toContain('Test Content');
    });

    test('should include semantic context when autoContext is true', async () => {
        const prompt = await generator.generate({
            goal: 'Test',
            autoContext: true
        });

        expect(prompt).toContain('src/utils.js');
    });
});
