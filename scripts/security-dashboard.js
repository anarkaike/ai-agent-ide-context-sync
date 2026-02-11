#!/usr/bin/env node

/**
 * 🛡️ Security Dashboard - Interface de Verificação Humana
 * 
 * Sistema para revisão de casos suspeitos identificados pelo Security Monitor
 */

const SecurityMonitor = require('./security-monitor.js');
const path = require('path');

class SecurityDashboard {
    constructor() {
        this.workspacePath = process.cwd();
        this.monitor = new SecurityMonitor(this.workspacePath);
    }

    async showDashboard() {
        console.log('\n🛡️ AI AGENT SECURITY DASHBOARD');
        console.log('================================');
        
        // Gerar relatório completo
        const report = await this.monitor.generateSecurityReport();
        
        // Exibir resumo
        console.log('\n📊 RESUMO DE SEGURANÇA:');
        console.log(`   Status: ${this.getStatusEmoji(report.securityStatus)} ${report.securityStatus}`);
        console.log(`   Total de Agentes: ${report.summary.total_agents}`);
        console.log(`   Agentes Autorizados: ${report.summary.authorized_agents}`);
        console.log(`   Revisões Pendentes: ${report.summary.pending_reviews}`);
        
        // Monitorar Mothership
        const mothershipStatus = await this.monitor.monitorMothershipCommunication();
        console.log(`   Mothership: ${this.getStatusEmoji(mothershipStatus.status === 'OK' ? 'SECURE' : 'ATTENTION_REQUIRED')} ${mothershipStatus.message}`);
        
        // Exibir fila de verificação
        if (report.suspicionQueue.length > 0) {
            console.log('\n🚨 CASOS PENDENTES DE VERIFICAÇÃO HUMANA:');
            report.suspicionQueue.forEach((caseItem, index) => {
                console.log(`\n   ${index + 1}. Caso ID: ${caseItem.id}`);
                console.log(`      Agente: ${caseItem.agentName} (${caseItem.agentId})`);
                console.log(`      Risco: ${this.getRiskEmoji(caseItem.riskLevel)} ${caseItem.riskLevel}`);
                console.log(`      Data: ${new Date(caseItem.timestamp).toLocaleString('pt-BR')}`);
                console.log(`      Atividades Suspeitas: ${caseItem.analysis.suspiciousActivities.length}`);
                console.log(`      Anomalias: ${caseItem.analysis.anomalies.length}`);
                
                if (caseItem.analysis.recommendations.length > 0) {
                    console.log('      Recomendações:');
                    caseItem.analysis.recommendations.forEach(rec => {
                        console.log(`         • ${rec.action}: ${rec.description}`);
                    });
                }
            });
        } else {
            console.log('\n✅ Nenhum caso pendente de verificação humana');
        }
        
        // Exibir recomendações gerais
        if (report.recommendations.length > 0) {
            console.log('\n💡 RECOMENDAÇÕES GERAIS:');
            report.recommendations.forEach(rec => {
                console.log(`   • ${rec.action}: ${rec.description}`);
            });
        }
        
        // Menu de ações
        console.log('\n🔧 AÇÕES DISPONÍVEIS:');
        console.log('   1. Ver detalhes de um caso específico');
        console.log('   2. Marcar caso como revisado');
        console.log('   3. Adicionar agente à lista de autorizados');
        console.log('   4. Remover agente da lista de autorizados');
        console.log('   5. Gerar relatório detalhado');
        console.log('   6. Sair');
        
        return report;
    }

