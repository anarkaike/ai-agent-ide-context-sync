import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * i18n Manager for CLI
 * Suporta múltiplos idiomas com fallback para inglês
 */
class I18nManager {
    constructor(options = {}) {
        this.options = {
            defaultLocale: 'en',
            translationsDir: path.join(__dirname, '.'),
            ...options
        };

        this.options.locale = options.locale || this.detectLocale();

        this.translations = new Map();
        this.loadTranslations();
    }

    /**
     * Detecta locale do ambiente
     */
    detectLocale() {
        // 1. Variável de ambiente
        if (process.env.AI_DOC_LOCALE) {
            return process.env.AI_DOC_LOCALE;
        }

        // 2. Locale do sistema
        const systemLocale = process.env.LANG || process.env.LC_ALL || process.env.LC_MESSAGES;
        if (systemLocale) {
            const lang = systemLocale.split('.')[0].split('_')[0];
            if (this.localeExists(lang)) {
                return lang;
            }
        }

        // 3. Config do workspace
        try {
            const configPath = path.join(process.cwd(), '.ai-workspace', 'config', 'user.json');
            if (fs.existsSync(configPath)) {
                const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                if (config.locale && this.localeExists(config.locale)) {
                    return config.locale;
                }
            }
        } catch (error) {
            // Ignorar erro
        }

        // 4. Default
        return this.options.defaultLocale;
    }

    /**
     * Verifica se locale existe
     */
    localeExists(locale) {
        const filePath = path.join(this.options.translationsDir, `${locale}.json`);
        return fs.existsSync(filePath);
    }

    /**
     * Carrega traduções
     */
    loadTranslations() {
        const locales = ['en', 'pt']; // Extender conforme necessário

        for (const locale of locales) {
            const filePath = path.join(this.options.translationsDir, `${locale}.json`);
            if (fs.existsSync(filePath)) {
                try {
                    const translations = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    this.translations.set(locale, translations);
                } catch (error) {
                    console.warn(`[I18n] Failed to load translations for ${locale}:`, error.message);
                }
            }
        }
    }

    /**
     * Obtém tradução para uma chave
     * @param {string} key - Chave no formato "section.key"
     * @param {Object} params - Parâmetros para interpolação
     * @param {string} locale - Locale específico (opcional)
     * @returns {string} Texto traduzido
     */
    t(key, params = {}, locale = null) {
        const targetLocale = locale || this.options.locale;

        // Tentar obter tradução
        let translation = this.getTranslation(key, targetLocale);

        // Fallback para locale default
        if (!translation && targetLocale !== this.options.defaultLocale) {
            translation = this.getTranslation(key, this.options.defaultLocale);
        }

        // Fallback para chave本身
        if (!translation) {
            translation = key;
        }

        // Interpolar parâmetros
        if (params && typeof translation === 'string') {
            translation = this.interpolate(translation, params);
        }

        return translation;
    }

    /**
     * Obtém tradução específica
     */
    getTranslation(key, locale) {
        const translations = this.translations.get(locale);
        if (!translations) return null;

        // Suporta chaves aninhadas: "status.connected"
        const keys = key.split('.');
        let value = translations;

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return null;
            }
        }

        return typeof value === 'string' ? value : null;
    }

    /**
     * Interpola parâmetros no texto
     * @param {string} text - Texto com placeholders {{param}}
     * @param {Object} params - Parâmetros
     * @returns {string} Texto interpolado
     */
    interpolate(text, params) {
        return text.replace(/\{\{(\w+)\}\}/g, (match, param) => {
            return params[param] !== undefined ? params[param] : match;
        });
    }

    /**
     * Muda locale atual
     */
    setLocale(locale) {
        if (this.localeExists(locale)) {
            this.options.locale = locale;
            return true;
        }
        return false;
    }

    /**
     * Obtém locale atual
     */
    getLocale() {
        return this.options.locale;
    }

    /**
     * Lista locales disponíveis
     */
    getAvailableLocales() {
        return Array.from(this.translations.keys());
    }

    /**
     * Verifica se chave existe
     */
    has(key, locale = null) {
        const targetLocale = locale || this.options.locale;
        return this.getTranslation(key, targetLocale) !== null;
    }

    /**
     * Adiciona tradução em runtime
     */
    addTranslation(locale, key, value) {
        if (!this.translations.has(locale)) {
            this.translations.set(locale, {});
        }

        const translations = this.translations.get(locale);
        const keys = key.split('.');
        let current = translations;

        // Criar estrutura aninhada
        for (let i = 0; i < keys.length - 1; i++) {
            const k = keys[i];
            if (!current[k] || typeof current[k] !== 'object') {
                current[k] = {};
            }
            current = current[k];
        }

        // Definir valor final
        current[keys[keys.length - 1]] = value;
    }

    /**
     * Recarrega traduções do disco
     */
    reload() {
        this.translations.clear();
        this.loadTranslations();
    }
}

// Singleton export para uso fácil
const i18n = new I18nManager();

// Helper global para facilitar uso
global.t = (key, params, locale) => i18n.t(key, params, locale);

export default i18n;
