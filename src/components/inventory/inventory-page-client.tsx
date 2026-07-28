'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';

import { ConfirmationDialog } from '@/components/ui/dialog';
import { PageHeader, PageShell } from '@/components/ui/page-layout';
import type { PageSize } from '@/components/ui/pagination-controls';
import { useCurrentUser } from '@/hooks/use-auth';
import { useInventoryMovements, useInventoryMutations, useInventoryProducts } from '@/hooks/use-inventory';
import { hasPermission } from '@/lib/auth/permissions';
import type { ShuttlecockProductSummary } from '@/types/domain';

import {
  InventoryFeedback,
  InventorySummary,
  InventoryToolbar,
  MovementFormsSection,
  MovementTableSection,
  ProductTableSection,
  type InventoryReportTotals,
  type InventoryTotals,
  type OutboundType,
  type ProductForm,
  type ReportPeriod,
  type StockFormTab
} from './inventory-presentation';

const emptyProduct: ProductForm = { name: '', brand: '', ballsPerTube: 12, status: 'ACTIVE' };
const today = new Date();

type QuantityBucket = {
  balls: number;
  ballsPerTube: number;
};

type QuantityBreakdown = {
  tubes: number;
  looseBalls: number;
  balls: number;
};

function addQuantityToBucket(
  buckets: Map<string, QuantityBucket>,
  productId: string,
  quantityBall: number,
  ballsPerTube: number
) {
  const safeBallsPerTube = Math.max(1, ballsPerTube);
  const existing = buckets.get(productId);
  if (existing) {
    existing.balls += quantityBall;
    existing.ballsPerTube = existing.ballsPerTube || safeBallsPerTube;
    return;
  }

  buckets.set(productId, { balls: quantityBall, ballsPerTube: safeBallsPerTube });
}

