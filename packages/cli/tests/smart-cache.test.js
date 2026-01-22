const SmartCache = require('../core/smart-cache');
const path = require('path');
const fs = require('fs');

describe('SmartCache', () => {
    let smartCache;
    const projectRoot = '/test-project';
    const cacheDir = path.join(projectRoot, '.ai-workspace', 'cache');
    const cacheFile = path.join(cacheDir, 'smart-cache.json');

    // Spies
    let existsSyncSpy;
    let readFileSyncSpy;
    let writeFileSyncSpy;
    let mkdirSyncSpy;
    let statSyncSpy;

    beforeEach(() => {
        // Setup spies
        existsSyncSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(false);
        readFileSyncSpy = jest.spyOn(fs, 'readFileSync').mockReturnValue('{}');
        writeFileSyncSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
        mkdirSyncSpy = jest.spyOn(fs, 'mkdirSync').mockImplementation(() => {});
        statSyncSpy = jest.spyOn(fs, 'statSync').mockReturnValue({ mtimeMs: 0 });
        
        // Mock path.resolve to behave predictably if needed, but path is usually safe.
        // If SmartCache uses path.resolve(root, file), and root is '/test-project', 
        // real path.resolve might try to work with CWD if root is relative.
        // But we pass absolute root '/test-project'.
        // However, on Windows/Mac, '/test-project' might be treated differently.
        // Let's spy on path.resolve just in case, or just rely on it being pure.
        // SmartCache: this.projectRoot = projectRoot || process.cwd();
        // We pass projectRoot.
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('should initialize with empty cache if file does not exist', () => {
        smartCache = new SmartCache(projectRoot);
        expect(smartCache.cache).toEqual({ prompts: {}, files: {} });
    });

    test('should initialize with default projectRoot if not provided', () => {
        const cwdSpy = jest.spyOn(process, 'cwd').mockReturnValue(projectRoot);
        smartCache = new SmartCache();
        expect(smartCache.projectRoot).toBe(projectRoot);
        cwdSpy.mockRestore();
    });

    test('should load existing cache', () => {
        const cacheData = { prompts: { 'key': 'value' }, files: {} };
        existsSyncSpy.mockReturnValue(true);
        readFileSyncSpy.mockReturnValue(JSON.stringify(cacheData));

        smartCache = new SmartCache(projectRoot);
        expect(smartCache.cache).toEqual(cacheData);
    });

    test('should handle corrupted cache file', () => {
        existsSyncSpy.mockReturnValue(true);
        readFileSyncSpy.mockReturnValue('invalid json');

        smartCache = new SmartCache(projectRoot);
        expect(smartCache.cache).toEqual({ prompts: {}, files: {} });
    });

    test('should save cache', () => {
        smartCache = new SmartCache(projectRoot);
        smartCache.save();

        expect(mkdirSyncSpy).toHaveBeenCalledWith(cacheDir, { recursive: true });
        expect(writeFileSyncSpy).toHaveBeenCalledWith(cacheFile, expect.any(String));
    });

    test('should generate consistent key', () => {
        smartCache = new SmartCache(projectRoot);
        const key1 = smartCache.generateKey('query', ['file1', 'file2']);
        const key2 = smartCache.generateKey('query', ['file2', 'file1']); // Different order
        expect(key1).toBe(key2);
    });

    test('should set and get cached prompt', () => {
        smartCache = new SmartCache(projectRoot);
        const query = 'test query';
        const contextFiles = ['file1.js'];
        const promptContent = 'generated prompt';
        const timestamp = 1000;

        // Mock getFileTimestamp behavior via statSyncSpy
        // We need to ensure existsSync returns true for the file check in getFileTimestamp
        // But existsSync is also used for cache file loading.
        // We can use mockImplementation to switch based on path.
        
        existsSyncSpy.mockImplementation((p) => {
            if (p === cacheFile) return false;
            return true; // Files exist
        });
        statSyncSpy.mockReturnValue({ mtimeMs: timestamp });
        
        jest.spyOn(Date, 'now').mockReturnValue(2000);

        smartCache.setCachedPrompt(query, contextFiles, promptContent);

        // Verify save was called
        expect(writeFileSyncSpy).toHaveBeenCalled();

        // Retrieve
        const cached = smartCache.getCachedPrompt(query, contextFiles);
        expect(cached).toBe(promptContent);
    });

    test('should return null if cache entry is missing', () => {
        smartCache = new SmartCache(projectRoot);
        const cached = smartCache.getCachedPrompt('unknown', []);
        expect(cached).toBeNull();
    });

    test('should return null and delete entry if TTL expired', () => {
        smartCache = new SmartCache(projectRoot);
        const query = 'test';
        const contextFiles = [];
        const key = smartCache.generateKey(query, contextFiles);
        
        smartCache.cache.prompts[key] = {
            prompt: 'content',
            timestamp: 1000, // Very old
            fileSnapshots: {}
        };

        jest.spyOn(Date, 'now').mockReturnValue(1000 + 25 * 60 * 60 * 1000); // 25 hours later

        const cached = smartCache.getCachedPrompt(query, contextFiles);
        expect(cached).toBeNull();
        expect(smartCache.cache.prompts[key]).toBeUndefined();
    });

    test('should return null if file is modified', () => {
        smartCache = new SmartCache(projectRoot);
        const query = 'test';
        const contextFiles = ['file1.js'];
        const key = smartCache.generateKey(query, contextFiles);

        smartCache.cache.prompts[key] = {
            prompt: 'content',
            timestamp: Date.now(),
            fileSnapshots: { 'file1.js': 1000 }
        };

        // Mock existsSync/statSync to return different timestamp
        existsSyncSpy.mockReturnValue(true);
        statSyncSpy.mockReturnValue({ mtimeMs: 2000 });

        const cached = smartCache.getCachedPrompt(query, contextFiles);
        expect(cached).toBeNull();
    });

    test('getFileTimestamp should return mtimeMs if file exists', () => {
        smartCache = new SmartCache(projectRoot);
        existsSyncSpy.mockReturnValue(true);
        statSyncSpy.mockReturnValue({ mtimeMs: 12345 });

        const ts = smartCache.getFileTimestamp('file.js');
        expect(ts).toBe(12345);
    });

    test('getFileTimestamp should return 0 if file does not exist', () => {
        smartCache = new SmartCache(projectRoot);
        existsSyncSpy.mockReturnValue(false);

        const ts = smartCache.getFileTimestamp('file.js');
        expect(ts).toBe(0);
    });
});
