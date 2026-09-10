export const ENTITLEMENT_FEATURE_KEYS = [
  'dashboard',
  'schedule',
  'session.runtime',
  'session.completion',
  'finance',
  'inventory',
  'users',
  'settings'
] as const;

export type EntitlementFeatureKey = (typeof ENTITLEMENT_FEATURE_KEYS)[number];
export type ClubLifecycleStatus = 'PROVISIONING' | 'ACTIVE' | 'GRACE_PERIOD' | 'SUSPENDED' | 'ARCHIVED';

export type EffectiveEntitlement = {
  clubId: string;
  clubStatus: ClubLifecycleStatus;
  version: string;
  enabledFeatures: EntitlementFeatureKey[];
  limits: Record<string, number>;
  validUntil: string | null;
  fetchedAt: string;
  source: 'CONTROL_PLANE' | 'STALE_CACHE';
};

export type EntitlementDecision = {
  allowed: boolean;
  reason: 'ENABLED' | 'FEATURE_DISABLED' | 'CLUB_INACTIVE' | 'EXPIRED' | 'ACTIVE_SESSION_CONTINUATION';
  entitlement: EffectiveEntitlement;
};

export function hasEntitlementFeature(
  entitlement: Pick<EffectiveEntitlement, 'enabledFeatures'> | null | undefined,
  feature: EntitlementFeatureKey
): boolean {
  return Boolean(entitlement?.enabledFeatures.includes(feature));
}
