module.exports = {
    testEnvironment: 'node',
    verbose: true,
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov'],
    collectCoverageFrom: [
        '<rootDir>/core/**/*.js',
        '<rootDir>/cli/**/*.js',
        '<rootDir>/commands/**/*.js',
        '<rootDir>/heuristics/**/*.js',
        '<rootDir>/indexing/**/*.js',
        '<rootDir>/parsers/**/*.js',
        '<rootDir>/workflows/**/*.js',
        '<rootDir>/evolution/**/*.js',
        '<rootDir>/modules/**/*.js',
        '!**/node_modules/**',
        '!**/tests/**',
        '!**/coverage/**'
    ]
};
