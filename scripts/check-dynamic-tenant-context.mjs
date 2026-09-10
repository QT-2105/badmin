import fs from 'node:fs';

const repositoryFiles = fs.readdirSync('src/repositories')
  .filter((name) => name.endsWith('-repository.ts'))
  .map((name) => `src/repositories/${name}`);
const production = repositoryFiles.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
const failures = [];

if (production.includes('requireLegacyTenantContext')) {
  failures.push('A production repository still depends on requireLegacyTenantContext.');
}
for (const file of repositoryFiles) {
  const source = fs.readFileSync(file, 'utf8');
  if (/\bclub_id\b/.test(source) && !source.includes('requireTenantContext(') && !file.endsWith('control-club-repository.ts') && !file.endsWith('owner-activation-repository.ts')) {
    failures.push(`${file}: tenant repository does not require server TenantContext.`);
  }
}

const context = fs.readFileSync('src/lib/tenant-context.ts', 'utf8');
const guards = fs.readFileSync('src/lib/auth/guards.ts', 'utf8');
const login = fs.readFileSync('src/repositories/control-club-repository.ts', 'utf8');
const bootstrap = fs.readFileSync('src/app/api/auth/bootstrap/route.ts', 'utf8');
const schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

for (const token of ['AsyncLocalStorage', 'BADMIN_ALLOW_LEGACY_TENANT_FALLBACK', 'TenantContext chưa được xác lập từ phiên đăng nhập']) {
  if (!context.includes(token)) failures.push(`tenant-context.ts: missing ${token}`);
}
if (!guards.includes("establishTenantContext({ clubId: user.clubId, userId: user.id }, 'auth.permissions')")) {
  failures.push('Authenticated guards do not establish request-owned TenantContext.');
}
if (guards.indexOf("establishTenantContext({ clubId: user.clubId, userId: user.id }, 'auth.permissions')") > guards.indexOf('getPermissionsForRole(user.role, user.clubId)')) {
  failures.push('TenantContext must be established before permission repository access.');
}
if (!login.includes('BADMIN_LOGIN_CLUB_ALLOWLIST')) failures.push('Non-Legacy login lacks a controlled rollout allowlist.');
if (/countAuthUsers|createAuthUser|password/.test(bootstrap)) failures.push('Global bootstrap still reads users or credentials.');
if (!bootstrap.includes('status: 410')) failures.push('Global bootstrap POST is not retired.');

const forbiddenSchemaTokens = [
  'play_date     DateTime        @unique',
  '@@unique([session_id, court_number], map: "uq_runtime_courts_session_number")',
  '@@unique([session_id, queue_order], map: "uq_runtime_matches_session_queue")',
  '@@unique([session_id, court_number], map: "uq_runtime_matches_session_court")',
  '@@unique([match_history_id, session_player_id], map: "uq_match_history_player")',
  'shuttlecock_product_id   String               @unique'
];
for (const token of forbiddenSchemaTokens) {
  if (schema.includes(token)) failures.push(`Prisma still contains legacy global uniqueness: ${token}`);
}
if (!schema.includes('club_id                                   String    @id @db.Uuid')) {
  failures.push('app_settings is not keyed by club_id.');
}

if (failures.length > 0) {
  console.error(`Dynamic TenantContext guard failed:\n${failures.join('\n')}`);
  process.exit(1);
}
console.log(`Dynamic TenantContext guard passed for ${repositoryFiles.length} repositories.`);
