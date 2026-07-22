'use client';

import { useId, type FormEvent } from 'react';
import { Boxes, CircleDollarSign, Coins, Loader2, Package, Pencil, Plus, Save, Trash2, TrendingDown, TrendingUp, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { Skeleton } from '@/components/ui/feedback';
import { FilterBar } from '@/components/ui/filter-bar';
import { Input, Select } from '@/components/ui/form';
import { NoticeCard, PageFeedbackStack, PageSummaryGrid, SectionCard, compactFormInputClass, formInputClass, formLabelClass } from '@/components/ui/page-layout';
import { PAGE_SIZE_OPTIONS, PaginationControls, type PageSize } from '@/components/ui/pagination-controls';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatCurrency } from '@/lib/date-format';
import type { ShuttlecockMovementSummary, ShuttlecockProductSummary } from '@/types/domain';

export type ProductForm = {
  name: string;
  brand: string;
  ballsPerTube: number;
  status: string;
};

export type OutboundType = 'SALE' | 'PLAY_USAGE' | 'ADJUSTMENT' | 'OTHER';
export type ReportPeriod = 'MONTH' | 'YEAR';
export type StockFormTab = 'IMPORT' | 'OUTBOUND';

export type InventoryTotals = {
  tubes: number;
  looseBalls: number;
  balls: number;
  stockCost: number;
};

export type InventoryReportTotals = {
  sales: number;
  usage: number;
  saleTubes: number;
  saleBalls: number;
  usageTubes: number;
  usageLooseBalls: number;
  usageBalls: number;
  totalOutboundAmount: number;
  totalOutboundTubes: number;
  totalOutboundLooseBalls: number;
  totalOutboundBalls: number;
};

const inputClass = formInputClass;

export function InventoryToolbar({
  reportPeriod,
  reportMonth,
  reportYear,
  onReportPeriodChange,
  onReportMonthChange,
  onReportYearChange
}: {
  reportPeriod: ReportPeriod;
  reportMonth: string;
  reportYear: string;
  onReportPeriodChange: (value: ReportPeriod) => void;
  onReportMonthChange: (value: string) => void;
  onReportYearChange: (value: string) => void;
}) {
  return (
    <FilterBar
      title="Kỳ báo cáo"
      description="Áp dụng cho tiền bán cầu và chi cầu hao ca."
      density="compact"
      contentClassName="sm:flex-nowrap"
      filters={(
        <>
          <Select
            aria-label="Chọn kỳ báo cáo kho cầu"
            value={reportPeriod}
            onChange={(event) => onReportPeriodChange(event.target.value as ReportPeriod)}
            className={`${compactFormInputClass} sm:w-36`}
          >
            <option value="MONTH">Theo tháng</option>
            <option value="YEAR">Theo năm</option>
          </Select>
          {reportPeriod === 'MONTH' ? (
            <Input
              aria-label="Tháng báo cáo kho cầu"
              type="month"
              value={reportMonth}
              onChange={(event) => onReportMonthChange(event.target.value)}
              className={`${compactFormInputClass} sm:w-44`}
            />
          ) : (
            <Input
              aria-label="Năm báo cáo kho cầu"
              type="number"
              min={2000}
              max={2100}
              value={reportYear}
              onChange={(event) => onReportYearChange(event.target.value)}
              className={`${compactFormInputClass} sm:w-28`}
            />
          )}
        </>
      )}
    />
  );
}

export function InventorySummary({
  isLoading,
  productsLength,
  totals,
  reportTotals
}: {
  isLoading: boolean;
  productsLength: number;
  totals: InventoryTotals;
  reportTotals: InventoryReportTotals;
}) {
  return (
    <PageSummaryGrid aria-label="Thống kê nhanh kho cầu" className="sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
      {isLoading ? (
        Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="min-h-[112px] rounded-xl" />)
      ) : (
        <>
          <StatCard label="Tổng loại cầu" value={`${productsLength}`} sub="Danh mục đang theo dõi" tone="neutral" icon={Boxes} />
          <StatCard
            label="Tồn kho"
            value={`${totals.tubes} ống ${totals.looseBalls} quả`}
            sub={`${totals.balls} quả`}
            tone={totals.balls > 0 ? 'success' : 'danger'}
            icon={Package}
          />
          <StatCard label="Giá trị tồn vốn" value={`${formatCurrency(totals.stockCost)}đ`} sub="Theo giá vốn bình quân" tone="info" icon={Coins} />
          <StatCard label="Chi cầu hao ca" value={`${formatCurrency(reportTotals.usage)}đ`} sub={`${reportTotals.usageTubes} ống ${reportTotals.usageLooseBalls} quả (${reportTotals.usageBalls} quả)`} tone="warning" icon={TrendingDown} />
          <StatCard label="Tiền bán cầu" value={`${formatCurrency(reportTotals.sales)}đ`} sub={`${formatQuantity(reportTotals.saleTubes)} ống (${reportTotals.saleBalls} quả)`} tone="income" icon={TrendingUp} />
          <StatCard
            label="Tổng tiền cầu"
            value={`${formatCurrency(reportTotals.totalOutboundAmount)}đ`}
            sub={`${reportTotals.totalOutboundTubes} ống ${reportTotals.totalOutboundLooseBalls} quả (${reportTotals.totalOutboundBalls} quả)`}
            tone="neutral"
            icon={CircleDollarSign}
          />
        </>
      )}
    </PageSummaryGrid>
  );
}

