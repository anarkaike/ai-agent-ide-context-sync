const SemanticSearch = require('../../indexing/semantic-search');
const fs = require('fs');
const path = require('path');

const getAllFiles = (dirPath, arrayOfFiles = []) => {
    if (!fs.existsSync(dirPath)) return arrayOfFiles;
    
    const files = fs.readdirSync(dirPath);

    files.forEach(file => {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (['node_modules', '.git', '.ai-workspace', 'dist', 'build', 'coverage'].includes(file)) return;
            getAllFiles(fullPath, arrayOfFiles);
        } else {
            if (file.match(/\.(md|txt|js|ts|jsx|tsx|json)$/)) {
                arrayOfFiles.push(fullPath);
            }
        }
    });

    return arrayOfFiles;
};

const index = async (args) => {
    const projectRoot = process.cwd();
    const semanticSearch = new SemanticSearch(projectRoot);
    
    let targetPath = args[0] || '.';
    targetPath = path.resolve(projectRoot, targetPath);

    console.log(`🧠 Indexing files in: ${targetPath}`);

    const files = getAllFiles(targetPath);

    if (files.length === 0) {
        console.log('⚠️ No matching files found to index.');
        return;
    }

    console.log(`Found ${files.length} files. Generating embeddings...`);
    
    let count = 0;
    for (const file of files) {
        try {
            const success = await semanticSearch.indexFile(file);
            if (success) {
                process.stdout.write('.');
                count++;
            }
        } catch (e) {
            // Ignore errors for individual files
        }
    }
    console.log(`\n✅ Indexed ${count} files.`);
};

const search = async (args) => {
    if (args.length === 0) {
        console.log('Usage: ai-doc memory search "<query>"');
        return;
    }
    const query = args.join(' ');
    const projectRoot = process.cwd();
    const semanticSearch = new SemanticSearch(projectRoot);

    console.log(`🔍 Searching memory for: "${query}"...`);
    
    try {
        const results = await semanticSearch.search(query, 5);
        
        if (results.length === 0) {
            console.log('❌ No relevant memories found.');
            return;
        }

        console.log('\n=== 🧠 Semantic Memory Matches ===\n');
        results.forEach((r, i) => {
            const percentage = (r.similarity * 100).toFixed(1);
            console.log(`${i+1}. [${percentage}%] ${r.path}`);
        });
        console.log('');
    } catch (e) {
        console.error('Error searching:', e.message);
    }
};

module.exports = async (args) => {
    const sub = args[0];
    const rest = args.slice(1);

    if (sub === 'index') {
        await index(rest);
    } else if (sub === 'search') {
        await search(rest);
    } else {
        console.log('Usage: ai-doc memory <index|search>');
    }
};
