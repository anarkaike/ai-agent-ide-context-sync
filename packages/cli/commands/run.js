const WorkflowManager = require('../workflows/workflow-manager');

const log = (msg) => console.log(msg);

module.exports = async (args) => {
    if (!WorkflowManager) {
        log('❌ Módulo WorkflowManager não encontrado.');
        return;
    }

    const workflowId = args[0];
    if (!workflowId) {
        log('❌ Informe o nome do workflow. Ex: ai-doc run create-component');
        try {
            const manager = new WorkflowManager(process.cwd());
            const list = manager.listWorkflows();
            if (list.length > 0) {
                log('\nWorkflows disponíveis:');
                list.forEach(w => log(`  - ${w.id}: ${w.description || 'Sem descrição'}`));
            }
        } catch (e) { }
        return;
    }

    // Parse params (key=value)
    const params = {};
    args.slice(1).forEach(arg => {
        const [key, value] = arg.split('=');
        if (key && value) params[key] = value;
    });

    try {
        const manager = new WorkflowManager(process.cwd());
        await manager.runWorkflow(workflowId, params);
    } catch (e) {
        log(`❌ Erro ao executar workflow: ${e.message}`);
    }
};
