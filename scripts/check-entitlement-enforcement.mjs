import fs from 'node:fs';

const checks = [
  ['src/lib/entitlements/types.ts', "'session.completion'"],
  ['src/lib/entitlements/index.ts', 'getControlClubEntitlementProjection'],
  ['src/lib/entitlements/index.ts', "reason: 'ACTIVE_SESSION_CONTINUATION'"],
  ['src/lib/auth/guards.ts', 'PERMISSION_FEATURES'],
  ['src/lib/auth/guards.ts', 'evaluateClubFeature'],
  ['src/lib/auth/guards.ts', 'FEATURE_NOT_ENTITLED'],
  ['src/app/api/runtime/snapshot/route.ts', 'allowActiveSessionContinuation: true'],
  ['src/app/api/sessions/[sessionId]/complete/route.ts', 'allowActiveSessionContinuation: true'],
  ['src/app/api/inventory/products/route.ts', "feature: 'session.completion'"],
  ['src/components/app-shell.tsx', 'hasEntitlementFeature'],
  ['src/repositories/control-club-repository.ts', 'e.valid_until'],
  ['prisma/manual-migrations/20260904120000_phase12_entitlement_projection_grant.sql', 'features, limits, valid_until, updated_at']
];

const failures = checks.flatMap(([file, token]) => {
  const source = fs.readFileSync(file, 'utf8');
  return source.includes(token) ? [] : [`${file}: missing ${token}`];
});

const productionSource = [
  ...fs.readdirSync('src/lib/entitlements', { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts'))
    .map((entry) => `src/lib/entitlements/${entry.name}`),
  'src/lib/auth/guards.ts',
  'src/components/app-shell.tsx'
].map((file) => fs.readFileSync(file, 'utf8')).join('\n');

if (/\b(planName|plan_name|subscriptionName|subscription_name|billingProvider|billing_provider)\b/.test(productionSource)) {
  failures.push('Badmin entitlement enforcement contains forbidden commercial-plan branching.');
}

if (failures.length > 0) {
  console.error(`Entitlement enforcement guard failed:\n${failures.join('\n')}`);
  process.exit(1);
}

console.log(`Entitlement enforcement guard passed for ${new Set(checks.map(([file]) => file)).size} source files.`);
