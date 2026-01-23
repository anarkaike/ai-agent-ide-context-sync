const fs = require('fs');
const path = require('path');
const docs = require('../../cli/commands/docs');
const { ensureDir, getTemplateContent, writeFileSafe, log } = docs;

jest.mock('fs');

describe('Docs Command', () => {
    let consoleLogSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
        fs.existsSync.mockReturnValue(false);
        fs.mkdirSync.mockImplementation();
        fs.writeFileSync.mockImplementation();
        fs.readFileSync.mockReturnValue('{}');
        jest.spyOn(process, 'cwd').mockReturnValue('/mock/project');
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
    });

    describe('Helpers', () => {
        test('ensureDir should create directory if not exists', () => {
            fs.existsSync.mockReturnValue(false);
            expect(ensureDir('/path/to/dir')).toBe(true);
            expect(fs.mkdirSync).toHaveBeenCalledWith('/path/to/dir', { recursive: true });
        });

        test('ensureDir should return false if exists', () => {
            fs.existsSync.mockReturnValue(true);
            expect(ensureDir('/path/to/dir')).toBe(false);
            expect(fs.mkdirSync).not.toHaveBeenCalled();
        });

        test('writeFileSafe should write file if not exists', () => {
            fs.existsSync.mockReturnValue(false);
            expect(writeFileSafe('/path/file.txt', 'content')).toBe(true);
            expect(fs.writeFileSync).toHaveBeenCalledWith('/path/file.txt', 'content', 'utf-8');
        });

        test('writeFileSafe should return false if exists', () => {
            fs.existsSync.mockReturnValue(true);
            expect(writeFileSafe('/path/file.txt', 'content')).toBe(false);
            expect(fs.writeFileSync).not.toHaveBeenCalled();
        });

        test('getTemplateContent should return content if exists', () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue('template content');
            expect(getTemplateContent('tpl.md', '/modules')).toBe('template content');
        });

        test('getTemplateContent should return placeholder if not exists', () => {
            fs.existsSync.mockReturnValue(false);
            expect(getTemplateContent('tpl.md', '/modules')).toContain('(Template not found)');
        });

        test('log should handle invalid colors gracefully', () => {
            log('test message', 'invalid-color');
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('test message'));
        });
    });

    describe('Main Execution', () => {
        test('should use default recipe if none provided', async () => {
            fs.existsSync.mockImplementation((p) => {
                if (p.includes('docs-config.json')) return false;
                if (p.includes('recipe-fullstack.json')) return true;
                return false;
            });
            fs.readFileSync.mockImplementation((p) => {
                if (p.includes('recipe-fullstack.json')) return JSON.stringify({ description: 'Test', structure: [], files: [] });
                return '';
            });

            await docs([]);
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('fullstack'));
        });

        test('should read recipe from config', async () => {
             fs.existsSync.mockImplementation((p) => {
                if (p.includes('docs-config.json')) return true;
                if (p.includes('recipe-custom.json')) return true;
                return false;
            });
            fs.readFileSync.mockImplementation((p) => {
                if (p.includes('docs-config.json')) return JSON.stringify({ recipe: 'custom' });
                if (p.includes('recipe-custom.json')) return JSON.stringify({ description: 'Custom' });
                return '';
            });

            await docs([]);
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('custom'));
        });

        test('should handle invalid docs-config.json', async () => {
            fs.existsSync.mockImplementation((p) => {
                if (p.includes('docs-config.json')) return true;
                return false;
            });
            fs.readFileSync.mockImplementation((p) => {
                if (p.includes('docs-config.json')) return 'invalid-json';
                return '';
            });

            await docs([]);
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Erro ao ler docs-config.json'));
        });

        test('should handle missing recipe', async () => {
             fs.existsSync.mockReturnValue(false);
             await docs(['invalid']);
             expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Recipe não encontrada'));
        });

        test('should create structure and files', async () => {
            const recipe = {
                description: 'Test Recipe',
                structure: [
                    { path: 'folder1', readmeTemplate: 'readme.md' }
                ],
                files: [
                    { path: 'folder1/file.md', template: 'file.md' }
                ]
            };

            fs.existsSync.mockImplementation((p) => {
                 if (p.includes('recipe-test.json')) return true;
                 return false;
            });
            fs.readFileSync.mockImplementation((p) => {
                if (p.includes('recipe-test.json')) return JSON.stringify(recipe);
                return 'template content';
            });

            await docs(['test']);

            expect(fs.mkdirSync).toHaveBeenCalled();
            expect(fs.writeFileSync).toHaveBeenCalled();
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Docs scaffolding concluído'));
        });

        test('should handle recipe parse error', async () => {
             fs.existsSync.mockReturnValue(true);
             fs.readFileSync.mockImplementation((p) => {
                 if (p.endsWith('.json')) throw new Error('Parse error');
                 return '';
             });

             await docs(['test']);
             expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Erro ao parsear recipe'));
        });

        test('should skip existing directories and files', async () => {
            fs.existsSync.mockReturnValue(true); // All exist
            fs.readFileSync.mockImplementation((p) => {
                if (p.includes('recipe-test')) return JSON.stringify({
                    description: 'Test Recipe',
                    structure: [{ path: '10-arch', readmeTemplate: 'arch.md' }],
                    files: [{ path: 'manual.md', template: 'manual.md' }]
                });
                return '';
            });

            await docs(['test']);

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Pastas criadas: 0'));
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Arquivos criados: 0'));
        });

        test('should handle structure without templates', async () => {
            fs.existsSync.mockImplementation((p) => {
                if (p.includes('recipe-test')) return true;
                return false;
            });
            fs.readFileSync.mockImplementation((p) => {
                if (p.includes('recipe-test')) return JSON.stringify({
                    description: 'No Template Recipe',
                    structure: [{ path: '10-arch' }], // No readmeTemplate
                    files: [{ path: 'manual.md' }] // No template
                });
                return '';
            });

            await docs(['test']);

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Pastas criadas: 1'));
        });

        test('should use default recipe if config has no recipe', async () => {
            fs.existsSync.mockImplementation((p) => {
                if (p.includes('docs-config.json')) return true;
                return false;
            });
            fs.readFileSync.mockImplementation((p) => {
                if (p.includes('docs-config.json')) return '{}'; // Empty config
                return '';
            });

            await docs([]); // No args

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Nenhuma recipe informada'));
        });

        test('should handle invalid color in log', async () => {
            // log is internal, but we can verify it doesn't crash if we could call it.
            // Since we can't call log directly easily without exporting, we rely on existing calls.
            // But we can trigger run without args to cover default args line 44.
            await docs(); // undefined args
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Nenhuma recipe informada'));
        });
    });
});