export function InventoryFeedback({
  actionError,
  isLoading,
  error
}: {
  actionError: string | null;
  isLoading: boolean;
  error: Error | null;
}) {
  if (!actionError && !isLoading && !error) {
    return null;
  }

  return (
    <PageFeedbackStack>
      {actionError ? (
        <div role="alert" aria-live="polite">
          <NoticeCard tone="danger">{actionError}</NoticeCard>
        </div>
      ) : null}
      {isLoading ? (
        <div aria-live="polite">
          <NoticeCard>Đang tải kho cầu...</NoticeCard>
        </div>
      ) : null}
      {error ? (
        <div role="alert" aria-live="polite">
          <NoticeCard tone="danger">{error.message}</NoticeCard>
        </div>
      ) : null}
    </PageFeedbackStack>
  );
}

export function ProductTableSection({
  canManageInventory,
  isProductFormOpen,
  editingProductId,
  productForm,
  products,
  isLoading,
  createProductPending,
  updateProductPending,
  deleteProductPending,
  onProductFormChange,
  onCancelEdit,
  onToggleForm,
  onSubmitProduct,
  onEditProduct,
  onRequestRemoveProduct
}: {
  canManageInventory: boolean;
  isProductFormOpen: boolean;
  editingProductId: string | null;
  productForm: ProductForm;
  products: ShuttlecockProductSummary[];
  isLoading: boolean;
  createProductPending: boolean;
  updateProductPending: boolean;
  deleteProductPending: boolean;
  onProductFormChange: (form: ProductForm) => void;
  onCancelEdit: () => void;
  onToggleForm: () => void;
  onSubmitProduct: (event: FormEvent) => void;
  onEditProduct: (product: ShuttlecockProductSummary) => void;
  onRequestRemoveProduct: (product: ShuttlecockProductSummary) => void;
}) {
  const productColumns: DataTableColumn<ShuttlecockProductSummary>[] = [
    {
      key: 'product',
      header: 'Loại cầu',
      width: '28%',
      render: (product) => (
        <div className="min-w-0">
          <div className="break-words font-semibold text-foreground">{product.name}</div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <span>{product.brand || 'Không hãng'}</span>
            <span aria-hidden="true">·</span>
            <span>{product.ballsPerTube} quả/ống</span>
            <StatusBadge tone={product.status === 'ACTIVE' ? 'success' : 'neutral'} className="ml-1 rounded-md">
              {product.status === 'ACTIVE' ? 'Đang dùng' : 'Ngưng dùng'}
            </StatusBadge>
            <StockStatusBadge product={product} />
          </div>
        </div>
      )
    },
    {
      key: 'stock-tubes',
      header: 'Tồn ống - quả',
      align: 'right',
      width: '13%',
      cellClassName: 'font-semibold tabular-nums',
      render: (product) => formatTubes(product.quantityBall, product.ballsPerTube)
    },
    {
      key: 'stock-balls',
      header: 'Tồn quả',
      align: 'right',
      width: '9%',
      cellClassName: 'tabular-nums',
      render: (product) => product.quantityBall
    },
    {
      key: 'avg-cost',
      header: 'Avg vốn/quả',
      align: 'right',
      width: '12%',
      cellClassName: 'tabular-nums',
      render: (product) => `${formatCurrency(product.avgCostPerBall)}đ`
    },
    {
      key: 'avg-usage',
      header: 'Avg cầu hao/quả',
      align: 'right',
      width: '13%',
      cellClassName: 'text-info tabular-nums',
      render: (product) => `${formatCurrency(product.avgUsagePricePerBall)}đ`
    },
    {
      key: 'stock-value',
      header: 'Giá trị tồn',
      align: 'right',
      width: '12%',
      cellClassName: 'tabular-nums',
      render: (product) => `${formatCurrency(product.stockCostValue)}đ`
    },
    {
      key: 'sale-total',
      header: 'Tiền bán',
      align: 'right',
      width: '11%',
      cellClassName: 'tabular-nums',
      render: (product) => `${formatCurrency(product.totalSaleAmount)}đ`
    }
  ];

  return (
    <SectionCard
      title="Danh mục cầu"
      description="Theo dõi từng loại cầu, tồn hiện tại, giá vốn bình quân và giá cầu hao bình quân đang dùng khi hoàn tất ca."
      density="compact"
      actions={canManageInventory ? (
        <div className="flex w-full flex-wrap justify-end gap-2 sm:w-auto">
          {editingProductId ? (
            <Button variant="ghost" size="sm" className="h-10 w-full whitespace-nowrap sm:w-auto" onClick={onCancelEdit}>
              <X className="h-4 w-4" />
              Hủy sửa
            </Button>
          ) : null}
          <Button variant="secondary" size="sm" className="h-10 w-full whitespace-nowrap sm:w-auto" onClick={onToggleForm}>
            {isProductFormOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {isProductFormOpen ? 'Thu gọn' : 'Mở rộng'}
          </Button>
        </div>
      ) : null}
    >
      {isProductFormOpen && canManageInventory ? (
        <form onSubmit={onSubmitProduct} className="rounded-xl border border-border bg-surface-subtle p-3 sm:p-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-card-title">{editingProductId ? 'Sửa loại cầu' : 'Thêm loại cầu'}</h3>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">
                Chỉ lưu thông tin danh mục. Tồn kho và giá bình quân được cập nhật qua phiếu nhập xuất.
              </p>
            </div>
            <StatusBadge tone={editingProductId ? 'info' : 'success'} className="w-fit rounded-lg">
              {editingProductId ? 'Đang sửa' : 'Tạo mới'}
            </StatusBadge>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(240px,1.4fr)_minmax(180px,1fr)_120px_140px] xl:items-start">
            <Field label="Tên loại cầu" value={productForm.name} onChange={(value) => onProductFormChange({ ...productForm, name: value })} required helper="Tên hiển thị trong danh mục và phiếu kho." />
            <Field label="Hãng" value={productForm.brand} onChange={(value) => onProductFormChange({ ...productForm, brand: value })} helper="Có thể để trống nếu không theo dõi hãng." />
            <NumberField label="Quả/ống" value={productForm.ballsPerTube} min={1} onChange={(value) => onProductFormChange({ ...productForm, ballsPerTube: value })} helper="Giữ theo giá trị mặc định hiện tại khi tạo mới." />
            <label className="block">
              <span className={formLabelClass}>Trạng thái</span>
              <Select value={productForm.status} onChange={(event) => onProductFormChange({ ...productForm, status: event.target.value })} className={inputClass}>
                <option value="ACTIVE">Đang dùng</option>
                <option value="INACTIVE">Ngưng dùng</option>
              </Select>
              <span className="mt-1 block text-xs leading-4 text-muted-foreground">Ngưng dùng sẽ ẩn khỏi thao tác mới nếu logic nguồn áp dụng.</span>
            </label>
          </div>
          <div className="mt-4 flex justify-end">
            <Button type="submit" disabled={createProductPending || updateProductPending} className="h-11 w-full min-w-32 whitespace-nowrap sm:w-auto">
              {createProductPending || updateProductPending ? <Loader2 className="h-4 w-4 animate-spin" /> : editingProductId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {editingProductId ? 'Lưu' : 'Thêm'}
            </Button>
          </div>
        </form>
      ) : null}

      <DataTable
        aria-label="Danh sách loại cầu"
        caption="Danh sách loại cầu"
        rows={products}
        columns={productColumns}
        getRowKey={(product) => product.id}
        loading={isLoading}
        loadingState={{ title: 'Đang tải danh mục cầu', description: 'Vui lòng chờ trong giây lát.' }}
        emptyState={{ title: 'Chưa có loại cầu', description: 'Thêm loại cầu trước khi tạo phiếu nhập hoặc xuất kho.' }}
        density="compact"
        minWidth="1080px"
        className="mt-4"
        mobileRenderer={(product) => <ProductMobileCard product={product} />}
        responsiveMode="cards"
        rowLabel={(product) => `Loại cầu ${product.name}`}
        stickyHeader
        actions={canManageInventory ? (product) => (
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="secondary" className="h-10 px-3" aria-label={`Sửa ${product.name}`} onClick={() => onEditProduct(product)}><Pencil className="h-4 w-4" /></Button>
            <Button size="sm" variant="danger" className="h-10 px-3" aria-label={`Xóa ${product.name}`} disabled={deleteProductPending} onClick={() => onRequestRemoveProduct(product)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ) : undefined}
      />
    </SectionCard>
  );
}

export function MovementFormsSection({
  stockFormTab,
  products,
  importProduct,
  importProductId,
  importTitle,
  importTubes,
  costPricePerTube,
  usagePricePerTube,
  importNote,
  outboundType,
  outboundProduct,
  outboundProductId,
  outboundTitle,
  outboundTubes,
  outboundBalls,
  salePricePerTube,
  actualQuantityBall,
  outboundNote,
  createMovementPending,
  onStockFormTabChange,
  onSubmitImport,
  onSubmitOutbound,
  onImportProductIdChange,
  onImportTitleChange,
  onImportTubesChange,
  onCostPricePerTubeChange,
  onUsagePricePerTubeChange,
  onImportNoteChange,
  onOutboundTypeChange,
  onOutboundProductIdChange,
  onOutboundTitleChange,
  onOutboundTubesChange,
  onOutboundBallsChange,
  onSalePricePerTubeChange,
  onActualQuantityBallChange,
  onOutboundNoteChange
}: {
  stockFormTab: StockFormTab | null;
  products: ShuttlecockProductSummary[];
  importProduct: ShuttlecockProductSummary | undefined;
  importProductId: string;
  importTitle: string;
  importTubes: number;
  costPricePerTube: number;
  usagePricePerTube: number;
  importNote: string;
  outboundType: OutboundType;
  outboundProduct: ShuttlecockProductSummary | undefined;
  outboundProductId: string;
  outboundTitle: string;
  outboundTubes: number;
  outboundBalls: number;
  salePricePerTube: number;
  actualQuantityBall: number;
  outboundNote: string;
  createMovementPending: boolean;
  onStockFormTabChange: (value: StockFormTab | null) => void;
  onSubmitImport: (event: FormEvent) => void;
  onSubmitOutbound: (event: FormEvent) => void;
  onImportProductIdChange: (value: string) => void;
  onImportTitleChange: (value: string) => void;
  onImportTubesChange: (value: number) => void;
  onCostPricePerTubeChange: (value: number) => void;
  onUsagePricePerTubeChange: (value: number) => void;
  onImportNoteChange: (value: string) => void;
  onOutboundTypeChange: (value: OutboundType) => void;
  onOutboundProductIdChange: (value: string) => void;
  onOutboundTitleChange: (value: string) => void;
  onOutboundTubesChange: (value: number) => void;
  onOutboundBallsChange: (value: number) => void;
  onSalePricePerTubeChange: (value: number) => void;
  onActualQuantityBallChange: (value: number) => void;
  onOutboundNoteChange: (value: string) => void;
}) {
  return (
    <SectionCard density="compact">
      <div className="grid gap-2 sm:grid-cols-2">
        <Button type="button" variant={stockFormTab === 'IMPORT' ? 'primary' : 'outline'} onClick={() => onStockFormTabChange(stockFormTab === 'IMPORT' ? null : 'IMPORT')} className="h-12 whitespace-nowrap">Phiếu nhập kho</Button>
        <Button type="button" variant={stockFormTab === 'OUTBOUND' ? 'primary' : 'outline'} onClick={() => onStockFormTabChange(stockFormTab === 'OUTBOUND' ? null : 'OUTBOUND')} className="h-12 whitespace-nowrap">Phiếu xuất kho</Button>
      </div>

      {stockFormTab === 'IMPORT' ? (
        <ImportMovementForm
          products={products}
          importProduct={importProduct}
          importProductId={importProductId}
          importTitle={importTitle}
          importTubes={importTubes}
          costPricePerTube={costPricePerTube}
          usagePricePerTube={usagePricePerTube}
          importNote={importNote}
          createMovementPending={createMovementPending}
          onSubmitImport={onSubmitImport}
          onImportProductIdChange={onImportProductIdChange}
          onImportTitleChange={onImportTitleChange}
          onImportTubesChange={onImportTubesChange}
          onCostPricePerTubeChange={onCostPricePerTubeChange}
          onUsagePricePerTubeChange={onUsagePricePerTubeChange}
          onImportNoteChange={onImportNoteChange}
        />
      ) : null}

      {stockFormTab === 'OUTBOUND' ? (
        <OutboundMovementForm
          products={products}
          outboundType={outboundType}
          outboundProduct={outboundProduct}
          outboundProductId={outboundProductId}
          outboundTitle={outboundTitle}
          outboundTubes={outboundTubes}
          outboundBalls={outboundBalls}
          salePricePerTube={salePricePerTube}
          actualQuantityBall={actualQuantityBall}
          outboundNote={outboundNote}
          createMovementPending={createMovementPending}
          onSubmitOutbound={onSubmitOutbound}
          onOutboundTypeChange={onOutboundTypeChange}
          onOutboundProductIdChange={onOutboundProductIdChange}
          onOutboundTitleChange={onOutboundTitleChange}
          onOutboundTubesChange={onOutboundTubesChange}
          onOutboundBallsChange={onOutboundBallsChange}
          onSalePricePerTubeChange={onSalePricePerTubeChange}
          onActualQuantityBallChange={onActualQuantityBallChange}
          onOutboundNoteChange={onOutboundNoteChange}
        />
      ) : null}
    </SectionCard>
  );
}

export function MovementTableSection({
  visibleMovements,
  movementsLoading,
  movementPage,
  movementTotalPages,
  movementPageSize,
  sortedMovementsLength,
  onMovementPageChange,
  onMovementPageSizeChange
}: {
  visibleMovements: ShuttlecockMovementSummary[];
  movementsLoading: boolean;
  movementPage: number;
  movementTotalPages: number;
  movementPageSize: PageSize;
  sortedMovementsLength: number;
  onMovementPageChange: (page: number) => void;
  onMovementPageSizeChange: (value: PageSize) => void;
}) {
  const movementColumns: DataTableColumn<ShuttlecockMovementSummary>[] = [
    {
      key: 'type',
      header: 'Loại',
      width: '132px',
      render: (movement) => (
        <div className="flex min-w-0 flex-col items-start gap-1">
          <MovementBadge type={movement.movementType} />
          <span className="text-xs tabular-nums text-muted-foreground">{movement.ballsPerTube} quả/ống</span>
        </div>
      )
    },
    {
      key: 'content',
      header: 'Nội dung',
      width: '38%',
      render: (movement) => <MovementContent movement={movement} />
    },
    {
      key: 'quantity',
      header: 'SL quả',
      align: 'right',
      width: '104px',
      render: (movement) => <MovementQuantity type={movement.movementType} quantity={movement.quantityBall} />
    },
    {
      key: 'cost',
      header: 'Vốn/quả',
      align: 'right',
      width: '120px',
      render: (movement) => <MoneyDetail amount={movement.costPerBall} tone="muted" />
    },
    {
      key: 'usage-price',
      header: 'Giá hao/quả',
      align: 'right',
      width: '130px',
      render: (movement) => <MoneyDetail amount={movement.usagePricePerBall} tone="info" />
    },
    {
      key: 'total',
      header: 'Tổng tiền',
      align: 'right',
      width: '172px',
      render: (movement) => (
        <div className="space-y-1">
          <div className="font-semibold tabular-nums text-foreground">{formatCurrency(movement.totalAmount)}đ</div>
          <div className="text-xs tabular-nums text-muted-foreground">Đơn giá {formatCurrency(movement.unitPrice)}đ</div>
          <div className="text-xs text-muted-foreground">{formatCreatedAt(movement.createdAt)}</div>
        </div>
      )
    }
  ];

  return (
    <SectionCard
      title="Lịch sử nhập xuất"
      description="Theo dõi từng movement theo đúng thứ tự phát sinh để đối soát tồn kho, giá và ghi chú nghiệp vụ."
      density="compact"
      actions={(
        <Select value={movementPageSize} onChange={(event) => onMovementPageSizeChange(Number(event.target.value) as PageSize)} className={`${compactFormInputClass} sm:w-32`}>
          {PAGE_SIZE_OPTIONS.map((value) => <option key={value} value={value}>{value} dòng</option>)}
        </Select>
      )}
    >
      <DataTable
        aria-label="Lịch sử nhập xuất kho cầu"
        caption="Lịch sử nhập xuất kho cầu"
        rows={visibleMovements}
        columns={movementColumns}
        getRowKey={(movement) => movement.id}
        loading={movementsLoading}
        loadingState={{ title: 'Đang tải giao dịch kho', description: 'Vui lòng chờ trong giây lát.' }}
        emptyState={{ title: 'Chưa có giao dịch kho', description: 'Các phiếu nhập, bán, cầu hao hoặc điều chỉnh sẽ hiển thị tại đây.' }}
        density="compact"
        minWidth="1040px"
        mobileRenderer={(movement) => <MovementMobileCard movement={movement} />}
        pagination={(
          <PaginationControls
            currentPage={Math.min(movementPage, movementTotalPages)}
            totalPages={movementTotalPages}
            totalItems={sortedMovementsLength}
            pageSize={movementPageSize}
            onPageChange={onMovementPageChange}
          />
        )}
        responsiveMode="cards"
        rowLabel={(movement) => `Giao dịch kho ${movement.title || movement.movementType}`}
        stickyHeader
      />
    </SectionCard>
  );
}

function ImportMovementForm({
  products,
  importProduct,
  importProductId,
  importTitle,
  importTubes,
  costPricePerTube,
  usagePricePerTube,
  importNote,
  createMovementPending,
  onSubmitImport,
  onImportProductIdChange,
  onImportTitleChange,
  onImportTubesChange,
  onCostPricePerTubeChange,
  onUsagePricePerTubeChange,
  onImportNoteChange
}: {
  products: ShuttlecockProductSummary[];
  importProduct: ShuttlecockProductSummary | undefined;
  importProductId: string;
  importTitle: string;
  importTubes: number;
  costPricePerTube: number;
  usagePricePerTube: number;
  importNote: string;
  createMovementPending: boolean;
  onSubmitImport: (event: FormEvent) => void;
  onImportProductIdChange: (value: string) => void;
  onImportTitleChange: (value: string) => void;
  onImportTubesChange: (value: number) => void;
  onCostPricePerTubeChange: (value: number) => void;
  onUsagePricePerTubeChange: (value: number) => void;
  onImportNoteChange: (value: string) => void;
}) {
  return (
    <form onSubmit={onSubmitImport} className="mt-4 rounded-xl border border-border bg-surface-subtle p-3 sm:p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-section-title">Tạo phiếu nhập kho</h2>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            Nhập theo số ống. Hệ thống dùng số quả/ống của loại cầu để quy đổi và cập nhật tồn kho.
          </p>
        </div>
        <StatusBadge tone="success" className="w-fit rounded-lg">IMPORT</StatusBadge>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_minmax(260px,1.3fr)_120px]">
        <ProductSelect label="Loại cầu" value={importProductId} products={products} onChange={onImportProductIdChange} />
        <Field label="Tiêu đề" value={importTitle} onChange={onImportTitleChange} required helper="Nội dung phiếu nhập để đối soát lịch sử kho." />
        <NumberField label="Số lượng ống" value={importTubes} min={1} onChange={onImportTubesChange} helper={importProduct ? `${importProduct.ballsPerTube} quả/ống` : 'Chọn loại cầu'} />
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(180px,1fr)_minmax(180px,1fr)_minmax(220px,1.2fr)]">
        <NumberField label="Giá vốn nhập/ống" value={costPricePerTube} min={0} step={1} onChange={onCostPricePerTubeChange} helper="Giá vốn thực tế theo ống." />
        <NumberField label="Giá đề xuất/ống" value={usagePricePerTube} min={0} step={1} onChange={onUsagePricePerTubeChange} helper="Giá dùng để tính cầu hao." />
        <Field label="Ghi chú" value={importNote} onChange={onImportNoteChange} helper="Tùy chọn." />
      </div>
      <div className="mt-4 grid gap-2 rounded-xl border border-border bg-surface p-3 text-sm sm:grid-cols-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Quy đổi</div>
          <div className="mt-1 font-semibold tabular-nums text-foreground">{importProduct ? `${importTubes * importProduct.ballsPerTube} quả` : 'Chọn loại cầu'}</div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Vốn/quả</div>
          <div className="mt-1 font-semibold tabular-nums text-foreground">{formatCurrency(importProduct ? costPricePerTube / importProduct.ballsPerTube : 0)}đ</div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Cầu hao/quả</div>
          <div className="mt-1 font-semibold tabular-nums text-info">{formatCurrency(importProduct ? usagePricePerTube / importProduct.ballsPerTube : 0)}đ</div>
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <Button type="submit" className="h-11 w-full min-w-40 whitespace-nowrap sm:w-auto" disabled={!importProduct || createMovementPending}>
          {createMovementPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Ghi nhập kho
        </Button>
      </div>
    </form>
  );
}

function OutboundMovementForm({
  products,
  outboundType,
  outboundProduct,
  outboundProductId,
  outboundTitle,
  outboundTubes,
  outboundBalls,
  salePricePerTube,
  actualQuantityBall,
  outboundNote,
  createMovementPending,
  onSubmitOutbound,
  onOutboundTypeChange,
  onOutboundProductIdChange,
  onOutboundTitleChange,
  onOutboundTubesChange,
  onOutboundBallsChange,
  onSalePricePerTubeChange,
  onActualQuantityBallChange,
  onOutboundNoteChange
}: {
  products: ShuttlecockProductSummary[];
  outboundType: OutboundType;
  outboundProduct: ShuttlecockProductSummary | undefined;
  outboundProductId: string;
  outboundTitle: string;
  outboundTubes: number;
  outboundBalls: number;
  salePricePerTube: number;
  actualQuantityBall: number;
  outboundNote: string;
  createMovementPending: boolean;
  onSubmitOutbound: (event: FormEvent) => void;
  onOutboundTypeChange: (value: OutboundType) => void;
  onOutboundProductIdChange: (value: string) => void;
  onOutboundTitleChange: (value: string) => void;
  onOutboundTubesChange: (value: number) => void;
  onOutboundBallsChange: (value: number) => void;
  onSalePricePerTubeChange: (value: number) => void;
  onActualQuantityBallChange: (value: number) => void;
  onOutboundNoteChange: (value: string) => void;
}) {
  return (
    <form onSubmit={onSubmitOutbound} className="mt-4 rounded-xl border border-border bg-surface-subtle p-3 sm:p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-section-title">{outboundType === 'ADJUSTMENT' ? 'Tạo phiếu điều chỉnh tồn' : 'Tạo phiếu xuất kho'}</h2>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            {outboundType === 'ADJUSTMENT'
              ? 'Nhập số quả kiểm kê thực tế. Hệ thống tự ghi nhận phần chênh lệch để đối soát tồn kho.'
              : 'Bán cầu theo ống, chi cầu hao theo quả. Tồn kho vẫn được lưu và trừ theo đơn vị quả.'}
          </p>
        </div>
        <MovementBadge type={outboundType} />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(180px,0.8fr)_minmax(220px,1fr)_minmax(260px,1.25fr)]">
        <label className="block">
          <span className={formLabelClass}>Loại xuất kho</span>
          <Select value={outboundType} onChange={(event) => onOutboundTypeChange(event.target.value as OutboundType)} className={inputClass}>
            <option value="SALE">Bán cầu</option>
            <option value="PLAY_USAGE">Chi cầu hao ca</option>
            <option value="ADJUSTMENT">Điều chỉnh tồn</option>
            <option value="OTHER">Ngoại lệ</option>
          </Select>
        </label>
        <ProductSelect label="Loại cầu" value={outboundProductId} products={products} onChange={onOutboundProductIdChange} />
        <Field label="Tiêu đề" value={outboundTitle} onChange={onOutboundTitleChange} required helper="Nội dung phiếu xuất để đối soát lịch sử kho." />
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(180px,1fr)_minmax(180px,1fr)_minmax(220px,1.2fr)]">
        {outboundType === 'ADJUSTMENT' ? (
          <NumberField label="Tồn thực tế theo quả" value={actualQuantityBall} min={0} onChange={onActualQuantityBallChange} helper={outboundProduct ? `Hiện hệ thống ghi nhận ${outboundProduct.quantityBall} quả.` : 'Chọn loại cầu trước khi nhập tồn.'} />
        ) : outboundType === 'PLAY_USAGE' ? (
          <NumberField label="Số cầu hao" value={outboundBalls} min={1} onChange={onOutboundBallsChange} helper="Đơn vị quả." />
        ) : (
          <>
            <NumberField label="Số lượng ống" value={outboundTubes} min={outboundType === 'SALE' ? 1 : 0} onChange={onOutboundTubesChange} helper={outboundProduct ? `${outboundProduct.ballsPerTube} quả/ống` : 'Chọn loại cầu'} />
            {outboundType === 'OTHER' ? <NumberField label="Số quả lẻ" value={outboundBalls} min={0} onChange={onOutboundBallsChange} helper="Tùy chọn." /> : null}
            <NumberField label="Đơn giá/ống" value={salePricePerTube} min={0} step={1} onChange={onSalePricePerTubeChange} helper={outboundType === 'SALE' ? 'Giá bán theo ống.' : 'Giá tham chiếu theo ống.'} />
          </>
        )}
        <Field label="Ghi chú" value={outboundNote} onChange={onOutboundNoteChange} helper="Tùy chọn." />
      </div>

      <div className="mt-4 grid gap-2 rounded-xl border border-border bg-surface p-3 text-sm sm:grid-cols-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Tồn hiện tại</div>
          <div className="mt-1 font-semibold tabular-nums text-foreground">{outboundProduct ? formatTubes(outboundProduct.quantityBall, outboundProduct.ballsPerTube) : 'Chọn loại cầu'}</div>
          <div className="mt-1 text-xs text-muted-foreground">{outboundProduct?.quantityBall ?? 0} quả</div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {outboundType === 'ADJUSTMENT' ? 'Hướng điều chỉnh' : 'Số lượng xuất'}
          </div>
          {outboundType === 'ADJUSTMENT' ? (
            <AdjustmentDirection current={outboundProduct?.quantityBall ?? 0} actual={actualQuantityBall} />
          ) : (
            <div className="mt-1 font-semibold tabular-nums text-foreground">{estimateOutboundBalls(outboundType, outboundProduct, outboundTubes, outboundBalls)} quả</div>
          )}
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {outboundType === 'ADJUSTMENT' ? 'Tồn sau kiểm kê' : outboundType === 'PLAY_USAGE' ? 'Giá cầu hao' : 'Tạm tính'}
          </div>
          <div className="mt-1 font-semibold tabular-nums text-info">
            {outboundType === 'ADJUSTMENT'
              ? `${actualQuantityBall} quả`
              : outboundType === 'PLAY_USAGE'
              ? `${formatCurrency(outboundProduct?.avgUsagePricePerBall ?? 0)}đ/quả`
              : `${formatCurrency(outboundTubes * salePricePerTube)}đ`}
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button type="submit" className="h-11 w-full min-w-40 whitespace-nowrap sm:w-auto" disabled={!outboundProduct || createMovementPending}>
          {createMovementPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Ghi xuất kho
        </Button>
      </div>
    </form>
  );
}

