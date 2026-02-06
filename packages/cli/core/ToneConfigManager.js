const fs = require('fs');
const path = require('path');

/**
 * ToneConfigManager
 * Maps emotional/contextual tones to LLM parameters and system instructions.
 */
class ToneConfigManager {
    constructor(projectRoot) {
        this.projectRoot = projectRoot || process.cwd();
        this.tonePath = path.join(this.projectRoot, '.ai-workspace', 'live-state', 'ui-tone.json');
    }

    getCurrentTone() {
        try {
            if (fs.existsSync(this.tonePath)) {
                const content = fs.readFileSync(this.tonePath, 'utf-8');
                const data = JSON.parse(content);
                return { tone: data.tone || 'neutral' };
            }
        } catch (e) {
            console.error('Error reading tone:', e);
        }
        return { tone: 'neutral' };
    }

    /**
     * Returns the LLM configuration based on the current tone/emotion.
     * Supports: temperature, max_tokens, model_hint, system_instruction.
     */
    getConfig() {
        const { tone } = this.getCurrentTone();
        const normalizedTone = (tone || 'neutral').toLowerCase();

        const baseConfig = {
            temperature: 0.5,
            max_tokens: 2048,
            min_chars: 0,
            model_hint: 'standard',
            instruction: 'Maintain a neutral, professional tone.'
        };

        switch (normalizedTone) {
            case 'creative':
                return {
                    ...baseConfig,
                    temperature: 0.9,
                    max_tokens: 4096,
                    min_chars: 500, // Encourage verbosity
                    model_hint: 'creative-reasoning', // e.g., GPT-4o, Claude 3.5 Sonnet
                    instruction: 'MODE: CREATIVE. Explore multiple solutions. Be verbose, explanatory, and innovative. Use analogies. Think outside the box. Prioritize novelty over brevity.'
                };
            case 'focused': // "Com raiva" (Angry/Direct)
                return {
                    ...baseConfig,
                    temperature: 0.2,
                    max_tokens: 1024,
                    min_chars: 0,
                    model_hint: 'precise-coding',
                    instruction: 'MODE: FOCUSED. Be concise. Do not explain unless asked. Output only the necessary code or answer. No chit-chat. Prioritize efficiency.'
                };
            case 'urgent': // "Sem paciência" (Impatient)
                return {
                    ...baseConfig,
                    temperature: 0.1,
                    max_tokens: 512,
                    min_chars: 0,
                    model_hint: 'fast-inference', // e.g., GPT-3.5 Turbo, Haiku
                    instruction: 'MODE: URGENT. Critical situation. Bullet points only. Immediate solution required. Minimal text. Skip introductions and conclusions.'
                };
            case 'cautious': // "Ansioso" (Anxious)
                return {
                    ...baseConfig,
                    temperature: 0.0, // Deterministic
                    max_tokens: 2048,
                    min_chars: 0,
                    model_hint: 'robust-security',
                    instruction: 'MODE: CAUTIOUS. Verify every step. Double-check for security vulnerabilities. Explain your reasoning for safety. Prefer safe, established patterns over new ones. Assume high risk.'
                };
            case 'neutral':
            default:
                return baseConfig;
        }
    }
}

module.exports = ToneConfigManager;
