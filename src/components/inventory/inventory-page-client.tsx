'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { Boxes, CircleDollarSign, Coins, Loader2, Package, Pencil, Plus, Save, Trash2, TrendingDown, TrendingUp, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { Skeleton } from '@/components/ui/feedback';
import { FilterBar } from '@/components/ui/filter-bar';
import { Input, Select } from '@/components/ui/form';
import { NoticeCard, PageHeader, PageShell, SectionCard, compactFormInputClass, formInputClass, formLabelClass } from '@/components/ui/page-layout';
import { PAGE_SIZE_OPTIONS, PaginationControls, type PageSize } from '@/components/ui/pagination-controls';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { useCurrentUser } from '@/hooks/use-auth';
import { useInventoryMovements, useInventoryMutations, useInventoryProducts } from '@/hooks/use-inventory';
import { hasPermission } from '@/lib/auth/permissions';
import { formatCurrency } from '@/lib/date-format';
import type { ShuttlecockMovementSummary, ShuttlecockProductSummary } from '@/types/domain';

type ProductForm = {
  name: string;
  brand: string;
  ballsPerTube: number;
  status: string;
};

type OutboundType = 'SALE' | 'PLAY_USAGE' | 'ADJUSTMENT' | 'OTHER';
type ReportPeriod = 'MONTH' | 'YEAR';
type StockFormTab = 'IMPORT' | 'OUTBOUND';

const emptyProduct: ProductForm = { name: '', brand: '', ballsPerTube: 12, status: 'ACTIVE' };
const today = new Date();

