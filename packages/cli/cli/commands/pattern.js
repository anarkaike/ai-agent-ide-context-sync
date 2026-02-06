const PatternLibrary = require('../../core/memory/PatternLibrary');

const getLib = () => new PatternLibrary();

const parseArgs = (args) => {
    const params = {
        role: null,
        title: null,
        problem: null,
        solution: null,
        tags: [],
        query: null
    };

    let currentKey = null;
    
    // Join all args to handle quoted strings properly if they were split by shell
    // But since we receive an array, let's try to parse flags
    
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith('--')) {
            const key = arg.substring(2);
            if (key === 'tags') {
                // tags might be comma separated or next arg
                if (args[i+1] && !args[i+1].startsWith('--')) {
                    params.tags = args[i+1].split(',').map(t => t.trim());
                    i++;
                }
            } else if (Object.keys(params).includes(key)) {
                if (args[i+1] && !args[i+1].startsWith('--')) {
                    params[key] = args[i+1];
                    i++;
                } else {
                    // flag without value?
                    params[key] = true;
                }
            }
        }
    }
    
    // Fallback for simple "search <role> <query>" if no flags
    if (!params.role && args.length >= 1 && !args[0].startsWith('--')) {
        // Maybe implementation specific, but let's stick to flags for clarity
    }

    return params;
};

const learn = async (args) => {
    const params = parseArgs(args);
    
    if (!params.role || !params.title || !params.solution) {
        console.log("❌ Usage: ai-doc pattern learn --role <role> --title <title> --solution <solution> [--problem <prob>] [--tags <t1,t2>]");
        return;
    }

    const lib = getLib();
    const pattern = lib.learn(params.role, {
        title: params.title,
        solution: params.solution,
        problem: params.problem,
        tags: params.tags,
        author: 'cli-user' // TODO: Get current agent ID if available
    });

    console.log(`✅ Pattern learned for role [${params.role}]!`);
    console.log(`   ID: ${pattern.id}`);
    console.log(`   Title: ${pattern.title}`);
};

const list = async (args) => {
    const params = parseArgs(args);
    
    if (!params.role) {
        console.log("❌ Usage: ai-doc pattern list --role <role> [--tags <t1,t2>]");
        return;
    }

    const lib = getLib();
    const patterns = lib.recall(params.role, { tags: params.tags });

    if (patterns.length === 0) {
        console.log(`Output: No patterns found for role [${params.role}].`);
        return;
    }

    console.log(`📚 Patterns for [${params.role}] (${patterns.length}):`);
    patterns.forEach(p => {
        console.log(`\n   🔹 [${p.id}] ${p.title}`);
        if (p.problem) console.log(`      Problem: ${p.problem}`);
        console.log(`      Solution: ${p.solution.substring(0, 100)}${p.solution.length > 100 ? '...' : ''}`);
        if (p.tags.length) console.log(`      Tags: ${p.tags.join(', ')}`);
        console.log(`      Used: ${p.usageCount || 0} times`);
    });
};

const search = async (args) => {
    const params = parseArgs(args);
    
    if (!params.role || !params.query) {
        console.log("❌ Usage: ai-doc pattern search --role <role> --query <text>");
        return;
    }

    const lib = getLib();
    const patterns = lib.recall(params.role, { query: params.query });

    console.log(`🔍 Search results for "${params.query}" in [${params.role}]:`);
    patterns.forEach(p => {
        console.log(`   - ${p.title} (ID: ${p.id})`);
    });
};

module.exports = {
    learn,
    list,
    search
};
