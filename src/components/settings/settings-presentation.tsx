'use client';

import { AlertTriangle, ChevronDown, ChevronUp, ImageUp, Loader2, Palette, Save, Settings2, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';

import { BrandLogo } from '@/components/branding/brand-logo';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input, Switch } from '@/components/ui/form';
import { PageHeader, PageShell, formInputClass, formLabelClass } from '@/components/ui/page-layout';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import type { AppSettings } from '@/lib/app-settings';
import { cn } from '@/lib/utils';
import type { BrandingSettings } from '@/types/domain';

export type SettingsSectionId = 'branding' | 'schedule' | 'finance' | 'appearance' | 'images' | 'history';
export type DestructiveAction = 'history' | 'images';
export type ResetState = 'idle' | 'loading' | 'done' | 'error';
export type BrandingSaveState = 'idle' | 'loading' | 'saved' | 'error';
export type ExpandedSettingsSections = Record<SettingsSectionId, boolean>;

export type DestructiveActionCopy = {
  title: string;
  description: string;
  confirmLabel: string;
  consequence: string;
} | null;

type FeedbackState = BrandingSaveState | ResetState;

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

export function SettingsPageView({
  settings,
  branding,
  clubName,
  isClubNameDirty,
  brandingSaveState,
  brandingSaveMessage,
  resetState,
  resetMessage,
  imageResetState,
  imageResetMessage,
  expandedSections,
  activeSection,
  destructiveActionCopy,
  isConfirmingDestructiveAction,
  updateNamePending,
  uploadLogoPending,
  deleteLogoPending,
  onNavigateSection,
  onToggleSection,
  onClubNameChange,
  onResetClubName,
  onSaveBrandingName,
  onUploadLogo,
  onDeleteLogo,
  onCourtFeeTransactionChange,
  onShuttlecockUsageTransactionChange,
  onMaxCourtCountChange,
  onOpenDestructiveAction,
  onCloseDestructiveAction,
  onConfirmDestructiveAction
}: {
  settings: AppSettings;
  branding: BrandingSettings | undefined;
  clubName: string;
  isClubNameDirty: boolean;
  brandingSaveState: BrandingSaveState;
  brandingSaveMessage: string | null;
  resetState: ResetState;
  resetMessage: string | null;
  imageResetState: ResetState;
  imageResetMessage: string | null;
  expandedSections: ExpandedSettingsSections;
  activeSection: SettingsSectionId;
  destructiveActionCopy: DestructiveActionCopy;
  isConfirmingDestructiveAction: boolean;
  updateNamePending: boolean;
  uploadLogoPending: boolean;
  deleteLogoPending: boolean;
  onNavigateSection: (sectionId: SettingsSectionId) => void;
  onToggleSection: (sectionId: SettingsSectionId) => void;
  onClubNameChange: (value: string) => void;
  onResetClubName: () => void;
  onSaveBrandingName: () => void;
  onUploadLogo: (file: File | undefined) => void;
  onDeleteLogo: () => void;
  onCourtFeeTransactionChange: (checked: boolean) => void;
  onShuttlecockUsageTransactionChange: (checked: boolean) => void;
  onMaxCourtCountChange: (value: string) => void;
  onOpenDestructiveAction: (action: DestructiveAction) => void;
  onCloseDestructiveAction: () => void;
  onConfirmDestructiveAction: () => void;
}) {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Cấu hình vận hành"
        title="Cài đặt"
        description="Cập nhật thông tin CLB, giới hạn số sân và các hành vi tự động khi hoàn tất ca. Chỉ bật những cấu hình phù hợp với cách vận hành thực tế."
      />

      <SettingsNavigation activeSection={activeSection} onNavigateSection={onNavigateSection} />

      <SettingsCard
        id="settings-branding"
        title="Thông tin CLB"
        description="Tên và logo hiển thị trên thanh menu."
        icon={<Settings2 className="h-5 w-5" />}
        expanded={expandedSections.branding}
        onToggle={() => onToggleSection('branding')}
      >
        <BrandingSection
          branding={branding}
          clubName={clubName}
          isClubNameDirty={isClubNameDirty}
          brandingSaveState={brandingSaveState}
          brandingSaveMessage={brandingSaveMessage}
          updateNamePending={updateNamePending}
          uploadLogoPending={uploadLogoPending}
          deleteLogoPending={deleteLogoPending}
          onClubNameChange={onClubNameChange}
          onResetClubName={onResetClubName}
          onSaveBrandingName={onSaveBrandingName}
          onUploadLogo={onUploadLogo}
          onDeleteLogo={onDeleteLogo}
        />
      </SettingsCard>

      <SettingsCard
        id="settings-finance"
        title="Thu chi khi hoàn tất ca"
        description="Bật/tắt phiếu tự động sinh ra khi operator hoàn tất ca chơi."
        icon={<Settings2 className="h-5 w-5" />}
        expanded={expandedSections.finance}
        onToggle={() => onToggleSection('finance')}
      >
        <FinanceSettingsSection
          settings={settings}
          onCourtFeeTransactionChange={onCourtFeeTransactionChange}
          onShuttlecockUsageTransactionChange={onShuttlecockUsageTransactionChange}
        />
      </SettingsCard>

      <SettingsCard
        id="settings-appearance"
        title="Giao diện"
        description="Điều chỉnh theme đang có của ứng dụng."
        icon={<Palette className="h-5 w-5" />}
        expanded={expandedSections.appearance}
        onToggle={() => onToggleSection('appearance')}
      >
        <AppearanceSettingsSection />
      </SettingsCard>

      <SettingsCard
        id="settings-schedule"
        title="Lịch chơi"
        description="Giới hạn thao tác tạo/sửa ca theo số sân tối đa phù hợp với vận hành thực tế."
        icon={<Settings2 className="h-5 w-5" />}
        expanded={expandedSections.schedule}
        onToggle={() => onToggleSection('schedule')}
      >
        <ScheduleSettingsSection settings={settings} onMaxCourtCountChange={onMaxCourtCountChange} />
      </SettingsCard>

      <SettingsCard
        id="settings-history"
        title="Dữ liệu lịch sử trận đấu"
        description="Xóa toàn bộ lịch sử các trận đã kết thúc."
        icon={<AlertTriangle className="h-5 w-5" />}
        expanded={expandedSections.history}
        danger
        onToggle={() => onToggleSection('history')}
      >
        <DestructiveActionSection
          message={resetMessage}
          state={resetState}
          title="Chỉ tài khoản có quyền cài đặt mới truy cập và thực hiện thao tác này."
          description="Thao tác này không ảnh hưởng người chơi, ca chơi, thu chi hoặc kho cầu."
          buttonLabel="Reset lịch sử"
          onOpen={() => onOpenDestructiveAction('history')}
        />
      </SettingsCard>

      <SettingsCard
        id="settings-images"
        title="Dữ liệu hình ảnh người chơi"
        description="Xóa toàn bộ ảnh người chơi trong DB và trên S3."
        icon={<AlertTriangle className="h-5 w-5" />}
        expanded={expandedSections.images}
        danger
        onToggle={() => onToggleSection('images')}
      >
        <DestructiveActionSection
          message={imageResetMessage}
          state={imageResetState}
          title="Chỉ tài khoản có quyền cài đặt mới truy cập và thực hiện thao tác này."
          description="Người chơi vẫn được giữ lại và dùng avatar mặc định theo giới tính."
          buttonLabel="Xóa ảnh người chơi"
          onOpen={() => onOpenDestructiveAction('images')}
        />
      </SettingsCard>

      <SettingsDestructiveDialog
        destructiveActionCopy={destructiveActionCopy}
        isConfirmingDestructiveAction={isConfirmingDestructiveAction}
        onClose={onCloseDestructiveAction}
        onConfirm={onConfirmDestructiveAction}
      />
    </PageShell>
  );
}

