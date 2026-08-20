import assert from 'node:assert/strict';
import { test } from 'vitest';

import {
  createQuartetSignature,
  evaluateSchedulerPlayerEligibility,
  generateSchedulerPreviews,
  getSchedulerFairMatches,
  type SchedulerCouple,
  type SchedulerPlayer
} from './index';

const NOW = 10_000_000;

function player(
  id: string,
  overrides: Partial<SchedulerPlayer> = {}
): SchedulerPlayer {
  return {
    id,
    gender: 'Nam',
    level: 3,
    matchesPlayed: 3,
    status: 'WAITING',
    arrived: true,
    endGame: false,
    waitingSince: NOW - 60_000,
    ...overrides
  };
}

function testEligibilityAndFairMatches(): void {
  const recentlyFinished = player('a', { status: 'JUST_FINISHED' });
  assert.deepEqual(evaluateSchedulerPlayerEligibility(recentlyFinished), []);
  assert.deepEqual(evaluateSchedulerPlayerEligibility(recentlyFinished, new Set(['a'])), ['RESERVED']);
  assert.deepEqual(evaluateSchedulerPlayerEligibility(player('b', { arrived: false, endGame: true })), [
    'NOT_ARRIVED',
    'END_GAME'
  ]);
  assert.equal(getSchedulerFairMatches(player('late', { matchesPlayed: 0, fairnessOffset: 4 })), 4);
  assert.equal(getSchedulerFairMatches(player('late-after-one', { matchesPlayed: 1, fairnessOffset: 4 })), 5);
}

function testCoupleOnlyConstrainsItsMode(): void {
  const players = [
    player('a', { gender: 'Nam', level: 4 }),
    player('b', { gender: 'Nữ', level: 5 }),
    player('c', { gender: 'Nam', level: 4 }),
    player('d', { gender: 'Nữ', level: 5 })
  ];
  const couples: SchedulerCouple[] = [{ id: 'couple-1', memberIds: ['a', 'b'], mode: 'mixed' }];
  const mixed = generateSchedulerPreviews({
    players,
    couples,
    targetMatchCount: 1,
    mode: 'mixed',
    now: NOW,
    seed: 'mixed'
  });
  assert.equal(mixed.suggestions.length, 1);
  assert.ok(mixed.suggestions[0].teamA.includes('a') && mixed.suggestions[0].teamA.includes('b')
    || mixed.suggestions[0].teamB.includes('a') && mixed.suggestions[0].teamB.includes('b'));
  assert.ok(mixed.suggestions[0].metrics.fulfilledCoupleIds.includes('couple-1'));

  const men = generateSchedulerPreviews({
    players: [players[0], player('e'), player('f'), player('g')],
    couples,
    targetMatchCount: 1,
    mode: 'men',
    now: NOW,
    seed: 'men'
  });
  assert.equal(men.suggestions.length, 1);
  assert.ok(men.suggestions[0].roster.includes('a'));
  assert.equal(men.suggestions[0].metrics.fulfilledCoupleIds.length, 0);
}

function testUnavailablePartnerDoesNotLeakIntoCoupleMode(): void {
  const result = generateSchedulerPreviews({
    players: [
      player('a', { gender: 'Nam' }),
      player('b', { gender: 'Nữ', endGame: true }),
      player('c', { gender: 'Nam' }),
      player('f', { gender: 'Nam' }),
      player('d', { gender: 'Nữ', level: 4 }),
      player('e', { gender: 'Nữ', level: 4 })
    ],
    couples: [{ id: 'couple-1', memberIds: ['a', 'b'], mode: 'mixed' }],
    targetMatchCount: 1,
    mode: 'mixed',
    now: NOW,
    seed: 2
  });
  assert.equal(result.suggestions.length, 1);
  assert.ok(!result.suggestions[0].roster.includes('a'));
  assert.ok(!result.suggestions[0].roster.includes('b'));
}

function testLowMatchCountOutranksProtectedWait(): void {
  const protectedPlayers = ['a', 'b', 'c', 'd'].map((id) => player(id, {
    deferredCycles: 5,
    matchesPlayed: 3,
    waitingSince: NOW - 9_000_000
  }));
  const lowerMatchPlayers = ['e', 'f', 'g', 'h'].map((id, index) => player(id, {
    matchesPlayed: 1,
    waitingSince: NOW - 60_000 - index,
    nextMatchRequestedAt: NOW - 1000 - index
  }));
  const result = generateSchedulerPreviews({
    players: [...protectedPlayers, ...lowerMatchPlayers],
    targetMatchCount: 1,
    mode: 'men',
    now: NOW,
    seed: 'low-match-count'
  });
  assert.deepEqual([...result.suggestions[0].roster].sort(), ['e', 'f', 'g', 'h']);
  assert.equal(result.suggestions[0].metrics.protectedPlayerIds.length, 0);
}

