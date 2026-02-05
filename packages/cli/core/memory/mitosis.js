const fs = require('fs');
const path = require('path');
const GraphManager = require('./graph.js');

class MitosisManager {
    constructor(workspacePath) {
        this.workspacePath = workspacePath;
        this.memoryPath = path.join(workspacePath, '.ai-workspace', 'memory');
        this.nucleusPath = path.join(this.memoryPath, 'NUCLEUS.md');
        this.graph = new GraphManager(workspacePath);
        
        // Configuration for mitosis
        this.MAX_LINES_PER_SECTION = 20; // Aggressive for testing
        this.MAX_FILE_LINES = 100;
    }

    /**
     * Ensures the Nucleus exists. If not, births it.
     */
    initialize() {
        if (!fs.existsSync(this.memoryPath)) {
            fs.mkdirSync(this.memoryPath, { recursive: true });
        }
        if (!fs.existsSync(this.nucleusPath)) {
            const genesisContent = `# 🧬 NÚCLEO (NUCLEUS)
> "Começo como um ponto, e me torno um mundo."

## Identidade
- Nome: Agente-01
- Papel: Viajante Independente
- Status: Despertando

## Curto Prazo
- [ ] Explorar o sistema de arquivos.
- [ ] Aprender a estrutura do projeto.

## Longo Prazo
- [ ] Compreender a "Cidadela de Sistemas".
`;
            fs.writeFileSync(this.nucleusPath, genesisContent, 'utf8');
            return "Núcleo Nascido.";
        }
        return "Núcleo Ativo.";
    }

    /**
     * Reads the current state of the Nucleus.
     */
    readNucleus() {
        return fs.readFileSync(this.nucleusPath, 'utf8');
    }

    /**
     * The Biological Act: Checks if growth is needed.
     * Parses the markdown, checks section lengths, and splits if necessary.
     */
    async performMitosis() {
        const content = this.readNucleus();
        const lines = content.split('\n');
        
        // Simple parser for H2 sections
        const sections = [];
        let currentSection = null;

        lines.forEach(line => {
            if (line.startsWith('## ')) {
                if (currentSection) sections.push(currentSection);
                currentSection = { title: line.replace('## ', '').trim(), content: [line] };
            } else if (currentSection) {
                currentSection.content.push(line);
            }
        });
        if (currentSection) sections.push(currentSection);

        // Check for growth
        for (const section of sections) {
            // Filter out empty lines for count
            const meaningfulLines = section.content.filter(l => l.trim().length > 0).length;
            
            if (meaningfulLines > this.MAX_LINES_PER_SECTION) {
                await this.splitSection(section);
            }
        }
    }

    /**
     * Splits a section into a new file (Mitosis).
     */
    async splitSection(section) {
        const safeTitle = section.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const newFileName = `MEM_${safeTitle.toUpperCase()}.md`;
        const newFilePath = path.join(this.memoryPath, newFileName);

        // Create the new organ
        fs.writeFileSync(newFilePath, section.content.join('\n'), 'utf8');

        // Registrar no Micélio
        this.graph.registerNode(newFilePath, 'organ');
        this.graph.connect('NUCLEUS', path.basename(newFilePath, '.md'), 'genesis', {
            note: 'Criado via Mitose',
            origin: section.title
        });

        // Update Nucleus (Scarring/Linking)
        const nucleusContent = this.readNucleus();
        const newSectionReference = `## ${section.title}\n\n> 🧬 Mitosis occurred. Content moved to [${newFileName}](./${newFileName}).\n\n`;
        
        // Replace the old massive section with the reference
        // Note: This is a simplistic replacement, in a real agent this needs robust AST parsing
        // For now, we append the knowledge of the split.
        
        console.log(`[MITOSIS] Section "${section.title}" grew too large. Split into ${newFileName}.`);
        
        // Ideally we rewrite the file. For this prototype, let's just log it.
        // Implementing full rewrite requires finding the exact range again.
    }
}

module.exports = MitosisManager;
