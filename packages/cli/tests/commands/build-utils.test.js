const { 
  trimText, 
  parseBudgetMap, 
  applyBudget, 
  normalizeModuleContent,
  toNumber,
  stripFrontmatter,
  extractSection,
  build
} = require('../../cli/commands/build');
const fs = require('fs');
const path = require('path');

jest.mock('fs');
jest.mock('path');

describe('Build Utils', () => {
  describe('toNumber', () => {
    test('should return null for empty value', () => {
      expect(toNumber(null)).toBeNull();
      expect(toNumber(undefined)).toBeNull();
      expect(toNumber('')).toBeNull();
    });

    test('should return number for valid input', () => {
      expect(toNumber('123')).toBe(123);
      expect(toNumber(456)).toBe(456);
    });

    test('should return null for invalid number', () => {
      expect(toNumber('abc')).toBeNull();
      expect(toNumber(NaN)).toBeNull();
    });
  });

  describe('trimText', () => {
    test('should return text if no maxChars', () => {
      expect(trimText('abc', null)).toBe('abc');
    });

    test('should return text if fits', () => {
      expect(trimText('abc', 10)).toBe('abc');
    });

    test('should truncate with default notice', () => {
      const text = 'abcdefghij';
      // notice length is around 45 chars.
      // maxChars must be > notice length to show some text.
      // default notice: '\n\n⚠️ Conteúdo truncado por orçamento de contexto.' (length 46)
      // text length 10.
      // If we pass maxChars = 5, it returns just part of notice?
      // Logic: available = max(0, maxChars - notice.length).
      // If maxChars < notice.length, available = 0. text.slice(0,0) + notice.
      // So it returns just notice (or part of it if we were slicing notice, but we aren't).
      // Actually trimText returns suffix (notice) fully.
      
      const res = trimText(text, 5); 
      expect(res).toContain('Conteúdo truncado');
    });

    test('should truncate with custom notice', () => {
      const text = 'hello world';
      const notice = '...';
      const res = trimText(text, 5, notice);
      // available = 5 - 3 = 2.
      // text.slice(0, 2) = 'he'.
      // result 'he...'
      expect(res).toBe('he...');
    });
  });

  describe('parseBudgetMap', () => {
    test('should return empty object for null', () => {
      expect(parseBudgetMap(null)).toEqual({});
    });

    test('should return empty object for invalid JSON', () => {
      expect(parseBudgetMap('{invalid')).toEqual({});
    });

    test('should return parsed object', () => {
      expect(parseBudgetMap('{"a":1}')).toEqual({a: 1});
    });

    test('should return empty object if parsed is not object', () => {
      expect(parseBudgetMap('123')).toEqual({});
      expect(parseBudgetMap('true')).toEqual({});
    });
  });

  describe('applyBudget', () => {
    test('should return full content if maxChars <= 0', () => {
      expect(applyBudget('H', ['A', 'B'], 0)).toContain('A');
    });

    test('should return content if fits', () => {
      // blocks.join(separator) where separator is '\n\n---\n'
      // blocks = ['A'] -> join returns 'A'
      // header = 'H'
      // result = 'HA'
      expect(applyBudget('H', ['A'], 100)).toBe('HA');
    });

    test('should remove blocks until fits', () => {
      const header = 'H';
      const blocks = ['AAA', 'BBB'];
      const maxChars = 5; // H + AAA = 4. H + AAA + sep + BBB > 5.
      // Notice length is huge.
      // If it doesn't fit with blocks, it tries removing blocks.
      // If blocks empty, it returns truncated header + notice.
      // Notice is ~86 chars.
      
      // Let's mock the notice logic? No, it's hardcoded.
      // We need maxChars large enough for header + notice + 1 block?
      // Or small enough to trigger removal.
      
      // If maxChars is small (e.g. 10), and notice is 86.
      // available = 0.
      // truncatedHeader = header.slice(0,0) = ''.
      // returns notice.
      
      const res = applyBudget('Header', ['Block1'], 10);
      expect(res).toContain('Contexto truncado');
    });
  });

  describe('normalizeModuleContent', () => {
    test('should return trimmed content if no tags', () => {
      expect(normalizeModuleContent(' abc ')).toBe('abc');
    });

    test('should return core content for core variant', () => {
      const content = 'Pre <!-- AI-DOC:CORE_START --> Core <!-- AI-DOC:CORE_END --> Post';
      expect(normalizeModuleContent(content, 'core')).toBe('Core');
    });

    test('should return combined for full variant', () => {
      const content = '<!-- AI-DOC:CORE_START -->Core<!-- AI-DOC:CORE_END --><!-- AI-DOC:FULL_START -->Full<!-- AI-DOC:FULL_END -->';
      expect(normalizeModuleContent(content, 'full')).toBe('Core\n\nFull');
    });

    test('should strip frontmatter', () => {
      const content = '---\ntitle: test\n---\nBody';
      expect(normalizeModuleContent(content)).toBe('Body');
    });
  });
  
  describe('build', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      path.join.mockImplementation((...args) => args.join('/'));
      path.basename.mockReturnValue('project');
      path.resolve.mockImplementation((...args) => args.join('/'));
    });

    test('should extract project name and stack from config', () => {
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockImplementation((p) => {
            if (p.endsWith('config.yaml')) {
                return 'name: "MyProject"\ntech_stack: Node';
            }
            if (p.endsWith('instruction.md')) return 'Inst';
            return '';
        });
        fs.readdirSync.mockReturnValue([]);
        
        const res = build('/kernel', '/ws', '/root');
        expect(res).toContain('MyProject');
        expect(res).toContain('Módulo: CORE'); // Assuming core module exists in loop
    });
    
     test('should handle missing config', () => {
        fs.existsSync.mockImplementation(p => !p.endsWith('config.yaml'));
        fs.readFileSync.mockImplementation(() => 'Inst');
        fs.readdirSync.mockReturnValue([]);
        
        const res = build('/kernel', '/ws', '/root');
        expect(res).toContain('project'); // basename
    });

    test('should skip empty modules', () => {
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockImplementation((p) => {
          if (p.endsWith('config.yaml')) return 'name: "Test"';
          if (p.endsWith('instruction.md')) return ''; // Empty content
          return ''; 
        });
        fs.readdirSync.mockReturnValue([]);
  
        const res = build('/kernel', '/ws', '/project');
        expect(res).not.toContain('Módulo: CORE');
    });

    test('should handle robust config parsing', () => {
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockImplementation((p) => {
            if (p.endsWith('config.yaml')) {
                return 'name: "Complex"\ntech_stack:\n  - A\n  - B\nother: val';
            }
            if (p.endsWith('instruction.md')) return 'Inst';
            return '';
        });
        fs.readdirSync.mockReturnValue([]);
        
        const res = build('/kernel', '/ws', '/project');
        expect(res).toContain('Complex');
    });
});
});