function ProductMobileCard({ product }: { product: ShuttlecockProductSummary }) {
  return (
    <div className="space-y-3">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="break-words font-semibold text-foreground">{product.name}</div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <span>{product.brand || 'Không hãng'}</span>
            <span aria-hidden="true">·</span>
            <span>{product.ballsPerTube} quả/ống</span>
          </div>
        </div>
        <StatusBadge tone={product.status === 'ACTIVE' ? 'success' : 'neutral'} className="shrink-0 rounded-md">
          {product.status === 'ACTIVE' ? 'Đang dùng' : 'Ngưng dùng'}
        </StatusBadge>
      </div>
      <dl className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg border border-border bg-background p-2">
          <dt className="text-muted-foreground">Tồn ống - quả</dt>
          <dd className="mt-1 flex flex-wrap items-center gap-2 font-semibold tabular-nums text-foreground">
            {formatTubes(product.quantityBall, product.ballsPerTube)}
            <StockStatusBadge product={product} />
          </dd>
        </div>
        <div className="rounded-lg border border-border bg-background p-2">
          <dt className="text-muted-foreground">Tồn quả</dt>
          <dd className="mt-1 font-semibold tabular-nums text-foreground">{product.quantityBall}</dd>
        </div>
        <div className="rounded-lg border border-border bg-background p-2">
          <dt className="text-muted-foreground">Avg vốn/quả</dt>
          <dd className="mt-1 font-mono font-semibold text-foreground">{formatCurrency(product.avgCostPerBall)}đ</dd>
        </div>
        <div className="rounded-lg border border-border bg-background p-2">
          <dt className="text-muted-foreground">Giá trị tồn</dt>
          <dd className="mt-1 font-mono font-semibold text-foreground">{formatCurrency(product.stockCostValue)}đ</dd>
        </div>
        <div className="rounded-lg border border-border bg-background p-2">
          <dt className="text-muted-foreground">Avg cầu hao/quả</dt>
          <dd className="mt-1 font-mono font-semibold text-info">{formatCurrency(product.avgUsagePricePerBall)}đ</dd>
        </div>
        <div className="rounded-lg border border-border bg-background p-2">
          <dt className="text-muted-foreground">Tiền bán</dt>
          <dd className="mt-1 font-mono font-semibold text-foreground">{formatCurrency(product.totalSaleAmount)}đ</dd>
        </div>
      </dl>
    </div>
  );
}

