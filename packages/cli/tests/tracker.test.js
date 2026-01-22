const MetricsTracker = require('../evolution/tracker');
const fs = require('fs');
const path = require('path');

jest.mock('fs');
jest.mock('path', () => {
    const original = jest.requireActual('path');
    return {
        ...original,
        join: jest.fn(),
        dirname: jest.fn()
    };
});

describe('MetricsTracker', () => {
    let tracker;
    const mockProjectRoot = '/mock/root';
    const mockStatsPath = '/mock/root/.ai-workspace/stats.json';

    beforeEach(() => {
        jest.clearAllMocks();
        path.join.mockReturnValue(mockStatsPath);
        path.dirname.mockReturnValue('/mock/root/.ai-workspace');
        fs.existsSync.mockReturnValue(false);
    });

    test('should initialize with default empty stats', () => {
        tracker = new MetricsTracker(mockProjectRoot);
        expect(tracker.stats).toEqual({ rules: {}, sessions: 0 });
    });

    test('should initialize with process.cwd() if no root provided', () => {
        const t = new MetricsTracker();
        expect(t.projectRoot).toBe(process.cwd());
    });

    test('should load existing stats', () => {
        const mockStats = { rules: { 'r1': {} }, sessions: 5 };
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockReturnValue(JSON.stringify(mockStats));
        
        tracker = new MetricsTracker(mockProjectRoot);
        expect(tracker.stats).toEqual(mockStats);
    });

    test('should handle corrupted stats file', () => {
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockReturnValue('invalid json');
        
        tracker = new MetricsTracker(mockProjectRoot);
        expect(tracker.stats).toEqual({ rules: {}, sessions: 0 });
    });

    test('save should write stats to file', () => {
        tracker = new MetricsTracker(mockProjectRoot);
        fs.writeFileSync.mockImplementation();
        fs.existsSync.mockReturnValue(true); 
        
        tracker.save();
        
        expect(fs.writeFileSync).toHaveBeenCalledWith(mockStatsPath, expect.any(String));
    });

    test('trackRuleUsage should init rule stats if missing', () => {
        tracker = new MetricsTracker(mockProjectRoot);
        const today = new Date().toISOString().split('T')[0];
        
        tracker.trackRuleUsage('rule-1', 'manual');
        
        const rule = tracker.stats.rules['rule-1'];
        expect(rule).toBeDefined();
        expect(rule.suggestions).toBe(1);
        expect(rule.history[today]).toBe(1);
    });

    test('trackRuleUsage should init history if missing in existing rule', () => {
        // Setup stats with rule but no history (migration case)
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockReturnValue(JSON.stringify({
            rules: {
                'rule-1': { suggestions: 1, byReasons: {}, lastUsed: null } // no history
            }
        }));
        
        tracker = new MetricsTracker(mockProjectRoot);
        const today = new Date().toISOString().split('T')[0];
        
        tracker.trackRuleUsage('rule-1', 'manual');
        
        expect(tracker.stats.rules['rule-1'].history).toBeDefined();
        expect(tracker.stats.rules['rule-1'].history[today]).toBe(1);
    });

    test('_pruneHistory should remove old entries', () => {
        tracker = new MetricsTracker(mockProjectRoot);
        
        // Setup history with 65 entries
        const history = {};
        for (let i = 0; i < 65; i++) {
            const key = i.toString().padStart(2, '0');
            history[key] = 1;
        }
        
        tracker._pruneHistory(history);
        
        const keys = Object.keys(history).sort();
        expect(keys.length).toBe(60);
        // keys 00-04 should be removed. 05 should be the first.
        expect(keys[0]).toBe('05');
        expect(history['04']).toBeUndefined();
    });

    test('getMostPopularRules should return sorted rules', () => {
        tracker = new MetricsTracker(mockProjectRoot);
        tracker.stats.rules = {
            'r1': { suggestions: 10 },
            'r2': { suggestions: 50 },
            'r3': { suggestions: 5 }
        };
        
        const popular = tracker.getMostPopularRules(2);
        expect(popular.length).toBe(2);
        expect(popular[0].id).toBe('r2');
        expect(popular[1].id).toBe('r1');
    });

    test('getMostPopularRules should use default limit', () => {
        tracker = new MetricsTracker(mockProjectRoot);
        tracker.stats.rules = {
            'r1': { suggestions: 1 },
            'r2': { suggestions: 2 },
            'r3': { suggestions: 3 },
            'r4': { suggestions: 4 },
            'r5': { suggestions: 5 },
            'r6': { suggestions: 6 }
        };
        
        const popular = tracker.getMostPopularRules();
        expect(popular).toHaveLength(5);
        expect(popular[0].id).toBe('r6');
    });
});
