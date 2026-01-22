const path = require('path');
const yaml = require('js-yaml');
const os = require('os');

// Mock os BEFORE requiring the module
jest.mock('os', () => ({
    homedir: jest.fn().mockReturnValue('/mock/home')
}));

jest.mock('fs');
jest.mock('js-yaml', () => ({
    load: jest.fn(),
    dump: jest.fn().mockReturnValue('mock-yaml-content')
}));
// path mock is fine as default since we don't need to change its behavior dynamically for global consts

// Now require the module
const HeuristicsEngine = require('../heuristics/engine');
const fs = require('fs'); // require again to use mocked methods in tests

describe('HeuristicsEngine', () => {
    let engine;
    const mockHomeDir = '/mock/home';

    beforeEach(() => {
        jest.clearAllMocks();
        // os.homedir() is already mocked by the factory above
        
        // Setup fs mocks for loadAll
        fs.existsSync.mockReturnValue(false); // Default no files
        fs.readdirSync.mockReturnValue([]);
        
        engine = new HeuristicsEngine();
    });

    test('should initialize with empty heuristics', () => {
        expect(engine.heuristics).toEqual({
            navigation: {},
            documentation: {},
            prompts: {},
            analysis: {}
        });
    });

    test('should load heuristics from files', () => {
        const mockYaml = { heuristics: [{ id: 'h1', confidence: 0.9 }] };
        
        fs.existsSync.mockReturnValue(true);
        fs.readdirSync.mockReturnValue(['node.yaml']);
        fs.readFileSync.mockReturnValue('content');
        yaml.load.mockReturnValue(mockYaml);

        // Re-init to trigger loadAll
        engine = new HeuristicsEngine();
        
        // We expect it to try loading for all 4 types
        // If fs.existsSync is true for all, it will load for all
        // Our mock readdir returns node.yaml for all types
        
        expect(engine.heuristics.navigation.node).toHaveLength(1);
        expect(engine.heuristics.navigation.node[0].id).toBe('h1');
    });

    test('should handle load errors gracefully', () => {
        fs.existsSync.mockReturnValue(true);
        fs.readdirSync.mockReturnValue(['broken.yaml']);
        fs.readFileSync.mockImplementation(() => { throw new Error('Read error'); });
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        engine = new HeuristicsEngine();
        
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });

    test('getRelevant should return filtered heuristics', () => {
        engine.heuristics.navigation.node = [
            { id: 'h1', confidence: 0.9 },
            { id: 'h2', confidence: 0.5 }
        ];

        const relevant = engine.getRelevant('navigation', 'node', 0.8);
        expect(relevant).toHaveLength(1);
        expect(relevant[0].id).toBe('h1');
    });

    test('getRelevant should return empty if stack not found', () => {
        const relevant = engine.getRelevant('navigation', 'unknown');
        expect(relevant).toEqual([]);
    });

    test('apply should increment usage stats', () => {
        engine.heuristics.navigation.node = [
            { id: 'h1', times_applied: 0 }
        ];
        
        // Mock save
        engine.save = jest.fn();

        const result = engine.apply('navigation', 'node', 'h1');
        
        expect(result).toBe(true);
        expect(engine.heuristics.navigation.node[0].times_applied).toBe(1);
        expect(engine.heuristics.navigation.node[0].last_used).toBeDefined();
        expect(engine.save).toHaveBeenCalled();
    });

    test('apply should return false if heuristic not found', () => {
        engine.heuristics.navigation.node = [];
        const result = engine.apply('navigation', 'node', 'h1');
        expect(result).toBe(false);
    });

    test('learn should add new heuristic', () => {
        engine.heuristics.navigation.node = [];
        engine.save = jest.fn();

        const newHeuristic = { id: 'new-h', confidence: 0.8 };
        
        engine.learn('navigation', 'node', newHeuristic);
        
        expect(engine.heuristics.navigation.node).toHaveLength(1);
        expect(engine.heuristics.navigation.node[0].times_applied).toBe(0);
        expect(engine.save).toHaveBeenCalled();
    });

    test('learn should not duplicate heuristic', () => {
        engine.heuristics.navigation.node = [{ id: 'h1' }];
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        
        const result = engine.learn('navigation', 'node', { id: 'h1' });
        
        expect(result).toBe(false);
        expect(engine.heuristics.navigation.node).toHaveLength(1);
        consoleSpy.mockRestore();
    });

    test('save should write to file', () => {
        engine.heuristics.navigation.node = [{ id: 'h1' }];
        fs.writeFileSync.mockImplementation();
        fs.existsSync.mockReturnValue(true);

        engine.save('navigation', 'node');
        
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            expect.stringContaining('node.yaml'),
            expect.any(String)
        );
    });

    test('save should create dir if missing', () => {
        engine.heuristics.navigation.node = [{ id: 'h1' }];
        fs.writeFileSync.mockImplementation();
        fs.existsSync.mockReturnValue(false);
        fs.mkdirSync.mockImplementation();

        engine.save('navigation', 'node');
        
        expect(fs.mkdirSync).toHaveBeenCalledWith(
            expect.stringContaining('navigation'),
            { recursive: true }
        );
    });

    test('stats should return correct counts', () => {
        engine.heuristics.navigation.node = [{ id: 'h1' }];
        engine.heuristics.prompts.react = [{ id: 'h2' }, { id: 'h3' }];

        const stats = engine.stats();
        
        expect(stats.total).toBe(3);
        expect(stats.byType.navigation).toBe(1);
        expect(stats.byType.prompts).toBe(2);
    });
});