function testWaitingTimeBreaksTiesAfterMatchCountAndRotation(): void {
  const players = ['a', 'b', 'c', 'd', 'e'].map((id, index) => player(id, {
    matchesPlayed: 1,
    waitingSince: NOW - (60_000 + index * 60_000)
  }));
  const result = generateSchedulerPreviews({
    players,
    targetMatchCount: 1,
    mode: 'men',
    now: NOW,
    seed: 'waiting-tie-break'
  });
  assert.deepEqual([...result.suggestions[0].roster].sort(), ['b', 'c', 'd', 'e']);
}

function testExactQuartetRepeatFallsBackToFreshQuartet(): void {
  const result = generateSchedulerPreviews({
    players: ['a', 'b', 'c', 'd', 'e'].map((id) => player(id)),
    recentMatches: [{ playerIds: ['a', 'b', 'c', 'd'] }],
    targetMatchCount: 1,
    mode: 'men',
    now: NOW,
    seed: 'repeat'
  });
  assert.equal(result.suggestions.length, 1);
  assert.notEqual(result.suggestions[0].quartetSignature, createQuartetSignature(['a', 'b', 'c', 'd']));
  assert.equal(result.suggestions[0].metrics.recentQuartetRank, null);
}

function testImbalancedMatchFallsBackWithWarning(): void {
  const result = generateSchedulerPreviews({
    players: [
      player('a', { level: 1 }),
      player('b', { level: 1 }),
      player('c', { level: 1 }),
      player('d', { level: 6 })
    ],
    targetMatchCount: 1,
    mode: 'men',
    now: NOW,
    seed: 'unbalanced'
  });
  assert.equal(result.suggestions.length, 1);
  assert.ok(result.suggestions[0].metrics.teamGap > 2);
  assert.ok(result.diagnostics.warnings.some((warning) => warning.code === 'BALANCE_FALLBACK_USED'));
}

function testBoundedMultiCourtAndReservations(): void {
  const players = Array.from({ length: 12 }, (_, index) => player(String.fromCharCode(97 + index)));
  const result = generateSchedulerPreviews({
    players,
    reservedPlayerIds: ['a'],
    lockedMatches: [{ id: 'locked', playerIds: ['b', 'c', 'd', 'e'], index: 1 }],
    targetMatchCount: 3,
    mode: 'men',
    now: NOW,
    seed: 'batch'
  });
  assert.equal(result.lockedMatchCount, 1);
  assert.equal(result.suggestions.length, 1);
  const generatedIds = result.suggestions.flatMap((suggestion) => [...suggestion.roster]);
  assert.equal(new Set(generatedIds).size, generatedIds.length);
  assert.ok(!generatedIds.some((id) => ['a', 'b', 'c', 'd', 'e'].includes(id)));
}

function testSeedOnlyDiversifiesEquivalentChoices(): void {
  const players = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => player(id));
  const signatures = new Set(
    Array.from({ length: 12 }, (_, seed) => generateSchedulerPreviews({
      players,
      targetMatchCount: 1,
      mode: 'men',
      now: NOW,
      seed
    }).suggestions[0]?.quartetSignature)
      .filter((signature): signature is string => Boolean(signature))
  );
  assert.ok(signatures.size > 1);
}

function testFourCourtActiveSessionRegression(): void {
  const men = [4, 5, 4, 3, 5, 4, 4, 3, 5, 5, 4]
    .map((level, index) => player(`m${index}`, { gender: 'Nam', level }));
  const women = [3, 3, 2, 2, 2, 3, 2]
    .map((level, index) => player(`w${index}`, { gender: 'Nữ', level, host: index === 1 }));
  const result = generateSchedulerPreviews({
    players: [...men, ...women],
    targetMatchCount: 4,
    mode: 'auto',
    now: NOW,
    seed: 'active-four-courts'
  });

  assert.equal(result.suggestions.length, 4);
  assert.equal(new Set(result.suggestions.flatMap((suggestion) => [...suggestion.roster])).size, 16);
  assert.ok(!result.suggestions.some((suggestion) => suggestion.roster.includes('w1')));
}

function testAutoModeFillsThreeCourtsWithNineMenAndThreeWomen(): void {
  const men = Array.from({ length: 9 }, (_, index) => player(`m${index}`, {
    gender: 'Nam',
    level: 3 + index % 2,
    matchesPlayed: 0
  }));
  const women = Array.from({ length: 3 }, (_, index) => player(`w${index}`, {
    gender: 'Nữ',
    level: 4 + index % 2,
    matchesPlayed: 0
  }));
  const result = generateSchedulerPreviews({
    players: [...men, ...women],
    targetMatchCount: 3,
    mode: 'auto',
    now: NOW,
    seed: 'nine-men-three-women'
  });

  assert.equal(result.suggestions.length, 3);
  assert.equal(new Set(result.suggestions.flatMap((suggestion) => [...suggestion.roster])).size, 12);
  assert.ok(result.suggestions.some((suggestion) => suggestion.metrics.mixedFormatFallback));
}

