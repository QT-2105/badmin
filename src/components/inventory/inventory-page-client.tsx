'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Pencil, Plus, Save, Trash2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/feedback';
import { Input, Select } from '@/components/ui/form';
import { MetricCard, NoticeCard, PageHeader, PageShell, SectionCard, ToolbarCard, compactFormInputClass, formInputClass, formLabelClass } from '@/components/ui/page-layout';
import { PAGE_SIZE_OPTIONS, PaginationControls, type PageSize } from '@/components/ui/pagination-controls';
import { StatusBadge } from '@/components/ui/status-badge';
import { useCurrentUser } from '@/hooks/use-auth';
import { useInventoryMovements, useInventoryMutations, useInventoryProducts } from '@/hooks/use-inventory';
import { hasPermission } from '@/lib/auth/permissions';
import { formatCurrency } from '@/lib/date-format';
import type { ShuttlecockProductSummary } from '@/types/domain';

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
    <PageShell>
      <PageHeader
        title="Kho cầu"
        description="Quản lý tồn kho theo quả. Khi nhập theo ống hệ thống tự quy đổi theo quả/ống, khi bán hoặc ghi cầu hao ca hệ thống trừ kho và tạo lịch sử nhập xuất để đối soát."
      />

      <ToolbarCard
        title="Kỳ báo cáo"
        description="Áp dụng cho tiền bán cầu và chi cầu hao ca."
        actions={(
          <>
            <Select value={reportPeriod} onChange={(event) => setReportPeriod(event.target.value as ReportPeriod)} className={compactFormInputClass}>
              <option value="MONTH">Theo tháng</option>
              <option value="YEAR">Theo năm</option>
            </Select>
            {reportPeriod === 'MONTH' ? (
              <Input type="month" value={reportMonth} onChange={(event) => setReportMonth(event.target.value)} className={compactFormInputClass} />
            ) : (
              <Input type="number" min={2000} max={2100} value={reportYear} onChange={(event) => setReportYear(event.target.value)} className={`${compactFormInputClass} sm:w-28`} />
            )}
          </>
        )}
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard label="Tổng loại cầu" value={`${products.length}`} tone="info" />
        <MetricCard
          label="Tồn kho"
          value={`${totals.tubes} ống ${totals.looseBalls} quả`}
          sub={`${totals.balls} quả`}
          tone="inventory"
        />
        <MetricCard label="Giá trị tồn vốn" value={`${formatCurrency(totals.stockCost)}đ`} tone="inventory" />
        <MetricCard label="Chi cầu hao ca" value={`${formatCurrency(reportTotals.usage)}đ`} sub={`${reportTotals.usageTubes} ống ${reportTotals.usageLooseBalls} quả (${reportTotals.usageBalls} quả)`} tone="expense" />
        <MetricCard label="Tiền bán cầu" value={`${formatCurrency(reportTotals.sales)}đ`} sub={`${formatQuantity(reportTotals.saleTubes)} ống (${reportTotals.saleBalls} quả)`} tone="income" />
        <MetricCard
          label="Tổng tiền cầu"
          value={`${formatCurrency(reportTotals.totalOutboundAmount)}đ`}
          sub={`${reportTotals.totalOutboundTubes} ống ${reportTotals.totalOutboundLooseBalls} quả (${reportTotals.totalOutboundBalls} quả)`}
          tone="violet"
        />
      </section>

      {actionError ? <NoticeCard tone="danger">{actionError}</NoticeCard> : null}
      {isLoading ? <NoticeCard>Đang tải kho cầu...</NoticeCard> : null}
      {error ? <NoticeCard tone="danger">{error.message}</NoticeCard> : null}

      <SectionCard
        title="Danh mục cầu"
        description="Theo dõi từng loại cầu, tồn hiện tại, giá vốn bình quân và giá cầu hao bình quân đang dùng khi hoàn tất ca."
        actions={canManageInventory ? (
          <div className="flex gap-2">
            {editingProductId ? (
              <Button variant="ghost" size="sm" onClick={() => { setEditingProductId(null); setProductForm(emptyProduct); setIsProductFormOpen(false); }}>
                <X className="h-4 w-4" />
                Hủy sửa
              </Button>
            ) : null}
            <Button variant="secondary" size="sm" onClick={() => setIsProductFormOpen((open) => !open)}>
              {isProductFormOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {isProductFormOpen ? 'Thu gọn' : 'Mở rộng'}
            </Button>
          </div>
        ) : null}
      >
        {isProductFormOpen && canManageInventory ? (
          <form onSubmit={submitProduct} className="grid gap-3 rounded-lg bg-surface-muted p-3 lg:grid-cols-[1.2fr_1fr_120px_130px_auto] lg:items-end">
            <Field label="Tên loại cầu" value={productForm.name} onChange={(value) => setProductForm((current) => ({ ...current, name: value }))} required />
            <Field label="Hãng" value={productForm.brand} onChange={(value) => setProductForm((current) => ({ ...current, brand: value }))} />
            <NumberField label="Quả/ống" value={productForm.ballsPerTube} min={1} onChange={(value) => setProductForm((current) => ({ ...current, ballsPerTube: value }))} />
            <label className="block">
              <span className={formLabelClass}>Trạng thái</span>
              <Select value={productForm.status} onChange={(event) => setProductForm((current) => ({ ...current, status: event.target.value }))} className={inputClass}>
                <option value="ACTIVE">Đang dùng</option>
                <option value="INACTIVE">Ngưng dùng</option>
              </Select>
            </label>
            <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending} className="h-11">
              {createProduct.isPending || updateProduct.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : editingProductId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {editingProductId ? 'Lưu' : 'Thêm'}
            </Button>
          </form>
        ) : null}

        <div className="mt-4 max-h-[360px] overflow-auto rounded-lg border border-border">
          <table className="min-w-[1080px] w-full text-sm">
            <thead className="sticky top-0 bg-surface text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-3 text-left font-medium">Loại cầu</th>
                <th className="px-3 py-3 text-right font-medium">Tồn ống - quả</th>
                <th className="px-3 py-3 text-right font-medium">Tồn quả</th>
                <th className="px-3 py-3 text-right font-medium">Avg vốn/quả</th>
                <th className="px-3 py-3 text-right font-medium">Avg cầu hao/quả</th>
                <th className="px-3 py-3 text-right font-medium">Giá trị tồn</th>
                <th className="px-3 py-3 text-right font-medium">Tiền bán</th>
                <th className="px-3 py-3 text-right font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((product) => (
                <tr key={product.id} className="text-foreground">
                  <td className="px-3 py-3">
                    <div className="font-medium text-foreground">{product.name}</div>
                    <div className="text-xs text-muted-foreground">{product.brand || 'Không hãng'} · {product.ballsPerTube} quả/ống · {product.status === 'ACTIVE' ? 'Đang dùng' : 'Ngưng dùng'}</div>
                  </td>
                  <td className="px-3 py-3 text-right">{formatTubes(product.quantityBall, product.ballsPerTube)}</td>
                  <td className="px-3 py-3 text-right">{product.quantityBall}</td>
                  <td className="px-3 py-3 text-right">{formatCurrency(product.avgCostPerBall)}đ</td>
                  <td className="px-3 py-3 text-right text-info">{formatCurrency(product.avgUsagePricePerBall)}đ</td>
                  <td className="px-3 py-3 text-right">{formatCurrency(product.stockCostValue)}đ</td>
                  <td className="px-3 py-3 text-right">{formatCurrency(product.totalSaleAmount)}đ</td>
                  <td className="px-3 py-3">
                    {canManageInventory ? (
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="secondary" className="h-10 px-3" aria-label={`Sửa ${product.name}`} onClick={() => editProduct(product)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="sm" variant="danger" className="h-10 px-3" aria-label={`Xóa ${product.name}`} disabled={deleteProduct.isPending} onClick={() => void removeProduct(product)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                    ) : null}
                  </td>
                </tr>
              ))}
              {!isLoading && products.length === 0 ? <tr><td colSpan={8} className="p-3"><EmptyState title="Chưa có loại cầu" description="Thêm loại cầu trước khi tạo phiếu nhập hoặc xuất kho." /></td></tr> : null}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {canManageInventory ? (
      <SectionCard>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button type="button" variant={stockFormTab === 'IMPORT' ? 'primary' : 'outline'} onClick={() => setStockFormTab((tab) => tab === 'IMPORT' ? null : 'IMPORT')} className="h-12">Phiếu nhập kho</Button>
          <Button type="button" variant={stockFormTab === 'OUTBOUND' ? 'primary' : 'outline'} onClick={() => setStockFormTab((tab) => tab === 'OUTBOUND' ? null : 'OUTBOUND')} className="h-12">Phiếu xuất kho</Button>
        </div>

        {stockFormTab === 'IMPORT' ? (
        <form onSubmit={submitImport} className="mt-4 rounded-xl border border-border bg-surface-muted p-4">
          <h2 className="text-sm font-semibold text-foreground">Tạo phiếu nhập kho</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <ProductSelect label="Loại cầu" value={importProductId} products={products} onChange={setImportProductId} />
            <Field label="Tiêu đề" value={importTitle} onChange={setImportTitle} required />
            <NumberField label="Số lượng ống" value={importTubes} min={1} onChange={setImportTubes} />
            <NumberField label="Giá vốn nhập/ống" value={costPricePerTube} min={0} step={1} onChange={setCostPricePerTube} />
            <NumberField label="Giá đề xuất/ống" value={usagePricePerTube} min={0} step={1} onChange={setUsagePricePerTube} />
            <Field label="Ghi chú" value={importNote} onChange={setImportNote} />
          </div>
          <div className="mt-3 grid gap-2 rounded-lg bg-muted p-3 text-sm text-muted-foreground sm:grid-cols-3">
            <span>{importProduct ? `${importTubes * importProduct.ballsPerTube} quả` : 'Chọn loại cầu'}</span>
            <span>Vốn/quả: {formatCurrency(importProduct ? costPricePerTube / importProduct.ballsPerTube : 0)}đ</span>
            <span>Cầu hao/quả: {formatCurrency(importProduct ? usagePricePerTube / importProduct.ballsPerTube : 0)}đ</span>
          </div>
          <Button type="submit" className="mt-4 w-full" disabled={!importProduct || createMovement.isPending}>
            {createMovement.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Ghi nhập kho
          </Button>
        </form>
        ) : null}

        {stockFormTab === 'OUTBOUND' ? (
        <form onSubmit={submitOutbound} className="mt-4 rounded-xl border border-border bg-surface-muted p-4">
          <h2 className="text-sm font-semibold text-foreground">Tạo phiếu xuất kho</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
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
            <Field label="Tiêu đề" value={outboundTitle} onChange={setOutboundTitle} required />
            {outboundType === 'ADJUSTMENT' ? (
              <NumberField label="Tồn thực tế theo quả" value={actualQuantityBall} min={0} onChange={setActualQuantityBall} />
            ) : outboundType === 'PLAY_USAGE' ? (
              <NumberField label="Số cầu hao" value={outboundBalls} min={1} onChange={setOutboundBalls} />
            ) : (
              <>
                <NumberField label="Số lượng ống" value={outboundTubes} min={outboundType === 'SALE' ? 1 : 0} onChange={setOutboundTubes} />
                {outboundType === 'OTHER' ? <NumberField label="Số quả lẻ" value={outboundBalls} min={0} onChange={setOutboundBalls} /> : null}
                <NumberField label="Đơn giá/ống" value={salePricePerTube} min={0} step={1} onChange={setSalePricePerTube} />
              </>
            )}
            <Field label="Ghi chú" value={outboundNote} onChange={setOutboundNote} />
          </div>
          <div className="mt-3 grid gap-2 rounded-lg bg-muted p-3 text-sm text-muted-foreground sm:grid-cols-3">
            <span>Còn {outboundProduct?.quantityBall ?? 0} quả</span>
            <span>{outboundProduct ? `Tồn: ${formatTubes(outboundProduct.quantityBall, outboundProduct.ballsPerTube)}` : 'Chọn loại cầu'}</span>
            <span>{outboundType === 'ADJUSTMENT' ? `Chênh lệch: ${outboundProduct ? actualQuantityBall - outboundProduct.quantityBall : 0} quả` : `Xuất: ${estimateOutboundBalls(outboundType, outboundProduct, outboundTubes, outboundBalls)} quả`}</span>
          </div>
          <Button type="submit" className="mt-4 w-full" disabled={!outboundProduct || createMovement.isPending}>
            {createMovement.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Ghi xuất kho
          </Button>
        </form>
        ) : null}
      </SectionCard>
      ) : null}

      <SectionCard
        title="Lịch sử nhập xuất"
        description="Mỗi phát sinh nhập, bán, cầu hao hoặc điều chỉnh đều được ghi lại để kiểm tra tồn kho."
        actions={(
          <Select value={movementPageSize} onChange={(event) => setMovementPageSize(Number(event.target.value) as PageSize)} className={`${compactFormInputClass} sm:w-32`}>
            {PAGE_SIZE_OPTIONS.map((value) => <option key={value} value={value}>{value} dòng</option>)}
          </Select>
        )}
      >
        <div className="operational-x-scroll max-h-[360px] overflow-auto rounded-lg border border-border">
          <div className="min-w-[920px]">
            <div className="sticky top-0 z-10 grid grid-cols-[112px_minmax(0,2.6fr)_90px_110px_120px_150px] items-center gap-3 border-b border-border bg-surface px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              <div>Loại</div>
              <div>Nội dung</div>
              <div>SL quả</div>
              <div className="text-right">Vốn/quả</div>
              <div className="text-right">Giá hao/quả</div>
              <div className="text-right">Tổng tiền</div>
            </div>
            {movementsLoading ? <div className="p-4 text-sm text-muted-foreground">Đang tải giao dịch kho...</div> : null}
            {visibleMovements.map((movement) => (
              <article key={movement.id} className="grid grid-cols-[112px_minmax(0,2.6fr)_90px_110px_120px_150px] items-center gap-3 border-b border-border px-3 py-3 text-sm">
                <MovementBadge type={movement.movementType} />
                <div className="min-w-0">
                  <div className="break-words font-medium text-foreground">{movement.title || movement.productName}</div>
                  <div className="break-words text-xs text-muted-foreground">{movement.productName} · {movement.note || '-'}</div>
                </div>
                <div className={movement.quantityBall >= 0 ? 'font-semibold text-success' : 'font-semibold text-danger'}>{movement.quantityBall > 0 ? '+' : ''}{movement.quantityBall}</div>
                <div className="text-right text-muted-foreground">{formatCurrency(movement.costPerBall)}đ</div>
                <div className="text-right text-info">{formatCurrency(movement.usagePricePerBall)}đ</div>
                <div className="text-right">
                  <div className="font-semibold text-foreground">{formatCurrency(movement.totalAmount)}đ</div>
                  <div className="text-xs text-muted-foreground">{formatCreatedAt(movement.createdAt)}</div>
                </div>
              </article>
            ))}
            {!movementsLoading && visibleMovements.length === 0 ? <EmptyState title="Chưa có giao dịch kho" description="Các phiếu nhập, bán, cầu hao hoặc điều chỉnh sẽ hiển thị tại đây." className="m-3" /> : null}
          </div>
        </div>
        <PaginationControls
          currentPage={Math.min(movementPage, movementTotalPages)}
          totalPages={movementTotalPages}
          totalItems={sortedMovements.length}
          pageSize={movementPageSize}
          onPageChange={setMovementPage}
        />
      </SectionCard>
    </PageShell>
  );
}

