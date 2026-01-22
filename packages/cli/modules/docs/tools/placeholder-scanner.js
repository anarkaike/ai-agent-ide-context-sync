#!/usr/bin/env node

/**
 * Placeholder Scanner Tool
 * 
 * Scans documentation files for common placeholder patterns that should have been replaced.
 * Used by AI agents to self-verify their documentation work.
 * 
 * Usage: node placeholder-scanner.js <directory>
 */

const fs = require('fs');
const path = require('path');

const PLACEHOLDER_PATTERNS = [
  /\[Nome\]/g,
  /\[Name\]/g,
  /\[Descrição\]/g,
  /\[Description\]/g,
  /\[Subtítulo\]/g,
  /\[Subtitle\]/g,
  /\[Objetivo\]/g,
  /\[Objective\]/g,
  /\[Insira.*?\]/g,
  /\[Insert.*?\]/g,
  /YYYY-MM-DD/g,
  /<!--.*?Instrução.*?-->/gi,
  /<!--.*?Instruction.*?-->/gi
];

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    
    // Split by lines to provide line numbers
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      PLACEHOLDER_PATTERNS.forEach(pattern => {
        if (pattern.test(line)) {
          issues.push({
            line: index + 1,
            content: line.trim(),
            pattern: pattern.toString()
          });
        }
      });
    });

    return issues;
  } catch (err) {
    console.error(`Error reading file ${filePath}:`, err.message);
    return [];
  }
}

function scanDirectory(dir) {
  let results = {};
  
  try {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (item !== 'node_modules' && item !== '.git') {
          const subResults = scanDirectory(fullPath);
          Object.assign(results, subResults);
        }
      } else if (stat.isFile() && item.endsWith('.md')) {
        const issues = scanFile(fullPath);
        if (issues.length > 0) {
          results[fullPath] = issues;
        }
      }
    });
  } catch (err) {
    console.error(`Error scanning directory ${dir}:`, err.message);
  }
  
  return results;
}

// Main execution if run directly
if (require.main === module) {
  const targetDir = process.argv[2] || '.';
  const absoluteTargetDir = path.resolve(targetDir);

  console.log(`🔍 Scanning for placeholders in: ${absoluteTargetDir}\n`);

  const allIssues = scanDirectory(absoluteTargetDir);
  const fileCount = Object.keys(allIssues).length;

  if (fileCount === 0) {
    console.log('✅ No placeholders found. Documentation looks clean!');
    process.exit(0);
  } else {
    console.log(`⚠️  Found potential placeholders in ${fileCount} file(s):\n`);
    
    Object.entries(allIssues).forEach(([file, issues]) => {
      const relativePath = path.relative(process.cwd(), file);
      console.log(`📄 ${relativePath}`);
      issues.forEach(issue => {
        console.log(`   L${issue.line}: ${issue.content} (matches ${issue.pattern})`);
      });
      console.log('');
    });
    
    console.log('❌ Please review and fill in the missing information.');
    process.exit(1);
  }
}

module.exports = { scanDirectory, scanFile };
