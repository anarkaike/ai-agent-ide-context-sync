const VaultManager = require('../core/ethereum_bridge/VaultManager');
const SBT = require('../core/ethereum_bridge/SBT');
const path = require('path');
const fs = require('fs');
const os = require('os');

async function validateSbt() {
    console.log("🔍 Iniciando validação de SBT...");

    try {
        const vault = new VaultManager();
        const testTitle = "SBT de Validação de Dashboard";
        
        console.log(`🛠️ Criando SBT: "${testTitle}"...`);
        
        const sbt = new SBT({
            title: testTitle,
            description: "Validação automática de integração com dashboard",
            type: "IDENTITY",
            issuer: { project_id: "ai-agent-ide-context-sync" },
            recipient: { persona_hash: "self" }
        });
        
        console.log(`💾 Armazenando SBT ID: ${sbt.id}...`);
        const result = vault.storeSBT(sbt);

        if (!result.success) {
            console.error(`❌ Falha ao armazenar SBT: ${result.message}`);
            // Se já existe, vamos considerar sucesso para fins de validação de leitura
            if (result.message !== 'SBT already exists in vault') {
                process.exit(1);
            }
        } else {
            console.log(`✅ SBT armazenado em: ${result.path}`);
        }

        // Verificar persistência no Vault Global correto
        const globalVaultDir = path.join(os.homedir(), '.ai-doc', 'ethereum_bridge', 'vault');
        const indexFile = path.join(globalVaultDir, 'index.json');
        
        console.log(`📂 Verificando índice em: ${indexFile}`);

        if (fs.existsSync(indexFile)) {
            const data = JSON.parse(fs.readFileSync(indexFile, 'utf8'));
            // Como o ID é gerado aleatoriamente no construtor se não for passado, 
            // e acabamos de criar um novo, ele deve estar lá.
            // Se falhou antes (already exists), não saberemos o ID anterior facilmente sem listar.
            // Vamos listar e procurar pelo título.
            
            const found = data.find(s => s.title === testTitle);
            
            if (found) {
                console.log("✅ SBT encontrado no Vault Global!");
                console.log(JSON.stringify(found, null, 2));
            } else {
                console.error("❌ SBT não encontrado no índice após gravação!");
                process.exit(1);
            }
        } else {
            console.error(`❌ Arquivo de índice não encontrado em: ${indexFile}`);
            process.exit(1);
        }

    } catch (error) {
        console.error("❌ Erro na validação:", error);
        process.exit(1);
    }
}

validateSbt();
