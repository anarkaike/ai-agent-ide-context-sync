const fs = require('fs');
const path = require('path');

module.exports = async () => {
  try {
    const packageJsonPath = path.resolve(__dirname, '../../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    console.log(`v${packageJson.version}`);
  } catch (e) {
    console.log('Versão desconhecida (erro ao ler package.json)');
  }
};
