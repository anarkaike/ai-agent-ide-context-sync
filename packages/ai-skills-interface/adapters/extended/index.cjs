const fs = require('fs');
const path = require('path');

// Carregar todos os adaptadores estendidos
const adapters = {};

const adapterFiles = fs.readdirSync(__dirname).filter(file => 
  file.endsWith('.cjs') && file !== 'index.cjs'
);

for (const file of adapterFiles) {
  const adapterName = path.basename(file, '.cjs');
  adapters[adapterName] = require(path.join(__dirname, file));
}

module.exports = {
  adapters,
  getAdapter: (name) => adapters[name],
  listAdapters: () => Object.keys(adapters).map(key => ({
    name: key,
    displayName: adapters[key].displayName,
    description: adapters[key].description,
    capabilities: adapters[key].capabilities
  }))
};
