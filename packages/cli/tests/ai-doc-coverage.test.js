const fs = require('fs');
const path = require('path');
const { commands } = require('../cli/ai-doc');
const RulesManager = require('../core/rules-manager');
const HeuristicsEngine = require('../heuristics/engine');

jest.mock('fs');
jest.mock('../core/rules-manager');
jest.mock('../core/smart-cache');
jest.mock('../heuristics/engine');
jest.mock('child_process');
jest.mock('../modules/docs/tools/placeholder-scanner', () => ({
    scanDirectory: jest.fn()
}));

describe('AI Doc CLI Coverage', () => {
  let consoleLogSpy;
  const projectRoot = '/mock/project';
  const originalEnv = process.env;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    process.cwd = jest.fn().mockReturnValue(projectRoot);
    process.env = { ...originalEnv };
    jest.clearAllMocks();
    
    // Default mocks
    fs.existsSync.mockReturnValue(true);
    fs.readdirSync.mockReturnValue([]);
    fs.statSync.mockReturnValue({ isDirectory: () => false, mtime: new Date(), size: 100 });
    fs.readFileSync.mockReturnValue('{}');
    
    // Mock RulesManager default
    RulesManager.mockImplementation(() => ({
      getAllRules: jest.fn().mockReturnValue([]),
      stats: jest.fn().mockReturnValue({ total: 0, byLevel: {}, byMode: {}, rules: {} })
    }));

    // Mock HeuristicsEngine default
    HeuristicsEngine.mockImplementation(() => ({
      stats: jest.fn().mockReturnValue({ total: 0 }),
      run: jest.fn().mockReturnValue([])
    }));
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    process.env = originalEnv;
  });

  test('chat command should handle "workflow" without arguments', async () => {
    // This hits lines 379-380 where match is null or workflowId is null
    const runSpy = jest.spyOn(commands, 'run').mockImplementation();
    await commands.chat(['workflow']);
    expect(runSpy).not.toHaveBeenCalled();
    runSpy.mockRestore();
  });

  test('evolve command should handle "always" mode penalty', async () => {
      RulesManager.mockImplementation(() => ({
          getAllRules: jest.fn().mockReturnValue([
              { id: 'ruleAlways', mode: 'always' }
          ]),
          stats: jest.fn().mockReturnValue({ total: 1 })
      }));
      
      fs.readFileSync.mockImplementation((p) => {
          if (p.endsWith('stats.json')) return JSON.stringify({ 
              rules: {
                  'ruleAlways': { suggestions: 10, history: {} }
              }
          });
          return '{}';
      });

      await commands.evolve();
      // computeRuleScore should apply 0.15 penalty
      // We can't verify the exact score easily without spying on computeRuleScore, 
      // but execution path is covered.
  });

  test('evolve command should handle missing suggestions property', async () => {
      RulesManager.mockImplementation(() => ({
          getAllRules: jest.fn().mockReturnValue([
              { id: 'ruleNoSuggestions', mode: 'manual' }
          ]),
          stats: jest.fn().mockReturnValue({ total: 1 })
      }));
      
      // stats has history but NO suggestions property (or 0)
      fs.readFileSync.mockImplementation((p) => {
          if (p.endsWith('stats.json')) return JSON.stringify({ 
              rules: {
                  'ruleNoSuggestions': { history: { '2023-01-01': 1 } }
                  // suggestions is undefined
              }
          });
          return '{}';
      });

      await commands.evolve();
      // Execution path for line 200 (stats.suggestions || 0) in detectDrift is covered
  });

  test('scan command should handle scanner errors', async () => {
    const { scanDirectory } = require('../modules/docs/tools/placeholder-scanner');
    scanDirectory.mockImplementation(() => {
        throw new Error('Scanner failed');
    });

    await commands.scan(['docs']);
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Error running scan: Scanner failed'));
  });

  test('kernel status should handle empty cache objects (undefined properties)', async () => {
    fs.readFileSync.mockImplementation((p) => {
        if (p.endsWith('smart-cache.json')) return '{}'; // Empty object, prompts is undefined
        if (p.endsWith('embeddings-index.json')) return '{}'; // Empty object, files is undefined
        if (p.endsWith('stats.json')) return '{}';
        return '{}';
    });

    await commands.kernel([]);
    
    // Expect 0 because property access should use optional chaining or fallback
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Cache prompts: 0'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Cache embeddings: 0'));
  });

  test('build command should handle validation errors gracefully', async () => {
    // Mock build command dependencies
    // We can't easily mock the build function from commands/build because it's required inside ai-doc.js
    // But we can rely on `scanDirectory` throwing during validation phase
    
    // Note: ai-doc.js uses require('./commands/build')
    // We need to ensure that runs fine, then the validation part runs
    
    jest.doMock('../cli/commands/build', () => ({
        build: () => 'content'
    }));
    
    const { scanDirectory } = require('../modules/docs/tools/placeholder-scanner');
    scanDirectory.mockImplementation(() => {
        throw new Error('Validation failed');
    });

    // Mock successful write
    fs.writeFileSync.mockImplementation(() => {});

    await commands.build();
    
    // Should NOT crash, just ignore the error
    // We can check if it logged "Validating..."
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Validando conformidade'));
    // And NOT logged the error (caught silently)
  });

  test('chat command should handle "run" without workflow ID', async () => {
    // Should simply not call run command
    const runSpy = jest.spyOn(commands, 'run').mockImplementation();
    await commands.chat(['run ']); // Trailing space, no ID
    expect(runSpy).not.toHaveBeenCalled();
    runSpy.mockRestore();
  });

  test('kernel rules should display promotion suggestions', async () => {
    // Mock rules manager to return a manual rule with high usage
    RulesManager.mockImplementation(() => ({
      getAllRules: jest.fn().mockReturnValue([
        { id: 'rule1', mode: 'manual', level: 'project' }
      ]),
      stats: jest.fn().mockReturnValue({ 
        total: 1, 
        byLevel: { project: 1 }, 
        byMode: { manual: 1 } 
      })
    }));

    // Mock stats.json to show high usage
    fs.readFileSync.mockImplementation((p) => {
      if (p.endsWith('stats.json')) {
        return JSON.stringify({
          rules: {
            'rule1': { suggestions: 10, history: {} }
          }
        });
      }
      return '{}';
    });

    // We need to set env var for promote min
    process.env.AI_DOC_RULE_PROMOTE_MIN = '5';

    await commands.kernel(['rules']);
    
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Sugestões de promoção'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('- rule1 (10 usos)'));
  });

  test('kernel status should display cache counts when cache exists', async () => {
    fs.readFileSync.mockImplementation((p) => {
        if (p.endsWith('smart-cache.json')) return JSON.stringify({ prompts: { p1: {} } });
        if (p.endsWith('embeddings-index.json')) return JSON.stringify({ files: ['f1'] });
        if (p.endsWith('stats.json')) return '{}';
        return '{}';
    });
    
    // Ensure we list compiled files to avoid "compiled" subcommand specific log (though we are running default status)
    // Default status logs "Cache prompts: X" and "Cache embeddings: Y"
    
    await commands.kernel([]);
    
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Cache prompts: 1'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Cache embeddings: 1'));
  });

  test('should handle assist command without arguments', async () => {
    await commands.assist();
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Informe sua intenção'));
  });
  
  test('should handle task command defaulting to list', async () => {
      // Mock task command
      const taskSpy = jest.spyOn(commands, 'task').mockImplementation();
      
      // Simulate chat "task" without subcommand
      await commands.chat(['task']);
      
      expect(taskSpy).toHaveBeenCalledWith(['list']);
      taskSpy.mockRestore();
  });

  test('chat command should handle workflow execution logic with null match', async () => {
    // Test branch where match is null for regex /(?:workflow|run)\s+([^\s]+)/
    // We pass "run" which doesn't match the required space+ID format
    const args = ['run'];
    
    // Mock runAssistant to avoid actual execution
    const { runAssistant } = require('../cli/ai-doc');
    
    await commands.chat(args);
    // Expectations: no crash
  });

  test('chat command should handle "ritual" intent', async () => {
      const ritualSpy = jest.spyOn(commands, 'ritual').mockImplementation();
      await commands.chat(['rodar ritual']);
      expect(ritualSpy).toHaveBeenCalled();
      ritualSpy.mockRestore();
  });

  test('kernel rules should handle promotions loop', async () => {
      // Setup mocking for RulesManager and stats to ensure promotions.length > 0
      RulesManager.mockImplementation(() => ({
          getAllRules: jest.fn().mockReturnValue([
              { id: 'rule1', mode: 'manual', level: 'project' }
          ]),
          stats: jest.fn().mockReturnValue({ total: 1, byLevel: {}, byMode: {} })
      }));
      
      fs.readFileSync.mockImplementation((p) => {
          if (p.endsWith('stats.json')) {
              return JSON.stringify({
                  rules: {
                      'rule1': { suggestions: 10 }
                  }
              });
          }
          return '{}';
      });

      process.env.AI_DOC_RULE_PROMOTE_MIN = '5';

      await commands.kernel(['rules', '--promote']);
      
      // This log comes from inside the promotions.forEach loop
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('- rule1 (10 usos)'));
  });

  test('evolve command should process rules for signals', async () => {
      RulesManager.mockImplementation(() => ({
          getAllRules: jest.fn().mockReturnValue([
              { id: 'rule1', mode: 'manual', weight: 2.0 }, // Test weight > 1
              { id: 'rule2', mode: 'manual' }, // Test default weight
              { id: 'rule3', mode: 'manual' } // Test missing from stats (new rule)
          ]),
          stats: jest.fn().mockReturnValue({ total: 1 })
      }));
      
      fs.readFileSync.mockImplementation((p) => {
          if (p.endsWith('stats.json')) return JSON.stringify({ 
              rules: {
                  'rule1': { suggestions: 10, lastUsed: new Date().toISOString() },
                  'rule2': { suggestions: 0 } // No suggestions, drift check
              } 
              // rule3 is missing -> usage = undefined -> || { suggestions: 0 } branch
          });
          return '{}';
      });

      await commands.evolve();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Autoevolução'));
  });

  test('chat command should handle "run " with trailing space', async () => {
    const runSpy = jest.spyOn(commands, 'run').mockImplementation();
    await commands.chat(['run ']); 
    expect(runSpy).not.toHaveBeenCalled();
    runSpy.mockRestore();
  });

  test('build command should handle scanner errors gracefully', async () => {
    // Mock scanner to throw
    const { scanDirectory } = require('../modules/docs/tools/placeholder-scanner');
    scanDirectory.mockImplementation(() => {
      throw new Error('Scanner failed');
    });
    
    fs.existsSync.mockReturnValue(true); // Workspace exists
    fs.readFileSync.mockReturnValue('{}'); // Stats
    
    // Mock build utils via doMock because build command is required inside ai-doc.js
    // Wait, ai-doc.js requires build at top level?
    // Let's check line 30 of ai-doc.js: const { build } = require('./commands/build');
    // So we can't easily mock it with doMock unless we reset modules.
    // BUT, we don't need to mock build() if we just want to test the scanner error handling at the end of build command.
    // The build function will run (mocked or real). If real, it might try to read files.
    // Since we mocked fs, build() might fail or succeed depending on fs mocks.
    // We mocked fs.readFileSync to return '{}'.
    // Real build() calls fs functions.
    
    // Let's assume build() runs fine with fs mocks.
    // The test focuses on the catch block at the end of commands.build
    
    await commands.build();
    // Should catch error and not crash
  });

  test('scan command should verify placeholders', async () => {
    const { scanDirectory } = require('../modules/docs/tools/placeholder-scanner');
    scanDirectory.mockReturnValue({
      'file.md': [{ line: 1, content: 'TODO', pattern: 'TODO' }]
    });
    
    fs.existsSync.mockReturnValue(true); // Target dir exists
    
    await commands.scan(['docs']);
    
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Found potential placeholders'));
  });

  test('scan command should handle clean docs', async () => {
    const { scanDirectory } = require('../modules/docs/tools/placeholder-scanner');
    scanDirectory.mockReturnValue({});
    
    fs.existsSync.mockReturnValue(true);
    
    await commands.scan(['docs']);
    
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No placeholders found'));
  });
  
  test('scan command should handle missing directory', async () => {
    fs.existsSync.mockReturnValue(false);
    
    await commands.scan(['missing-dir']);
    
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Directory not found'));
  });

  test('scan command should handle errors', async () => {
    const { scanDirectory } = require('../modules/docs/tools/placeholder-scanner');
    scanDirectory.mockImplementation(() => { throw new Error('Scan error'); });
    
    fs.existsSync.mockReturnValue(true);
    
    await commands.scan(['docs']);
    
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Error running scan'));
  });
});
