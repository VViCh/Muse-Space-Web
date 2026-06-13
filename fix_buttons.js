
const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('src');
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // We'll replace bg-indigo-600 with bg-indigo-600 dark:bg-white dark:text-slate-900 dark:shadow-none
    // But only where we see it. We also replace hover:bg-indigo-700 with hover:bg-indigo-700 dark:hover:bg-slate-200
    
    // Actually, instead of parsing AST, let's just replace bg-indigo-600 inside className strings that also have text-white
    content = content.replace(/className=(['"'])([^>]*?bg-indigo-600[^>]*?)\1/g, (match, quote, classes) => {
        if (!classes.includes('dark:bg-white')) {
            classes = classes.replace('bg-indigo-600', 'bg-indigo-600 dark:bg-white dark:text-slate-900 dark:shadow-none');
        }
        if (classes.includes('hover:bg-indigo-700') && !classes.includes('dark:hover:bg-slate-200')) {
            classes = classes.replace('hover:bg-indigo-700', 'hover:bg-indigo-700 dark:hover:bg-slate-200');
        }
        return className=;
    });

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Updated ' + file);
    }
});

