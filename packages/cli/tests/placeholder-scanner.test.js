const fs = require('fs');
const path = require('path');
const { scanDirectory, scanFile, main } = require('../modules/docs/tools/placeholder-scanner');

jest.mock('fs');

describe('Placeholder Scanner', () => {
  let originalArgv;
  let originalExit;
  let mockExit;

  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
    originalArgv = process.argv;
    originalExit = process.exit;
    mockExit = jest.fn();
    process.exit = mockExit;
  });

  afterEach(() => {
    process.argv = originalArgv;
    process.exit = originalExit;
  });

  describe('main', () => {
    test('should exit 0 if no placeholders found', () => {
      process.argv = ['node', 'script.js', '/clean/dir'];
      
      // Mock scanDirectory to return empty object
      // Note: Since scanDirectory is in the same module, we can't mock it easily if it's called internally.
      // But main calls scanDirectory.
      // We can mock fs to ensure scanDirectory returns empty.
      fs.readdirSync.mockReturnValue([]);
      
      main();
      
      expect(mockExit).toHaveBeenCalledWith(0);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('No placeholders found'));
    });

    test('should use default directory when none provided', () => {
      process.argv = ['node', 'script.js'];
      fs.readdirSync.mockReturnValue([]);

      main();

      expect(mockExit).toHaveBeenCalledWith(0);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Scanning for placeholders'));
    });

    test('should exit 1 if placeholders found', () => {
      process.argv = ['node', 'script.js', '/dirty/dir'];
      
      // Mock fs to simulate finding placeholders
      fs.readdirSync.mockReturnValue(['file.md']);
      fs.statSync.mockReturnValue({ isDirectory: () => false, isFile: () => true });
      fs.readFileSync.mockReturnValue('Content with [Nome]');
      
      // path.join/resolve are real, assuming they work
      
      main();
      
      expect(mockExit).toHaveBeenCalledWith(1);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Found potential placeholders'));
    });
  });


  describe('scanFile', () => {
    test('should detect placeholders in file content', () => {
      const content = 'This is a test with [Nome] and [Descrição].';
      fs.readFileSync.mockReturnValue(content);
      
      const result = scanFile('/path/to/file.md');
      
      expect(result).toHaveLength(2);
      expect(result[0].content).toContain('test with [Nome]');
      expect(result[1].content).toContain('and [Descrição]');
    });

    test('should return empty array if no placeholders found', () => {
      const content = 'Clean content without placeholders.';
      fs.readFileSync.mockReturnValue(content);
      
      const result = scanFile('/path/to/clean.md');
      
      expect(result).toHaveLength(0);
    });

    test('should handle read errors gracefully', () => {
      fs.readFileSync.mockImplementation(() => {
        throw new Error('Read error');
      });
      
      const result = scanFile('/path/to/error.md');
      
      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });

    test('should detect multiline comments placeholders', () => {
        const content = '<!-- Instrução: faça isso -->';
        fs.readFileSync.mockReturnValue(content);
        
        const result = scanFile('/path/to/comment.md');
        expect(result).toHaveLength(1);
    });
  });

  describe('scanDirectory', () => {
    test('should recursively scan directories', () => {
      // Mock file system structure
      // /root
      //   - file1.md (has placeholder)
      //   - subdir
      //     - file2.md (clean)
      
      // path.join.mockImplementation((dir, file) => `${dir}/${file}`);
      
      // First call for root
      fs.readdirSync.mockReturnValueOnce(['file1.md', 'subdir']);
      
      // Stat calls
      fs.statSync.mockImplementation((p) => ({
        isDirectory: () => p === '/root/subdir' || p === 'subdir',
        isFile: () => p !== '/root/subdir' && p !== 'subdir'
      }));

      // Second call for subdir
      fs.readdirSync.mockReturnValueOnce(['file2.md']);

      // Read file contents
      fs.readFileSync.mockImplementation((p) => {
        if (p.endsWith('file1.md')) return 'Content with [TODO]'; // [TODO] isn't in default list, let's use [Nome]
        if (p.endsWith('file1.md')) return 'Content with [Nome]';
        if (p.endsWith('file2.md')) return 'Clean content';
        return '';
      });

      // We need to ensure scanFile is called or mock the logic within scanDirectory if it calls scanFile directly.
      // Looking at the implementation implies it might call scanFile.
      // Since we are unit testing the module, and scanFile is exported from the same module, 
      // typically internal calls are hard to mock without rewiring. 
      // However, we can just rely on the real scanFile logic since we tested it above.
      
      // Let's refine the mock to return specific content for specific files
      fs.readFileSync.mockImplementation((p) => {
          if (p.includes('file1.md')) return 'Content with [Nome]';
          return 'Clean content';
      });

      const results = scanDirectory('/root');
      
      expect(results['/root/file1.md']).toBeDefined();
      expect(results['/root/file1.md']).toHaveLength(1);
      expect(results['/root/subdir/file2.md']).toBeUndefined();
    });

    test('should handle directory access errors', () => {
      fs.readdirSync.mockImplementation(() => {
        throw new Error('Access denied');
      });
      
      const results = scanDirectory('/root/protected');
      
      expect(results).toEqual({});
      expect(console.error).toHaveBeenCalled();
    });
    
    test('should ignore node_modules and .git', () => {
         // path.join.mockImplementation((dir, file) => `${dir}/${file}`);
         fs.readdirSync.mockReturnValue(['node_modules', '.git', 'valid.md']);
         fs.statSync.mockImplementation((p) => ({
            isDirectory: () => p.includes('node_modules') || p.includes('.git'),
            isFile: () => p.includes('valid.md')
         }));
         fs.readFileSync.mockReturnValue('clean');
         
         scanDirectory('/root');
         
         // Should not try to read dir content of ignored dirs
         // Since readdirSync was called only once (for root), it means it didn't recurse
         expect(fs.readdirSync).toHaveBeenCalledTimes(1);
    });

    test('should skip non-md files', () => {
      fs.readdirSync.mockReturnValue(['notes.txt']);
      fs.statSync.mockReturnValue({ isDirectory: () => false, isFile: () => true });

      const result = scanDirectory('/root');

      expect(result).toEqual({});
      expect(fs.readFileSync).not.toHaveBeenCalled();
    });
  });
});
