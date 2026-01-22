const MentionParser = require('../parsers/mention-parser');
const fs = require('fs');
const path = require('path');

jest.mock('fs');
jest.mock('path', () => {
    const original = jest.requireActual('path');
    return {
        ...original,
        resolve: jest.fn(),
    };
});

describe('MentionParser', () => {
    let parser;
    const mockProjectRoot = '/mock/root';

    beforeEach(() => {
        jest.clearAllMocks();
        parser = new MentionParser(mockProjectRoot);
        // Default behavior for path.resolve mock
        path.resolve.mockImplementation((...args) => args.join('/'));
    });

    test('should initialize with project root', () => {
        expect(parser.projectRoot).toBe(mockProjectRoot);
    });

    test('should use process.cwd() if no root provided', () => {
        const cwdSpy = jest.spyOn(process, 'cwd').mockReturnValue('/cwd');
        const p = new MentionParser();
        expect(p.projectRoot).toBe('/cwd');
        cwdSpy.mockRestore();
    });

    test('should return empty object for empty text', () => {
        const result = parser.parse('');
        expect(result.files).toHaveLength(0);
        expect(result.folders).toHaveLength(0);
        expect(result.rules).toHaveLength(0);
        expect(result.raw).toHaveLength(0);
    });

    test('should return empty object for null text', () => {
        const result = parser.parse(null);
        expect(result.files).toHaveLength(0);
    });

    test('should identify folders ending with /', () => {
        const text = 'Check @src/utils/';
        path.resolve.mockReturnValue('/mock/root/src/utils/');
        
        const result = parser.parse(text);
        
        expect(result.folders).toContain('src/utils/');
        expect(result.raw).toContain('@src/utils/');
    });

    test('should identify folders via fs check', () => {
        const text = 'Check @src/utils';
        path.resolve.mockReturnValue('/mock/root/src/utils');
        fs.existsSync.mockReturnValue(true);
        fs.statSync.mockReturnValue({ isDirectory: () => true, isFile: () => false });

        const result = parser.parse(text);
        
        expect(result.folders).toContain('src/utils');
    });

    test('should identify files via fs check', () => {
        const text = 'Read @src/index.js';
        path.resolve.mockReturnValue('/mock/root/src/index.js');
        fs.existsSync.mockReturnValue(true);
        fs.statSync.mockReturnValue({ isDirectory: () => false, isFile: () => true });

        const result = parser.parse(text);
        
        expect(result.files).toContain('src/index.js');
    });

    test('should default to rules if not file/folder', () => {
        const text = 'Use @clean-code';
        path.resolve.mockReturnValue('/mock/root/clean-code');
        fs.existsSync.mockReturnValue(false);

        const result = parser.parse(text);
        
        expect(result.rules).toContain('clean-code');
    });

    test('should handle multiple mentions', () => {
        const text = 'Check @src/ @file.js and @rule';
        
        // Mock specific paths
        path.resolve.mockImplementation((root, token) => {
            if (token === 'src/') return '/mock/root/src/';
            if (token === 'file.js') return '/mock/root/file.js';
            return '/mock/root/rule';
        });

        // Mock fs behavior
        fs.existsSync.mockImplementation(p => p.includes('file.js'));
        fs.statSync.mockImplementation(p => ({
            isFile: () => p.includes('file.js'),
            isDirectory: () => false
        }));

        const result = parser.parse(text);
        
        expect(result.folders).toContain('src/');
        expect(result.files).toContain('file.js');
        expect(result.rules).toContain('rule');
        expect(result.raw).toHaveLength(3);
    });
});
