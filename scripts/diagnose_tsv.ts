import fs from 'fs';
import path from 'path';

async function diagnose() {
    const argPath = process.argv[2];
    if (!argPath) {
        console.error('Please provide the path to your .tsv file.');
        process.exit(1);
    }

    const inputPath = path.resolve(argPath);
    console.log(`Inspecting: ${inputPath}`);

    const content = fs.readFileSync(inputPath, 'utf-8');
    const lines = content.split('\n');

    console.log('--- HEADER LINE ---');
    console.log(lines[0]);
    console.log('--- END HEADER ---');

    console.log('\n--- FIRST DATA ROW ---');
    console.log(lines[1]);
    console.log('--- END DATA ROW ---');

    // Check tabs
    const tabCountLine0 = (lines[0].match(/\t/g) || []).length;
    console.log(`\nTabs found in header: ${tabCountLine0}`);

    const commaCountLine0 = (lines[0].match(/,/g) || []).length;
    console.log(`Commas found in header: ${commaCountLine0}`);
}

diagnose().catch(console.error);
