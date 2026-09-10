import { PrismaClient } from '@prisma/client';

import { assertPhase8Target, jsonReplacer } from './phase8-contract.mjs';

const target = assertPhase8Target();
const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL_UNPOOLED } } });

try {
  const report = await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY');
    const roles = await tx.$queryRawUnsafe(`
      SELECT rolname, rolcanlogin, rolsuper, rolcreaterole, rolcreatedb
      FROM pg_roles
      WHERE rolname IN ('neondb_owner', 'badmin_schema_owner', 'badmin_control_writer', 'badmin_uat_app')
      ORDER BY rolname
    `);
    const memberships = await tx.$queryRawUnsafe(`
      SELECT member.rolname AS member, granted.rolname AS granted_role, membership.set_option
      FROM pg_auth_members membership
      JOIN pg_roles member ON member.oid = membership.member
      JOIN pg_roles granted ON granted.oid = membership.roleid
      WHERE granted.rolname IN ('badmin_schema_owner', 'badmin_control_writer', 'badmin_uat_app')
      ORDER BY member.rolname, granted.rolname
    `);
    const privileges = await tx.$queryRawUnsafe(`
      SELECT grantee, table_schema, privilege_type, count(*) AS object_count
      FROM information_schema.table_privileges
      WHERE grantee IN ('badmin_control_writer', 'badmin_uat_app')
      GROUP BY grantee, table_schema, privilege_type
      ORDER BY grantee, table_schema, privilege_type
    `);
    return { roles, memberships, privileges };
  });
  console.log(JSON.stringify({ target, report }, jsonReplacer, 2));
} finally {
  await prisma.$disconnect();
}
