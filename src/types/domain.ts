export type PlaySessionStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'NOT_STARTED' | 'LIVE' | 'IN_PROGRESS' | 'FINISHED';

export type PlaySessionSummary = {
  id: string;
  playDateId: string;
  name: string;
  startTime: string;
  endTime: string;
  courtCount: number;
  status: string;
  courtCost: number;
  shuttlecockPiecesUsed: number;
  shuttlecockProductId: string | null;
  shuttlecockProductName: string | null;
  totalIncome: number;
  totalExpense: number;
  totalProfit: number;
  note: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type PlayDateSummary = {
  id: string;
  playDate: string;
  title: string | null;
  note: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  sessionCount: number;
  sessions: PlaySessionSummary[];
};

export type SessionPlayerSummary = {
  id: string;
  sessionId: string;
  fullName: string;
  gender: string | null;
  level: number;
  totalMatches: number;
  paymentAmount: number;
  discount: number;
  paymentMethod: string | null;
  paymentStatus: string;
  runtimeStatus: string | null;
  lastCourtNumber: number | null;
  note: string | null;
  joinedAt: string | null;
};

export type DashboardSummary = {
  playDates: number;
  sessions: number;
  activeSessions: number;
  players: number;
  totalIncome: number;
  totalExpense: number;
  totalProfit: number;
  unpaidAmount: number;
  inventoryProducts: number;
  inventoryPieces: number;
  inventoryValue: number;
  periodLabel: string;
  costBreakdown: Array<{
    category: string;
    label: string;
    amount: number;
  }>;
  dailyFinance: Array<{
    date: string;
    label: string;
    income: number;
    expense: number;
    profit: number;
  }>;
  recentSessions: Array<{
    id: string;
    playDateId: string;
    playDate: string;
    name: string;
    startTime: string;
    endTime: string;
    status: string;
    playerCount: number;
    paidAmount: number;
    expectedAmount: number;
    totalIncome: number;
    totalExpense: number;
    totalProfit: number;
  }>;
  alerts: Array<{
    id: string;
    tone: 'warning' | 'danger' | 'info';
    title: string;
    detail: string;
    href?: string;
  }>;
  lowStockProducts: Array<{
    id: string;
    name: string;
    quantityBall: number;
    ballsPerTube: number;
    stockValue: number;
  }>;
};

export type SessionTransactionSummary = {
  id: string;
  sessionId: string | null;
  transactionType: string;
  category: string;
  title: string | null;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  note: string | null;
  createdAt: string | null;
};

export type ShuttlecockProductSummary = {
  id: string;
  name: string;
  brand: string | null;
  ballsPerTube: number;
  status: string;
  quantityBall: number;
  avgCostPerBall: number;
  avgUsagePricePerBall: number;
  stockCostValue: number;
  stockUsageValue: number;
  totalImportAmount: number;
  totalSaleAmount: number;
  totalUsageAmount: number;
  createdAt: string | null;
  updatedAt: string | null;
};

export type ShuttlecockProductOption = {
  id: string;
  name: string;
  brand: string | null;
  avgUsagePricePerBall: number;
};

export type ShuttlecockMovementSummary = {
  id: string;
  productId: string;
  productName: string;
  ballsPerTube: number;
  movementType: string;
  quantityBall: number;
  costPerBall: number;
  usagePricePerBall: number;
  unitPrice: number;
  totalAmount: number;
  title: string | null;
  note: string | null;
  createdAt: string | null;
};
