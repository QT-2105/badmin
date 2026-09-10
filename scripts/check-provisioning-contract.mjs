import fs from 'node:fs';

const checks = [
  ['src/lib/provisioning/contract.ts', '*** MÃ CLB ĐĂNG NHẬP:'],
  ['src/lib/provisioning/contract.ts', '#token='],
  ['src/lib/provisioning/owner-activation.ts', 'hashPassword(input.password)'],
  ['src/lib/provisioning/owner-activation.ts', 'hashActivationToken(input.token)'],
  ['src/repositories/owner-activation-repository.ts', 'control.activate_club_owner($1, $2, $3)'],
  ['prisma/schema.prisma', '@@id([club_id, role], map: "app_role_permissions_pkey")'],
  ['prisma/manual-migrations/20260904130000_phase13_idempotent_provisioning.sql', "p_request ?| ARRAY['password', 'password_hash', 'plaintext_password']"],
  ['prisma/manual-migrations/20260904130000_phase13_idempotent_provisioning.sql', 'pg_advisory_xact_lock'],
  ['prisma/manual-migrations/20260904130000_phase13_idempotent_provisioning.sql', 'Idempotency key payload mismatch'],
  ['prisma/manual-migrations/20260904130000_phase13_idempotent_provisioning.sql', "'READY_FOR_OWNER'"],
  ['prisma/manual-migrations/20260904130000_phase13_idempotent_provisioning.sql', 'reissue_club_owner_activation'],
  ['prisma/manual-migrations/20260904130000_phase13_idempotent_provisioning.sql', "SET status = 'ACTIVE', updated_at = now()"],
  ['prisma/manual-migrations/20260904130000_phase13_idempotent_provisioning.sql', 'GRANT SELECT, INSERT, UPDATE ON public.app_users TO badmin_schema_owner'],
  ['prisma/manual-migrations/20260904130000_phase13_idempotent_provisioning_validate.sql', 'Badmin runtime role has direct provisioning table mutation rights'],
  ['prisma/manual-migrations/20260904130000_phase13_idempotent_provisioning_validate.sql', 'Provisioning function owner public-table privileges are invalid']
];

const failures = checks.flatMap(([file, token]) => (
  fs.readFileSync(file, 'utf8').includes(token) ? [] : [`${file}: missing ${token}`]
));

const routeFiles = fs.readdirSync('src/app/api', { recursive: true })
  .map(String)
  .filter((file) => /(?:^|\/)route\.ts$/.test(file));
if (routeFiles.some((file) => /provision|register-club/.test(file))) {
  failures.push('Badmin must not expose a public tenant provisioning or club registration API.');
}

const migration = fs.readFileSync('prisma/manual-migrations/20260904130000_phase13_idempotent_provisioning.sql', 'utf8');
if (/public\.(?:digest|gen_random_bytes)/.test(migration)) {
  failures.push('Provisioning migration must not depend on an uninstalled pgcrypto extension.');
}
const ownerActivation = migration.indexOf("SET password_hash = p_password_hash, status = 'ACTIVE'");
const clubActivation = migration.indexOf("SET status = 'ACTIVE', updated_at = now()", ownerActivation + 1);
if (ownerActivation < 0 || clubActivation < ownerActivation) {
  failures.push('Club activation must remain after OWNER activation in the atomic function.');
}

if (failures.length > 0) {
  console.error(`Provisioning contract guard failed:\n${failures.join('\n')}`);
  process.exit(1);
}

console.log(`Provisioning contract guard passed for ${new Set(checks.map(([file]) => file)).size} files.`);
