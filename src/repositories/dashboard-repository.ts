import { prisma } from '@/lib/prisma';
import { toTimeInput } from '@/lib/date-format';
import { normalizeSessionStatus } from '@/lib/session-status';
import type { DashboardSummary } from '@/types/domain';

type DashboardPeriod = 'MONTH' | 'YEAR';

function toNumber(value: unknown): number {
  return Number(value ?? 0);
}

function toDateInput(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function getPeriodRange(period: DashboardPeriod, month?: string | null, year?: string | null): { start: Date; end: Date; label: string } {
  const now = new Date();
  if (period === 'YEAR') {
    const selectedYear = Number(year || now.getFullYear());
    return {
      start: new Date(Date.UTC(selectedYear, 0, 1)),
      end: new Date(Date.UTC(selectedYear + 1, 0, 1)),
      label: `Năm ${selectedYear}`
    };
  }

  const [rawYear, rawMonth] = (month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`).split('-').map(Number);
  const selectedYear = rawYear || now.getFullYear();
  const selectedMonth = rawMonth || now.getMonth() + 1;
  return {
    start: new Date(Date.UTC(selectedYear, selectedMonth - 1, 1)),
    end: new Date(Date.UTC(selectedYear, selectedMonth, 1)),
    label: `Tháng ${String(selectedMonth).padStart(2, '0')}/${selectedYear}`
  };
}

function getCategoryLabel(category: string): string {
  if (category === 'COURT_FEE') return 'Sân';
  if (category === 'SHUTTLECOCK' || category === 'SHUTTLECOCK_USAGE') return 'Cầu';
  if (category === 'SESSION_FEE') return 'Slot';
  return 'Khác';
}

function buildDailyFinance(transactions: Array<{ created_at: Date | null; transaction_type: string; total_amount: unknown }>, start: Date, end: Date): DashboardSummary['dailyFinance'] {
  const byDate = new Map<string, { income: number; expense: number }>();
  for (let cursor = new Date(start); cursor < end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    byDate.set(toDateInput(cursor), { income: 0, expense: 0 });
  }

  transactions.forEach((transaction) => {
    if (!transaction.created_at) return;
    const key = toDateInput(transaction.created_at);
    const current = byDate.get(key);
    if (!current) return;
    if (transaction.transaction_type === 'INCOME') current.income += toNumber(transaction.total_amount);
    if (transaction.transaction_type === 'EXPENSE') current.expense += toNumber(transaction.total_amount);
  });

  return Array.from(byDate.entries()).map(([date, value]) => ({
    date,
    label: date.slice(8, 10),
    income: value.income,
    expense: value.expense,
    profit: value.income - value.expense
  }));
}

export async function getDashboardSummary(options: { period?: DashboardPeriod; month?: string | null; year?: string | null } = {}): Promise<DashboardSummary> {
  const period = options.period === 'YEAR' ? 'YEAR' : 'MONTH';
  const range = getPeriodRange(period, options.month, options.year);

  const [
    playDates,
    sessions,
    activeSessions,
    players,
    periodTransactions,
    unpaidRows,
    inventoryProducts,
    inventoryRows,
    recentSessions,
    activeSessionRows
  ] = await Promise.all([
    prisma.play_dates.count({ where: { play_date: { gte: range.start, lt: range.end } } }),
    prisma.play_sessions.count({ where: { play_dates: { play_date: { gte: range.start, lt: range.end } } } }),
    prisma.play_sessions.count({ where: { status: { in: ['ACTIVE', 'LIVE', 'IN_PROGRESS'] } } }),
    prisma.session_players.count({ where: { play_sessions: { play_dates: { play_date: { gte: range.start, lt: range.end } } } } }),
    prisma.session_transactions.findMany({
      where: { created_at: { gte: range.start, lt: range.end } },
      select: { transaction_type: true, category: true, total_amount: true, created_at: true }
    }),
    prisma.session_players.aggregate({
      _sum: { payment_amount: true },
      where: {
        payment_status: { not: 'PAID' },
        play_sessions: { play_dates: { play_date: { gte: range.start, lt: range.end } } }
      }
    }),
    prisma.shuttlecock_products.count(),
    prisma.shuttlecock_inventory.findMany({
      include: { shuttlecock_products: true }
    }),
    prisma.play_sessions.findMany({
      take: 8,
      orderBy: [{ play_dates: { play_date: 'desc' } }, { start_time: 'asc' }],
      include: { play_dates: true, session_players: true }
    }),
    prisma.play_sessions.findMany({
      where: { status: { in: ['ACTIVE', 'LIVE', 'IN_PROGRESS'] } },
      take: 5,
      orderBy: [{ updated_at: 'desc' }],
      include: { play_dates: true }
    })
  ]);

  const inventory = inventoryRows.reduce(
    (acc, row) => {
      const pieces = row.quantity_ball;
      const value = pieces * toNumber(row.avg_cost_per_ball);
      const ballsPerTube = row.shuttlecock_products.balls_per_tube;
      return {
        pieces: acc.pieces + pieces,
        tubes: acc.tubes + Math.floor(pieces / ballsPerTube),
        looseBalls: acc.looseBalls + (pieces % ballsPerTube),
        value: acc.value + value
      };
    },
    { pieces: 0, tubes: 0, looseBalls: 0, value: 0 }
  );

  const totalIncome = periodTransactions.filter((row) => row.transaction_type === 'INCOME').reduce((total, row) => total + toNumber(row.total_amount), 0);
  const totalExpense = periodTransactions.filter((row) => row.transaction_type === 'EXPENSE').reduce((total, row) => total + toNumber(row.total_amount), 0);

  const costByCategory = new Map<string, number>();
  periodTransactions
    .filter((row) => row.transaction_type === 'EXPENSE')
    .forEach((row) => costByCategory.set(row.category, (costByCategory.get(row.category) ?? 0) + toNumber(row.total_amount)));

  const lowStockProducts = inventoryRows
    .filter((row) => row.quantity_ball <= row.shuttlecock_products.balls_per_tube * 2)
    .map((row) => ({
      id: row.shuttlecock_product_id,
      name: row.shuttlecock_products.name,
      quantityBall: row.quantity_ball,
      ballsPerTube: row.shuttlecock_products.balls_per_tube,
      stockValue: row.quantity_ball * toNumber(row.avg_cost_per_ball)
    }))
    .sort((left, right) => left.quantityBall - right.quantityBall)
    .slice(0, 3);

  const alerts: DashboardSummary['alerts'] = [];
  activeSessionRows.forEach((session) => {
    alerts.push({
      id: `active-${session.id}`,
      tone: 'info',
      title: 'Ca đang hoạt động',
      detail: `${session.name} · ${toDateInput(session.play_dates.play_date)}`,
      href: `/sessions/${session.id}`
    });
  });
  if (toNumber(unpaidRows._sum.payment_amount) > 0) {
    alerts.push({
      id: 'unpaid',
      tone: 'warning',
      title: 'Còn tiền chưa thu',
      detail: `${Math.round(toNumber(unpaidRows._sum.payment_amount)).toLocaleString('vi-VN')}đ trong ${range.label}`,
      href: '/finance'
    });
  }
  lowStockProducts.forEach((product) => {
    alerts.push({
      id: `stock-${product.id}`,
      tone: 'danger',
      title: 'Kho cầu thấp',
      detail: `${product.name} còn ${product.quantityBall} quả`,
      href: '/inventory'
    });
  });

  return {
    playDates,
    sessions,
    activeSessions,
    players,
    totalIncome,
    totalExpense,
    totalProfit: totalIncome - totalExpense,
    unpaidAmount: toNumber(unpaidRows._sum.payment_amount),
    inventoryProducts,
    inventoryPieces: inventory.pieces,
    inventoryTubes: inventory.tubes,
    inventoryLooseBalls: inventory.looseBalls,
    inventoryValue: inventory.value,
    periodLabel: range.label,
    costBreakdown: Array.from(costByCategory.entries())
      .map(([category, amount]) => ({ category, label: getCategoryLabel(category), amount }))
      .sort((left, right) => right.amount - left.amount),
    dailyFinance: buildDailyFinance(periodTransactions, range.start, range.end),
    recentSessions: recentSessions.map((session) => {
      const expectedAmount = session.session_players.reduce((total, player) => total + Math.max(0, toNumber(player.payment_amount) - toNumber(player.discount)), 0);
      const paidAmount = session.session_players.reduce((total, player) => {
        if (player.payment_status !== 'PAID') return total;
        return total + Math.max(0, toNumber(player.payment_amount) - toNumber(player.discount));
      }, 0);

      return {
        id: session.id,
        playDateId: session.play_date_id,
        playDate: toDateInput(session.play_dates.play_date),
        name: session.name,
        startTime: toTimeInput(session.start_time),
        endTime: toTimeInput(session.end_time),
        status: normalizeSessionStatus(session.status),
        playerCount: session.session_players.length,
        paidAmount,
        expectedAmount,
        totalIncome: toNumber(session.total_income),
        totalExpense: toNumber(session.total_expense),
        totalProfit: toNumber(session.total_profit)
      };
    }),
    alerts: alerts.slice(0, 6),
    lowStockProducts
  };
}
