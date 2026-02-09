#!/usr/bin/env node

/**
 * Test script para AI Skills Interface
 */

const AISkillsInterface = require('./index.cjs');

async function testSkills() {
  console.log('🧪 Testando AI Skills Interface...\n');
  
  try {
    // Inicializa interface
    const aiSkills = new AISkillsInterface();
    const summary = await aiSkills.initialize();
    
    console.log('📊 Resumo das Skills:');
    console.log('  Total:', summary.total);
    console.log('  Skills:', summary.skills.join(', '));
    console.log('  Categorias:', Object.keys(summary.categories).join(', '));
    
    // Lista skills
    const skills = aiSkills.listSkills();
    console.log('\n📋 Skills Disponíveis:');
    for (const skill of skills) {
      console.log(`  ✅ ${skill.name}: ${skill.description}`);
    }
    
    // Testa skill específica
    console.log('\n🎯 Testando skill ide-integration...');
    const ideSkill = aiSkills.getSkill('ide-integration');
    if (ideSkill) {
      const result = await ideSkill.execute({ 
        action: 'list-ides' 
      });
      console.log('Resultado:', result.success ? '✅' : '❌', result.message);
    }
    
    // Testa exportação
    console.log('\n📦 Testando exportação...');
    const exportPath = await aiSkills.exportSkills('json');
    console.log('Exportado para:', exportPath);
    
    // Valida skills
    console.log('\n🔍 Validando skills...');
    const validation = aiSkills.validateSkills();
    console.log(`Válidas: ${validation.valid.length}/${validation.total}`);
    console.log(`Inválidas: ${validation.invalid.length}/${validation.total}`);
    
    console.log('\n✅ Todos os testes concluídos com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro nos testes:', error.message);
    process.exit(1);
  }
}

// Executa testes
testSkills();
