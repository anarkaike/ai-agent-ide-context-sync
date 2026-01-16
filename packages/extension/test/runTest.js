const path = require('path');

module.exports = {
    testRunner: path.join(__dirname, './testRunner.js'),
    testMatch: ['**/test/**/*.test.js'],
    extensionDevelopmentPath: path.resolve(__dirname, '../'),
    extensionTestsPath: path.resolve(__dirname, './extension.test.js'),
    launchArgs: [
        '--disable-extensions',
        '--disable-gpu'
    ]
};
