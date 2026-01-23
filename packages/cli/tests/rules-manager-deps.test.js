const fs = require('fs');
const path = require('path');

jest.mock('fs');
jest.mock('js-yaml');
jest.mock('../core/rules-manager', () => jest.requireActual('../core/rules-manager'));

// Mock embeddings to throw error on require or usage
jest.mock('../indexing/embeddings', () => {
  throw new Error('Embeddings module missing or failed');
}, { virtual: true });

describe('RulesManager Dependency Failures', () => {
  let consoleWarnSpy;
  const projectRoot = '/mock/project';

  beforeEach(() => {
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  test('initSemanticSearch should handle missing embeddings module', async () => {
    jest.resetModules();
    // Mock console.warn
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    // Mock module to throw on require
    jest.doMock('../indexing/embeddings', () => {
      throw new Error('Module not found');
    }, { virtual: true });

    // Re-require RulesManager to use the mocked dependency
    const RulesManager = require('../core/rules-manager');
    const manager = new RulesManager(projectRoot);
    
    await manager.initSemanticSearch();
    
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Busca semântica não disponível'));
  });
});