export function InventoryPageClient() {
  const { data: currentUser } = useCurrentUser();
  const { data: products = [], isLoading, error } = useInventoryProducts();
  const { data: movements = [], isLoading: movementsLoading } = useInventoryMovements();
  const { createProduct, updateProduct, deleteProduct, createMovement } = useInventoryMutations();
  const [productForm, setProductForm] = useState<ProductForm>(emptyProduct);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [importProductId, setImportProductId] = useState('');
  const [importTitle, setImportTitle] = useState('');
  const [importTubes, setImportTubes] = useState(1);
  const [costPricePerTube, setCostPricePerTube] = useState(0);
  const [usagePricePerTube, setUsagePricePerTube] = useState(0);
  const [importNote, setImportNote] = useState('');
  const [outboundType, setOutboundType] = useState<OutboundType>('SALE');
  const [outboundProductId, setOutboundProductId] = useState('');
  const [outboundTitle, setOutboundTitle] = useState('');
  const [outboundTubes, setOutboundTubes] = useState(1);
  const [outboundBalls, setOutboundBalls] = useState(0);
  const [salePricePerTube, setSalePricePerTube] = useState(0);
  const [actualQuantityBall, setActualQuantityBall] = useState(0);
  const [outboundNote, setOutboundNote] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('MONTH');
  const [reportMonth, setReportMonth] = useState(() => `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`);
  const [reportYear, setReportYear] = useState(() => String(today.getFullYear()));
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [stockFormTab, setStockFormTab] = useState<StockFormTab | null>(null);
  const [movementPageSize, setMovementPageSize] = useState<PageSize>(10);
  const [movementPage, setMovementPage] = useState(1);
  const canManageInventory = hasPermission(currentUser ?? null, 'inventory.manage');

  const importProduct = products.find((product) => product.id === importProductId);
  const outboundProduct = products.find((product) => product.id === outboundProductId);

  const totals = useMemo(() => products.reduce(
    (result, product) => ({
      tubes: result.tubes + Math.floor(product.quantityBall / product.ballsPerTube),
      looseBalls: result.looseBalls + (product.quantityBall % product.ballsPerTube),
      balls: result.balls + product.quantityBall,
      stockCost: result.stockCost + product.stockCostValue,
    }),
    { tubes: 0, looseBalls: 0, balls: 0, stockCost: 0 }
  ), [products]);

  const reportTotals = useMemo(() => {
    return movements.filter((movement) => isInReportPeriod(movement.createdAt, reportPeriod, reportMonth, reportYear)).reduce(
      (result, movement) => {
        const quantityBall = Math.abs(movement.quantityBall);
        const ballsPerTube = Math.max(1, movement.ballsPerTube);
        if (movement.movementType === 'SALE') {
          return {
            ...result,
            sales: result.sales + movement.totalAmount,
            saleTubes: result.saleTubes + (quantityBall / ballsPerTube),
            saleBalls: result.saleBalls + quantityBall,
            totalOutboundAmount: result.totalOutboundAmount + movement.totalAmount,
            totalOutboundTubes: result.totalOutboundTubes + Math.floor(quantityBall / ballsPerTube),
            totalOutboundLooseBalls: result.totalOutboundLooseBalls + (quantityBall % ballsPerTube),
            totalOutboundBalls: result.totalOutboundBalls + quantityBall
          };
        }
        if (movement.movementType === 'PLAY_USAGE') {
          return {
            ...result,
            usage: result.usage + movement.totalAmount,
            usageTubes: result.usageTubes + Math.floor(quantityBall / ballsPerTube),
            usageLooseBalls: result.usageLooseBalls + (quantityBall % ballsPerTube),
            usageBalls: result.usageBalls + quantityBall,
            totalOutboundAmount: result.totalOutboundAmount + movement.totalAmount,
            totalOutboundTubes: result.totalOutboundTubes + Math.floor(quantityBall / ballsPerTube),
            totalOutboundLooseBalls: result.totalOutboundLooseBalls + (quantityBall % ballsPerTube),
            totalOutboundBalls: result.totalOutboundBalls + quantityBall
          };
        }
        return result;
      },
      {
        sales: 0,
        usage: 0,
        saleTubes: 0,
        saleBalls: 0,
        usageTubes: 0,
        usageLooseBalls: 0,
        usageBalls: 0,
        totalOutboundAmount: 0,
        totalOutboundTubes: 0,
        totalOutboundLooseBalls: 0,
        totalOutboundBalls: 0
      }
    );
  }, [movements, reportMonth, reportPeriod, reportYear]);
  const sortedMovements = useMemo(() => [...movements].sort((left, right) => getTime(right.createdAt) - getTime(left.createdAt)), [movements]);
  const movementTotalPages = Math.max(1, Math.ceil(sortedMovements.length / movementPageSize));
  const visibleMovements = useMemo(() => {
    const safePage = Math.min(movementPage, movementTotalPages);
    const start = (safePage - 1) * movementPageSize;
    return sortedMovements.slice(start, start + movementPageSize);
  }, [movementPage, movementPageSize, movementTotalPages, sortedMovements]);

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
      render: (movement) => <MovementQuantity quantity={movement.quantityBall} />
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

  useEffect(() => {
    setMovementPage(1);
  }, [movementPageSize]);

  async function submitProduct(event: React.FormEvent) {
    event.preventDefault();
    setActionError(null);
    try {
      if (editingProductId) {
        await updateProduct.mutateAsync({ id: editingProductId, payload: productForm });
      } else {
        const product = await createProduct.mutateAsync(productForm);
        setImportProductId(product.id);
        setOutboundProductId(product.id);
      }
      setProductForm(emptyProduct);
      setEditingProductId(null);
      setIsProductFormOpen(false);
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Không thể lưu loại cầu');
    }
  }

  function editProduct(product: ShuttlecockProductSummary) {
    setEditingProductId(product.id);
    setIsProductFormOpen(true);
    setProductForm({
      name: product.name,
      brand: product.brand || '',
      ballsPerTube: product.ballsPerTube,
      status: product.status
    });
  }

  async function removeProduct(product: ShuttlecockProductSummary) {
    if (!window.confirm(`Xóa loại cầu "${product.name}"?`)) return;
    setActionError(null);
    try {
      await deleteProduct.mutateAsync(product.id);
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Không thể xóa loại cầu');
    }
  }

  async function submitImport(event: React.FormEvent) {
    event.preventDefault();
    if (!importProduct) return;
    setActionError(null);
    if (!importTitle.trim()) {
      setActionError('Vui lòng nhập tiêu đề phiếu nhập kho.');
      return;
    }
    try {
      await createMovement.mutateAsync({
        productId: importProduct.id,
        movementType: 'IMPORT',
        title: importTitle,
        quantityTube: importTubes,
        costPricePerTube,
        usagePricePerTube,
        note: importNote
      });
      setImportTitle('');
      setImportTubes(1);
      setCostPricePerTube(0);
      setUsagePricePerTube(0);
      setImportNote('');
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Không thể nhập kho');
    }
  }

  async function submitOutbound(event: React.FormEvent) {
    event.preventDefault();
    if (!outboundProduct) return;
    setActionError(null);
    if (!outboundTitle.trim()) {
      setActionError('Vui lòng nhập tiêu đề phiếu xuất kho.');
      return;
    }
    try {
      await createMovement.mutateAsync({
        productId: outboundProduct.id,
        movementType: outboundType,
        title: outboundTitle,
        quantityTube: outboundType === 'ADJUSTMENT' || outboundType === 'PLAY_USAGE' ? undefined : outboundTubes,
        quantityBall: outboundType === 'PLAY_USAGE' || outboundType === 'OTHER' ? outboundBalls : undefined,
        actualQuantityBall: outboundType === 'ADJUSTMENT' ? actualQuantityBall : undefined,
        salePricePerTube: outboundType === 'ADJUSTMENT' || outboundType === 'PLAY_USAGE' ? undefined : salePricePerTube,
        note: outboundNote
      });
      setOutboundTitle('');
      setOutboundTubes(1);
      setOutboundBalls(0);
      setActualQuantityBall(0);
      setSalePricePerTube(0);
      setOutboundNote('');
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Không thể ghi phiếu xuất kho');
    }
  }

  return (
    <PageShell className="gap-4 md:gap-5">
      <PageHeader
        eyebrow="Kho vận hành"
        title="Kho cầu"
        description="Theo dõi tồn kho theo quả, nhập theo ống và đối soát mọi phát sinh nhập, bán, cầu hao hoặc điều chỉnh."
      />

      <FilterBar
        title="Kỳ báo cáo"
        description="Áp dụng cho tiền bán cầu và chi cầu hao ca."
        density="compact"
        className="shadow-soft"
        contentClassName="sm:flex-nowrap"
        filters={(
          <>
            <Select
              aria-label="Chọn kỳ báo cáo kho cầu"
              value={reportPeriod}
              onChange={(event) => setReportPeriod(event.target.value as ReportPeriod)}
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
                onChange={(event) => setReportMonth(event.target.value)}
                className={`${compactFormInputClass} sm:w-44`}
              />
            ) : (
              <Input
                aria-label="Năm báo cáo kho cầu"
                type="number"
                min={2000}
                max={2100}
                value={reportYear}
                onChange={(event) => setReportYear(event.target.value)}
                className={`${compactFormInputClass} sm:w-28`}
              />
            )}
          </>
        )}
      />

      <section aria-label="Thống kê nhanh kho cầu" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="min-h-[112px] rounded-xl" />)
        ) : (
          <>
            <StatCard label="Tổng loại cầu" value={`${products.length}`} sub="Danh mục đang theo dõi" tone="info" icon={Boxes} />
            <StatCard
              label="Tồn kho"
              value={`${totals.tubes} ống ${totals.looseBalls} quả`}
              sub={`${totals.balls} quả`}
              tone={totals.balls > 0 ? 'inventory' : 'neutral'}
              icon={Package}
            />
            <StatCard label="Giá trị tồn vốn" value={`${formatCurrency(totals.stockCost)}đ`} sub="Theo giá vốn bình quân" tone="info" icon={Coins} />
            <StatCard label="Chi cầu hao ca" value={`${formatCurrency(reportTotals.usage)}đ`} sub={`${reportTotals.usageTubes} ống ${reportTotals.usageLooseBalls} quả (${reportTotals.usageBalls} quả)`} tone="expense" icon={TrendingDown} />
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
      </section>

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

      <SectionCard
        title="Danh mục cầu"
        description="Theo dõi từng loại cầu, tồn hiện tại, giá vốn bình quân và giá cầu hao bình quân đang dùng khi hoàn tất ca."
        actions={canManageInventory ? (
          <div className="flex flex-wrap justify-end gap-2">
            {editingProductId ? (
              <Button variant="ghost" size="sm" className="whitespace-nowrap" onClick={() => { setEditingProductId(null); setProductForm(emptyProduct); setIsProductFormOpen(false); }}>
                <X className="h-4 w-4" />
                Hủy sửa
              </Button>
            ) : null}
            <Button variant="secondary" size="sm" className="whitespace-nowrap" onClick={() => setIsProductFormOpen((open) => !open)}>
              {isProductFormOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {isProductFormOpen ? 'Thu gọn' : 'Mở rộng'}
            </Button>
          </div>
        ) : null}
      >
        {isProductFormOpen && canManageInventory ? (
          <form onSubmit={submitProduct} className="rounded-xl border border-border bg-surface-subtle p-3 sm:p-4">
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
              <Field label="Tên loại cầu" value={productForm.name} onChange={(value) => setProductForm((current) => ({ ...current, name: value }))} required helper="Tên hiển thị trong danh mục và phiếu kho." />
              <Field label="Hãng" value={productForm.brand} onChange={(value) => setProductForm((current) => ({ ...current, brand: value }))} helper="Có thể để trống nếu không theo dõi hãng." />
              <NumberField label="Quả/ống" value={productForm.ballsPerTube} min={1} onChange={(value) => setProductForm((current) => ({ ...current, ballsPerTube: value }))} helper="Mặc định 12." />
              <label className="block">
                <span className={formLabelClass}>Trạng thái</span>
                <Select value={productForm.status} onChange={(event) => setProductForm((current) => ({ ...current, status: event.target.value }))} className={inputClass}>
                  <option value="ACTIVE">Đang dùng</option>
                  <option value="INACTIVE">Ngưng dùng</option>
                </Select>
                <span className="mt-1 block text-xs leading-4 text-muted-foreground">Ngưng dùng sẽ ẩn khỏi thao tác mới nếu logic nguồn áp dụng.</span>
              </label>
            </div>
            <div className="mt-4 flex justify-end">
              <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending} className="h-11 w-full min-w-32 whitespace-nowrap sm:w-auto">
                {createProduct.isPending || updateProduct.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : editingProductId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {editingProductId ? 'Lưu' : 'Thêm'}
              </Button>
            </div>
          </form>
        ) : null}

        <DataTable
          aria-label="Danh sách loại cầu"
          rows={products}
          columns={productColumns}
          getRowKey={(product) => product.id}
          loading={isLoading}
          loadingState={{ title: 'Đang tải danh mục cầu', description: 'Vui lòng chờ trong giây lát.' }}
          emptyState={{ title: 'Chưa có loại cầu', description: 'Thêm loại cầu trước khi tạo phiếu nhập hoặc xuất kho.' }}
          density="compact"
          minWidth="1080px"
          className="mt-4"
          actions={canManageInventory ? (product) => (
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="secondary" className="h-10 px-3" aria-label={`Sửa ${product.name}`} onClick={() => editProduct(product)}><Pencil className="h-4 w-4" /></Button>
              <Button size="sm" variant="danger" className="h-10 px-3" aria-label={`Xóa ${product.name}`} disabled={deleteProduct.isPending} onClick={() => void removeProduct(product)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ) : undefined}
        />
      </SectionCard>

      {canManageInventory ? (
      <SectionCard>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button type="button" variant={stockFormTab === 'IMPORT' ? 'primary' : 'outline'} onClick={() => setStockFormTab((tab) => tab === 'IMPORT' ? null : 'IMPORT')} className="h-12 whitespace-nowrap">Phiếu nhập kho</Button>
          <Button type="button" variant={stockFormTab === 'OUTBOUND' ? 'primary' : 'outline'} onClick={() => setStockFormTab((tab) => tab === 'OUTBOUND' ? null : 'OUTBOUND')} className="h-12 whitespace-nowrap">Phiếu xuất kho</Button>
        </div>

        {stockFormTab === 'IMPORT' ? (
        <form onSubmit={submitImport} className="mt-4 rounded-xl border border-border bg-surface-subtle p-3 sm:p-4">
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
            <ProductSelect label="Loại cầu" value={importProductId} products={products} onChange={setImportProductId} />
            <Field label="Tiêu đề" value={importTitle} onChange={setImportTitle} required helper="Nội dung phiếu nhập để đối soát lịch sử kho." />
            <NumberField label="Số lượng ống" value={importTubes} min={1} onChange={setImportTubes} helper={importProduct ? `${importProduct.ballsPerTube} quả/ống` : 'Chọn loại cầu'} />
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(180px,1fr)_minmax(180px,1fr)_minmax(220px,1.2fr)]">
            <NumberField label="Giá vốn nhập/ống" value={costPricePerTube} min={0} step={1} onChange={setCostPricePerTube} helper="Giá vốn thực tế theo ống." />
            <NumberField label="Giá đề xuất/ống" value={usagePricePerTube} min={0} step={1} onChange={setUsagePricePerTube} helper="Giá dùng để tính cầu hao." />
            <Field label="Ghi chú" value={importNote} onChange={setImportNote} helper="Tùy chọn." />
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
            <Button type="submit" className="h-11 w-full min-w-40 whitespace-nowrap sm:w-auto" disabled={!importProduct || createMovement.isPending}>
              {createMovement.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Ghi nhập kho
            </Button>
          </div>
        </form>
        ) : null}

        {stockFormTab === 'OUTBOUND' ? (
        <form onSubmit={submitOutbound} className="mt-4 rounded-xl border border-border bg-surface-subtle p-3 sm:p-4">
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
              <Select value={outboundType} onChange={(event) => setOutboundType(event.target.value as OutboundType)} className={inputClass}>
                <option value="SALE">Bán cầu</option>
                <option value="PLAY_USAGE">Chi cầu hao ca</option>
                <option value="ADJUSTMENT">Điều chỉnh tồn</option>
                <option value="OTHER">Ngoại lệ</option>
              </Select>
            </label>
            <ProductSelect label="Loại cầu" value={outboundProductId} products={products} onChange={setOutboundProductId} />
            <Field label="Tiêu đề" value={outboundTitle} onChange={setOutboundTitle} required helper="Nội dung phiếu xuất để đối soát lịch sử kho." />
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(180px,1fr)_minmax(180px,1fr)_minmax(220px,1.2fr)]">
            {outboundType === 'ADJUSTMENT' ? (
              <NumberField label="Tồn thực tế theo quả" value={actualQuantityBall} min={0} onChange={setActualQuantityBall} helper={outboundProduct ? `Hiện hệ thống ghi nhận ${outboundProduct.quantityBall} quả.` : 'Chọn loại cầu trước khi nhập tồn.'} />
            ) : outboundType === 'PLAY_USAGE' ? (
              <NumberField label="Số cầu hao" value={outboundBalls} min={1} onChange={setOutboundBalls} helper="Đơn vị quả." />
            ) : (
              <>
                <NumberField label="Số lượng ống" value={outboundTubes} min={outboundType === 'SALE' ? 1 : 0} onChange={setOutboundTubes} helper={outboundProduct ? `${outboundProduct.ballsPerTube} quả/ống` : 'Chọn loại cầu'} />
                {outboundType === 'OTHER' ? <NumberField label="Số quả lẻ" value={outboundBalls} min={0} onChange={setOutboundBalls} helper="Tùy chọn." /> : null}
                <NumberField label="Đơn giá/ống" value={salePricePerTube} min={0} step={1} onChange={setSalePricePerTube} helper={outboundType === 'SALE' ? 'Giá bán theo ống.' : 'Giá tham chiếu theo ống.'} />
              </>
            )}
            <Field label="Ghi chú" value={outboundNote} onChange={setOutboundNote} helper="Tùy chọn." />
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
            <Button type="submit" className="h-11 w-full min-w-40 whitespace-nowrap sm:w-auto" disabled={!outboundProduct || createMovement.isPending}>
              {createMovement.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Ghi xuất kho
            </Button>
          </div>
        </form>
        ) : null}
      </SectionCard>
      ) : null}

      <SectionCard
        title="Lịch sử nhập xuất"
        description="Theo dõi từng movement theo đúng thứ tự phát sinh để đối soát tồn kho, giá và ghi chú nghiệp vụ."
        actions={(
          <Select value={movementPageSize} onChange={(event) => setMovementPageSize(Number(event.target.value) as PageSize)} className={`${compactFormInputClass} sm:w-32`}>
            {PAGE_SIZE_OPTIONS.map((value) => <option key={value} value={value}>{value} dòng</option>)}
          </Select>
        )}
      >
        <DataTable
          aria-label="Lịch sử nhập xuất kho cầu"
          rows={visibleMovements}
          columns={movementColumns}
          getRowKey={(movement) => movement.id}
          loading={movementsLoading}
          loadingState={{ title: 'Đang tải giao dịch kho', description: 'Vui lòng chờ trong giây lát.' }}
          emptyState={{ title: 'Chưa có giao dịch kho', description: 'Các phiếu nhập, bán, cầu hao hoặc điều chỉnh sẽ hiển thị tại đây.' }}
          density="compact"
          minWidth="1040px"
          pagination={(
            <PaginationControls
              currentPage={Math.min(movementPage, movementTotalPages)}
              totalPages={movementTotalPages}
              totalItems={sortedMovements.length}
              pageSize={movementPageSize}
              onPageChange={setMovementPage}
            />
          )}
        />
      </SectionCard>
    </PageShell>
  );
}

const inputClass = formInputClass;

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

function MovementQuantity({ quantity }: { quantity: number }) {
  const isInbound = quantity >= 0;
  return (
    <div className="space-y-1">
      <div className={isInbound ? 'font-semibold tabular-nums text-success' : 'font-semibold tabular-nums text-danger'}>
        {quantity > 0 ? '+' : ''}{quantity}
      </div>
      <div className="text-xs text-muted-foreground">{isInbound ? 'Nhập/tăng' : 'Xuất/giảm'}</div>
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

function isInReportPeriod(value: string | null, period: ReportPeriod, selectedMonth: string, selectedYear: string): boolean {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  if (period === 'MONTH') {
    const [year, month] = selectedMonth.split('-').map(Number);
    return date.getFullYear() === year && date.getMonth() + 1 === month;
  }
  return date.getFullYear() === Number(selectedYear);
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

function getTime(value: string | null): number {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
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