    async showCaseDetails(caseId) {
        const queue = JSON.parse(require('fs').readFileSync(
            path.join(this.workspacePath, '.ai-workspace', 'security', 'suspicion-queue.json'), 
            'utf8'
        ));
        
        const caseItem = queue.queue.find(item => item.id === caseId);
        if (!caseItem) {
            console.log(`❌ Caso ${caseId} não encontrado`);
            return;
        }
        
        console.log('\n🔍 DETALHES DO CASO:');
        console.log('==================');
        console.log(`ID: ${caseItem.id}`);
        console.log(`Agente: ${caseItem.agentName} (${caseItem.agentId})`);
        console.log(`Nível de Risco: ${this.getRiskEmoji(caseItem.riskLevel)} ${caseItem.riskLevel}`);
        console.log(`Status: ${caseItem.status}`);
        console.log(`Data: ${new Date(caseItem.timestamp).toLocaleString('pt-BR')}`);
        
        console.log('\n🚨 ATIVIDADES SUSPEITAS:');
        if (caseItem.analysis.suspiciousActivities.length === 0) {
            console.log('   Nenhuma atividade suspeita detectada');
        } else {
            caseItem.analysis.suspiciousActivities.forEach((activity, index) => {
                console.log(`\n   ${index + 1}. Tipo: ${activity.type}`);
                console.log(`      Padrão: ${activity.pattern}`);
                console.log(`      Ocorrências: ${activity.count}`);
                if (activity.matches.length > 0) {
                    console.log('      Exemplos:');
                    activity.matches.forEach(match => {
                        console.log(`         • ${match.substring(0, 100)}...`);
                    });
                }
            });
        }
        
        console.log('\n⚠️ ANOMALIAS DETECTADAS:');
        if (caseItem.analysis.anomalies.length === 0) {
            console.log('   Nenhuma anomalia detectada');
        } else {
            caseItem.analysis.anomalies.forEach((anomaly, index) => {
                console.log(`\n   ${index + 1}. Tipo: ${anomaly.type}`);
                console.log(`      Severidade: ${anomaly.severity}`);
                console.log(`      Descrição: ${anomaly.description}`);
            });
        }
        
        console.log('\n💡 RECOMENDAÇÕES:');
        caseItem.analysis.recommendations.forEach((rec, index) => {
            console.log(`\n   ${index + 1}. Prioridade: ${rec.priority}`);
            console.log(`      Ação: ${rec.action}`);
            console.log(`      Descrição: ${rec.description}`);
        });
    }

    async markCaseAsReviewed(caseId, resolution, reviewedBy = 'Human Operator') {
        const queueFile = path.join(this.workspacePath, '.ai-workspace', 'security', 'suspicion-queue.json');
        const queue = JSON.parse(require('fs').readFileSync(queueFile, 'utf8'));
        
        const caseItem = queue.queue.find(item => item.id === caseId);
        if (!caseItem) {
            console.log(`❌ Caso ${caseId} não encontrado`);
            return false;
        }
        
        caseItem.status = 'REVIEWED';
        caseItem.reviewedBy = reviewedBy;
        caseItem.reviewedAt = new Date().toISOString();
        caseItem.resolution = resolution;
        
        require('fs').writeFileSync(queueFile, JSON.stringify(queue, null, 2));
        
        this.monitor.logSecurityEvent({
            type: 'CASE_REVIEWED',
            caseId: caseId,
            reviewedBy: reviewedBy,
            resolution: resolution
        });
        
        console.log(`✅ Caso ${caseId} marcado como revisado`);
        console.log(`   Resolução: ${resolution}`);
        console.log(`   Revisado por: ${reviewedBy}`);
        
        return true;
    }

    async generateDetailedReport() {
        const report = await this.monitor.generateSecurityReport();
        const reportFile = path.join(this.workspacePath, '.ai-workspace', 'security', 'detailed-report.json');
        
        require('fs').writeFileSync(reportFile, JSON.stringify(report, null, 2));
        
        console.log(`\n📄 Relatório detalhado gerado: ${reportFile}`);
        console.log('   Contém análise completa de segurança e recomendações');
        
        return reportFile;
    }

    getStatusEmoji(status) {
        const emojis = {
            'SECURE': '✅',
            'ATTENTION_REQUIRED': '⚠️',
            'CRITICAL': '🚨',
            'OK': '✅',
            'FAILED': '❌'
        };
        return emojis[status] || '❓';
    }

    getRiskEmoji(risk) {
        const emojis = {
            'LOW': '🟢',
            'MEDIUM': '🟡',
            'HIGH': '🟠',
            'CRITICAL': '🔴'
        };
        return emojis[risk] || '⚪';
    }
}

// CLI Interface
async function main() {
    const dashboard = new SecurityDashboard();
    
    if (process.argv.includes('--help')) {
        console.log('🛡️ Security Dashboard - Uso:');
        console.log('   node security-dashboard.js                    # Mostrar dashboard');
        console.log('   node security-dashboard.js --case <id>        # Ver detalhes do caso');
        console.log('   node security-dashboard.js --review <id> <resolution> # Marcar como revisado');
        console.log('   node security-dashboard.js --report           # Gerar relatório detalhado');
        return;
    }
    
    if (process.argv.includes('--case')) {
        const caseId = process.argv[process.argv.indexOf('--case') + 1];
        await dashboard.showCaseDetails(caseId);
        return;
    }
    
    if (process.argv.includes('--review')) {
        const caseIndex = process.argv.indexOf('--review');
        const caseId = process.argv[caseIndex + 1];
        const resolution = process.argv.slice(caseIndex + 2).join(' ') || 'Resolvido manualmente';
        await dashboard.markCaseAsReviewed(caseId, resolution);
        return;
    }
    
    if (process.argv.includes('--report')) {
        await dashboard.generateDetailedReport();
        return;
    }
    
    // Mostrar dashboard principal
    await dashboard.showDashboard();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = SecurityDashboard;
