import { afterEach, describe, expect, test } from 'vitest';

import { generateCourts, useBadmintonStore, type Player } from './badminton-store';
import { normalizePlayerTags, togglePlayerTag } from './player-tags';

function player(id: string, overrides: Partial<Player> = {}): Player {
  return {
    id,
    name: id,
    gender: 'Nam',
    level: 3,
    setsPlayed: 0,
    matchesPlayed: 0,
    money: 0,
    paymentStatus: 'UNPAID',
    paymentType: 'TM',
    discount: 0,
    note: '',
    playerTags: ['ARRIVED'],
    status: 'WAITING',
    fatigue: 0,
    lastCourt: null,
    statusUpdatedAt: 1,
    justFinishedAt: null,
    restUntil: null,
    avatarUrl: null,
    avatarS3Key: null,
    firstArrivedAt: 1,
    arrivalBaselineMatches: 0,
    fairnessOffset: 0,
    deferredRounds: 0,
    waitingSince: 1,
    entryPriorityConsumedAt: 1,
    lastFinishedAt: null,
    nextMatchRequestedAt: null,
    nextMatchRequestMode: null,
    endGameAt: null,
    endGameAfterMatch: false,
    coupleNumber: null,
    coupleMatchMode: null,
    ...overrides
  };
}

function seedStore() {
  useBadmintonStore.setState({
    session: { title: 'Test', timeRange: '', round: 1, courtCount: 1, status: 'ACTIVE' },
    runtimeSessionId: 'test-session',
    players: ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => player(id)),
    courts: generateCourts(1),
    nextMatches: [],
    suggestionMode: 'men',
    history: [],
    recentQuartets: [],
    runtimeVersion: 0,
    suggestionGeneration: 0
  });
}

afterEach(() => {
  useBadmintonStore.setState({ players: [], courts: [], nextMatches: [], recentQuartets: [] });
});

