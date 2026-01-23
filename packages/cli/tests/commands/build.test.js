const fs = require('fs');
const path = require('path');
const { 
    build, 
    toNumber, 
    trimText, 
    parseBudgetMap, 
    applyBudget, 
    stripFrontmatter, 
    extractSection, 
    normalizeModuleContent 
} = require('../../cli/commands/build');

jest.mock('fs');

describe('Build Command', () => {
    describe('Helpers', () => {
        test('toNumber should parse numbers correctly', () => {
            expect(toNumber('123')).toBe(123);
            expect(toNumber('abc')).toBeNull();
            expect(toNumber(null)).toBeNull();
        });

        test('trimText should truncate text correctly', () => {
            const notice = '...';
            // Text length 11 ('hello world')
            // Limit 8. Suffix 3. Available 5 ('hello').
            expect(trimText('hello world', 8, notice)).toBe('hello...');
            expect(trimText('hello', 100)).toBe('hello');
        });

        test('trimText should use default notice', () => {
            const result = trimText('hello world', 8);
            expect(result).toContain('⚠️ Conteúdo truncado');
        });

        test('applyBudget should manage blocks', () => {
            const header = 'Header';
            const blocks = ['Block1', 'Block2'];
            // Case 1: Fits
            expect(applyBudget(header, blocks, 100)).toContain('Block1');
            expect(applyBudget(header, blocks, 100)).toContain('Block2');
            
            // Case 2: Truncated
            const result = applyBudget(header, blocks, 20); 
            expect(result).toContain('⚠️ Contexto truncado');

            // Case 3: Truncate blocks to fit (Line 51 coverage)
            // Block must be larger than notice (~80 chars) to make space when removed
            const longBlock = 'a'.repeat(100);
            const blocks2 = ['Short', longBlock];
            // Header(6) + sep(7) + Short(5) + sep(7) + Long(100) = 125
            // Limit 110.
            // Pop Long -> Header + Short + Notice (~80) = ~98 <= 110. Fits.
            const result2 = applyBudget('Header', blocks2, 110);
            expect(result2).toContain('Short');
            expect(result2).not.toContain(longBlock);
            expect(result2).toContain('⚠️ Contexto truncado');
        });

        test('parseBudgetMap should parse JSON', () => {
            expect(parseBudgetMap('{"a":1}')).toEqual({a: 1});
            expect(parseBudgetMap('invalid')).toEqual({});
            expect(parseBudgetMap('123')).toEqual({});
            expect(parseBudgetMap('null')).toEqual({});
        });

        test('stripFrontmatter should remove frontmatter', () => {
            const content = '---\ntitle: test\n---\nbody';
            expect(stripFrontmatter(content)).toBe('body');
            expect(stripFrontmatter('no frontmatter')).toBe('no frontmatter');
        });

        test('extractSection should extract tagged sections', () => {
            const content = 'start <!-- TAG:START --> content <!-- TAG:END --> end';
            expect(extractSection(content, '<!-- TAG:START -->', '<!-- TAG:END -->')).toBe('content');
        });

        test('normalizeModuleContent should handle variants', () => {
            const content = `
<!-- AI-DOC:CORE_START -->
core
<!-- AI-DOC:CORE_END -->
<!-- AI-DOC:FULL_START -->
full
<!-- AI-DOC:FULL_END -->
            `;
            expect(normalizeModuleContent(content, 'core')).toBe('core');
            expect(normalizeModuleContent(content, 'full')).toBe('core\n\nfull');

            const onlyCore = `
<!-- AI-DOC:CORE_START -->
core
<!-- AI-DOC:CORE_END -->
            `;
            expect(normalizeModuleContent(onlyCore, 'full')).toBe('core');

            const onlyFull = `
<!-- AI-DOC:FULL_START -->
full
<!-- AI-DOC:FULL_END -->
            `;
            expect(normalizeModuleContent(onlyFull, 'full')).toBe('full');

            const noTags = 'just content';
            expect(normalizeModuleContent(noTags, 'full')).toBe('just content');
        });
    });

    describe('build function', () => {
        const mockKernelPath = '/kernel';
        const mockWsPath = '/ws';
        const mockProjectRoot = '/project';

        beforeEach(() => {
            jest.clearAllMocks();
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockImplementation((p) => {
                if (p.includes('config.yaml')) return 'name: TestProject\ntech_stack: node';
                if (p.includes('instruction.md')) return 'Module Content';
                if (p.endsWith('.md')) return 'Stack Content'; // For stacks
                return '';
            });
            fs.readdirSync.mockReturnValue(['stack.md']);
            fs.statSync.mockReturnValue({ isFile: () => true, isDirectory: () => false });
        });

        test('should build content with modules and stacks', () => {
            const result = build(mockKernelPath, mockWsPath, mockProjectRoot, {
                budget: {
                    maxChars: 1000,
                    moduleBudgets: JSON.stringify({ core: 100 }),
                    stackBudgets: JSON.stringify({ stack: 100 })
                }
            });
            expect(result).toContain('# AI Instructions - TestProject');
            expect(result).toContain('## Módulo: CORE');
            expect(result).toContain('Module Content');
            expect(result).toContain('## Stack: STACK');
            expect(result).toContain('Stack Content');
        });

        test('should handle missing files gracefully', () => {
            fs.existsSync.mockImplementation((p) => p.includes('config.yaml')); // Only config exists
            const result = build(mockKernelPath, mockWsPath, mockProjectRoot);
            expect(result).toContain('# AI Instructions');
            expect(result).not.toContain('## Módulo:');
        });

        test('should handle missing config and empty stack files', () => {
            fs.existsSync.mockReturnValue(false); // No config
            fs.readdirSync.mockReturnValue(['ignore.txt', 'empty.md']);
            fs.readFileSync.mockImplementation((p) => {
                if (p.endsWith('empty.md')) return ''; // Empty stack
                return '';
            });

            // Mock exists for stacks path to enter the loop
            fs.existsSync.mockImplementation((p) => p.includes('stacks'));

            const result = build(mockKernelPath, mockWsPath, mockProjectRoot);
            // Default project name from root
            expect(result).toContain('# AI Instructions - project'); 
        });
    });
});