function MovementMobileCard({ movement }: { movement: ShuttlecockMovementSummary }) {
  return (
    <div className="space-y-3">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <MovementBadge type={movement.movementType} />
          <div className="mt-1 text-xs tabular-nums text-muted-foreground">{movement.ballsPerTube} quả/ống</div>
        </div>
        <MovementQuantity type={movement.movementType} quantity={movement.quantityBall} />
      </div>
      <MovementContent movement={movement} />
      <dl className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg border border-border bg-background p-2">
          <dt className="text-muted-foreground">Vốn/quả</dt>
          <dd className="mt-1"><MoneyDetail amount={movement.costPerBall} tone="muted" /></dd>
        </div>
        <div className="rounded-lg border border-border bg-background p-2">
          <dt className="text-muted-foreground">Giá hao/quả</dt>
          <dd className="mt-1"><MoneyDetail amount={movement.usagePricePerBall} tone="info" /></dd>
        </div>
        <div className="rounded-lg border border-border bg-background p-2">
          <dt className="text-muted-foreground">Tổng tiền</dt>
          <dd className="mt-1 font-mono font-semibold text-foreground">{formatCurrency(movement.totalAmount)}đ</dd>
        </div>
        <div className="rounded-lg border border-border bg-background p-2">
          <dt className="text-muted-foreground">Thời gian</dt>
          <dd className="mt-1 font-medium text-foreground">{formatCreatedAt(movement.createdAt)}</dd>
        </div>
      </dl>
    </div>
  );
}

