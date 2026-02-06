const ToneConfigManager = require('./ToneConfigManager');

/**
 * AIClient
 * Centralized client for LLM interactions with Context-Aware Tone adaptation.
 */
class AIClient {
    constructor(projectRoot) {
        this.projectRoot = projectRoot || process.cwd();
        this.toneManager = new ToneConfigManager(this.projectRoot);
    }

    /**
     * Executes a completion request to the LLM.
     * Automatically applies parameters (temperature, max_tokens) based on the current Agent Tone.
     * 
     * @param {string} prompt The prompt text
     * @param {Object} options Override options { temperature, maxTokens, model }
     * @returns {Promise<Object>} Response object { content, usage, config_used }
     */
    async complete(prompt, options = {}) {
        // 1. Get Tone Configuration
        const toneConfig = this.toneManager.getConfig();

        // 2. Merge Configuration (Priority: options > toneConfig > defaults)
        // Note: toneConfig uses 'max_tokens', we normalize to camelCase if needed or keep standard
        const config = {
            temperature: options.temperature ?? toneConfig.temperature ?? 0.7,
            max_tokens: options.maxTokens ?? toneConfig.max_tokens ?? 2048,
            model: options.model ?? toneConfig.model_hint ?? 'gpt-4o',
            system_instruction: toneConfig.instruction, // Inject Tone Instruction
            min_chars: toneConfig.min_chars ?? 0,
            stream: options.stream ?? false
        };

        // 3. Log for debugging/verification (Crucial for the task)
        // In a real implementation, this would be a debug log
        // console.log(`[AIClient] Preparing request with Tone=${toneConfig.tone || 'unknown'} -> Temp=${config.temperature}`);

        // 4. Simulate API Call (Mock for now, as we don't have API keys in this env)
        // TODO: Integrate with real OpenAI/Anthropic SDKs
        
        return {
            content: `[Simulated Response] Processed with temperature ${config.temperature} and model ${config.model}.`,
            usage: { 
                prompt_tokens: prompt.length / 4,
                completion_tokens: 50,
                total_tokens: (prompt.length / 4) + 50
            },
            config_used: config // Returning this allows tests to verify integration
        };
    }
}

module.exports = AIClient;