describe('Runtime Scheduler store integration', () => {
  test('keeps a held roster unchanged across refresh and mode selection', () => {
    seedStore();
    useBadmintonStore.getState().refreshNextMatches('men');
    const initial = useBadmintonStore.getState().nextMatches[0];
    expect(initial?.roster).toHaveLength(4);

    useBadmintonStore.getState().toggleNextMatchLock(initial.id);
    useBadmintonStore.getState().refreshNextMatches('random');

    const held = useBadmintonStore.getState().nextMatches.find((match) => match.id === initial.id);
    expect(held?.locked).toBe(true);
    expect(held?.roster).toEqual(initial.roster);
  });

  test('creates a real alternative on repeated Auto gợi ý when alternatives exist', () => {
    seedStore();
    useBadmintonStore.getState().refreshNextMatches('men');
    const firstSignature = [...useBadmintonStore.getState().nextMatches[0].roster].sort().join(':');

    useBadmintonStore.getState().refreshNextMatches('men');
    const secondSignature = [...useBadmintonStore.getState().nextMatches[0].roster].sort().join(':');

    expect(secondSignature).not.toBe(firstSignature);
  });

  test('fills four suggestions for a four-court session when sixteen free players can be scheduled', () => {
    const onCourt = ['ready-a', 'ready-b', 'ready-c', 'ready-d'].map((id) => player(id, { status: 'PRIORITY' }));
    const men = [4, 5, 4, 3, 5, 4, 4, 3, 5, 5, 4]
      .map((level, index) => player(`m${index}`, { gender: 'Nam', level }));
    const women = [3, 3, 2, 2, 2, 3, 2]
      .map((level, index) => player(`w${index}`, { gender: 'Nữ', level, playerTags: index === 1 ? ['ARRIVED', 'HOST'] : ['ARRIVED'] }));
    const courts = generateCourts(4);
    courts[0] = { ...courts[0], status: 'READY', slots: ['ready-a', 'ready-b', 'ready-c', 'ready-d'] };
    useBadmintonStore.setState({
      session: { title: '4 sân', timeRange: '', round: 1, courtCount: 4, status: 'ACTIVE' },
      runtimeSessionId: 'four-court-session',
      players: [...onCourt, ...men, ...women],
      courts,
      nextMatches: [],
      suggestionMode: 'random',
      history: [],
      recentQuartets: [],
      runtimeVersion: 0,
      suggestionGeneration: 0
    });

    useBadmintonStore.getState().refreshNextMatches('random');
    const suggestions = useBadmintonStore.getState().nextMatches;

    expect(suggestions).toHaveLength(4);
    expect(new Set(suggestions.flatMap((match) => match.roster)).size).toBe(16);
    expect(suggestions.some((match) => match.roster.includes('w1'))).toBe(false);
  });

  test('fills and applies three Auto suggestions for nine men and three women', () => {
    const men = Array.from({ length: 9 }, (_, index) => player(`auto-m${index}`, {
      gender: 'Nam',
      level: 3 + index % 2
    }));
    const women = Array.from({ length: 3 }, (_, index) => player(`auto-w${index}`, {
      gender: 'Nữ',
      level: 4 + index % 2
    }));
    useBadmintonStore.setState({
      session: { title: '9 nam 3 nữ', timeRange: '', round: 1, courtCount: 3, status: 'ACTIVE' },
      runtimeSessionId: 'nine-men-three-women-session',
      players: [...men, ...women],
      courts: generateCourts(3),
      nextMatches: [],
      suggestionMode: 'random',
      history: [],
      recentQuartets: [],
      runtimeVersion: 0,
      suggestionGeneration: 0
    });

    expect(useBadmintonStore.getState().refreshNextMatches('random').changed).toBe(true);
    const suggestions = useBadmintonStore.getState().nextMatches;
    expect(suggestions).toHaveLength(3);
    expect(new Set(suggestions.flatMap((match) => match.roster)).size).toBe(12);
    const fallback = suggestions.find((match) => match.matchFormat === 'AUTO');
    expect(fallback).toBeDefined();
    expect(useBadmintonStore.getState().applyNextMatch(fallback!.id, 'c1').changed).toBe(true);
    expect(useBadmintonStore.getState().courts[0].slots).toEqual(fallback!.roster);
  });

  test('keeps remaining previews and tops the queue up after applying one to a court', () => {
    const players = Array.from({ length: 24 }, (_, index) => player(`p${index}`, {
      level: 3 + (index % 3)
    }));
    useBadmintonStore.setState({
      session: { title: 'Top up', timeRange: '', round: 1, courtCount: 4, status: 'ACTIVE' },
      runtimeSessionId: 'top-up-session',
      players,
      courts: generateCourts(4),
      nextMatches: [],
      suggestionMode: 'men',
      history: [],
      recentQuartets: [],
      runtimeVersion: 0,
      suggestionGeneration: 0
    });
    useBadmintonStore.getState().refreshNextMatches('men');
    const initial = useBadmintonStore.getState().nextMatches;
    const applied = initial[0];
    const preserved = initial.slice(1).map((match) => ({ id: match.id, roster: match.roster }));

    useBadmintonStore.getState().applyNextMatch(applied.id, 'c1');
    const state = useBadmintonStore.getState();

    expect(state.courts[0].slots).toEqual(applied.roster);
    expect(state.nextMatches).toHaveLength(4);
    preserved.forEach((match, index) => {
      expect(state.nextMatches[index]?.id).toBe(match.id);
      expect(state.nextMatches[index]?.index).toBe(index + 1);
      expect(state.nextMatches[index]?.roster).toEqual(match.roster);
    });
    expect(state.nextMatches[3]?.id).not.toBe(applied.id);
    expect(new Set(state.nextMatches.flatMap((match) => match.roster)).size).toBe(16);
    expect(state.nextMatches.flatMap((match) => match.roster).some((id) => applied.roster.includes(id))).toBe(false);
  });

  test('restores a cancelled ready court at the front as an exact locked preview', () => {
    const players = Array.from({ length: 20 }, (_, index) => player(`p${index}`, { level: 3 + (index % 3) }));
    useBadmintonStore.setState({
      session: { title: 'Cancel restore', timeRange: '', round: 1, courtCount: 4, status: 'ACTIVE' },
      runtimeSessionId: 'cancel-restore-session',
      players,
      courts: generateCourts(4),
      nextMatches: [],
      suggestionMode: 'men',
      history: [],
      recentQuartets: [],
      runtimeVersion: 0,
      suggestionGeneration: 0
    });
    useBadmintonStore.getState().refreshNextMatches('men');
    const initial = useBadmintonStore.getState().nextMatches;
    const applied = initial[0];
    useBadmintonStore.getState().applyNextMatch(applied.id, 'c1');

    useBadmintonStore.getState().cancelReadyCourt('c1');
    const state = useBadmintonStore.getState();

    expect(state.courts[0].status).toBe('EMPTY');
    expect(state.nextMatches[0]?.roster).toEqual(applied.roster);
    expect(state.nextMatches[0]?.locked).toBe(true);
    expect(state.nextMatches[0]?.index).toBe(1);
    expect(state.nextMatches).toHaveLength(4);
    expect(new Set(state.nextMatches.flatMap((match) => match.roster)).size).toBe(16);

    const restoredId = state.nextMatches[0].id;
    useBadmintonStore.getState().refreshNextMatches('men');
    expect(useBadmintonStore.getState().nextMatches[0]?.id).toBe(restoredId);
    expect(useBadmintonStore.getState().nextMatches[0]?.roster).toEqual(applied.roster);
  });

  test('keeps all operator locks when a cancelled court temporarily overflows the preview target', () => {
    const players = Array.from({ length: 20 }, (_, index) => player(`p${index}`, { level: 3 + (index % 3) }));
    useBadmintonStore.setState({
      session: { title: 'Lock overflow', timeRange: '', round: 1, courtCount: 4, status: 'ACTIVE' },
      runtimeSessionId: 'lock-overflow-session',
      players,
      courts: generateCourts(4),
      nextMatches: [],
      suggestionMode: 'men',
      history: [],
      recentQuartets: [],
      runtimeVersion: 0,
      suggestionGeneration: 0
    });
    useBadmintonStore.getState().refreshNextMatches('men');
    const originalMatches = useBadmintonStore.getState().nextMatches;
    const applied = originalMatches[0];
    useBadmintonStore.getState().applyNextMatch(applied.id, 'c1');
    useBadmintonStore.setState((state) => ({
      nextMatches: state.nextMatches.map((match) => ({ ...match, locked: true }))
    }));
    const lockedIds = useBadmintonStore.getState().nextMatches.map((match) => match.id);

    useBadmintonStore.getState().cancelReadyCourt('c1');
    const state = useBadmintonStore.getState();

    expect(state.nextMatches).toHaveLength(5);
    expect(state.nextMatches.every((match) => match.locked)).toBe(true);
    expect(state.nextMatches.slice(1).map((match) => match.id)).toEqual(lockedIds);
    expect(new Set(state.nextMatches.flatMap((match) => match.roster)).size).toBe(20);
  });

  test('regenerates four previews for seventeen eligible players outside four ready courts', () => {
    const onCourt = Array.from({ length: 16 }, (_, index) => player(`court-${index}`, {
      status: 'PRIORITY',
      level: 3 + (index % 3)
    }));
    const outsideMen = Array.from({ length: 16 }, (_, index) => player(`outside-${index}`, {
      level: 3 + (index % 3),
      playerTags: index === 15 ? ['ARRIVED', 'HOST'] : ['ARRIVED']
    }));
    const outsideWoman = player('outside-woman', { gender: 'Nữ', level: 3 });
    const courts = generateCourts(4).map((court, courtIndex) => ({
      ...court,
      status: 'READY' as const,
      slots: onCourt.slice(courtIndex * 4, courtIndex * 4 + 4).map((item) => item.id) as [string, string, string, string]
    }));
    useBadmintonStore.setState({
      session: { title: '17 ngoài sân', timeRange: '', round: 1, courtCount: 4, status: 'ACTIVE' },
      runtimeSessionId: 'seventeen-outside-session',
      players: [...onCourt, ...outsideMen, outsideWoman],
      courts,
      nextMatches: [],
      suggestionMode: 'men',
      history: [],
      recentQuartets: [],
      runtimeVersion: 0,
      suggestionGeneration: 0
    });

    useBadmintonStore.getState().refreshNextMatches('men');
    const suggestions = useBadmintonStore.getState().nextMatches;

    expect(suggestions).toHaveLength(4);
    expect(new Set(suggestions.flatMap((match) => match.roster)).size).toBe(16);
    expect(suggestions.some((match) => match.roster.includes('outside-15'))).toBe(true);
    expect(suggestions.some((match) => match.roster.includes('outside-woman'))).toBe(false);
  });

  test('returns completed players directly to waiting and records soft rest time', () => {
    seedStore();
    useBadmintonStore.setState((state) => ({
      players: state.players.map((item) => ['a', 'b', 'c', 'd'].includes(item.id) ? { ...item, status: 'PLAYING' as const } : item),
      courts: [{ ...state.courts[0], status: 'PLAYING', slots: ['a', 'b', 'c', 'd'], startedAt: Date.now() - 1000 }]
    }));

    useBadmintonStore.getState().endMatch('c1');
    const completed = useBadmintonStore.getState().players.filter((item) => ['a', 'b', 'c', 'd'].includes(item.id));

    expect(completed.every((item) => item.status === 'WAITING')).toBe(true);
    expect(completed.every((item) => item.lastFinishedAt !== null)).toBe(true);
    expect(completed.every((item) => item.matchesPlayed === 1)).toBe(true);
  });

  test('keeps replacement players waiting and allows the edited preview to be applied', () => {
    const players = Array.from({ length: 8 }, (_, index) => player(`p${index}`));
    useBadmintonStore.setState({
      session: { title: 'Replace apply', timeRange: '', round: 1, courtCount: 1, status: 'ACTIVE' },
      runtimeSessionId: 'replace-apply-session',
      players,
      courts: generateCourts(1),
      nextMatches: [],
      suggestionMode: 'men',
      history: [],
      recentQuartets: [],
      runtimeVersion: 0,
      suggestionGeneration: 0
    });
    useBadmintonStore.getState().refreshNextMatches('men');
    const match = useBadmintonStore.getState().nextMatches[0];
    const replacement = players.find((candidate) => !match.roster.includes(candidate.id))!;
    const draftRoster = [...match.roster];
    draftRoster[0] = replacement.id;

    const replaceResult = useBadmintonStore.getState().replaceNextMatchRoster(match.id, draftRoster);
    expect(replaceResult.changed).toBe(true);
    expect(useBadmintonStore.getState().players.find((candidate) => candidate.id === replacement.id)?.status).toBe('WAITING');

    const applyResult = useBadmintonStore.getState().applyNextMatch(match.id, 'c1');
    expect(applyResult.changed).toBe(true);
    expect(useBadmintonStore.getState().courts[0].slots).toEqual(draftRoster);
  });

  test('does not strand an edited preview player in PRIORITY after Auto refresh', () => {
    seedStore();
    useBadmintonStore.getState().refreshNextMatches('men');
    const match = useBadmintonStore.getState().nextMatches[0];
    const replacement = useBadmintonStore.getState().players.find((candidate) => !match.roster.includes(candidate.id))!;
    const draftRoster = [...match.roster];
    draftRoster[0] = replacement.id;
    useBadmintonStore.getState().replaceNextMatchRoster(match.id, draftRoster);

    useBadmintonStore.getState().refreshNextMatches('men');
    expect(useBadmintonStore.getState().players.every((candidate) => candidate.status !== 'PRIORITY')).toBe(true);
  });

  test('blocks starting a ready court after one player becomes End-Game', () => {
    seedStore();
    useBadmintonStore.getState().refreshNextMatches('men');
    const match = useBadmintonStore.getState().nextMatches[0];
    expect(useBadmintonStore.getState().applyNextMatch(match.id, 'c1').changed).toBe(true);
    const blockedPlayerId = match.roster[0];
    useBadmintonStore.getState().updatePlayer(blockedPlayerId, { playerTags: ['ARRIVED', 'END_GAME'] });

    const startResult = useBadmintonStore.getState().startMatch('c1');
    expect(startResult.changed).toBe(false);
    expect(startResult.errors).toContain('PLAYER_END_GAME');
    expect(useBadmintonStore.getState().courts[0].status).toBe('READY');
  });

  test('restores an unavailable cancelled player as a stale lock without reactivating them', () => {
    seedStore();
    useBadmintonStore.getState().refreshNextMatches('men');
    const match = useBadmintonStore.getState().nextMatches[0];
    expect(useBadmintonStore.getState().applyNextMatch(match.id, 'c1').changed).toBe(true);
    const unavailablePlayerId = match.roster[0];
    useBadmintonStore.getState().updatePlayer(unavailablePlayerId, { playerTags: ['ARRIVED', 'END_GAME'] });

    useBadmintonStore.getState().cancelReadyCourt('c1');
    const state = useBadmintonStore.getState();
    expect(state.players.find((candidate) => candidate.id === unavailablePlayerId)?.status).toBe('FINISHED');
    expect(state.nextMatches[0]?.roster).toEqual(match.roster);
    expect(state.nextMatches[0]?.locked).toBe(true);
    expect(state.nextMatches[0]?.validity).toBe('STALE');
  });

  test('can replace a cancelled lock with an orphan PRIORITY preview player and apply it again', () => {
    const players = Array.from({ length: 12 }, (_, index) => player(`p${index}`));
    useBadmintonStore.setState({
      session: { title: 'Cancel replace apply', timeRange: '', round: 1, courtCount: 2, status: 'ACTIVE' },
      runtimeSessionId: 'cancel-replace-apply-session',
      players,
      courts: generateCourts(2),
      nextMatches: [],
      suggestionMode: 'men',
      history: [],
      recentQuartets: [],
      runtimeVersion: 4,
      suggestionGeneration: 0
    });
    useBadmintonStore.getState().refreshNextMatches('men');
    const firstMatch = useBadmintonStore.getState().nextMatches[0];
    const secondMatch = useBadmintonStore.getState().nextMatches[1];
    expect(useBadmintonStore.getState().applyNextMatch(firstMatch.id, 'c1').changed).toBe(true);

    const orphanPriorityId = secondMatch.roster[0];
    useBadmintonStore.setState((state) => ({
      players: state.players.map((candidate) => candidate.id === orphanPriorityId
        ? { ...candidate, status: 'PRIORITY' as const }
        : candidate)
    }));
    useBadmintonStore.getState().cancelReadyCourt('c1');

    const restored = useBadmintonStore.getState().nextMatches[0];
    const replacementRoster = [...restored.roster];
    replacementRoster[0] = orphanPriorityId;
    const replaceResult = useBadmintonStore.getState().replaceNextMatchRoster(restored.id, replacementRoster);
    expect(replaceResult.changed).toBe(true);
    expect(useBadmintonStore.getState().players.find((candidate) => candidate.id === orphanPriorityId)?.status).toBe('WAITING');

    const applyResult = useBadmintonStore.getState().applyNextMatch(restored.id, 'c1');
    expect(applyResult.changed).toBe(true);
    expect(useBadmintonStore.getState().courts[0]?.slots).toEqual(replacementRoster);
  });

  test('atomically swaps players across locked previews and preserves every Lock', () => {
    const players = Array.from({ length: 12 }, (_, index) => player(`locked-${index}`, { level: 3 + (index % 2) }));
    useBadmintonStore.setState({
      session: { title: 'Manual locked swap', timeRange: '', round: 1, courtCount: 3, status: 'ACTIVE' },
      runtimeSessionId: 'manual-locked-swap-session',
      players,
      courts: generateCourts(3),
      nextMatches: [],
      suggestionMode: 'men',
      history: [],
      recentQuartets: [],
      runtimeVersion: 7,
      suggestionGeneration: 0
    });
    useBadmintonStore.getState().refreshNextMatches('men');
    useBadmintonStore.setState((state) => ({
      nextMatches: state.nextMatches.map((match) => ({ ...match, locked: true }))
    }));
    const before = useBadmintonStore.getState().nextMatches;
    const target = before[0];
    const source = before[1];
    const outgoingId = target.roster[0];
    const incomingId = source.roster[0];
    const roster = [...target.roster];
    roster[0] = incomingId;

    const result = useBadmintonStore.getState().replaceNextMatchRoster(target.id, roster);
    const after = useBadmintonStore.getState().nextMatches;
    const changedTarget = after.find((match) => match.id === target.id)!;
    const changedSource = after.find((match) => match.id === source.id)!;

    expect(result.changed).toBe(true);
    expect(after.every((match) => match.locked)).toBe(true);
    expect(changedTarget.roster).toContain(incomingId);
    expect(changedTarget.roster).not.toContain(outgoingId);
    expect(changedSource.roster).toContain(outgoingId);
    expect(changedSource.roster).not.toContain(incomingId);
    expect(new Set(after.flatMap((match) => match.roster)).size).toBe(12);
  });

  test('keeps a manual locked format override applicable with a warning', () => {
    seedStore();
    useBadmintonStore.getState().refreshNextMatches('men');
    const original = useBadmintonStore.getState().nextMatches[0];
    useBadmintonStore.getState().toggleNextMatchLock(original.id);
    useBadmintonStore.getState().updatePlayer(original.roster[0], { gender: 'Nữ' });

    const edited = useBadmintonStore.getState().nextMatches.find((match) => match.id === original.id)!;
    expect(edited.locked).toBe(true);
    expect(edited.matchFormat).toBe('AUTO');
    expect(edited.validity).toBe('WARNING');
    expect(edited.warningCodes).toContain('FORMAT_MISMATCH');
    expect(useBadmintonStore.getState().applyNextMatch(edited.id, 'c1').changed).toBe(true);
  });

  test('does not grant automatic deferred protection to Host when a match starts', () => {
    seedStore();
    useBadmintonStore.setState((state) => ({
      players: state.players.map((candidate) => candidate.id === 'f'
        ? { ...candidate, playerTags: ['ARRIVED', 'HOST'], deferredRounds: 4 }
        : candidate)
    }));
    useBadmintonStore.getState().refreshNextMatches('men');
    const match = useBadmintonStore.getState().nextMatches[0];
    expect(useBadmintonStore.getState().applyNextMatch(match.id, 'c1').changed).toBe(true);
    expect(useBadmintonStore.getState().startMatch('c1').changed).toBe(true);
    expect(useBadmintonStore.getState().players.find((candidate) => candidate.id === 'f')?.deferredRounds).toBe(4);
  });

  test('marks Host as arrived while keeping Trận kế separate from attendance', () => {
    const hostTags = togglePlayerTag(['NOT_ARRIVED'], 'HOST');
    const requestTags = togglePlayerTag(['NOT_ARRIVED'], 'PRIORITY');

    expect(normalizePlayerTags(hostTags)).toEqual(expect.arrayContaining(['ARRIVED', 'HOST']));
    expect(normalizePlayerTags(requestTags)).toEqual(expect.arrayContaining(['NOT_ARRIVED', 'PRIORITY']));
    expect(normalizePlayerTags(hostTags)).not.toContain('NOT_ARRIVED');
    expect(normalizePlayerTags(requestTags)).not.toContain('ARRIVED');
  });

  test('scales the candidate cohort to fill seven men courts', () => {
    const players = Array.from({ length: 32 }, (_, index) => player(`m${index}`, { level: 2 + (index % 4) }));
    useBadmintonStore.setState({
      session: { title: 'Seven courts', timeRange: '', round: 1, courtCount: 7, status: 'ACTIVE' },
      runtimeSessionId: 'seven-court-session',
      players,
      courts: generateCourts(7),
      nextMatches: [],
      suggestionMode: 'men',
      history: [],
      recentQuartets: [],
      runtimeVersion: 0,
      suggestionGeneration: 0
    });

    const result = useBadmintonStore.getState().refreshNextMatches('men');
    expect(result.changed).toBe(true);
    expect(useBadmintonStore.getState().nextMatches).toHaveLength(7);
    expect(new Set(useBadmintonStore.getState().nextMatches.flatMap((match) => match.roster)).size).toBe(28);
  });
});
