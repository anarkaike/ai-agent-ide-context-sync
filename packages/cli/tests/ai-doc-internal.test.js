
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const {
  computeRuleScore,
  updateRuleAlwaysApply,
  log,
  listFiles,
  countFilesRecursive,
  normalizeText
} = require('../cli/ai-doc');

jest.mock('fs');
jest.mock('js-yaml');

describe('AI Doc Internal Functions Coverage', () => {
  const projectRoot = '/mock/project';

  beforeEach(() => {
    jest.clearAllMocks();
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue('');
    fs.writeFileSync.mockImplementation(() => {});
    path.join = jest.fn((...args) => args.join('/'));
  });

  describe('computeRuleScore', () => {
    test('should return 0 if usage is missing', () => {
      expect(computeRuleScore(null, {})).toBe(0);
      expect(computeRuleScore(undefined, {})).toBe(0);
    });

    test('should handle semantic-match reason', () => {
      const usage = {
        suggestions: 10,
        byReasons: {
          'semantic-match-query': 5,
          'manual-mention': 5
        }
      };
      const rule = { mode: 'manual' };
      // semantic-match weight is 1.1
      // manual-mention weight is 2.0
      // weighted sum = 5 * 1.1 + 5 * 2.0 = 5.5 + 10 = 15.5
      // qualityFactor = 15.5 / 10 = 1.55
      // scoreBase = 10 (from suggestions as no history)
      // finalScore = 10 * 1.55 = 15.5
      
      const score = computeRuleScore(usage, rule);
      expect(score).toBeCloseTo(15.5);
    });

    test('should handle unknown reasons with default weight 1.0', () => {
      const usage = {
        suggestions: 10,
        byReasons: {
          'custom-reason': 10
        }
      };
      const rule = { mode: 'manual' };
      // custom-reason weight defaults to 1.0
      // weighted sum = 10 * 1.0 = 10
      // qualityFactor = 10 / 10 = 1.0
      // finalScore = 10 * 1.0 = 10
      
      const score = computeRuleScore(usage, rule);
      expect(score).toBe(10);
    });

    test('should apply mode penalty for always mode', () => {
      const usage = {
        suggestions: 10,
        byReasons: { 'manual-mention': 10 }
      };
      const rule = { mode: 'always' };
      // manual-mention weight 2.0
      // weighted sum = 20
      // qualityFactor = 2.0
      // finalScore = 20
      // penalty = 0.15
      // result = 19.85
      
      const score = computeRuleScore(usage, rule);
      expect(score).toBeCloseTo(19.85);
    });

    test('should handle zero suggestions with history', () => {
      const today = new Date();
      const usage = {
        suggestions: 0,
        history: { [today.toISOString().split('T')[0]]: 5 },
        byReasons: { 'manual-mention': 5 }
      };
      const rule = { mode: 'manual' };

      const score = computeRuleScore(usage, rule);
      expect(score).toBe(0);
    });
  });

  describe('updateRuleAlwaysApply', () => {
    test('should handle content without frontmatter', () => {
      const rule = { 
        filename: 'test.md', 
        level: 'project'
        // content removed to force reading from file
      };
      
      fs.readFileSync.mockReturnValue('Just some content');
      yaml.dump.mockReturnValue('alwaysApply: true');
      
      updateRuleAlwaysApply(projectRoot, rule, true);
      
      // Should verify writeFileSync was called with new frontmatter + original content
      expect(fs.writeFileSync).toHaveBeenCalled();
      const call = fs.writeFileSync.mock.calls.find(call => call[0].includes('test.md'));
      expect(call).toBeDefined();
      expect(call[1]).toContain('alwaysApply: true');
      expect(call[1]).toContain('Just some content');
    });

    test('should fallback to rule.content if file content matching fails', () => {
      const rule = { 
        filename: 'test.md', 
        level: 'project', 
        content: 'Rule Content'
      };
      
      // match returns null (no frontmatter regex match)
      // But here we want to test "rule.content || content"
      // If match is null, body = rule.content || content
      
      fs.readFileSync.mockReturnValue('File Content');
      yaml.dump.mockReturnValue('alwaysApply: true');
      
      updateRuleAlwaysApply(projectRoot, rule, true);
      
      expect(fs.writeFileSync).toHaveBeenCalled();
      const call = fs.writeFileSync.mock.calls.find(call => call[0].includes('test.md'));
      expect(call).toBeDefined();
      expect(call[1]).toContain('alwaysApply: true');
      expect(call[1]).toContain('Rule Content');
    });

    test('should handle yaml load returning null/undefined', () => {
      const rule = { filename: 'test.md', level: 'project' };
      const content = '---\nbroken: yaml\n---\nBody';
      
      fs.readFileSync.mockReturnValue(content);
      // Mock yaml.load to return null
      yaml.load.mockReturnValue(null);
      yaml.dump.mockReturnValue('alwaysApply: true');
      
      updateRuleAlwaysApply(projectRoot, rule, true);
      
      // frontmatter defaults to {}
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    test('should handle missing rule file', () => {
      const rule = { filename: 'missing.md', level: 'project' };

      fs.existsSync.mockReturnValue(false);
      fs.mkdirSync.mockImplementation(() => {});
      yaml.dump.mockReturnValue('alwaysApply: true');

      updateRuleAlwaysApply(projectRoot, rule, true);

      expect(fs.readFileSync).not.toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalled();
    });
  });

  describe('helpers', () => {
    test('should fallback to default color when unknown', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      log('hello', 'unknown');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('hello'));
      consoleSpy.mockRestore();
    });

    test('should return empty list when directory missing', () => {
      fs.existsSync.mockReturnValue(false);

      const result = listFiles('/missing');

      expect(result).toEqual([]);
    });

    test('should list only files when directory exists', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readdirSync.mockReturnValue(['a.txt', 'b.txt']);
      fs.statSync.mockImplementation((p) => ({
        isFile: () => p.endsWith('a.txt')
      }));

      const result = listFiles('/root');

      expect(result).toEqual(['/root/a.txt']);
    });

    test('should count files recursively with any extension', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readdirSync.mockReturnValue(['file.md']);
      fs.statSync.mockImplementation(() => ({
        isDirectory: () => false,
        isFile: () => true
      }));

      const count = countFilesRecursive('/root');

      expect(count).toBe(1);
    });

    test('should return zero when recursive directory is missing', () => {
      fs.existsSync.mockReturnValue(false);

      const count = countFilesRecursive('/missing');

      expect(count).toBe(0);
    });

    test('should ignore files when extensions do not match', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readdirSync.mockReturnValue(['file.txt']);
      fs.statSync.mockImplementation(() => ({
        isDirectory: () => false,
        isFile: () => true
      }));

      const count = countFilesRecursive('/root', ['.md']);

      expect(count).toBe(0);
    });

    test('should normalize text with default input', () => {
      expect(normalizeText()).toBe('');
    });
  });
});
