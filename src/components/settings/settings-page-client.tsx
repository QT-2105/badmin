'use client';

import { AlertTriangle, ChevronDown, ChevronUp, ImageUp, Loader2, Palette, Save, Settings2, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { BrandLogo } from '@/components/branding/brand-logo';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input, Switch } from '@/components/ui/form';
import { PageHeader, PageShell, formInputClass, formLabelClass } from '@/components/ui/page-layout';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAppSettings } from '@/hooks/use-app-settings';
import { useBranding, useBrandingMutations } from '@/hooks/use-branding';
import { normalizeMaxCourtCount } from '@/lib/app-settings';
import { deleteAllPlayerImages, resetMatchHistory } from '@/services/settings-service';

type SettingsSectionId = 'branding' | 'schedule' | 'finance' | 'appearance' | 'images' | 'history';
type DestructiveAction = 'history' | 'images';

type SettingsNavItem = {
  id: SettingsSectionId;
  group: string;
  label: string;
  description: string;
  status: 'AVAILABLE' | 'PARTIAL';
  tone?: 'default' | 'danger';
};

const SETTINGS_NAV_ITEMS: SettingsNavItem[] = [
  {
    id: 'branding',
    group: 'Club',
    label: 'Thông tin CLB',
    description: 'Tên và logo hiển thị',
    status: 'AVAILABLE'
  },
  {
    id: 'schedule',
    group: 'Schedule & Sessions',
    label: 'Lịch & ca chơi',
    description: 'Giới hạn số sân mỗi ca',
    status: 'PARTIAL'
  },
  {
    id: 'finance',
    group: 'Finance',
    label: 'Thu chi',
    description: 'Phiếu tự động khi hoàn tất',
    status: 'PARTIAL'
  },
  {
    id: 'appearance',
    group: 'Appearance',
    label: 'Giao diện',
    description: 'Sáng hoặc tối',
    status: 'PARTIAL'
  },
  {
    id: 'images',
    group: 'Data',
    label: 'Ảnh người chơi',
    description: 'Dọn ảnh đang lưu',
    status: 'AVAILABLE',
    tone: 'danger'
  },
  {
    id: 'history',
    group: 'Data',
    label: 'Lịch sử trận',
    description: 'Reset dữ liệu trận đấu',
    status: 'AVAILABLE',
    tone: 'danger'
  }
];