function Field({ label, value, required, helper, onChange }: { label: string; value: string; required?: boolean; helper?: string; onChange: (value: string) => void }) {
  const fieldId = useId();
  const helperId = helper ? `${fieldId}-helper` : undefined;

  return (
    <label className="block" htmlFor={fieldId}>
      <span className={formLabelClass}>{label}{required ? <span className="ml-1 text-danger">*</span> : null}</span>
      <Input
        id={fieldId}
        required={required}
        aria-required={required || undefined}
        aria-describedby={helperId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      />
      {helper ? <span id={helperId} className="mt-1 block text-xs leading-4 text-muted-foreground">{helper}</span> : null}
    </label>
  );
}

function NumberField({ label, value, min, step, disabled, helper, onChange }: { label: string; value: number; min?: number; step?: number; disabled?: boolean; helper?: string; onChange: (value: number) => void }) {
  const fieldId = useId();
  const helperId = helper ? `${fieldId}-helper` : undefined;

  return (
    <label className="block" htmlFor={fieldId}>
      <span className={formLabelClass}>{label}</span>
      <Input
        id={fieldId}
        type="number"
        min={min}
        step={step}
        disabled={disabled}
        aria-describedby={helperId}
        value={Number.isFinite(value) ? value : 0}
        onChange={(event) => onChange(Number(event.target.value))}
        className={inputClass}
      />
      {helper ? <span id={helperId} className="mt-1 block text-xs leading-4 text-muted-foreground">{helper}</span> : null}
    </label>
  );
}

function ProductSelect({ label, value, products, onChange }: { label: string; value: string; products: ShuttlecockProductSummary[]; onChange: (value: string) => void }) {
  const fieldId = useId();

  return (
    <label className="block" htmlFor={fieldId}>
      <span className={formLabelClass}>{label}</span>
      <Select id={fieldId} required aria-required value={value} onChange={(event) => onChange(event.target.value)} className={inputClass}>
        <option value="">Chọn loại cầu</option>
        {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
      </Select>
    </label>
  );
}

function MovementContent({ movement }: { movement: ShuttlecockMovementSummary }) {
  return (
    <div className="min-w-0 space-y-1">
      <div className="break-words font-semibold leading-snug text-foreground">{movement.title || movement.productName}</div>
      <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <span>Loại cầu</span>
        <span aria-hidden="true">·</span>
        <span className="font-medium text-foreground/80">{movement.productName}</span>
      </div>
      <div className="break-words text-xs leading-5 text-muted-foreground">{movement.note || 'Không có ghi chú.'}</div>
    </div>
  );
}

function MovementQuantity({ type, quantity }: { type: string; quantity: number }) {
  const isInbound = quantity >= 0;
  const toneClass = getMovementQuantityTone(type, quantity);
  return (
    <div className="space-y-1">
      <div className={`font-semibold tabular-nums ${toneClass}`}>
        {quantity > 0 ? '+' : ''}{quantity}
      </div>
      <div className="text-xs text-muted-foreground">{getMovementQuantityLabel(type, isInbound)}</div>
    </div>
  );
}

function MoneyDetail({ amount, tone }: { amount: number; tone: 'info' | 'muted' }) {
  return (
    <div className="space-y-1">
      <div className={tone === 'info' ? 'font-semibold tabular-nums text-info' : 'font-semibold tabular-nums text-foreground'}>
        {formatCurrency(amount)}đ
      </div>
      <div className="text-xs text-muted-foreground">theo quả</div>
    </div>
  );
}

function formatQuantity(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatTubes(balls: number, ballsPerTube: number): string {
  return `${Math.floor(balls / ballsPerTube)} ống ${balls % ballsPerTube} quả`;
}

function StockStatusBadge({ product }: { product: ShuttlecockProductSummary }) {
  if (product.quantityBall <= 0) {
    return <StatusBadge tone="danger" className="w-fit rounded-md">Hết hàng</StatusBadge>;
  }
  if (product.quantityBall < product.ballsPerTube) {
    return <StatusBadge tone="warning" className="w-fit rounded-md">Sắp hết</StatusBadge>;
  }
  return <StatusBadge tone="success" className="w-fit rounded-md">Còn hàng</StatusBadge>;
}

function estimateOutboundBalls(type: OutboundType, product: ShuttlecockProductSummary | undefined, tubes: number, balls: number): number {
  if (!product) return 0;
  if (type === 'SALE') return tubes * product.ballsPerTube;
  if (type === 'PLAY_USAGE') return balls;
  return tubes * product.ballsPerTube + balls;
}

function formatCreatedAt(value: string | null): string {
  return value ? new Date(value).toLocaleString('vi-VN') : '-';
}

function AdjustmentDirection({ current, actual }: { current: number; actual: number }) {
  const difference = actual - current;
  if (difference > 0) {
    return (
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <StatusBadge tone="success" className="rounded-lg">Tăng tồn</StatusBadge>
        <span className="font-semibold tabular-nums text-success">+{difference} quả</span>
      </div>
    );
  }
  if (difference < 0) {
    return (
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <StatusBadge tone="warning" className="rounded-lg">Giảm tồn</StatusBadge>
        <span className="font-semibold tabular-nums text-warning">{difference} quả</span>
      </div>
    );
  }
  return (
    <div className="mt-1 flex flex-wrap items-center gap-2">
      <StatusBadge tone="neutral" className="rounded-lg">Không đổi</StatusBadge>
      <span className="font-semibold tabular-nums text-muted-foreground">0 quả</span>
    </div>
  );
}

function getMovementQuantityTone(type: string, quantity: number): string {
  if (type === 'IMPORT') return 'text-success';
  if (type === 'SALE') return 'text-info';
  if (type === 'PLAY_USAGE') return 'text-warning';
  if (type === 'ADJUSTMENT') {
    if (quantity > 0) return 'text-success';
    if (quantity < 0) return 'text-warning';
    return 'text-muted-foreground';
  }
  return quantity >= 0 ? 'text-foreground' : 'text-muted-foreground';
}

function getMovementQuantityLabel(type: string, isInbound: boolean): string {
  if (type === 'IMPORT') return 'Nhập kho';
  if (type === 'SALE') return 'Bán cầu';
  if (type === 'PLAY_USAGE') return 'Cầu hao';
  if (type === 'ADJUSTMENT') return isInbound ? 'Điều chỉnh tăng' : 'Điều chỉnh giảm';
  return isInbound ? 'Nhập/tăng' : 'Xuất/giảm';
}

function MovementBadge({ type }: { type: string }) {
  const config = type === 'IMPORT'
    ? { label: 'Nhập kho', tone: 'success' as const }
    : type === 'SALE'
      ? { label: 'Bán cầu', tone: 'info' as const }
      : type === 'ADJUSTMENT'
        ? { label: 'Điều chỉnh', tone: 'warning' as const }
        : type === 'OTHER'
          ? { label: 'Ngoại lệ', tone: 'neutral' as const }
          : { label: 'Chi cầu hao ca', tone: 'warning' as const };
  return <StatusBadge tone={config.tone} className="w-fit rounded-lg">{config.label}</StatusBadge>;
}