function SettingsNavigation({
  activeSection,
  onNavigateSection
}: {
  activeSection: SettingsSectionId;
  onNavigateSection: (sectionId: SettingsSectionId) => void;
}) {
  return (
    <nav aria-label="Điều hướng cài đặt" className="rounded-xl border border-border bg-surface p-1.5">
      <div className="flex gap-1.5 overflow-x-auto pb-1 lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0 2xl:grid-cols-6">
        {SETTINGS_NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.id;
          const isDanger = item.tone === 'danger';
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigateSection(item.id)}
              aria-current={isActive ? 'location' : undefined}
              className={[
                'min-h-16 w-[min(76vw,13rem)] shrink-0 rounded-lg border px-2.5 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background lg:min-h-[4.5rem] lg:w-auto',
                isActive
                  ? isDanger
                    ? 'border-danger/30 bg-danger-soft text-danger'
                    : 'border-info/30 bg-info-soft text-info'
                  : 'border-transparent bg-transparent text-muted-foreground hover:border-border hover:bg-surface-muted hover:text-foreground'
              ].join(' ')}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="block min-w-0 truncate text-[0.68rem] font-semibold uppercase tracking-wider opacity-80">{item.group}</span>
                <CapabilityStatusChip status={item.status} />
              </span>
              <span className="mt-1 block text-sm font-semibold leading-tight">{item.label}</span>
              <span className="mt-0.5 block truncate text-xs opacity-80">{item.description}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function BrandingSection({
  branding,
  clubName,
  isClubNameDirty,
  brandingSaveState,
  brandingSaveMessage,
  updateNamePending,
  uploadLogoPending,
  deleteLogoPending,
  onClubNameChange,
  onResetClubName,
  onSaveBrandingName,
  onUploadLogo,
  onDeleteLogo
}: {
  branding: BrandingSettings | undefined;
  clubName: string;
  isClubNameDirty: boolean;
  brandingSaveState: BrandingSaveState;
  brandingSaveMessage: string | null;
  updateNamePending: boolean;
  uploadLogoPending: boolean;
  deleteLogoPending: boolean;
  onClubNameChange: (value: string) => void;
  onResetClubName: () => void;
  onSaveBrandingName: () => void;
  onUploadLogo: (file: File | undefined) => void;
  onDeleteLogo: () => void;
}) {
  return (
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
              <SaveStatePill dirty={isClubNameDirty} state={brandingSaveState} />
            </span>
            <span id="club-name-helper" className="mb-2 block text-xs text-muted-foreground">
              Dùng cho nhận diện CLB trong toàn bộ giao diện. Không thêm field thông tin liên hệ nếu hệ thống chưa hỗ trợ.
            </span>
            <Input
              value={clubName}
              onChange={(event) => onClubNameChange(event.target.value)}
              className={formInputClass}
              placeholder="Tên CLB"
              aria-describedby="club-name-helper"
            />
          </label>
          <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
            <Button
              type="button"
              variant="secondary"
              onClick={onResetClubName}
              disabled={!isClubNameDirty || updateNamePending}
              className="h-11 w-full rounded-xl sm:w-auto"
            >
              Hoàn tác
            </Button>
            <Button type="button" onClick={onSaveBrandingName} disabled={updateNamePending} className="h-11 w-full rounded-xl sm:w-auto lg:min-w-[128px]">
              {updateNamePending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Lưu tên
            </Button>
          </div>
        </div>
        {brandingSaveMessage ? (
          <SettingsFeedbackMessage state={brandingSaveState} className="mt-3 rounded-xl">
            {brandingSaveMessage}
          </SettingsFeedbackMessage>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">Tên CLB dùng cơ chế lưu thủ công theo từng field. Các thay đổi chưa lưu chỉ nằm trên ô nhập hiện tại.</p>
        )}
        <div className="mt-4 border-t border-border pt-4">
          <p className="text-sm font-medium text-foreground">Logo CLB</p>
          <p className="mt-1 text-xs text-muted-foreground">Tải ảnh logo hiện có. Định dạng được phép giữ nguyên theo validation của hệ thống.</p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
            <label className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground transition hover:bg-muted focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background sm:w-auto">
              {uploadLogoPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageUp className="h-4 w-4" />}
              Tải logo
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={(event) => onUploadLogo(event.target.files?.[0])}
              />
            </label>
            {branding?.logoUrl ? (
              <Button type="button" variant="ghost" onClick={onDeleteLogo} disabled={deleteLogoPending} className="h-11 w-full rounded-xl sm:w-auto">
                Xóa logo
              </Button>
            ) : null}
          </div>
          {uploadLogoPending || deleteLogoPending ? (
            <p className="mt-3 text-sm text-muted-foreground">Đang cập nhật logo...</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function FinanceSettingsSection({
  settings,
  onCourtFeeTransactionChange,
  onShuttlecockUsageTransactionChange
}: {
  settings: AppSettings;
  onCourtFeeTransactionChange: (checked: boolean) => void;
  onShuttlecockUsageTransactionChange: (checked: boolean) => void;
}) {
  return (
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
          onChange={onCourtFeeTransactionChange}
        />
        <SettingToggle
          checked={settings.autoCreateShuttlecockUsageTransaction}
          title="Tự động tạo phiếu chi cầu hao ca"
          description="Khi hoàn tất ca, hệ thống tự ghi phiếu chi CẦU theo số cầu hao. Tồn kho vẫn được trừ để tránh sai số lượng."
          onChange={onShuttlecockUsageTransactionChange}
        />
      </div>
    </div>
  );
}

function AppearanceSettingsSection() {
  return (
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
  );
}

function ScheduleSettingsSection({
  settings,
  onMaxCourtCountChange
}: {
  settings: AppSettings;
  onMaxCourtCountChange: (value: string) => void;
}) {
  return (
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
          onChange={(event) => onMaxCourtCountChange(event.target.value)}
          className={`${formInputClass} mt-3 max-w-[180px]`}
          aria-describedby="max-court-helper"
        />
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded-full border border-border bg-surface px-2.5 py-1">Tạo ca: giữ nguyên workflow</span>
          <span className="rounded-full border border-border bg-surface px-2.5 py-1">Sửa ca: chỉ chặn vượt giới hạn</span>
        </div>
      </label>
    </div>
  );
}

function DestructiveActionSection({
  message,
  state,
  title,
  description,
  buttonLabel,
  onOpen
}: {
  message: string | null;
  state: ResetState;
  title: string;
  description: string;
  buttonLabel: string;
  onOpen: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium text-danger">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        {message ? (
          <SettingsFeedbackMessage state={state} className="mt-2 rounded-lg">
            {message}
          </SettingsFeedbackMessage>
        ) : null}
      </div>
      <Button
        type="button"
        onClick={onOpen}
        disabled={state === 'loading'}
        variant="danger"
        className="h-11 shrink-0"
      >
        {state === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        {buttonLabel}
      </Button>
    </div>
  );
}

function SettingsDestructiveDialog({
  destructiveActionCopy,
  isConfirmingDestructiveAction,
  onClose,
  onConfirm
}: {
  destructiveActionCopy: DestructiveActionCopy;
  isConfirmingDestructiveAction: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog
      open={Boolean(destructiveActionCopy)}
      onOpenChange={(open) => {
        if (!open && !isConfirmingDestructiveAction) {
          onClose();
        }
      }}
      title={destructiveActionCopy?.title}
      description={destructiveActionCopy?.description}
      tone="danger"
      closeOnOutsideClick={!isConfirmingDestructiveAction}
      closeOnEscape={!isConfirmingDestructiveAction}
      footer={(
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isConfirmingDestructiveAction}
          >
            Hủy
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={onConfirm}
            disabled={isConfirmingDestructiveAction}
          >
            {isConfirmingDestructiveAction ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {destructiveActionCopy?.confirmLabel}
          </Button>
        </>
      )}
    >
      <div className="rounded-xl border border-danger/25 bg-danger-soft p-3 text-sm text-danger">
        {destructiveActionCopy?.consequence}
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        Server vẫn kiểm tra quyền `settings.manage`; giao diện xác nhận này chỉ giúp tránh thao tác nhầm.
      </p>
    </Dialog>
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
  const titleId = id ? `${id}-title` : undefined;

  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className={`scroll-mt-4 rounded-xl border p-3 sm:p-4 ${danger ? 'border-danger/25 bg-danger-soft' : 'border-border bg-surface'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${danger ? 'bg-danger-soft text-danger' : 'bg-info-soft text-info'}`}>
            {icon}
          </div>
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-semibold leading-snug text-foreground">{title}</h2>
            <p className={`mt-1 text-sm ${danger ? 'text-danger-foreground' : 'text-muted-foreground'}`}>{description}</p>
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
    <label className="flex cursor-pointer flex-col gap-3 rounded-lg border border-border bg-surface-muted p-3 transition-colors hover:bg-muted focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background sm:flex-row sm:items-center sm:justify-between motion-reduce:transition-none">
      <span className="min-w-0">
        <span className="block text-sm font-medium text-foreground">{title}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <span className={`text-xs font-semibold ${checked ? 'text-success-foreground' : 'text-muted-foreground'}`}>
          {checked ? 'Bật' : 'Tắt'}
        </span>
        <Switch
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="min-h-10 shrink-0"
          aria-label={title}
        />
      </span>
    </label>
  );
}

function FinanceSettingStatus({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3 py-2">
      <span className="min-w-0 truncate text-muted-foreground">{label}</span>
      <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${enabled ? 'border-success/25 bg-success-soft text-success-foreground' : 'border-border bg-muted text-muted-foreground'}`}>
        {enabled ? 'Đang bật' : 'Đang tắt'}
      </span>
    </div>
  );
}

function CapabilityStatusChip({ status }: { status: SettingsNavItem['status'] }) {
  return (
    <span
      className={cn(
        'shrink-0 rounded-full border px-1.5 py-0.5 text-[0.62rem] font-semibold leading-none',
        status === 'AVAILABLE'
          ? 'border-success/25 bg-success-soft text-success-foreground'
          : 'border-warning/30 bg-warning-soft text-warning-foreground'
      )}
      title={status === 'AVAILABLE' ? 'Capability có sẵn' : 'Capability một phần'}
    >
      {status === 'AVAILABLE' ? 'Có sẵn' : 'Một phần'}
    </span>
  );
}

function SaveStatePill({ dirty, state }: { dirty: boolean; state: BrandingSaveState }) {
  return (
    <span
      className={cn(
        'rounded-full border px-2.5 py-1 text-xs font-semibold',
        dirty
          ? 'border-warning/30 bg-warning-soft text-warning-foreground'
          : state === 'saved'
            ? 'border-success/25 bg-success-soft text-success-foreground'
            : 'border-border bg-muted text-muted-foreground'
      )}
      aria-live="polite"
    >
      {dirty ? 'Chưa lưu' : state === 'saved' ? 'Đã lưu' : 'Không đổi'}
    </span>
  );
}

function SettingsFeedbackMessage({
  state,
  className,
  children
}: {
  state: FeedbackState;
  className?: string;
  children: ReactNode;
}) {
  return (
    <p
      className={cn(
        'border px-3 py-2 text-sm',
        state === 'error'
          ? 'border-danger/25 bg-danger-soft text-danger-foreground'
          : 'border-success/25 bg-success-soft text-success-foreground',
        className
      )}
      role={state === 'error' ? 'alert' : 'status'}
      aria-live="polite"
    >
      {children}
    </p>
  );
}