export function SettingsPageClient() {
  const { settings, setSetting } = useAppSettings();
  const { data: branding } = useBranding();
  const brandingMutations = useBrandingMutations();
  const [clubName, setClubName] = useState('');
  const [resetState, setResetState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [imageResetState, setImageResetState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [imageResetMessage, setImageResetMessage] = useState<string | null>(null);
  const [brandingSaveState, setBrandingSaveState] = useState<'idle' | 'loading' | 'saved' | 'error'>('idle');
  const [brandingSaveMessage, setBrandingSaveMessage] = useState<string | null>(null);
  const [pendingDestructiveAction, setPendingDestructiveAction] = useState<DestructiveAction | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    branding: false,
    finance: false,
    appearance: false,
    schedule: false,
    history: false,
    images: false
  });
  const [activeSection, setActiveSection] = useState<SettingsSectionId>('branding');

  useEffect(() => {
    setClubName(branding?.clubName || 'Badmin');
  }, [branding?.clubName]);

  function openSection(sectionId: SettingsSectionId) {
    setActiveSection(sectionId);
    setExpandedSections((current) => ({ ...current, [sectionId]: true }));
  }

  function handleNavigateSection(sectionId: SettingsSectionId) {
    openSection(sectionId);
    window.requestAnimationFrame(() => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      document.getElementById(`settings-${sectionId}`)?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
    });
  }

  async function handleSaveBrandingName() {
    setBrandingSaveState('loading');
    setBrandingSaveMessage(null);
    try {
      await brandingMutations.updateName.mutateAsync(clubName);
      setBrandingSaveState('saved');
      setBrandingSaveMessage('Đã lưu tên hiển thị.');
    } catch (caught) {
      setBrandingSaveState('error');
      setBrandingSaveMessage(caught instanceof Error ? caught.message : 'Không thể lưu tên hiển thị.');
    }
  }

  async function handleUploadLogo(file: File | undefined) {
    if (!file) return;
    await brandingMutations.uploadLogo.mutateAsync(file);
  }

  async function handleResetMatchHistory() {
    setResetState('loading');
    setResetMessage(null);
    try {
      const result = await resetMatchHistory();
      setResetState('done');
      setResetMessage(`Đã xóa ${result.deletedMatches} trận đấu khỏi lịch sử.`);
    } catch (caught) {
      setResetState('error');
      setResetMessage(caught instanceof Error ? caught.message : 'Không thể xóa lịch sử trận đấu');
    }
  }

  async function handleDeleteAllPlayerImages() {
    setImageResetState('loading');
    setImageResetMessage(null);
    try {
      const result = await deleteAllPlayerImages();
      setImageResetState('done');
      setImageResetMessage(`Đã xóa ${result.deletedImages} hình ảnh người chơi.`);
    } catch (caught) {
      setImageResetState('error');
      setImageResetMessage(caught instanceof Error ? caught.message : 'Không thể xóa dữ liệu hình ảnh người chơi');
    }
  }

  async function handleConfirmDestructiveAction() {
    const action = pendingDestructiveAction;
    if (!action) return;

    if (action === 'history') {
      await handleResetMatchHistory();
    } else {
      await handleDeleteAllPlayerImages();
    }

    setPendingDestructiveAction(null);
  }

  const destructiveActionCopy = pendingDestructiveAction === 'history'
    ? {
        title: 'Reset lịch sử trận đấu?',
        description: 'Thao tác này xóa toàn bộ lịch sử các trận đã kết thúc. Dữ liệu đã xóa không thể khôi phục từ màn hình này.',
        confirmLabel: 'Reset lịch sử',
        consequence: 'Không ảnh hưởng người chơi, ca chơi, thu chi hoặc kho cầu.'
      }
    : pendingDestructiveAction === 'images'
      ? {
          title: 'Xóa toàn bộ ảnh người chơi?',
          description: 'Thao tác này xóa ảnh người chơi trong DB và trên S3. Người chơi vẫn tồn tại và quay về avatar mặc định theo giới tính.',
          confirmLabel: 'Xóa ảnh người chơi',
          consequence: 'Không xóa người chơi, thanh toán, ca chơi hoặc lịch sử trận.'
        }
      : null;
  const isConfirmingDestructiveAction = resetState === 'loading' || imageResetState === 'loading';
  const savedClubName = branding?.clubName || 'Badmin';
  const isClubNameDirty = clubName !== savedClubName;

  return (
    <PageShell>
      <PageHeader
        eyebrow="Cấu hình vận hành"
        title="Cài đặt"
        description="Cập nhật thông tin CLB, giới hạn số sân và các hành vi tự động khi hoàn tất ca. Chỉ bật những cấu hình phù hợp với cách vận hành thực tế."
      />

      <nav aria-label="Điều hướng cài đặt" className="rounded-2xl border border-border bg-surface p-2 shadow-soft">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          {SETTINGS_NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            const isDanger = item.tone === 'danger';

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigateSection(item.id)}
                aria-current={isActive ? 'location' : undefined}
                className={[
                  'min-h-24 rounded-xl border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  isActive
                    ? isDanger
                      ? 'border-danger/30 bg-danger-soft text-danger'
                      : 'border-info/30 bg-info-soft text-info'
                    : 'border-transparent bg-transparent text-muted-foreground hover:border-border hover:bg-surface-muted hover:text-foreground'
                ].join(' ')}
              >
                <span className="block text-[0.68rem] font-semibold uppercase tracking-wider opacity-80">{item.group}</span>
                <span className="mt-1 block text-sm font-semibold leading-tight">{item.label}</span>
                <span className="mt-0.5 block truncate text-xs opacity-80">{item.description}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <SettingsCard
        id="settings-branding"
        title="Thông tin CLB"
        description="Tên và logo hiển thị trên thanh menu."
        icon={<Settings2 className="h-5 w-5" />}
        expanded={expandedSections.branding}
        onToggle={() => {
          setActiveSection('branding');
          setExpandedSections((current) => ({ ...current, branding: !current.branding }));
        }}
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(220px,300px)_minmax(0,1fr)] 2xl:grid-cols-[minmax(240px,320px)_minmax(0,1fr)]">
          <div className="rounded-2xl border border-border bg-surface-muted p-3 sm:p-4">
            <div className="flex items-center gap-4">
              <BrandLogo
                clubName={branding?.clubName || clubName}
                logoUrl={branding?.logoUrl}
                className="h-24 w-24 rounded-2xl text-2xl"
                textClassName="text-xl"
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-info">Preview</p>
                <p className="mt-1 truncate text-lg font-semibold text-foreground">{branding?.clubName || clubName || 'Badmin'}</p>
                <p className="mt-1 text-sm text-muted-foreground">{branding?.logoUrl ? 'Đang dùng logo riêng' : 'Đang dùng avatar chữ'}</p>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-muted-foreground">
              Thông tin này được hiển thị ở sidebar, màn đăng nhập và các khu vực nhận diện CLB.
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-surface-muted p-3 sm:p-4">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
              <label className="block min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <span className={formLabelClass}>Tên hiển thị</span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      isClubNameDirty
                        ? 'bg-warning-soft text-warning'
                        : brandingSaveState === 'saved'
                          ? 'bg-success-soft text-success'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isClubNameDirty ? 'Chưa lưu' : brandingSaveState === 'saved' ? 'Đã lưu' : 'Không đổi'}
                  </span>
                </span>
                <span id="club-name-helper" className="mb-2 block text-xs text-muted-foreground">
                  Dùng cho nhận diện CLB trong toàn bộ giao diện. Không thêm field thông tin liên hệ nếu hệ thống chưa hỗ trợ.
                </span>
                <Input
                  value={clubName}
                  onChange={(event) => {
                    setClubName(event.target.value);
                    setBrandingSaveState('idle');
                    setBrandingSaveMessage(null);
                  }}
                  className={formInputClass}
                  placeholder="Tên CLB"
                  aria-describedby="club-name-helper"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setClubName(savedClubName);
                    setBrandingSaveState('idle');
                    setBrandingSaveMessage(null);
                  }}
                  disabled={!isClubNameDirty || brandingMutations.updateName.isPending}
                  className="h-11 rounded-xl"
                >
                  Hoàn tác
                </Button>
                <Button type="button" onClick={() => void handleSaveBrandingName()} disabled={brandingMutations.updateName.isPending} className="h-11 rounded-xl lg:min-w-[128px]">
                {brandingMutations.updateName.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Lưu tên
                </Button>
              </div>
            </div>
            {brandingSaveMessage ? (
              <p
                className={`mt-3 rounded-xl border px-3 py-2 text-sm ${
                  brandingSaveState === 'error'
                    ? 'border-danger/25 bg-danger-soft text-danger'
                    : 'border-success/25 bg-success-soft text-success'
                }`}
                role="status"
                aria-live="polite"
              >
                {brandingSaveMessage}
              </p>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">Tên CLB dùng cơ chế lưu thủ công theo từng field. Các thay đổi chưa lưu chỉ nằm trên ô nhập hiện tại.</p>
            )}
            <div className="mt-4 border-t border-border pt-4">
              <p className="text-sm font-medium text-foreground">Logo CLB</p>
              <p className="mt-1 text-xs text-muted-foreground">Tải ảnh logo hiện có. Định dạng được phép giữ nguyên theo validation của hệ thống.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground transition hover:bg-muted focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
                  {brandingMutations.uploadLogo.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageUp className="h-4 w-4" />}
                  Tải logo
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    onChange={(event) => void handleUploadLogo(event.target.files?.[0])}
                  />
                </label>
                {branding?.logoUrl ? (
                  <Button type="button" variant="ghost" onClick={() => void brandingMutations.deleteLogo.mutateAsync()} disabled={brandingMutations.deleteLogo.isPending} className="h-11 rounded-xl">
                    Xóa logo
                  </Button>
                ) : null}
              </div>
              {brandingMutations.uploadLogo.isPending || brandingMutations.deleteLogo.isPending ? (
                <p className="mt-3 text-sm text-muted-foreground">Đang cập nhật logo...</p>
              ) : null}
            </div>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        id="settings-finance"
        title="Thu chi khi hoàn tất ca"
        description="Bật/tắt phiếu tự động sinh ra khi operator hoàn tất ca chơi."
        icon={<Settings2 className="h-5 w-5" />}
        expanded={expandedSections.finance}
        onToggle={() => {
          setActiveSection('finance');
          setExpandedSections((current) => ({ ...current, finance: !current.finance }));
        }}
      >
        <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(220px,300px)_minmax(0,1fr)] 2xl:grid-cols-[minmax(240px,320px)_minmax(0,1fr)]">
          <div className="rounded-2xl border border-border bg-surface-muted p-3 sm:p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-success">Hoàn tất ca</p>
            <div className="mt-3 space-y-2 text-sm">
              <FinanceSettingStatus label="Phiếu chi sân" enabled={settings.autoCreateCourtFeeTransaction} />
              <FinanceSettingStatus label="Phiếu chi cầu hao ca" enabled={settings.autoCreateShuttlecockUsageTransaction} />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Các tùy chọn này chỉ quyết định có sinh phiếu thu chi tự động hay không. Công thức lợi nhuận, doanh thu và chi phí không đổi.
            </p>
            <p className="mt-2 rounded-xl border border-border bg-surface px-3 py-2 text-xs text-muted-foreground">
              Tự lưu trong trình duyệt ngay khi bật hoặc tắt.
            </p>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <SettingToggle
              checked={settings.autoCreateCourtFeeTransaction}
              title="Tự động tạo phiếu chi tiền sân"
              description="Khi hoàn tất ca, hệ thống tự ghi phiếu chi SÂN theo chi phí sân đã nhập."
              onChange={(checked) => setSetting('autoCreateCourtFeeTransaction', checked)}
            />
            <SettingToggle
              checked={settings.autoCreateShuttlecockUsageTransaction}
              title="Tự động tạo phiếu chi cầu hao ca"
              description="Khi hoàn tất ca, hệ thống tự ghi phiếu chi CẦU theo số cầu hao. Tồn kho vẫn được trừ để tránh sai số lượng."
              onChange={(checked) => setSetting('autoCreateShuttlecockUsageTransaction', checked)}
            />
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        id="settings-appearance"
        title="Giao diện"
        description="Điều chỉnh theme đang có của ứng dụng."
        icon={<Palette className="h-5 w-5" />}
        expanded={expandedSections.appearance}
        onToggle={() => {
          setActiveSection('appearance');
          setExpandedSections((current) => ({ ...current, appearance: !current.appearance }));
        }}
      >
        <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(220px,300px)_minmax(0,1fr)] 2xl:grid-cols-[minmax(240px,320px)_minmax(0,1fr)]">
          <div className="rounded-2xl border border-border bg-surface-muted p-3 sm:p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-info">Theme hiện có</p>
            <p className="mt-2 text-lg font-semibold text-foreground">Sáng / Tối</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Tùy chọn này dùng lại cơ chế theme hiện tại của ứng dụng và lưu trong trình duyệt. Không có system theme hoặc accent color trong Settings hiện tại.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface-muted p-3 sm:p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Chế độ hiển thị</p>
                <p className="mt-1 text-xs text-muted-foreground">Thay đổi có hiệu lực ngay và giữ nguyên behavior hiện tại khi reload.</p>
              </div>
              <ThemeToggle className="h-11 shrink-0 rounded-xl" />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-background p-3">
                <div className="h-2 w-12 rounded-full bg-info" />
                <p className="mt-3 text-sm font-semibold text-foreground">Preview nền</p>
                <p className="mt-1 text-xs text-muted-foreground">Theo token hiện tại.</p>
              </div>
              <div className="rounded-xl border border-border bg-surface p-3">
                <div className="h-2 w-12 rounded-full bg-success" />
                <p className="mt-3 text-sm font-semibold text-foreground">Preview surface</p>
                <p className="mt-1 text-xs text-muted-foreground">Không đổi design token.</p>
              </div>
            </div>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        id="settings-schedule"
        title="Lịch chơi"
        description="Giới hạn thao tác tạo/sửa ca theo số sân tối đa phù hợp với vận hành thực tế."
        icon={<Settings2 className="h-5 w-5" />}
        expanded={expandedSections.schedule}
        onToggle={() => {
          setActiveSection('schedule');
          setExpandedSections((current) => ({ ...current, schedule: !current.schedule }));
        }}
      >
        <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(220px,300px)_minmax(0,1fr)] 2xl:grid-cols-[minmax(240px,320px)_minmax(0,1fr)]">
          <div className="rounded-2xl border border-border bg-surface-muted p-3 sm:p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-info">Giới hạn hiện tại</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-foreground">{settings.maxCourtCountPerSession} sân</p>
            <p className="mt-2 text-sm text-muted-foreground">Áp dụng cho thao tác tạo hoặc sửa ca chơi mới. Các ca đã tạo không bị cập nhật lại.</p>
            <p className="mt-2 rounded-xl border border-border bg-surface px-3 py-2 text-xs text-muted-foreground">
              Tự lưu sau mỗi lần chỉnh giá trị.
            </p>
          </div>
          <label className="rounded-2xl border border-border bg-surface-muted p-3 sm:p-4">
            <span className="block text-sm font-medium text-foreground">Số sân tối đa cho một ca</span>
            <span id="max-court-helper" className="mt-1 block text-xs text-muted-foreground">
              Giá trị được lưu trong cài đặt trình duyệt hiện tại. Hệ thống giữ nguyên giới hạn từ 1 đến 12 sân.
            </span>
            <Input
              type="number"
              min={1}
              max={12}
              value={settings.maxCourtCountPerSession}
              onChange={(event) => setSetting('maxCourtCountPerSession', normalizeMaxCourtCount(event.target.value))}
              className={`${formInputClass} mt-3 max-w-[180px]`}
              aria-describedby="max-court-helper"
            />
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="rounded-full border border-border bg-surface px-2.5 py-1">Tạo ca: giữ nguyên workflow</span>
              <span className="rounded-full border border-border bg-surface px-2.5 py-1">Sửa ca: chỉ chặn vượt giới hạn</span>
            </div>
          </label>
        </div>
      </SettingsCard>

      <SettingsCard
        id="settings-history"
        title="Dữ liệu lịch sử trận đấu"
        description="Xóa toàn bộ lịch sử các trận đã kết thúc."
        icon={<AlertTriangle className="h-5 w-5" />}
        expanded={expandedSections.history}
        danger
        onToggle={() => {
          setActiveSection('history');
          setExpandedSections((current) => ({ ...current, history: !current.history }));
        }}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-danger">Chỉ tài khoản có quyền cài đặt mới truy cập và thực hiện thao tác này.</p>
            <p className="mt-1 text-sm text-muted-foreground">Thao tác này không ảnh hưởng người chơi, ca chơi, thu chi hoặc kho cầu.</p>
            {resetMessage ? (
              <p className={`mt-2 text-sm ${resetState === 'error' ? 'text-danger' : 'text-success'}`}>{resetMessage}</p>
            ) : null}
          </div>
          <Button
            type="button"
            onClick={() => setPendingDestructiveAction('history')}
            disabled={resetState === 'loading'}
            variant="danger"
            className="h-11 shrink-0"
          >
            {resetState === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Reset lịch sử
          </Button>
        </div>
      </SettingsCard>

      <SettingsCard
        id="settings-images"
        title="Dữ liệu hình ảnh người chơi"
        description="Xóa toàn bộ ảnh người chơi trong DB và trên S3."
        icon={<AlertTriangle className="h-5 w-5" />}
        expanded={expandedSections.images}
        danger
        onToggle={() => {
          setActiveSection('images');
          setExpandedSections((current) => ({ ...current, images: !current.images }));
        }}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-danger">Chỉ tài khoản có quyền cài đặt mới truy cập và thực hiện thao tác này.</p>
            <p className="mt-1 text-sm text-muted-foreground">Người chơi vẫn được giữ lại và dùng avatar mặc định theo giới tính.</p>
            {imageResetMessage ? (
              <p className={`mt-2 text-sm ${imageResetState === 'error' ? 'text-danger' : 'text-success'}`}>{imageResetMessage}</p>
            ) : null}
          </div>
          <Button
            type="button"
            onClick={() => setPendingDestructiveAction('images')}
            disabled={imageResetState === 'loading'}
            variant="danger"
            className="h-11 shrink-0"
          >
            {imageResetState === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Xóa ảnh người chơi
          </Button>
        </div>
      </SettingsCard>

      <Dialog
        open={Boolean(destructiveActionCopy)}
        onOpenChange={(open) => {
          if (!open && !isConfirmingDestructiveAction) {
            setPendingDestructiveAction(null);
          }
        }}
        title={destructiveActionCopy?.title}
        description={destructiveActionCopy?.description}
        tone="danger"
        closeOnOutsideClick={!isConfirmingDestructiveAction}
        closeOnEscape={!isConfirmingDestructiveAction}
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPendingDestructiveAction(null)}
              disabled={isConfirmingDestructiveAction}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => void handleConfirmDestructiveAction()}
              disabled={isConfirmingDestructiveAction}
            >
              {isConfirmingDestructiveAction ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {destructiveActionCopy?.confirmLabel}
            </Button>
          </>
        }
      >
        <div className="rounded-xl border border-danger/25 bg-danger-soft p-3 text-sm text-danger">
          {destructiveActionCopy?.consequence}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Server vẫn kiểm tra quyền `settings.manage`; giao diện xác nhận này chỉ giúp tránh thao tác nhầm.
        </p>
      </Dialog>
    </PageShell>
  );
}

