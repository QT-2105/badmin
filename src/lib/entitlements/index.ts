import { AppError } from '@/lib/app-error';
import { prisma } from '@/lib/prisma';
import { getControlClubEntitlementProjection } from '@/repositories/control-club-repository';
import {
  ENTITLEMENT_FEATURE_KEYS,
  type EffectiveEntitlement,
  type EntitlementDecision,
  type EntitlementFeatureKey
} from './types';

const STALE_FALLBACK_WINDOW_MS = 2 * 60 * 1000;
const CONTROL_REFRESH_INTERVAL_MS = 15 * 1000;
const cache = new Map<string, EffectiveEntitlement>();

function normalizeFeatures(value: unknown): EntitlementFeatureKey[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  const record = value as Record<string, unknown>;
  return ENTITLEMENT_FEATURE_KEYS.filter((feature) => record[feature] === true);
}

function normalizeLimits(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).flatMap(([key, raw]) => {
    const number = Number(raw);
    return key && Number.isFinite(number) && number >= 0 ? [[key, number]] : [];
  }));
}

function cacheKey(entitlement: Pick<EffectiveEntitlement, 'clubId' | 'version' | 'validUntil'>): string {
  return `${entitlement.clubId}:${entitlement.version}:${entitlement.validUntil ?? 'none'}`;
}

function remember(entitlement: EffectiveEntitlement): void {
  for (const key of cache.keys()) {
    if (key.startsWith(`${entitlement.clubId}:`)) cache.delete(key);
  }
  cache.set(cacheKey(entitlement), entitlement);
}

function readFallback(clubId: string, now: Date): EffectiveEntitlement | null {
  const entitlement = [...cache.values()].find((entry) => entry.clubId === clubId);
  if (!entitlement) return null;
  if (now.getTime() - new Date(entitlement.fetchedAt).getTime() > STALE_FALLBACK_WINDOW_MS) return null;
  if (entitlement.validUntil && new Date(entitlement.validUntil).getTime() <= now.getTime()) return null;
  return { ...entitlement, source: 'STALE_CACHE' };
}

function readRecent(clubId: string, now: Date): EffectiveEntitlement | null {
  const entitlement = [...cache.values()].find((entry) => entry.clubId === clubId);
  if (!entitlement) return null;
  if (now.getTime() - new Date(entitlement.fetchedAt).getTime() > CONTROL_REFRESH_INTERVAL_MS) return null;
  if (entitlement.validUntil && new Date(entitlement.validUntil).getTime() <= now.getTime()) return null;
  return entitlement;
}

export async function getEffectiveEntitlement(clubId: string, now = new Date()): Promise<EffectiveEntitlement> {
  const recent = readRecent(clubId, now);
  if (recent) return recent;
  try {
    const projection = await getControlClubEntitlementProjection(clubId);
    if (!projection) throw new AppError('Không tìm thấy cấu hình tính năng của CLB.', 503);
    const entitlement: EffectiveEntitlement = {
      clubId: projection.id,
      clubStatus: projection.status,
      version: projection.entitlementVersion,
      enabledFeatures: normalizeFeatures(projection.features),
      limits: normalizeLimits(projection.limits),
      validUntil: projection.validUntil?.toISOString() ?? null,
      fetchedAt: now.toISOString(),
      source: 'CONTROL_PLANE'
    };
    remember(entitlement);
    return entitlement;
  } catch (error) {
    const fallback = readFallback(clubId, now);
    if (fallback) {
      console.warn(JSON.stringify({ event: 'entitlement_stale_cache', clubId, version: fallback.version }));
      return fallback;
    }
    throw error;
  }
}

export function evaluateEntitlement(
  entitlement: EffectiveEntitlement,
  feature: EntitlementFeatureKey,
  now = new Date()
): EntitlementDecision {
  if (entitlement.validUntil && new Date(entitlement.validUntil).getTime() <= now.getTime()) {
    return { allowed: false, reason: 'EXPIRED', entitlement };
  }
  if (entitlement.clubStatus !== 'ACTIVE' && entitlement.clubStatus !== 'GRACE_PERIOD') {
    return { allowed: false, reason: 'CLUB_INACTIVE', entitlement };
  }
  if (!entitlement.enabledFeatures.includes(feature)) {
    return { allowed: false, reason: 'FEATURE_DISABLED', entitlement };
  }
  return { allowed: true, reason: 'ENABLED', entitlement };
}

export async function evaluateClubFeature(
  clubId: string,
  feature: EntitlementFeatureKey,
  options: {
    activeSessionId?: string;
    activeSessionPlayerId?: string;
    allowActiveSessionContinuation?: boolean;
  } = {}
): Promise<EntitlementDecision> {
  const entitlement = await getEffectiveEntitlement(clubId);
  const decision = evaluateEntitlement(entitlement, feature);
  if (decision.allowed || !options.allowActiveSessionContinuation) return decision;

  const activeSession = options.activeSessionId
    ? await prisma.play_sessions.findFirst({
        where: { id: options.activeSessionId, club_id: clubId, status: 'LIVE' },
        select: { id: true }
      })
    : options.activeSessionPlayerId
      ? await prisma.session_players.findFirst({
          where: {
            id: options.activeSessionPlayerId,
            club_id: clubId,
            play_sessions: { is: { club_id: clubId, status: 'LIVE' } }
          },
          select: { session_id: true }
        })
      : null;
  if (!activeSession) return decision;
  return { allowed: true, reason: 'ACTIVE_SESSION_CONTINUATION', entitlement };
}

export function logEntitlementDecision(
  clubId: string,
  feature: EntitlementFeatureKey,
  decision: EntitlementDecision
): void {
  if (decision.reason === 'ENABLED') return;
  console.info(JSON.stringify({
    event: 'entitlement_evaluation',
    clubId,
    feature,
    allowed: decision.allowed,
    reason: decision.reason,
    version: decision.entitlement.version,
    source: decision.entitlement.source
  }));
}

export function clearEntitlementCacheForTests(): void {
  cache.clear();
}
