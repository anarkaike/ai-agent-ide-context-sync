module.exports = {
    testEnvironment: 'node',
    verbose: true,
    roots: ['<rootDir>/tests'],
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov']
};