function SettingsCard({
  id,
  title,
  description,
  icon,
  expanded,
  danger = false,
  onToggle,
  children
}: {
  id?: string;
  title: string;
  description: string;
  icon: ReactNode;
  expanded: boolean;
  danger?: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const contentId = id ? `${id}-content` : undefined;

  return (
    <section id={id} className={`scroll-mt-4 rounded-xl border p-3 shadow-soft sm:p-4 ${danger ? 'border-danger/25 bg-danger-soft' : 'border-border bg-surface'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${danger ? 'bg-danger-soft text-danger' : 'bg-info-soft text-info'}`}>
            {icon}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold leading-snug text-foreground">{title}</h2>
            <p className={`mt-1 text-sm ${danger ? 'text-danger' : 'text-muted-foreground'}`}>{description}</p>
          </div>
        </div>
        <Button
          type="button"
          onClick={onToggle}
          variant="secondary"
          size="sm"
          className="h-9 w-9 shrink-0 px-0"
          aria-controls={contentId}
          aria-expanded={expanded}
          aria-label={expanded ? `Thu gọn ${title}` : `Mở rộng ${title}`}
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>
      {expanded ? <div id={contentId} className="mt-3">{children}</div> : null}
    </section>
  );
}

function SettingToggle({ checked, title, description, onChange }: { checked: boolean; title: string; description: string; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex cursor-pointer flex-col gap-3 rounded-lg border border-border bg-surface-muted p-3 transition-colors hover:bg-muted sm:flex-row sm:items-center sm:justify-between">
      <span className="min-w-0">
        <span className="block text-sm font-medium text-foreground">{title}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
      </span>
      <Switch checked={checked} onChange={(event) => onChange(event.target.checked)} className="min-h-10 shrink-0" />
    </label>
  );
}

function FinanceSettingStatus({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3 py-2">
      <span className="min-w-0 truncate text-muted-foreground">{label}</span>
      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${enabled ? 'bg-success-soft text-success' : 'bg-muted text-muted-foreground'}`}>
        {enabled ? 'Đang bật' : 'Đang tắt'}
      </span>
    </div>
  );
}
