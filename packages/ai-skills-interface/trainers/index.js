/**
 * Treinadores para diferentes tipos de IAs
 */

const AITrainer = {
  name: 'ai-trainer',
  description: 'Treinador genérico para diferentes tipos de IAs',
  category: 'ai-training',
  capabilities: ['skill-training', 'context-adaptation', 'model-optimization'],
  
  async initialize(aiType, config = {}) {
    const trainers = {
      claude: () => require('./claude'),
      gpt: () => require('./gpt'),
      gemini: () => require('./gemini'),
      custom: () => require('./custom')
    };
    
    const trainer = trainers[aiType];
    if (!trainer) {
      throw new Error(`IA não suportada: ${aiType}`);
    }
    
    return await trainer().initialize(config);
  }
};

module.exports = AITrainer;