function summarizeQuantityBuckets(buckets: Map<string, QuantityBucket>): QuantityBreakdown {
  const result: QuantityBreakdown = { tubes: 0, looseBalls: 0, balls: 0 };

  buckets.forEach(({ balls, ballsPerTube }) => {
    const safeBallsPerTube = Math.max(1, ballsPerTube);
    result.tubes += Math.floor(balls / safeBallsPerTube);
    result.looseBalls += balls % safeBallsPerTube;
    result.balls += balls;
  });

  return result;
}

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
  const [pendingDeleteProduct, setPendingDeleteProduct] = useState<ShuttlecockProductSummary | null>(null);
  const canManageInventory = hasPermission(currentUser ?? null, 'inventory.manage');

  const importProduct = products.find((product) => product.id === importProductId);
  const outboundProduct = products.find((product) => product.id === outboundProductId);

  const totals: InventoryTotals = useMemo(() => products.reduce(
    (result, product) => ({
      tubes: result.tubes + Math.floor(product.quantityBall / product.ballsPerTube),
      looseBalls: result.looseBalls + (product.quantityBall % product.ballsPerTube),
      balls: result.balls + product.quantityBall,
      stockCost: result.stockCost + product.stockCostValue,
    }),
    { tubes: 0, looseBalls: 0, balls: 0, stockCost: 0 }
  ), [products]);

  const reportTotals: InventoryReportTotals = useMemo(() => {
    let sales = 0;
    let usage = 0;
    let totalOutboundAmount = 0;
    const saleBuckets = new Map<string, QuantityBucket>();
    const usageBuckets = new Map<string, QuantityBucket>();
    const totalOutboundBuckets = new Map<string, QuantityBucket>();

    movements
      .filter((movement) => isInReportPeriod(movement.createdAt, reportPeriod, reportMonth, reportYear))
      .forEach((movement) => {
        const quantityBall = Math.abs(movement.quantityBall);
        if (quantityBall <= 0) return;

        if (movement.movementType === 'SALE') {
          sales += movement.totalAmount;
          totalOutboundAmount += movement.totalAmount;
          addQuantityToBucket(saleBuckets, movement.productId, quantityBall, movement.ballsPerTube);
          addQuantityToBucket(totalOutboundBuckets, movement.productId, quantityBall, movement.ballsPerTube);
          return;
        }

        if (movement.movementType === 'PLAY_USAGE') {
          usage += movement.totalAmount;
          totalOutboundAmount += movement.totalAmount;
          addQuantityToBucket(usageBuckets, movement.productId, quantityBall, movement.ballsPerTube);
          addQuantityToBucket(totalOutboundBuckets, movement.productId, quantityBall, movement.ballsPerTube);
        }
      });

    const saleQuantity = summarizeQuantityBuckets(saleBuckets);
    const usageQuantity = summarizeQuantityBuckets(usageBuckets);
    const totalOutboundQuantity = summarizeQuantityBuckets(totalOutboundBuckets);

    return {
      sales,
      usage,
      saleTubes: saleQuantity.tubes,
      saleLooseBalls: saleQuantity.looseBalls,
      saleBalls: saleQuantity.balls,
      usageTubes: usageQuantity.tubes,
      usageLooseBalls: usageQuantity.looseBalls,
      usageBalls: usageQuantity.balls,
      totalOutboundAmount,
      totalOutboundTubes: totalOutboundQuantity.tubes,
      totalOutboundLooseBalls: totalOutboundQuantity.looseBalls,
      totalOutboundBalls: totalOutboundQuantity.balls
    };
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

  async function submitProduct(event: FormEvent) {
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

  function requestRemoveProduct(product: ShuttlecockProductSummary) {
    setActionError(null);
    setPendingDeleteProduct(product);
  }

  async function confirmRemoveProduct() {
    if (!pendingDeleteProduct) return;
    setActionError(null);
    try {
      await deleteProduct.mutateAsync(pendingDeleteProduct.id);
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Không thể xóa loại cầu');
    } finally {
      setPendingDeleteProduct(null);
    }
  }

  async function submitImport(event: FormEvent) {
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

  async function submitOutbound(event: FormEvent) {
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

      <InventoryToolbar
        reportPeriod={reportPeriod}
        reportMonth={reportMonth}
        reportYear={reportYear}
        onReportPeriodChange={setReportPeriod}
        onReportMonthChange={setReportMonth}
        onReportYearChange={setReportYear}
      />

      <InventorySummary isLoading={isLoading} productsLength={products.length} totals={totals} reportTotals={reportTotals} />
      <InventoryFeedback actionError={actionError} isLoading={isLoading} error={error ?? null} />

      <ProductTableSection
        canManageInventory={canManageInventory}
        isProductFormOpen={isProductFormOpen}
        editingProductId={editingProductId}
        productForm={productForm}
        products={products}
        isLoading={isLoading}
        createProductPending={createProduct.isPending}
        updateProductPending={updateProduct.isPending}
        deleteProductPending={deleteProduct.isPending}
        onProductFormChange={setProductForm}
        onCancelEdit={() => {
          setEditingProductId(null);
          setProductForm(emptyProduct);
          setIsProductFormOpen(false);
        }}
        onToggleForm={() => setIsProductFormOpen((open) => !open)}
        onSubmitProduct={submitProduct}
        onEditProduct={editProduct}
        onRequestRemoveProduct={requestRemoveProduct}
      />

      {canManageInventory ? (
        <MovementFormsSection
          stockFormTab={stockFormTab}
          products={products}
          importProduct={importProduct}
          importProductId={importProductId}
          importTitle={importTitle}
          importTubes={importTubes}
          costPricePerTube={costPricePerTube}
          usagePricePerTube={usagePricePerTube}
          importNote={importNote}
          outboundType={outboundType}
          outboundProduct={outboundProduct}
          outboundProductId={outboundProductId}
          outboundTitle={outboundTitle}
          outboundTubes={outboundTubes}
          outboundBalls={outboundBalls}
          salePricePerTube={salePricePerTube}
          actualQuantityBall={actualQuantityBall}
          outboundNote={outboundNote}
          createMovementPending={createMovement.isPending}
          onStockFormTabChange={setStockFormTab}
          onSubmitImport={submitImport}
          onSubmitOutbound={submitOutbound}
          onImportProductIdChange={setImportProductId}
          onImportTitleChange={setImportTitle}
          onImportTubesChange={setImportTubes}
          onCostPricePerTubeChange={setCostPricePerTube}
          onUsagePricePerTubeChange={setUsagePricePerTube}
          onImportNoteChange={setImportNote}
          onOutboundTypeChange={setOutboundType}
          onOutboundProductIdChange={setOutboundProductId}
          onOutboundTitleChange={setOutboundTitle}
          onOutboundTubesChange={setOutboundTubes}
          onOutboundBallsChange={setOutboundBalls}
          onSalePricePerTubeChange={setSalePricePerTube}
          onActualQuantityBallChange={setActualQuantityBall}
          onOutboundNoteChange={setOutboundNote}
        />
      ) : null}

      <MovementTableSection
        visibleMovements={visibleMovements}
        movementsLoading={movementsLoading}
        movementPage={movementPage}
        movementTotalPages={movementTotalPages}
        movementPageSize={movementPageSize}
        sortedMovementsLength={sortedMovements.length}
        onMovementPageChange={setMovementPage}
        onMovementPageSizeChange={setMovementPageSize}
      />

      <ConfirmationDialog
        open={Boolean(pendingDeleteProduct)}
        title="Xóa loại cầu?"
        description={pendingDeleteProduct ? `Loại cầu "${pendingDeleteProduct.name}" sẽ bị xóa theo đúng quyền và mutation hiện tại.` : 'Loại cầu sẽ bị xóa theo đúng quyền và mutation hiện tại.'}
        confirmLabel="Xóa loại cầu"
        cancelLabel="Hủy"
        tone="danger"
        isLoading={deleteProduct.isPending}
        onCancel={() => setPendingDeleteProduct(null)}
        onConfirm={confirmRemoveProduct}
      />
    </PageShell>
  );
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

function getTime(value: string | null): number {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}