const inputClass = formInputClass;

function Field({ label, value, required, onChange }: { label: string; value: string; required?: boolean; onChange: (value: string) => void }) {
  return <label className="block"><span className={formLabelClass}>{label}</span><Input required={required} value={value} onChange={(event) => onChange(event.target.value)} className={inputClass} /></label>;
}

function NumberField({ label, value, min, step, disabled, onChange }: { label: string; value: number; min?: number; step?: number; disabled?: boolean; onChange: (value: number) => void }) {
  return <label className="block"><span className={formLabelClass}>{label}</span><Input type="number" min={min} step={step} disabled={disabled} value={Number.isFinite(value) ? value : 0} onChange={(event) => onChange(Number(event.target.value))} className={inputClass} /></label>;
}

function ProductSelect({ label, value, products, onChange }: { label: string; value: string; products: ShuttlecockProductSummary[]; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className={formLabelClass}>{label}</span>
      <Select required value={value} onChange={(event) => onChange(event.target.value)} className={inputClass}>
        <option value="">Chọn loại cầu</option>
        {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
      </Select>
    </label>
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
          : { label: 'Chi cầu hao ca', tone: 'danger' as const };
  return <StatusBadge tone={config.tone} className="w-fit rounded-lg">{config.label}</StatusBadge>;
}
