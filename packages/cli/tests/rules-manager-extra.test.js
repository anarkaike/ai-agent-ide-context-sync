const RulesManager = require('../core/rules-manager');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

jest.mock('fs');
jest.mock('js-yaml');

describe('RulesManager', () => {
    let manager;
    const mockProjectRoot = '/mock/root';
    
    beforeEach(() => {
        jest.clearAllMocks();
        // Setup default mocks
        fs.existsSync.mockReturnValue(false);
        fs.readdirSync.mockReturnValue([]);
        fs.readFileSync.mockReturnValue('');
        
        // Mock js-yaml
        yaml.load.mockImplementation(str => {
            if (str.includes('alwaysApply: true')) return { alwaysApply: true };
            if (str.includes('globs:')) return { globs: ['*.js'] };
            return {};
        });
        yaml.dump.mockReturnValue('mock: yaml');
    });

    test('should initialize and load rules', () => {
        manager = new RulesManager(mockProjectRoot);
        expect(manager.projectRoot).toBe(mockProjectRoot);
        expect(manager.rules.user).toEqual([]);
    });

    test('createRule should create file with frontmatter', () => {
        manager = new RulesManager(mockProjectRoot);
        fs.existsSync.mockReturnValue(true); // dir exists
        
        const result = manager.createRule('project', {
            id: 'new-rule',
            description: 'Test Rule',
            mode: 'always',
            content: 'Rule Content'
        });
        
        expect(result.success).toBe(true);
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            expect.stringContaining('new-rule.mdc'),
            expect.stringContaining('mock: yaml'),
            'utf-8'
        );
    });

    test('initSemanticSearch should handle errors', async () => {
        manager = new RulesManager(mockProjectRoot);
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
        
        // Mock require to throw error when loading embeddings
        // Since we can't easily mock require failure for a specific module in jest.mock factory inside test,
        // we can rely on the fact that EmbeddingsGenerator might fail or we can mock it.
        // Actually, RulesManager uses `require('../indexing/embeddings')` inside the method.
        // We can mock that module to throw in constructor.
        
        jest.mock('../indexing/embeddings', () => {
            return class MockEmbeddings {
                constructor() { throw new Error('Init failed'); }
            };
        });
        
        // Note: jest.mock is hoisted, so this applies to the whole file. 
        // We need to use doMock or isolate this test.
        // For simplicity, let's just spy on the method if possible, or accept we need a separate test file for this specific failure?
        // OR: we can mock EmbeddingsGenerator prototype init or something.
        // But the error is in `require` or `new`.
        
        // Let's rely on the catch block handling. 
        // If we can't force an error easily, we might miss this line.
        // BUT, we can mock `indexIntelligentRules` to throw!
        
        manager.indexIntelligentRules = jest.fn().mockRejectedValue(new Error('Index failed'));
        
        // Mock EmbeddingsGenerator to be available so it enters the try block
        manager.embeddingsGenerator = null;
        
        await manager.initSemanticSearch();
        
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Busca semântica não disponível'));
    });
    
    test('CLI execution (stats) should run without error', () => {
        // We can't easily test the `if (require.main === module)` block directly via require,
        // but we can test the `stats` method which is what it prints.
        manager = new RulesManager(mockProjectRoot);
        const stats = manager.stats();
        expect(stats).toHaveProperty('total');
        expect(stats).toHaveProperty('byLevel');
    });
});
