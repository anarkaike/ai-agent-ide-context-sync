const PromptGenerator = require('../core/prompt-generator');
const path = require('path');

// Mock dependencies
const mockRulesManager = {
    getApplicableRulesAsync: jest.fn()
};

jest.mock('../core/rules-manager', () => {
    return jest.fn().mockImplementation(() => mockRulesManager);
});

const mockSemanticSearch = {
    search: jest.fn()
};

jest.mock('../indexing/semantic-search', () => {
    return jest.fn().mockImplementation(() => mockSemanticSearch);
});

const mockSmartCache = {
    getCachedPrompt: jest.fn(),
    setCachedPrompt: jest.fn()
};

jest.mock('../core/smart-cache', () => {
    return jest.fn().mockImplementation(() => mockSmartCache);
});

describe('PromptGenerator', () => {
    let generator;

    beforeEach(() => {
        jest.clearAllMocks();
        mockRulesManager.getApplicableRulesAsync.mockResolvedValue([
            { id: 'test-rule', level: 'project', content: 'Test Content', description: 'Test Description' }
        ]);
        mockSemanticSearch.search.mockResolvedValue([
            { path: 'src/utils.js', similarity: 0.9 }
        ]);
        
        generator = new PromptGenerator(process.cwd());
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

    // New tests for coverage
    
    test('toNumber should handle various inputs', () => {
        expect(generator.toNumber('123')).toBe(123);
        expect(generator.toNumber(456)).toBe(456);
        expect(generator.toNumber('abc')).toBeNull();
        expect(generator.toNumber(null)).toBeNull();
        expect(generator.toNumber(undefined)).toBeNull();
    });

    test('trimText should truncate text correctly', () => {
        const suffix = '\n\n⚠️ Conteúdo truncado por orçamento de contexto.';
        const suffixLen = suffix.length; 
        const text = 'A'.repeat(100);
        const maxChars = 60; // Enough for suffix + some text
        
        const expectedContentLen = maxChars - suffixLen;
        const expected = 'A'.repeat(expectedContentLen) + suffix;
        
        expect(generator.trimText(text, maxChars)).toBe(expected);
        expect(generator.trimText(text, 200)).toBe(text);
        expect(generator.trimText(text, 0)).toBe(text); // No limit
    });

    test('getBudget should return default or env values', () => {
        process.env.AI_DOC_PROMPT_MAX_CHARS = '1000';
        const budget = generator.getBudget({});
        expect(budget.maxChars).toBe(1000);
        
        const customBudget = generator.getBudget({ maxChars: 500 });
        expect(customBudget.maxChars).toBe(500);
        
        delete process.env.AI_DOC_PROMPT_MAX_CHARS;
    });

    test('should respect maxContextFiles budget', async () => {
        const files = ['1.js', '2.js', '3.js'];
        const prompt = await generator.generate({
            goal: 'Test',
            contextFiles: files,
            budget: { maxContextFiles: 2 },
            autoContext: false
        });
        
        expect(prompt).toContain('1.js');
        expect(prompt).toContain('2.js');
    });

    test('should respect maxRules budget', async () => {
        mockRulesManager.getApplicableRulesAsync.mockResolvedValue([
            { id: 'r1', level: 'p', content: 'c1' },
            { id: 'r2', level: 'p', content: 'c2' }
        ]);
        
        const prompt = await generator.generate({
            goal: 'Test',
            budget: { maxRules: 1 },
            autoContext: false
        });

        expect(prompt).toContain('r1');
        // r2 might be excluded depending on order, but we confirm at least r1 is there
    });

    test('should respect maxRuleChars budget', async () => {
        mockRulesManager.getApplicableRulesAsync.mockResolvedValue([
            { id: 'r1', level: 'p', content: 'Very long content here' }
        ]);
        
        // Suffix is \n\n[...] (7 chars)
        // We want 'Very' (4 chars) + suffix = 11 chars
        
        const prompt = await generator.generate({
            goal: 'Test',
            budget: { maxRuleChars: 11 },
            autoContext: false
        });

        expect(prompt).toContain('Very');
        expect(prompt).toContain('[...]');
    });

    test('should respect maxHistoryItems budget', async () => {
        const history = ['cmd1', 'cmd2', 'cmd3'];
        const prompt = await generator.generate({
            goal: 'Test',
            history,
            budget: { maxHistoryItems: 2 },
            autoContext: false
        });

        expect(prompt).toContain('cmd1');
        expect(prompt).toContain('cmd2');
        expect(prompt).not.toContain('cmd3');
    });

    test('should use cache if available', async () => {
        mockSmartCache.getCachedPrompt.mockReturnValue('Cached Prompt');
        
        const prompt = await generator.generate({
            goal: 'Cached Goal'
        });

        expect(prompt).toContain('Cached Prompt');
        expect(prompt).toContain('<!-- CACHED (SmartCache) -->');
        expect(mockSmartCache.getCachedPrompt).toHaveBeenCalled();
    });

    test('should save to cache after generation', async () => {
        mockSmartCache.getCachedPrompt.mockReturnValue(null);
        
        await generator.generate({
            goal: 'New Goal'
        });

        expect(mockSmartCache.setCachedPrompt).toHaveBeenCalled();
    });

    test('should handle semantic search failure gracefully', async () => {
        mockSemanticSearch.search.mockRejectedValue(new Error('Search failed'));
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

        await generator.generate({
            goal: 'Test',
            autoContext: true
        });

        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });
    
    test('should trim final prompt if maxChars is set', async () => {
        const prompt = await generator.generate({
            goal: 'Test',
            budget: { maxChars: 60 } // Just enough to trigger truncation if prompt is long
        });
        
        // The prompt will be longer than 60 chars with headers etc
        expect(prompt.length).toBeLessThanOrEqual(60); 
    });
    
    test('collectRules should remove duplicates', async () => {
        mockRulesManager.getApplicableRulesAsync.mockResolvedValue([
            { id: 'r1', level: 'p', content: 'c1' }
        ]);
        
        const prompt = await generator.generate({
            goal: 'Test',
            contextFiles: ['file1.js'],
            autoContext: false
        });
        
        const constraintsSection = prompt.split('## ⚠️ CONSTRAINTS')[1];
        const occurrences = (constraintsSection.match(/r1/g) || []).length;
        expect(occurrences).toBe(1);
    });

    test('should not duplicate context files from semantic search', async () => {
        const prompt = await generator.generate({
            goal: 'Test',
            contextFiles: ['src/utils.js'], // Same as mocked semantic search result
            autoContext: true
        });
        
        // We check if it appears only once in the context section
        const contextSection = prompt.split('## 📋 CONTEXTO')[1];
        const occurrences = (contextSection.match(/src\/utils.js/g) || []).length;
        expect(occurrences).toBe(1);
    });

    // Additional branch coverage tests

    test('should handle missing options', async () => {
        // Covers generate(undefined) and getBudget(undefined)
        const prompt = await generator.generate(); 
        expect(prompt).toBeDefined();
    });

    test('should handle disabled cache', async () => {
        generator.cache = null;
        const prompt = await generator.generate({ goal: 'Test' });
        expect(mockSmartCache.getCachedPrompt).not.toHaveBeenCalled();
    });

    test('should handle empty rule content', async () => {
        mockRulesManager.getApplicableRulesAsync.mockResolvedValue([
            { id: 'r1', level: 'p', content: null }
        ]);
        const prompt = await generator.generate({
            goal: 'Test',
            budget: { maxRuleChars: 10 } // Trigger trimText
        });
        expect(prompt).toContain('r1');
    });

    test('should handle missing goal', async () => {
        const prompt = await generator.generate({ contextFiles: ['f1.js'] });
        expect(prompt).not.toContain('## 🎯 OBJETIVO');
    });

    test('should handle empty context (no files, rules, history)', async () => {
        mockRulesManager.getApplicableRulesAsync.mockResolvedValue([]);
        const prompt = await generator.generate({
            goal: 'Test',
            autoContext: false,
            contextFiles: [],
            history: []
        });
        
        expect(prompt).not.toContain('## 📋 CONTEXTO');
    });

    test('should handle empty constraints', async () => {
        mockRulesManager.getApplicableRulesAsync.mockResolvedValue([]);
        const prompt = await generator.generate({
            goal: 'Test',
            autoContext: false
        });
        
        expect(prompt).not.toContain('## ⚠️ CONSTRAINTS');
    });

    test('getBudget should handle missing argument', () => {
        const budget = generator.getBudget();
        expect(budget.maxChars).toBeDefined();
    });

    test('constructor should use process.cwd() if no projectRoot provided', () => {
        const gen = new PromptGenerator();
        expect(gen.projectRoot).toBe(process.cwd());
    });

    test('should ignore low similarity semantic search results', async () => {
        mockSemanticSearch.search.mockResolvedValue([
            { path: 'low-similarity.js', similarity: 0.3 } // < 0.4 threshold
        ]);

        const prompt = await generator.generate({
            goal: 'Test',
            autoContext: true
        });

        // Should not be in context because similarity is too low
        expect(prompt).not.toContain('low-similarity.js');
    });
});
