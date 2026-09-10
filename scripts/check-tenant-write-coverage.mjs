import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const checks = [
  ['src/lib/auth/session.ts', "requireTenantContext('auth.session.create.compatibility')", 'club_id: clubId'],
  ['src/repositories/auth-users-repository.ts', "requireTenantContext('auth.user.create')", 'club_id: clubId'],
  ['src/repositories/role-permissions-repository.ts', "requireTenantContext('role_permissions.upsert')", 'data: { club_id: clubId'],
  ['src/repositories/app-settings-repository.ts', "requireTenantContext('settings.upsert')", 'club_id: clubId'],
  ['src/repositories/branding-repository.ts', "requireTenantContext('branding.name.upsert')", 'club_id: clubId'],
  ['src/repositories/payment-bank-accounts-repository.ts', "requireTenantContext('payment_bank_account.create')", 'club_id: clubId'],
  ['src/repositories/play-dates-repository.ts', "requireTenantContext('play_date.create')", 'club_id: clubId'],
  ['src/repositories/play-sessions-repository.ts', "requireTenantContext('play_session.create')", 'club_id: clubId'],
  ['src/repositories/session-players-repository.ts', "requireTenantContext('session_player.create')", 'club_id: clubId'],
  ['src/repositories/runtime-snapshot-repository.ts', "requireTenantContext('runtime_snapshot.sync')", 'club_id: clubId'],
  ['src/repositories/match-history-repository.ts', "requireTenantContext('match_history.create')", 'club_id: clubId'],
  ['src/repositories/finance-repository.ts', "requireTenantContext('finance.transaction.create')", 'club_id: clubId'],
  ['src/repositories/inventory-repository.ts', "requireTenantContext('inventory.product.create')", 'club_id: clubId'],
  ['src/repositories/inventory-repository.ts', "requireTenantContext('inventory.movement.create')", 'club_id: clubId'],
  ['src/repositories/session-completion-repository.ts', "requireTenantContext('session.completion')", 'club_id: clubId'],
  ['src/repositories/player-images-repository.ts', "requireTenantContext('player_image.create')", 'club_id: clubId']
];

const failures = [];
for (const [file, contextFragment, clubFragment] of checks) {
  const source = readFileSync(file, 'utf8');
  if (!source.includes(contextFragment)) failures.push(`${file}: missing ${contextFragment}`);
  if (!source.includes(clubFragment)) failures.push(`${file}: missing ${clubFragment}`);
}

const sourceFiles = [...new Set(checks.map(([file]) => file))];
const uncoveredCreateCalls = [];

function listProductionTypeScriptFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return listProductionTypeScriptFiles(path);
    if (!entry.isFile() || !/\.tsx?$/.test(entry.name) || /\.test\.tsx?$/.test(entry.name)) return [];
    return [path];
  });
}

const unregisteredCreateFiles = listProductionTypeScriptFiles('src').filter((file) => {
  const source = readFileSync(file, 'utf8');
  return /\.(?:create|createMany|upsert)\(\{/.test(source) && !sourceFiles.includes(file);
});

for (const file of sourceFiles) {
  const source = readFileSync(file, 'utf8');
  const createCallCount = [...source.matchAll(/\.(?:create|upsert)\(\{/g)].length;
  const clubFieldCount = [...source.matchAll(/club_id:\s*clubId/g)].length;
  const variableBackedCreateMany = [...source.matchAll(/\.createMany\(\{\s*data:\s*transactions\s*\}\)/g)].length;
  if (clubFieldCount + variableBackedCreateMany < createCallCount) {
    uncoveredCreateCalls.push(`${file}: create/upsert=${createCallCount}, tenant writes=${clubFieldCount + variableBackedCreateMany}`);
  }
}

if (failures.length > 0 || uncoveredCreateCalls.length > 0 || unregisteredCreateFiles.length > 0) {
  throw new Error([
    'Tenant write coverage guard failed.',
    ...failures,
    ...uncoveredCreateCalls,
    ...unregisteredCreateFiles.map((file) => `${file}: unregistered Prisma create path`)
  ].join('\n'));
}

console.log(`Tenant write coverage guard passed for ${sourceFiles.length} source files.`);
