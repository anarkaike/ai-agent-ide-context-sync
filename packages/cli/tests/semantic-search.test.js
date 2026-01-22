const SemanticSearch = require('../indexing/semantic-search');
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

// Mock EmbeddingsGenerator
jest.mock('../indexing/embeddings', () => {
    return class MockEmbeddings {
        constructor() {}
        processFile() { return Promise.resolve(null); }
        generateEmbedding() { return Promise.resolve([0.1]); }
    };
});

describe('SemanticSearch', () => {
    let search;
    const mockProjectRoot = '/mock/root';

    beforeEach(() => {
        jest.clearAllMocks();
        path.join.mockReturnValue('/mock/path');
        path.dirname.mockReturnValue('/mock/dir');
        fs.existsSync.mockReturnValue(false);
        fs.writeFileSync.mockImplementation(() => {});
        fs.mkdirSync.mockImplementation(() => {});
    });

    test('should initialize and load index', () => {
        search = new SemanticSearch(mockProjectRoot);
        expect(search.index).toEqual({ files: [] });
    });

    test('should use process.cwd() if no projectRoot provided', () => {
        const search = new SemanticSearch();
        expect(search.projectRoot).toBe(process.cwd());
    });

    test('loadIndex should handle corrupt file', () => {
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockReturnValue('invalid json');
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        
        search = new SemanticSearch(mockProjectRoot);
        
        expect(search.index).toEqual({ files: [] });
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Erro ao carregar índice'));
    });

    test('saveIndex should create dir and write file', () => {
        search = new SemanticSearch(mockProjectRoot);
        fs.existsSync.mockReturnValue(false);
        
        search.saveIndex();
        
        expect(fs.mkdirSync).toHaveBeenCalled();
        expect(fs.writeFileSync).toHaveBeenCalled();
    });

    test('saveIndex should not create dir if it exists', () => {
        search = new SemanticSearch(mockProjectRoot);
        // First call is loadIndex (not important here)
        // We care about saveIndex calls
        
        // Setup mocks for saveIndex
        // The code checks path.dirname(indexPath)
        // fs.existsSync is called for that dir
        fs.existsSync.mockReturnValue(true); 
        
        search.saveIndex();
        
        expect(fs.mkdirSync).not.toHaveBeenCalled();
        expect(fs.writeFileSync).toHaveBeenCalled();
    });

    test('saveIndex should handle write error (implied coverage)', () => {
        search = new SemanticSearch(mockProjectRoot);
        fs.writeFileSync.mockImplementation(() => { throw new Error('Write failed'); });
        
        // The code doesn't catch write errors, so it should throw
        expect(() => search.saveIndex()).toThrow('Write failed');
    });

    test('search should return sorted results', async () => {
        search = new SemanticSearch(mockProjectRoot);
        search.index.files = [
            { path: 'a.txt', vector: [0.9] },
            { path: 'b.txt', vector: [0.1] }
        ];
        
        const results = await search.search('query');
        
        expect(results[0].path).toBe('a.txt');
        expect(results[1].path).toBe('b.txt');
    });

    test('indexFile should add file to index if processed', async () => {
        search = new SemanticSearch(mockProjectRoot);
        const mockEntry = { path: 'test.txt', vector: [0.1] };
        
        // Mock generator.processFile
        search.generator.processFile = jest.fn().mockResolvedValue(mockEntry);
        
        // Spy on saveIndex
        jest.spyOn(search, 'saveIndex');
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        // Use a path that resolves relatively
        const filePath = path.join(mockProjectRoot, 'test.txt');
        // We need to ensure path.relative works or mock it. 
        // Since path is mocked partially, relative is real.
        // But path.join is mocked! So path.join returns /mock/path.
        // Wait, checking mock factory...
        // path.join returns mocked value? No, I see path.join.mockReturnValue('/mock/path') in beforeEach.
        // This makes path.join return a fixed string.
        
        // Ideally we should mock path.relative too to be safe/consistent
        const originalRelative = path.relative;
        path.relative = jest.fn().mockReturnValue('test.txt');

        const result = await search.indexFile(filePath);

        expect(result).toBe(true);
        expect(search.index.files).toHaveLength(1);
        expect(search.index.files[0]).toEqual(mockEntry);
        expect(search.saveIndex).toHaveBeenCalled();
        
        // Restore
        path.relative = originalRelative;
        consoleSpy.mockRestore();
    });

    test('indexFile should return false if processing fails', async () => {
        search = new SemanticSearch(mockProjectRoot);
        search.generator.processFile = jest.fn().mockResolvedValue(null);
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        
        const result = await search.indexFile('/path/to/file');
        
        expect(result).toBe(false);
        expect(search.index.files).toHaveLength(0);
        consoleSpy.mockRestore();
    });

    test('indexFile should replace existing entry', async () => {
        search = new SemanticSearch(mockProjectRoot);
        const oldEntry = { path: 'test.txt', vector: [0.0] };
        search.index.files = [oldEntry];
        
        const newEntry = { path: 'test.txt', vector: [1.0] };
        search.generator.processFile = jest.fn().mockResolvedValue(newEntry);
        
        const originalRelative = path.relative;
        path.relative = jest.fn().mockReturnValue('test.txt');
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        
        await search.indexFile('/path/to/file');
        
        expect(search.index.files).toHaveLength(1);
        expect(search.index.files[0].vector).toEqual([1.0]);
        
        path.relative = originalRelative;
        consoleSpy.mockRestore();
    });
});
