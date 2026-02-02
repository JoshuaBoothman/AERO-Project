const fs = require('fs');
const data = JSON.parse(fs.readFileSync('lint-report.json', 'utf8'));

console.log('=== CRITICAL ERRORS (Runtime Breaking) ===\n');

const critical = [];
data.forEach(f => {
    const relPath = f.filePath.split('\\').slice(-3).join('/');
    f.messages.forEach(m => {
        if (['no-undef', 'react-hooks/rules-of-hooks', 'react-hooks/immutability'].includes(m.ruleId)) {
            critical.push({
                file: relPath,
                line: m.line,
                rule: m.ruleId,
                msg: m.message
            });
        }
    });
});

critical.forEach(c => {
    console.log(`${c.file}:${c.line}`);
    console.log(`  [${c.rule}] ${c.msg}\n`);
});

console.log(`\nTotal critical errors: ${critical.length}\n`);

console.log('=== MEDIUM RISK ERRORS ===\n');
const medium = [];
data.forEach(f => {
    const relPath = f.filePath.split('\\').slice(-3).join('/');
    f.messages.forEach(m => {
        if (['react-hooks/set-state-in-effect', 'react-hooks/static-components'].includes(m.ruleId)) {
            medium.push({
                file: relPath,
                line: m.line,
                rule: m.ruleId
            });
        }
    });
});

const mediumByFile = {};
medium.forEach(m => {
    if (!mediumByFile[m.file]) mediumByFile[m.file] = [];
    mediumByFile[m.file].push(m);
});

Object.keys(mediumByFile).forEach(file => {
    console.log(`${file}: ${mediumByFile[file].length} issues`);
    mediumByFile[file].slice(0, 3).forEach(m => {
        console.log(`  Line ${m.line}: ${m.rule}`);
    });
    console.log();
});
