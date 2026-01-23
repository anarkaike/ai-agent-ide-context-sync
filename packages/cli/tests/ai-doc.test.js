const fs = require('fs');
const path = require('path');
const { main, commands, formatBytes, formatDate } = require('../cli/ai-doc');
const RulesManager = require('../core/rules-manager');
const HeuristicsEngine = require('../heuristics/engine');

// Mock external dependencies
jest.mock('fs');
jest.mock('os', () => ({
    homedir: jest.fn().mockReturnValue('/mock/home')
}));
jest.mock('../cli/commands/build', () => ({
    build: jest.fn().mockReturnValue('mock-content')
}));
jest.mock('../core/rules-manager');
jest.mock('../heuristics/engine');
jest.mock('js-yaml', () => ({
    load: jest.fn(),
    dump: jest.fn().mockReturnValue('mock-yaml: content')
}));

describe('CLI ai-doc', () => {
    let consoleLogSpy;
    let consoleErrorSpy;
    const mockProjectRoot = '/mock/project';

    beforeEach(() => {
        jest.clearAllMocks();
        // Allow console.log to print so we can debug
        consoleLogSpy = jest.spyOn(console, 'log');
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        // Mock process.cwd
        jest.spyOn(process, 'cwd').mockReturnValue(mockProjectRoot);
        
        // Mock RulesManager instance
        RulesManager.mockImplementation(() => ({
            getAllRules: jest.fn().mockReturnValue([]),
            stats: jest.fn().mockReturnValue({
                total: 0,
                byLevel: {},
                byMode: {}
            })
        }));

        // Mock HeuristicsEngine instance
        HeuristicsEngine.mockImplementation(() => ({
            stats: jest.fn().mockReturnValue({
                total: 0,
                byType: {}
            })
        }));

        // Default fs mocks
        fs.existsSync.mockReturnValue(true);
        fs.readdirSync.mockReturnValue([]);
        fs.statSync.mockReturnValue({
            isFile: () => true,
            isDirectory: () => false,
            mtime: new Date(),
            size: 100
        });
        fs.readFileSync.mockReturnValue('{}');
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Helpers', () => {
        test('formatBytes should format correctly', () => {
            expect(formatBytes(0)).toBe('0 B');
            expect(formatBytes(1023)).toBe('1023 B');
            expect(formatBytes(1024)).toBe('1.0 KB');
            expect(formatBytes(1024 * 1024)).toBe('1.0 MB');
            expect(formatBytes(NaN)).toBe('-');
        });

        test('formatDate should format correctly', () => {
            expect(formatDate(null)).toBe('-');
            expect(formatDate('invalid')).toBe('-');
            const d = new Date('2023-01-01T00:00:00.000Z');
            expect(formatDate(d)).toBe('2023-01-01T00:00:00.000Z');
        });
    });

    describe('main()', () => {
        test('should show help if no command provided', async () => {
            process.argv = ['node', 'ai-doc'];
            await main();
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Comandos:'));
        });

        test('should run command if valid', async () => {
            process.argv = ['node', 'ai-doc', 'status'];
            await main();
            expect(consoleLogSpy).toHaveBeenCalledWith("AI CLI v2.0 Refactored");
        });

        test('should show error if command unknown', async () => {
            process.argv = ['node', 'ai-doc', 'unknown'];
            await main();
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Comando desconhecido'));
        });

        test('should handle command errors', async () => {
            process.argv = ['node', 'ai-doc', 'status'];
            commands.status = jest.fn().mockRejectedValue(new Error('Fatal error'));
            await main();
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Erro fatal: Fatal error'));
            // Restore original status
            commands.status = async () => { console.log("AI CLI v2.0 Refactored"); };
        });
    });

    describe('Commands', () => {
        describe('init', () => {
            test('should initialize workspace if not exists', async () => {
                fs.existsSync.mockReturnValue(false);
                await commands.init();
                expect(fs.mkdirSync).toHaveBeenCalledWith(expect.stringContaining('.ai-workspace/cache/compiled'), { recursive: true });
                // Check if called with README.md (ignoring other args or being specific)
                expect(fs.writeFileSync).toHaveBeenCalledWith(
                    expect.stringContaining('README.md'), 
                    expect.stringContaining('Documentação do Projeto')
                );
            });

            test('should warn if workspace exists', async () => {
                fs.existsSync.mockReturnValue(true);
                await commands.init();
                expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Workspace já existe'));
            });
        });

        describe('build', () => {
            test('should fail if workspace not found', async () => {
                fs.existsSync.mockReturnValue(false);
                await commands.build();
                expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Workspace não encontrado'));
            });

            test('should run build and verify docs', async () => {
                fs.existsSync.mockReturnValue(true);
                // Mock scanner
                jest.mock('../modules/docs/tools/placeholder-scanner', () => ({
                    scanDirectory: jest.fn().mockReturnValue({})
                }), { virtual: true });

                await commands.build();
                
                // Verify that the mocked build function was called
                // We access the mock via the required module
                const buildModule = require('../cli/commands/build');
                expect(buildModule.build).toHaveBeenCalledTimes(2); // core and full
                expect(fs.writeFileSync).toHaveBeenCalled();
            });

            test('should warn if build finds placeholders', async () => {
                fs.existsSync.mockReturnValue(true);
                const { scanDirectory } = require('../modules/docs/tools/placeholder-scanner');
                scanDirectory.mockReturnValue({
                    'doc.md': [{ line: 1, content: 'TODO', pattern: 'TODO' }]
                });

                await commands.build();
                
                expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Atenção: 1 arquivo(s) contém placeholders'));
            });
        });

        describe('kernel', () => {
            test('should show status', async () => {
                fs.existsSync.mockReturnValue(true);
                // Mocks are already set in beforeEach
                
                await commands.kernel(['status']);
                expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Kernel Navigator'));
            });

            test('should show heuristics count with recursion', async () => {
            fs.existsSync.mockReturnValue(true);
            
            // Mock readdir to return file and directory
            fs.readdirSync.mockImplementation((p) => {
                 if (p.endsWith('heuristics')) return ['h1.yaml', 'subdir'];
                 if (p.endsWith('subdir')) return ['h2.yaml'];
                 return [];
            });
            
            fs.statSync.mockImplementation((p) => {
                const isDir = p.endsWith('subdir');
                return {
                    isFile: () => !isDir,
                    isDirectory: () => isDir,
                    size: 100,
                    mtime: new Date()
                };
            });
            // Also need path.extname to work. It does naturally.

            await commands.kernel(['heuristics']);
            
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Arquivos YAML: 2'));
        });

        test('should handle readJsonSafe errors', async () => {
             fs.existsSync.mockReturnValue(true);
             fs.readFileSync.mockImplementation(() => { throw new Error('JSON Error'); });
             
             // readJsonSafe is used in kernel
             await commands.kernel(['status']);
             // Should handle null stats gracefully
             expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Stats: ausente'));
        });
        
        test('should show budgets', async () => {
                fs.existsSync.mockReturnValue(true);
                await commands.kernel(['budgets']);
                expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Orçamento de Contexto'));
            });

            test('should fail if workspace missing', async () => {
                fs.existsSync.mockReturnValue(false);
                await commands.kernel(['status']);
                expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Workspace não encontrado'));
            });
        });

        describe('scan', () => {
        beforeEach(() => {
            jest.mock('../modules/docs/tools/placeholder-scanner', () => ({
                scanDirectory: jest.fn()
            }), { virtual: true });
        });

        test('should scan directory and find issues', async () => {
            const { scanDirectory } = require('../modules/docs/tools/placeholder-scanner');
            scanDirectory.mockReturnValue({
                'doc.md': [{ line: 1, content: 'TODO', pattern: 'TODO' }]
            });
            fs.existsSync.mockReturnValue(true);

            await commands.scan(['docs']);

            expect(scanDirectory).toHaveBeenCalled();
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Found potential placeholders'));
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('doc.md'));
        });

        test('should report clean if no issues', async () => {
            const { scanDirectory } = require('../modules/docs/tools/placeholder-scanner');
            scanDirectory.mockReturnValue({});
            fs.existsSync.mockReturnValue(true);

            await commands.scan(['docs']);

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No placeholders found'));
        });

        test('should handle missing directory', async () => {
            fs.existsSync.mockReturnValue(false);
            await commands.scan(['missing']);
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Directory not found'));
        });

        test('should handle scan errors', async () => {
             const { scanDirectory } = require('../modules/docs/tools/placeholder-scanner');
             scanDirectory.mockImplementation(() => { throw new Error('Scan failed'); });
             fs.existsSync.mockReturnValue(true);
             
             await commands.scan(['docs']);
             
             expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Error running scan'));
        });

        test('should use default directory if not provided', async () => {
             const { scanDirectory } = require('../modules/docs/tools/placeholder-scanner');
             scanDirectory.mockReturnValue({});
             fs.existsSync.mockReturnValue(true);
             
             await commands.scan(); // No args
             
             expect(scanDirectory).toHaveBeenCalled();
             const calledPath = scanDirectory.mock.calls[0][0];
             expect(calledPath).toMatch(/docs$/);
        });
    });

    describe('kernel', () => {
        test('should show cache status', async () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockImplementation((p) => {
                if (p.includes('smart-cache')) return JSON.stringify({ prompts: { a: 1 } });
                if (p.includes('embeddings-index')) return JSON.stringify({ files: ['a'] });
                return '{}';
            });
            
            await commands.kernel(['cache']);
            
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('SmartCache prompts: 1'));
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Embeddings index: 1'));
        });

        test('should show compiled files', async () => {
            fs.existsSync.mockReturnValue(true);
            fs.readdirSync.mockImplementation((p) => {
                 if (p.includes('compiled')) return ['file1.md'];
                 return [];
            });
            fs.statSync.mockImplementation((p) => ({
                isFile: () => true,
                isDirectory: () => false,
                size: 100,
                mtime: new Date()
            }));

            await commands.kernel(['compiled']);
            
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('file1.md'));
        });

        test('should report no compiled files', async () => {
            fs.existsSync.mockReturnValue(true);
            fs.readdirSync.mockImplementation((p) => {
                 return [];
            });

            await commands.kernel(['compiled']);
            
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Nenhum arquivo compilado'));
        });

        test('should show heuristics count', async () => {
            fs.existsSync.mockReturnValue(true);
            // Mock countFilesRecursive via readdirSync/statSync recursion or mocking internal function?
            // Since countFilesRecursive is internal and not exported, we rely on fs mocks.
            // But countFilesRecursive calls fs.readdirSync and fs.statSync.
            // We need to support recursion mock.
            // Simplified: readdir returns 1 file.
            fs.readdirSync.mockImplementation((p) => {
                 if (p.includes('heuristics')) return ['h1.yaml'];
                 return [];
            });
            fs.statSync.mockImplementation((p) => ({
                isFile: () => true,
                isDirectory: () => false,
                size: 100,
                mtime: new Date()
            }));

            await commands.kernel(['heuristics']);
            
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Arquivos YAML: 1'));
        });
        
        test('should show budgets', async () => {
             fs.existsSync.mockReturnValue(true);
             process.env.AI_DOC_BUILD_MAX_CHARS = '1000';
             
             await commands.kernel(['budgets']);
             
             expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('buildMaxChars: 1000'));
        });

        test('should handle rules subcommands (promote/demote/drift)', async () => {
            fs.existsSync.mockReturnValue(true);
            // Mock RulesManager.stats and getAllRules
            const mockRules = [
                { id: 'rule1', mode: 'manual', level: 'project', filename: 'rule1.md' },
                { id: 'rule2', mode: 'always', level: 'project', filename: 'rule2.md' },
                { id: 'rule3', mode: 'always', level: 'project', filename: 'rule3.md' },
                { id: 'rule4', mode: 'always', level: 'project', filename: 'rule4.md' }, // Unused rule (missing from stats)
                { id: 'ruleUser', mode: 'manual', level: 'user', filename: 'ruleUser.md' },
                { id: 'rulePath', mode: 'manual', level: 'path-specific', filename: 'rulePath.md' }
            ];
            
            RulesManager.mockImplementation(() => ({
                stats: jest.fn().mockReturnValue({ total: 6, byLevel: {}, byMode: {} }),
                getAllRules: jest.fn().mockReturnValue(mockRules)
            }));
            
            // Mock stats.json with usage data
            fs.readFileSync.mockImplementation((p) => {
                if (p.endsWith('stats.json')) return JSON.stringify({
                    rules: {
                        'rule1': { suggestions: 10, lastUsed: new Date().toISOString() }, // Promotion candidate
                        'rule2': { 
                            suggestions: 20, 
                            lastUsed: '2020-01-01',
                            history: { '2020-01-01': 20 }
                        }, // Drift candidate
                        'rule3': { suggestions: 0, lastUsed: '2020-01-01' }, // Demotion candidate
                        'ruleUser': { suggestions: 10, lastUsed: new Date().toISOString() }, // User promotion
                        'rulePath': { suggestions: 10, lastUsed: new Date().toISOString() } // Path specific
                    }
                });
                return '{}';
            });

            await commands.kernel(['rules', '--apply-promotions', '--apply-demotions']);
            
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Regras'));
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Promoções aplicadas'));
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Rebaixamentos aplicados'));
            // Drift detection
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Drift Detectado'));
        });
    });

    describe('ritual', () => {
            test('should run auto-init if needed', async () => {
                fs.existsSync.mockReturnValue(false); // No workspace
                
                // Spy on init
                const initSpy = jest.spyOn(commands, 'init').mockImplementation();
                const kernelSpy = jest.spyOn(commands, 'kernel').mockImplementation();
                const buildSpy = jest.spyOn(commands, 'build').mockImplementation();

                await commands.ritual();

                expect(initSpy).toHaveBeenCalled();
                expect(kernelSpy).toHaveBeenCalled();
                expect(buildSpy).toHaveBeenCalled();
            });
        });
        
        describe('assist/chat', () => {
            test('should require message', async () => {
                await commands.chat([]);
                expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Informe sua intenção'));
            });

            test('should detect task intent', async () => {
                await commands.chat(['nova task minha tarefa']);
                expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('ai-doc task start minha tarefa'));
            });

            test('should handle prompt intent without keyword', async () => {
                fs.readFileSync.mockImplementation((p) => {
                    if (p.endsWith('stats.json')) return JSON.stringify({
                        lastRitual: new Date().toISOString()
                    });
                    return '{}';
                });

                const promptSpy = jest.spyOn(commands, 'prompt').mockImplementation();

                await commands.chat(['pergunta', 'como', 'usar']);

                expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('ai-doc prompt pergunta como usar'));
                expect(promptSpy).toHaveBeenCalledWith(['pergunta como usar']);
                promptSpy.mockRestore();
            });

            test('should handle various chat intents', async () => {
                  // Prevent auto-ritual
                  fs.readFileSync.mockImplementation((p) => {
                      if (p.endsWith('stats.json')) return JSON.stringify({
                          lastRitual: new Date().toISOString()
                      });
                      return '{}';
                  });

                  // Spy on subcommands to prevent execution and verify calls if needed
                  jest.spyOn(commands, 'run').mockImplementation();
                  jest.spyOn(commands, 'task').mockImplementation();
                  jest.spyOn(commands, 'prompt').mockImplementation();
                  jest.spyOn(commands, 'scan').mockImplementation();
                  jest.spyOn(commands, 'kernel').mockImplementation();

                  // rules
                  await commands.chat(['ver regras']);
                  expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('ai-doc kernel rules'));
                  
                  // budgets
                  await commands.chat(['ver budget']);
                  expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('ai-doc kernel budgets'));
                  
                  // cache
                  await commands.chat(['ver cache']);
                  expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('ai-doc kernel cache'));
                  
                  // heuristics
                  await commands.chat(['ver heuristicas']);
                  expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('ai-doc kernel heuristics'));
                  
                  // compiled
                  await commands.chat(['ver compilados']);
                  expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('ai-doc kernel compiled'));
                  
                  // build
                  await commands.chat(['compilar projeto']);
                  expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('ai-doc build'));
                  
                  // ritual
                   await commands.chat(['rodar ritual']);
                   expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('ai-doc ritual'));
                   
                   // workflow
                   await commands.chat(['run deploy env=prod']);
                   expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('ai-doc run deploy env=prod'));
                   expect(commands.run).toHaveBeenCalled();
                   
                   // prompt
                   await commands.chat(['gerar prompt feature login']);
                   expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('ai-doc prompt feature login'));
                   expect(commands.prompt).toHaveBeenCalled();
                   
                   // scan
                   await commands.chat(['scan docs']);
                   expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('ai-doc scan docs'));
                   expect(commands.scan).toHaveBeenCalled();
                   
                   // task list
                   await commands.chat(['listar tasks']);
                   expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('ai-doc task list'));
                   expect(commands.task).toHaveBeenCalled();

                   // task complete
                   await commands.chat(['concluir task']);
                   expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('ai-doc task complete'));
                   
                   // task status
                   await commands.chat(['status task']);
                   expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('ai-doc task status'));

                   // task default (unknown subcmd)
                   await commands.chat(['task algo']);
                   expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('ai-doc task list'));
              });

             test('should trigger ritual on .env change', async () => {
                 // Mock stats with old ritual
                 const lastRitual = new Date(Date.now() - 100000); // slightly old
                 const envMtime = new Date(Date.now()); // newer
                 
                 fs.readFileSync.mockImplementation((p) => {
                     if (p.endsWith('stats.json')) return JSON.stringify({
                         lastRitual: lastRitual.toISOString()
                     });
                     return '{}';
                 });
                 
                 fs.statSync.mockImplementation((p) => {
                     if (p.endsWith('.env')) return { mtime: envMtime, isFile: () => true };
                     return { mtime: new Date(), isFile: () => true, isDirectory: () => false };
                 });

                 // Spy on ritual
                 const ritualSpy = jest.spyOn(commands, 'ritual').mockImplementation();

                 await commands.chat(['ver regras']);
                 
                 expect(ritualSpy).toHaveBeenCalled();
             });

             test('should trigger ritual if stats missing (new project)', async () => {
                 // Mock stats missing
                 fs.existsSync.mockImplementation((p) => {
                     if (p.endsWith('stats.json')) return false; // missing
                     return true;
                 });
                 
                 const ritualSpy = jest.spyOn(commands, 'ritual').mockImplementation();

                 await commands.chat(['ver regras']);
                 
                 expect(ritualSpy).toHaveBeenCalled();
             });

             test('should handle missing command handler', async () => {
                 // Prevent auto-ritual
                 fs.readFileSync.mockImplementation((p) => {
                     if (p.endsWith('stats.json')) return JSON.stringify({
                         lastRitual: new Date().toISOString()
                     });
                     return '{}';
                 });

                 // Save original handler
                 const originalKernel = commands.kernel;
                 // Remove handler
                 commands.kernel = undefined;
                 
                 try {
                     await commands.chat(['ver regras']);
                     expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Comando não disponível: kernel'));
                 } finally {
                     // Restore
                     commands.kernel = originalKernel;
                 }
             });

             test('should support assist alias', async () => {
                 await commands.assist(['ver regras']);
                 expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('ai-doc kernel rules'));
             });
 
             test('should fallback to kernel rules for unknown intent', async () => {
                 // Prevent auto-ritual
                 fs.readFileSync.mockImplementation((p) => {
                     if (p.endsWith('stats.json')) return JSON.stringify({
                         lastRitual: new Date().toISOString()
                     });
                     return '{}';
                 });

                 await commands.chat(['ola mundo']);
                 // Should default to kernel info and rules
                 expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('ai-doc kernel'));
                 expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('ai-doc kernel rules'));
             });

             test('should trigger auto-ritual if needed', async () => {
                 fs.existsSync.mockReturnValue(true);
                 // Mock stats with old ritual date
                 fs.readFileSync.mockImplementation((p) => {
                     if (p.endsWith('stats.json')) return JSON.stringify({
                         lastRitual: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
                     });
                     return '{}';
                 });
                 
                 await commands.chat(['status']);
                 expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Auto-trigger: Executando ritual'));
            });

            test('should handle default arguments', async () => {
                 // Test scan default arg
                 const scanSpy = jest.spyOn(commands, 'scan').mockImplementation(); // Restore original implementation? No, scan is async.
                 // We want to test the default arg logic inside scan implementation.
                 // But commands.scan IS the implementation in ai-doc.js.
                 // Wait, in `beforeEach`, I didn't mock commands.scan.
                 // But in `should handle various chat intents` (line 425), I spied on it.
                 // I should add a NEW test block or use existing one.
                 // In `describe('scan')`, I can test default arg.
            });
        });
        
        describe('default args', () => {
             test('should use default args for commands', async () => {
                 // chat default
                 await commands.chat();
                 expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Informe sua intenção'));
                 
                 // assist default
                 await commands.assist();
                 expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Informe sua intenção'));
             });
        });

        describe('evolve', () => {
            test('should fail if workspace missing', async () => {
                fs.existsSync.mockReturnValue(false);
                await commands.evolve();
                expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Workspace não encontrado'));
            });

            test('should evolve successfully', async () => {
                fs.existsSync.mockReturnValue(true);
                fs.readFileSync.mockImplementation((p) => {
                    if (p.endsWith('stats.json')) return JSON.stringify({
                        rules: {},
                        autoEvolutionLog: []
                    });
                    return '{}';
                });
                fs.writeFileSync.mockImplementation(() => {});
                
                await commands.evolve();
                
                expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Autoevolução'));
            });

            test('should collect all evolution signals (drift, lowScore, missingHistory)', async () => {
                // Mock fs.existsSync to true so readJsonSafe works
                fs.existsSync.mockReturnValue(true);

                // Mock rules
                const mockRules = [
                     { id: 'drifted', mode: 'manual' },
                     { id: 'lowScore', mode: 'manual' },
                     { id: 'missingHistory', mode: 'manual' },
                     { id: 'activeRule', mode: 'manual' }
                 ];
                 RulesManager.mockImplementation(() => ({
                     getAllRules: jest.fn().mockReturnValue(mockRules),
                     stats: jest.fn().mockReturnValue({ total: 4, byLevel: {}, byMode: {} })
                 }));

                // Mock stats with specific usage
             const today = new Date();
             
             // Drift: > 10 usage, > 14 days ago
             const driftDate = new Date();
             driftDate.setDate(today.getDate() - 20);
             const driftDateStr = driftDate.toISOString().split('T')[0];

             // Low Score: < 10 usage (no drift), > 30 days ago (score 0)
             // Use a very old date to ensure score is 0
             const lowScoreDateStr = '2000-01-01';
 
             fs.readFileSync.mockImplementation((p) => {
                 if (p.endsWith('stats.json')) return JSON.stringify({
                     rules: {
                         'drifted': { 
                             suggestions: 11, 
                             byReasons: { 'manual-mention': 11 },
                             lastUsed: driftDate.toISOString(),
                             history: { [driftDateStr]: 11 } 
                         },
                         'lowScore': { 
                             suggestions: 5, 
                             byReasons: { 'manual-mention': 5 },
                             history: { [lowScoreDateStr]: 5 } 
                         },
                         'missingHistory': {
                             suggestions: 5,
                             byReasons: { 'manual-mention': 5 }
                             // no history
                         },
                         'activeRule': {
                            suggestions: 20,
                            byReasons: { 'manual-mention': 20 },
                            lastUsed: today.toISOString(),
                            history: { [today.toISOString().split('T')[0]]: 20 }
                        }
                     }
                 });
                 return '{}';
             });

                await commands.evolve();
                
                // Debug logs if needed
                // consoleLogSpy.mock.calls.forEach(call => process.stdout.write('LOG CALL: ' + call[0] + '\n'));
 
                expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringMatching(/Drift detectado:\s*1/));
                expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringMatching(/Regras com score baixo:\s*1/));
                expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringMatching(/Regras sem histórico:\s*1/));
            });

            test('should truncate evolution log if > 30', async () => {
                const logs = Array(35).fill({ timestamp: 'old' });
                fs.readFileSync.mockImplementation((p) => {
                     if (p.endsWith('stats.json')) return JSON.stringify({
                         rules: {},
                         autoEvolutionLog: logs
                     });
                     return '{}';
                 });

                 await commands.evolve();
                 
                 // We can check if writeFileSync was called with truncated log
                 const writeCall = fs.writeFileSync.mock.calls.find(call => call[0].endsWith('stats.json'));
                 const writtenData = JSON.parse(writeCall[1]);
                 expect(writtenData.autoEvolutionLog.length).toBe(30);
            });
        });

        describe('Extra Coverage', () => {
            test('should handle empty prompt text', async () => {
                 // Prevent auto-ritual
                 fs.readFileSync.mockImplementation((p) => {
                     if (p.endsWith('stats.json')) return JSON.stringify({ lastRitual: new Date().toISOString() });
                     return '{}';
                 });
                 const promptSpy = jest.spyOn(commands, 'prompt').mockImplementation();
                 
                 await commands.chat(['prompt ']); // Trailing space, empty content
                 expect(promptSpy).toHaveBeenCalledWith(['prompt']);
                 promptSpy.mockRestore();
            });

            test('should handle incomplete workflow command', async () => {
                 // Prevent auto-ritual
                 fs.readFileSync.mockImplementation((p) => {
                     if (p.endsWith('stats.json')) return JSON.stringify({ lastRitual: new Date().toISOString() });
                     return '{}';
                 });
                 
                 await commands.chat(['run']); // Missing ID
                 expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('ai-doc kernel'));
            });

            test('should handle null caches in kernel status', async () => {
                 fs.existsSync.mockReturnValue(true);
                 // Mock listFiles to return empty array for compiled
                 fs.readdirSync.mockReturnValue([]);
                 fs.statSync.mockReturnValue({ isFile: () => true, isDirectory: () => false });

                 // Mock readFileSync to throw error (simulating file read failure handled by readJsonSafe)
                 fs.readFileSync.mockImplementation(() => { throw new Error('File read error'); });
                 
                 await commands.kernel();
                 
                 expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Cache prompts: 0'));
                 expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Cache embeddings: 0'));
                 expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Stats: ausente'));
            });

            test('should handle demote rules chat intent', async () => {
                 // Prevent auto-ritual
                 fs.readFileSync.mockImplementation((p) => {
                     if (p.endsWith('stats.json')) return JSON.stringify({ lastRitual: new Date().toISOString() });
                     return '{}';
                 });
                 
                 const kernelSpy = jest.spyOn(commands, 'kernel').mockImplementation();
                 
                 await commands.chat(['rebaixar regras']);
                 expect(kernelSpy).toHaveBeenCalledWith(['rules', '--demote']);
                 kernelSpy.mockRestore();
            });

            test('should handle promote rules chat intent', async () => {
                 // Prevent auto-ritual
                 fs.readFileSync.mockImplementation((p) => {
                     if (p.endsWith('stats.json')) return JSON.stringify({ lastRitual: new Date().toISOString() });
                     return '{}';
                 });
                 
                 const kernelSpy = jest.spyOn(commands, 'kernel').mockImplementation();
                 
                 await commands.chat(['promover regras aplicar']);
                 expect(kernelSpy).toHaveBeenCalledWith(['rules', '--promote', '--apply']);
                 kernelSpy.mockRestore();
            });

             test('should handle compiled subcommand with no files', async () => {
                 fs.existsSync.mockReturnValue(true);
                 fs.readdirSync.mockReturnValue([]); // No files
                 fs.readFileSync.mockImplementation(() => '{}'); // Mock configs
                 
                 await commands.kernel(['compiled']);
                 
                 expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Nenhum arquivo compilado encontrado'));
            });
        });
    });
});
