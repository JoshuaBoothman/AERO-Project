const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OUTPUT_FILE = path.join(__dirname, '../docs/NotebookLM_Context.md');
const ROOT_DIR = path.join(__dirname, '../');

function generateTree(dir, prefix = '', exclude = []) {
    let output = '';
    const files = fs.readdirSync(dir);
    files.forEach((file, index) => {
        if (exclude.includes(file)) return;
        const fullPath = path.join(dir, file);
        const stats = fs.statSync(fullPath);
        const isLast = index === files.length - 1;
        const marker = isLast ? '└── ' : '├── ';

        output += `${prefix}${marker}${file}\n`;

        if (stats.isDirectory()) {
            output += generateTree(fullPath, prefix + (isLast ? '    ' : '│   '), exclude);
        }
    });
    return output;
}

function getPackageDependencies(packageJsonPath) {
    if (!fs.existsSync(packageJsonPath)) return 'Not found';
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    let output = '';
    if (pkg.dependencies) {
        output += 'Dependencies:\n';
        for (const [dep, ver] of Object.entries(pkg.dependencies)) {
            output += `- ${dep}: ${ver}\n`;
        }
    }
    if (pkg.devDependencies) {
        output += 'Dev Dependencies:\n';
        for (const [dep, ver] of Object.entries(pkg.devDependencies)) {
            output += `- ${dep}: ${ver}\n`;
        }
    }
    return output;
}

function getScripts(packageJsonPath) {
    if (!fs.existsSync(packageJsonPath)) return 'Not found';
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    let output = '';
    if (pkg.scripts) {
        for (const [name, script] of Object.entries(pkg.scripts)) {
            output += `- ${name}: ${script}\n`;
        }
    }
    return output;
}

function main() {
    console.log("Generating NotebookLM Context...");
    let content = `# AERO Project Context\nGenerated on: ${new Date().toISOString()}\n\n`;

    // 1. Project Structure
    content += `## Project Structure\n\`\`\`\n`;
    content += generateTree(ROOT_DIR, '', ['.git', '.vscode', 'node_modules', 'dist', 'build', '.github', '.DS_Store', 'NotebookLM_Context.md', 'package-lock.json', 'yarn.lock']);
    content += `\`\`\`\n\n`;

    // 2. Dependencies & Scripts
    content += `## Client Configuration (client/package.json)\n`;
    content += `### Scripts\n${getScripts(path.join(ROOT_DIR, 'client/package.json'))}\n`;
    content += `### Dependencies\n${getPackageDependencies(path.join(ROOT_DIR, 'client/package.json'))}\n\n`;

    content += `## API Configuration (api/package.json)\n`;
    content += `### Scripts\n${getScripts(path.join(ROOT_DIR, 'api/package.json'))}\n`;
    content += `### Dependencies\n${getPackageDependencies(path.join(ROOT_DIR, 'api/package.json'))}\n\n`;

    // 3. Database Schema
    console.log("Fetching Database Schema...");
    try {
        const schemaOutput = execSync(`node ${path.join(ROOT_DIR, 'api/scripts/dump_schema.js')}`, { encoding: 'utf8' });
        content += `${schemaOutput}\n`;
    } catch (e) {
        console.error("Failed to fetch schema:", e.message);
        content += `## Database Schema\nError fetching schema.\n\n`;
    }

    // 4. Documentation
    console.log("Reading Documentation...");
    const docsDir = path.join(ROOT_DIR, 'docs');
    if (fs.existsSync(docsDir)) {
        const docFiles = fs.readdirSync(docsDir).filter(f => f.endsWith('.md') && f !== 'NotebookLM_Context.md');
        docFiles.forEach(file => {
            content += `## Documentation: ${file}\n\n`;
            content += fs.readFileSync(path.join(docsDir, file), 'utf8');
            content += `\n\n---\n\n`;
        });
    }

    // Root README
    const readmePath = path.join(ROOT_DIR, 'README.md');
    if (fs.existsSync(readmePath)) {
        content += `## Documentation: README.md\n\n`;
        content += fs.readFileSync(readmePath, 'utf8');
        content += `\n\n---\n\n`;
    }

    // 5. API Routes Summary (Basic scan of api/src/functions)
    console.log("Scanning API Functions...");
    const apiFunctionsDir = path.join(ROOT_DIR, 'api/src/functions');
    if (fs.existsSync(apiFunctionsDir)) {
        content += `## API Functions List\n`;
        const funcFiles = fs.readdirSync(apiFunctionsDir).filter(f => f.endsWith('.js'));
        funcFiles.forEach(f => {
            content += `- ${f}\n`;
        });
        content += `\n`;
    }

    fs.writeFileSync(OUTPUT_FILE, content);
    console.log(`Context generated at ${OUTPUT_FILE}`);
}

main();
