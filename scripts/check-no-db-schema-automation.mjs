import { readFileSync } from 'node:fs';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const files = [
  '.github/workflows/ci-cd.yml',
  '.github/workflows/deploy.yml',
  'Dockerfile',
  'docker-compose.yml',
  'package.json'
];

const forbiddenPatterns = [
  /\bprisma\s+migrate\b/i,
  /\bnpx\s+prisma\s+migrate\b/i,
  /\bprisma\s+db\s+push\b/i,
  /\bnpx\s+prisma\s+db\s+push\b/i
];

const findings = [];

for (const file of files) {
  const path = join(root, file);
  if (!existsSync(path)) continue;

  const lines = readFileSync(path, 'utf8').split('\n');
  lines.forEach((line, index) => {
    if (forbiddenPatterns.some((pattern) => pattern.test(line))) {
      findings.push(`${file}:${index + 1}: ${line.trim()}`);
    }
  });
}

if (findings.length > 0) {
  console.error('Forbidden automatic DB schema migration command found.');
  console.error('Schema changes must be reviewed and applied manually with owner approval.');
  console.error(findings.join('\n'));
  process.exit(1);
}

console.log('DB schema automation guard passed.');
