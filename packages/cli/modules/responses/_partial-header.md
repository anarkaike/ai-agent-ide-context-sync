⚙️ **Resposta ativa do Kernel** — mantenha os blocos abaixo como fonte da verdade.

🧭 **Status do Agente:** {{AGENT_STATUS}}

🧬 **Auto-evolução:** {{AUTO_EVOLUTION_STATUS}}

🧪 **Melhorias detectadas:** {{AUTO_EVOLUTION_IMPROVEMENTS}}

📋 **Task ativa:** {{#if TASK_ACTIVE}}{{#if TASK_ACTIVE.LINK}}[{{TASK_ACTIVE.TITLE}}]({{TASK_ACTIVE.LINK}}){{else}}{{TASK_ACTIVE.TITLE}}{{/if}}
   **Status:** {{TASK_ACTIVE.STATUS}}{{else}}Nenhuma{{/if}}

🎛️ **Seleção Emojis:** {{STYLE_MOOD}} | 🧊 Formato: {{STYLE_FORMAT}} | 🔁 Fallback: {{STYLE_FALLBACK_FLAG}}

🧠 **Conselho de Personas (ai:list-ids)**  
{{PERSONA_PANEL}}

💗 **Empatia Contextual**  
{{EMPATHY_SNIPPET}}

---
