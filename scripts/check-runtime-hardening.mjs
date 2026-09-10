import fs from 'node:fs';

const checks = [
  ['src/types/runtime.ts', 'expectedVersion: number;'],
  ['src/hooks/use-runtime-sync.ts', 'state.runtimeVersion'],
  ['src/repositories/runtime-snapshot-repository.ts', "status: 'LIVE', runtime_version: expectedVersion"],
  ['src/repositories/runtime-snapshot-repository.ts', 'Phiên bản runtime là bắt buộc.'],
  ['src/repositories/runtime-snapshot-repository.ts', 'Dữ liệu người chơi trong runtime snapshot không hợp lệ.'],
  ['src/repositories/session-completion-repository.ts', "status: 'LIVE'"],
  ['src/repositories/session-completion-repository.ts', 'lockShuttlecockProduct(tx, clubId, input.shuttlecockProductId)'],
  ['src/repositories/inventory-repository.ts', 'lockShuttlecockProduct(tx, clubId, input.productId)'],
  ['src/repositories/transaction-locks.ts', 'AND club_id = ${clubId}::uuid'],
  ['src/repositories/transaction-locks.ts', 'FOR UPDATE']
];

const failures = checks.flatMap(([file, token]) => {
  const source = fs.readFileSync(file, 'utf8');
  return source.includes(token) ? [] : [`${file}: missing ${token}`];
});

if (failures.length > 0) {
  console.error(`Runtime hardening guard failed:\n${failures.join('\n')}`);
  process.exit(1);
}

console.log(`Runtime hardening guard passed for ${new Set(checks.map(([file]) => file)).size} source files.`);
