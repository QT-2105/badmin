import { readFileSync } from 'node:fs';

const tenantSources = [
  'src/lib/auth/session.ts',
  'src/repositories/app-settings-repository.ts',
  'src/repositories/auth-users-repository.ts',
  'src/repositories/branding-repository.ts',
  'src/repositories/dashboard-repository.ts',
  'src/repositories/finance-repository.ts',
  'src/repositories/inventory-repository.ts',
  'src/repositories/match-history-repository.ts',
  'src/repositories/payment-bank-accounts-repository.ts',
  'src/repositories/play-dates-repository.ts',
  'src/repositories/play-sessions-repository.ts',
  'src/repositories/player-images-repository.ts',
  'src/repositories/role-permissions-repository.ts',
  'src/repositories/runtime-courts-repository.ts',
  'src/repositories/runtime-matches-repository.ts',
  'src/repositories/runtime-session-repository.ts',
  'src/repositories/runtime-snapshot-repository.ts',
  'src/repositories/session-completion-repository.ts',
  'src/repositories/session-couples-repository.ts',
  'src/repositories/session-players-repository.ts'
];

const guardedMethods = new Set([
  'findMany', 'findFirst', 'findUnique', 'count', 'aggregate',
  'update', 'updateMany', 'delete', 'deleteMany', 'upsert'
]);
const allowedVariableScopedCalls = new Set([
  'src/repositories/runtime-snapshot-repository.ts:deleteMany:{ where }',
  // Auth tokens are high-entropy values stored only as a globally unique hash.
  // The session row supplies club_id, which is then matched against app_users.club_id.
  'src/lib/auth/session.ts:findFirst:{ where: { token_hash: tokenHash(token) }, include: { app_users: true } }',
  'src/lib/auth/session.ts:deleteMany:{ where: { token_hash: tokenHash(token) } }'
]);
const failures = [];

function extractBalancedArgument(source, openIndex) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === "'" || char === '"' || char === '`') {
      quote = char;
      continue;
    }
    if (char === '(') depth += 1;
    if (char === ')') {
      depth -= 1;
      if (depth === 0) return source.slice(openIndex + 1, index).trim();
    }
  }
  return null;
}

for (const file of tenantSources) {
  const source = readFileSync(file, 'utf8');
  if (!source.includes('requireTenantContext(')) {
    failures.push(`${file}: missing server-owned TenantContext`);
  }

  const matcher = /\.(findMany|findFirst|findUnique|count|aggregate|update|updateMany|delete|deleteMany|upsert)\s*\(/g;
  for (const match of source.matchAll(matcher)) {
    const method = match[1];
    if (!guardedMethods.has(method)) continue;
    const lineStart = source.lastIndexOf('\n', match.index) + 1;
    const callPrefix = source.slice(lineStart, match.index);
    if (!/\b(?:prisma|tx)\./.test(callPrefix)) continue;
    const openIndex = match.index + match[0].lastIndexOf('(');
    const argument = extractBalancedArgument(source, openIndex);
    if (argument === null) {
      failures.push(`${file}:${method}: unbalanced call`);
      continue;
    }
    const compact = argument.replace(/\s+/g, ' ').trim();
    const allowKey = `${file}:${method}:${compact}`;
    if (!argument.includes('club_id') && !allowedVariableScopedCalls.has(allowKey)) {
      const line = source.slice(0, match.index).split('\n').length;
      failures.push(`${file}:${line}: ${method} lacks explicit club_id`);
    }
  }
}

if (failures.length > 0) {
  throw new Error(['Tenant data-access coverage guard failed.', ...failures].join('\n'));
}

console.log(`Tenant data-access coverage guard passed for ${tenantSources.length} source files.`);
