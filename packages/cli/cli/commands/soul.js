const VaultManager = require('../../core/ethereum_bridge/VaultManager');
const SBT = require('../../core/ethereum_bridge/SBT');

module.exports = async (args) => {
    const subcommand = args[0];
    const vault = new VaultManager();
    
    if (subcommand === 'mint') {
        // format: ai-doc soul mint "Title" --type="ACHIEVEMENT" --desc="Description"
        const title = args[1];
        if (!title || title.startsWith('--')) {
            console.error('❌ Title required');
            return;
        }

        const typeArg = args.find(a => a.startsWith('--type='));
        const descArg = args.find(a => a.startsWith('--desc='));

        const type = typeArg ? typeArg.split('=')[1] : 'ACHIEVEMENT';
        const description = descArg ? descArg.split('=')[1] : 'Manual Mint';

        const sbt = new SBT({
            title,
            description,
            type,
            issuer: { project_id: 'CLI' },
            recipient: { persona_hash: 'self' }
        });

        const result = vault.storeSBT(sbt);
        
        if (result.success) {
            console.log(`✨ SBT Minted: ${title} [${type}]`);
            console.log(`ID: ${sbt.id}`);
        } else {
            console.error(`❌ Mint failed: ${result.message}`);
        }

    } else if (subcommand === 'list' || subcommand === 'resonate') {
        // resonate is the fancy name for list/sync in the UI
        const sbts = vault.listSBTs();
        
        if (args.includes('--json')) {
            console.log(JSON.stringify(sbts, null, 2));
        } else {
            if (sbts.length === 0) {
                console.log('📭 Soul Vault is empty.');
            } else {
                sbts.forEach(sbt => {
                    console.log(`- [${sbt.type}] ${sbt.title} (${sbt.timestamp})`);
                });
            }
        }
    } else {
        console.log('Unknown soul command. Use: mint, list, or resonate');
    }
};
