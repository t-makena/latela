#!/usr/bin/env node
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runCommand(cmd, args, options = {}) {
  console.log(`> ${cmd} ${args.join(' ')}`);
  const res = spawnSync(cmd, args, { stdio: 'pipe', encoding: 'utf-8', ...options });
  return {
    status: res.status,
    stdout: res.stdout || '',
    stderr: res.stderr || ''
  };
}

async function main() {
  const results = { runs: [], timestamp: new Date().toISOString() };

  // 1) Run scraper tests
  try {
    const r1 = runCommand('npm', ['--prefix', 'scraper', 'run', 'test']);
    results.runs.push({ name: 'scraper:test', ...r1 });
  } catch (e) {
    results.runs.push({ name: 'scraper:test', status: 1, stdout: '', stderr: String(e) });
  }

  // 2) Run root lint (if available)
  try {
    const r2 = runCommand('npm', ['run', 'lint']);
    results.runs.push({ name: 'root:lint', ...r2 });
  } catch (e) {
    results.runs.push({ name: 'root:lint', status: 1, stdout: '', stderr: String(e) });
  }

  // 3) Optionally, run scraper build to validate types
  try {
    const r3 = runCommand('npm', ['--prefix', 'scraper', 'run', 'build']);
    results.runs.push({ name: 'scraper:build', ...r3 });
  } catch (e) {
    results.runs.push({ name: 'scraper:build', status: 1, stdout: '', stderr: String(e) });
  }

  const outDir = path.join(__dirname, 'results.json');
  fs.writeFileSync(outDir, JSON.stringify(results, null, 2));
  console.log(`Results written to ${outDir}`);

  // Exit with non-zero if any run failed
  const failed = results.runs.some(r => r.status && r.status !== 0);
  process.exit(failed ? 1 : 0);
}

main();