function testAutoModeKeepsPureFormatsAheadOfCrossFormatFallback(): void {
  const men = Array.from({ length: 6 }, (_, index) => player(`pure-m${index}`, {
    gender: 'Nam',
    level: 3 + index % 2,
    matchesPlayed: 0
  }));
  const women = Array.from({ length: 2 }, (_, index) => player(`pure-w${index}`, {
    gender: 'Nữ',
    level: 4 + index % 2,
    matchesPlayed: 0
  }));
  const result = generateSchedulerPreviews({
    players: [...men, ...women],
    targetMatchCount: 2,
    mode: 'auto',
    now: NOW,
    seed: 'pure-before-cross-format'
  });

  assert.equal(result.suggestions.length, 2);
  assert.ok(result.suggestions.every((suggestion) => !suggestion.metrics.mixedFormatFallback));
}

function testFourCourtBatchRecoversFromOverlappingTopOptions(): void {
  const players = Array.from({ length: 18 }, (_, index) => player(`p${index}`, {
    gender: index < 11 ? 'Nam' : 'Nữ',
    level: 1 + ((index * 3) % 6),
    matchesPlayed: (index * 5) % 7,
    host: index === 12,
    entryPriority: index % 3 !== 0,
    deferredCycles: (index * 2) % 3,
    fairnessOffset: index % 4,
    waitingSince: NOW - (30_000 + index * 10_007)
  }));
  const result = generateSchedulerPreviews({
    players,
    targetMatchCount: 4,
    mode: 'auto',
    now: NOW,
    seed: 'case-0'
  });

  assert.equal(result.suggestions.length, 4);
  assert.equal(new Set(result.suggestions.flatMap((suggestion) => [...suggestion.roster])).size, 16);
}

function testHostFillsOnlyTheFourthCourtWhenRequired(): void {
  const players = Array.from({ length: 16 }, (_, index) => player(`m${index}`, {
    gender: 'Nam',
    level: 3 + (index % 3),
    host: index === 15
  }));
  const result = generateSchedulerPreviews({
    players,
    targetMatchCount: 4,
    mode: 'men',
    now: NOW,
    seed: 'host-fourth-court'
  });

  assert.equal(result.suggestions.length, 4);
  assert.equal(result.suggestions.reduce((total, suggestion) => total + suggestion.metrics.hostCount, 0), 1);
  assert.ok(result.suggestions.some((suggestion) => suggestion.roster.includes('m15')));
}

function testHostRequestAndWaitProtectionNeverDisplaceOrdinaryPlayers(): void {
  const ordinaryPlayers = Array.from({ length: 8 }, (_, index) => player(`ordinary-${index}`, {
    deferredCycles: 0,
    matchesPlayed: 5
  }));
  const host = player('host', {
    host: true,
    deferredCycles: 99,
    matchesPlayed: 0,
    nextMatchRequestedAt: NOW - 1_000_000,
    waitingSince: NOW - 9_000_000
  });
  const result = generateSchedulerPreviews({
    players: [...ordinaryPlayers, host],
    targetMatchCount: 2,
    mode: 'men',
    now: NOW,
    seed: 'host-is-not-owed-a-match'
  });

  assert.equal(result.suggestions.length, 2);
  assert.ok(result.suggestions.every((suggestion) => !suggestion.roster.includes('host')));
}

function testPreviousPreviewPlayersRotateAcrossLargePool(): void {
  const players = Array.from({ length: 26 }, (_, index) => player(`m${index}`, {
    level: 3 + (index % 3),
    waitingSince: NOW - 60_000
  }));
  const previousPlayerIds = players.slice(0, 8).map((item) => item.id);
  const result = generateSchedulerPreviews({
    players,
    previousPreviewPlayerIds: previousPlayerIds,
    targetMatchCount: 2,
    mode: 'men',
    now: NOW,
    seed: 'rotate-large-pool'
  });

  assert.equal(result.suggestions.length, 2);
  assert.equal(result.suggestions.flatMap((suggestion) => [...suggestion.roster]).filter((id) => previousPlayerIds.includes(id)).length, 0);
}

function run(): void {
  testEligibilityAndFairMatches();
  testCoupleOnlyConstrainsItsMode();
  testUnavailablePartnerDoesNotLeakIntoCoupleMode();
  testLowMatchCountOutranksProtectedWait();
  testWaitingTimeBreaksTiesAfterMatchCountAndRotation();
  testExactQuartetRepeatFallsBackToFreshQuartet();
  testImbalancedMatchFallsBackWithWarning();
  testBoundedMultiCourtAndReservations();
  testSeedOnlyDiversifiesEquivalentChoices();
  testFourCourtActiveSessionRegression();
  testAutoModeFillsThreeCourtsWithNineMenAndThreeWomen();
  testAutoModeKeepsPureFormatsAheadOfCrossFormatFallback();
  testFourCourtBatchRecoversFromOverlappingTopOptions();
  testHostFillsOnlyTheFourthCourtWhenRequired();
  testHostRequestAndWaitProtectionNeverDisplaceOrdinaryPlayers();
  testPreviousPreviewPlayersRotateAcrossLargePool();
}

test('Runtime Scheduler fairness, Couple, anti-repeat, lock and variants', run);
