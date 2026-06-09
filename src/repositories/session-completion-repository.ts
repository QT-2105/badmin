import { prisma } from '@/lib/prisma';
import { getPlaySession } from '@/repositories/play-sessions-repository';
import type { PlaySessionSummary } from '@/types/domain';

function toNumber(value: unknown): number {
  return Number(value ?? 0);
}

export async function completePlaySession(input: {
  sessionId: string;
  courtCost: number;
  shuttlecockProductId: string;
  shuttlecockPiecesUsed: number;
  autoCreateCourtFeeTransaction?: boolean;
  autoCreateShuttlecockUsageTransaction?: boolean;
}): Promise<PlaySessionSummary> {
  const courtCost = Number(input.courtCost);
  const shuttlecockPiecesUsed = Math.floor(Number(input.shuttlecockPiecesUsed));
  const autoCreateCourtFeeTransaction = input.autoCreateCourtFeeTransaction !== false;
  const autoCreateShuttlecockUsageTransaction = input.autoCreateShuttlecockUsageTransaction !== false;

  if (!Number.isFinite(courtCost) || courtCost <= 0) {
    throw new Error('Vui lòng nhập chi phí sân');
  }

  if (!input.shuttlecockProductId) {
    throw new Error('Vui lòng chọn loại cầu hao');
  }

  if (!Number.isFinite(shuttlecockPiecesUsed) || shuttlecockPiecesUsed <= 0) {
    throw new Error('Vui lòng nhập số lượng cầu hao');
  }

  await prisma.$transaction(async (tx) => {
    const session = await tx.play_sessions.findUnique({
      where: { id: input.sessionId },
      include: { session_players: true, play_dates: true }
    });
    if (!session) throw new Error('Session not found');
    if (session.status === 'FINISHED') throw new Error('Ca chơi đã hoàn tất');
    if (session.status !== 'LIVE') throw new Error('Chỉ có thể hoàn tất ca đang hoạt động');

    const product = await tx.shuttlecock_products.findUnique({
      where: { id: input.shuttlecockProductId },
      include: { shuttlecock_inventory: true }
    });
    if (!product) throw new Error('Không tìm thấy loại cầu');

    const inventory = product.shuttlecock_inventory;
    const currentQuantityBall = inventory?.quantity_ball ?? 0;
    if (currentQuantityBall < shuttlecockPiecesUsed) {
      throw new Error(`Kho cầu không đủ. Còn ${currentQuantityBall} quả, cần ${shuttlecockPiecesUsed} quả`);
    }

    const nextQuantityBall = currentQuantityBall - shuttlecockPiecesUsed;
    const shuttlecockCostPerBall = toNumber(inventory?.avg_cost_per_ball);
    const shuttlecockUsagePricePerBall = toNumber(inventory?.avg_usage_price_per_ball);
    if (shuttlecockUsagePricePerBall <= 0) {
      throw new Error('Loại cầu chưa có giá cầu hao bình quân. Vui lòng nhập kho cầu trước khi hoàn tất ca');
    }
    const shuttlecockCost = shuttlecockPiecesUsed * shuttlecockUsagePricePerBall;
    const slotIncome = session.session_players.reduce((total, player) => {
      if (player.payment_status !== 'PAID') return total;
      return total + Math.max(0, toNumber(player.payment_amount) - toNumber(player.discount));
    }, 0);
    const dateLabel = session.play_dates.play_date.toLocaleDateString('vi-VN');
    const startLabel = session.start_time.toISOString().slice(11, 16);
    const endLabel = session.end_time.toISOString().slice(11, 16);
    const sessionLabel = `${startLabel}-${endLabel} - ${dateLabel}`;
    const incomeTitle = `Thu SLOT vãng lai ca ${sessionLabel}`;
    const courtTitle = `Chi SÂN vãng lai ca ${sessionLabel}`;
    const shuttlecockTitle = `Chi CẦU vãng lai ca ${sessionLabel}`;
    const shuttlecockMovementTitle = `Xuất cầu hao ca ${startLabel}-${endLabel} | ngày ${dateLabel}`;

    const transactions = [
      {
        session_id: input.sessionId,
        transaction_type: 'INCOME',
        category: 'SESSION_FEE',
        title: incomeTitle,
        quantity: 1,
        unit_price: slotIncome,
        total_amount: slotIncome,
        note: incomeTitle
      }
    ];

    if (autoCreateCourtFeeTransaction) {
      transactions.push({
        session_id: input.sessionId,
        transaction_type: 'EXPENSE',
        category: 'COURT_FEE',
        title: courtTitle,
        quantity: 1,
        unit_price: courtCost,
        total_amount: courtCost,
        note: courtTitle
      });
    }

    if (autoCreateShuttlecockUsageTransaction) {
      transactions.push({
        session_id: input.sessionId,
        transaction_type: 'EXPENSE',
        category: 'SHUTTLECOCK_USAGE',
        title: shuttlecockTitle,
        quantity: shuttlecockPiecesUsed,
        unit_price: shuttlecockUsagePricePerBall,
        total_amount: shuttlecockCost,
        note: shuttlecockTitle
      });
    }

    await tx.session_transactions.createMany({ data: transactions });

    await tx.shuttlecock_movements.create({
      data: {
        shuttlecock_product_id: input.shuttlecockProductId,
        movement_type: 'PLAY_USAGE',
        quantity_ball: -shuttlecockPiecesUsed,
        cost_per_ball: shuttlecockCostPerBall,
        usage_price_per_ball: shuttlecockUsagePricePerBall,
        unit_price: shuttlecockUsagePricePerBall,
        title: shuttlecockMovementTitle,
        note: `Ngày chơi ${dateLabel}, ca ${session.name} ${startLabel}-${endLabel}, ${session.court_count} sân, dùng ${shuttlecockPiecesUsed} quả`
      }
    });

    await tx.shuttlecock_inventory.upsert({
      where: { shuttlecock_product_id: input.shuttlecockProductId },
      create: {
        shuttlecock_product_id: input.shuttlecockProductId,
        quantity_ball: nextQuantityBall,
        avg_cost_per_ball: shuttlecockCostPerBall,
        avg_usage_price_per_ball: shuttlecockUsagePricePerBall
      },
      update: {
        quantity_ball: nextQuantityBall,
        updated_at: new Date()
      }
    });

    const totalIncome = slotIncome;
    const totalExpense = courtCost + shuttlecockCost;

    await tx.session_players.updateMany({
      where: { session_id: input.sessionId },
      data: {
        runtime_status: 'FINISHED'
      }
    });

    await tx.runtime_courts.updateMany({
      where: { session_id: input.sessionId },
      data: {
        status: 'EMPTY',
        runtime_match_id: null,
        started_at: null,
        updated_at: new Date()
      }
    });

    await tx.runtime_matches.deleteMany({ where: { session_id: input.sessionId } });

    await tx.play_sessions.update({
      where: { id: input.sessionId },
      data: {
        status: 'FINISHED',
        court_cost: courtCost,
        shuttlecock_pieces_used: shuttlecockPiecesUsed,
        shuttlecock_product_id: product.id,
        shuttlecock_product_name: product.name,
        total_income: totalIncome,
        total_expense: totalExpense,
        total_profit: totalIncome - totalExpense,
        updated_at: new Date()
      }
    });

    const existingSummary = await tx.session_summaries.findFirst({ where: { session_id: input.sessionId } });
    if (existingSummary) {
      await tx.session_summaries.update({
        where: { id: existingSummary.id },
        data: {
          total_players: session.session_players.length,
          total_income: totalIncome,
          total_expense: totalExpense,
          total_profit: totalIncome - totalExpense
        }
      });
    } else {
      await tx.session_summaries.create({
        data: {
          session_id: input.sessionId,
          total_players: session.session_players.length,
          total_income: totalIncome,
          total_expense: totalExpense,
          total_profit: totalIncome - totalExpense
        }
      });
    }
  });

  const updated = await getPlaySession(input.sessionId);
  if (!updated) throw new Error('Session not found after completion');
  return updated;
}
