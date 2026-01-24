const WorkflowManager = require('../workflows/workflow-manager');

const log = (msg) => console.log(msg);

module.exports = async (args) => {
    if (!WorkflowManager) {
        if (args.includes('--json')) {
            console.log(JSON.stringify([]));
        } else {
            log('❌ Módulo WorkflowManager não encontrado.');
        }
        return;
    }

    try {
        const manager = new WorkflowManager(process.cwd());
        const list = manager.listWorkflows();
        const isJson = args.includes('--json');

        if (isJson) {
            console.log(JSON.stringify(list, null, 2));
            return;
        }

        if (list.length > 0) {
            log('\nWorkflows disponíveis:');
            list.forEach(w => {
                const sourceIcon = w.source === 'global' ? '🌍' : '📁';
                log(`  ${sourceIcon} ${w.id}: ${w.description || 'Sem descrição'}`);
                if (w.params && w.params.length > 0) {
                    log(`     Params: ${w.params.map(p => p.name).join(', ')}`);
                }
            });
        } else {
            log('Nenhum workflow encontrado.');
        }
    } catch (e) {
        if (args.includes('--json')) {
            console.log(JSON.stringify({ error: e.message }));
        } else {
            log(`❌ Erro ao listar workflows: ${e.message}`);
        }
    }
};
