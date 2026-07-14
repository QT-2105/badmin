'use client';

import { AlertTriangle, ChevronDown, ChevronUp, ImageUp, Loader2, Save, Settings2, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { BrandLogo } from '@/components/branding/brand-logo';
import { Button } from '@/components/ui/button';
import { PageHeader, PageShell, formInputClass, formLabelClass } from '@/components/ui/page-layout';
import { useAppSettings } from '@/hooks/use-app-settings';
import { useBranding, useBrandingMutations } from '@/hooks/use-branding';
import { normalizeMaxCourtCount } from '@/lib/app-settings';
import { deleteAllPlayerImages, resetMatchHistory } from '@/services/settings-service';

export function SettingsPageClient() {
  const { settings, setSetting } = useAppSettings();
  const { data: branding } = useBranding();
  const brandingMutations = useBrandingMutations();
  const [clubName, setClubName] = useState('');
  const [resetState, setResetState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [imageResetState, setImageResetState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [imageResetMessage, setImageResetMessage] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    branding: false,
    finance: false,
    schedule: false,
    history: false,
    images: false
  });

  useEffect(() => {
    setClubName(branding?.clubName || 'Badmin');
  }, [branding?.clubName]);

  async function handleSaveBrandingName() {
    await brandingMutations.updateName.mutateAsync(clubName);
  }

  async function handleUploadLogo(file: File | undefined) {
    if (!file) return;
    await brandingMutations.uploadLogo.mutateAsync(file);
  }

  async function handleResetMatchHistory() {
    const confirmed = window.confirm('Bạn chắc chắn muốn xóa toàn bộ lịch sử trận đấu? Dữ liệu đã xóa sẽ không thể khôi phục.');
    if (!confirmed) return;

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
    const confirmed = window.confirm('Bạn chắc chắn muốn xóa toàn bộ hình ảnh người chơi trên DB và S3? Người chơi sẽ quay về avatar mặc định theo giới tính.');
    if (!confirmed) return;

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

  return (
    <PageShell>
      <PageHeader
        eyebrow="Cấu hình vận hành"
        title="Cài đặt"
        description="Cập nhật thông tin CLB, giới hạn số sân và các hành vi tự động khi hoàn tất ca. Chỉ bật những cấu hình phù hợp với cách vận hành thực tế."
      />

      <SettingsCard
        title="Thông tin CLB"
        description="Tên và logo hiển thị trên thanh menu."
        icon={<Settings2 className="h-5 w-5" />}
        expanded={expandedSections.branding}
        onToggle={() => setExpandedSections((current) => ({ ...current, branding: !current.branding }))}
      >
        <div className="grid gap-4 lg:grid-cols-[144px_minmax(0,1fr)] lg:items-center">
          <div className="flex justify-center lg:justify-start">
            <BrandLogo
              clubName={branding?.clubName || clubName}
              logoUrl={branding?.logoUrl}
              className="h-32 w-32 rounded-3xl text-3xl"
              textClassName="text-2xl"
            />
          </div>
          <div className="rounded-2xl border border-border bg-surface-muted p-3">
            <label className="block min-w-0">
              <span className={formLabelClass}>Tên hiển thị</span>
              <input
                value={clubName}
                onChange={(event) => setClubName(event.target.value)}
                className={formInputClass}
                placeholder="Tên CLB"
              />
            </label>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" onClick={() => void handleSaveBrandingName()} disabled={brandingMutations.updateName.isPending} className="h-11 rounded-xl">
                {brandingMutations.updateName.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Lưu tên
              </Button>
              <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground transition hover:bg-muted">
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
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Thu chi khi hoàn tất ca"
        description="Bật/tắt phiếu tự động sinh ra khi operator hoàn tất ca chơi."
        icon={<Settings2 className="h-5 w-5" />}
        expanded={expandedSections.finance}
        onToggle={() => setExpandedSections((current) => ({ ...current, finance: !current.finance }))}
      >
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
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
      </SettingsCard>

      <SettingsCard
        title="Lịch chơi"
        description="Giới hạn thao tác tạo/sửa ca theo số sân tối đa phù hợp với vận hành thực tế."
        icon={<Settings2 className="h-5 w-5" />}
        expanded={expandedSections.schedule}
        onToggle={() => setExpandedSections((current) => ({ ...current, schedule: !current.schedule }))}
      >
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <label className="rounded-lg border border-border bg-surface-muted p-3">
            <span className="block text-sm font-medium text-foreground">Số sân tối đa cho một ca</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">Màn tạo/sửa ca sẽ không cho nhập vượt giới hạn này.</span>
            <input
              type="number"
              min={1}
              max={12}
              value={settings.maxCourtCountPerSession}
              onChange={(event) => setSetting('maxCourtCountPerSession', normalizeMaxCourtCount(event.target.value))}
              className={formInputClass}
            />
          </label>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Dữ liệu lịch sử trận đấu"
        description="Xóa toàn bộ lịch sử các trận đã kết thúc."
        icon={<AlertTriangle className="h-5 w-5" />}
        expanded={expandedSections.history}
        danger
        onToggle={() => setExpandedSections((current) => ({ ...current, history: !current.history }))}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="text-sm text-rose-100/80">Thao tác này không ảnh hưởng người chơi, ca chơi, thu chi hoặc kho cầu.</p>
              {resetMessage ? (
                <p className={`mt-2 text-sm ${resetState === 'error' ? 'text-rose-100' : 'text-emerald-200'}`}>{resetMessage}</p>
              ) : null}
            </div>
          <button
            type="button"
            onClick={() => void handleResetMatchHistory()}
            disabled={resetState === 'loading'}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-rose-300/30 bg-rose-500/20 px-4 text-sm font-semibold text-rose-100 transition-colors hover:bg-rose-500/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {resetState === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Reset lịch sử
          </button>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Dữ liệu hình ảnh người chơi"
        description="Xóa toàn bộ ảnh người chơi trong DB và trên S3."
        icon={<AlertTriangle className="h-5 w-5" />}
        expanded={expandedSections.images}
        danger
        onToggle={() => setExpandedSections((current) => ({ ...current, images: !current.images }))}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="text-sm text-rose-100/80">Người chơi vẫn được giữ lại và dùng avatar mặc định theo giới tính.</p>
              {imageResetMessage ? (
                <p className={`mt-2 text-sm ${imageResetState === 'error' ? 'text-rose-100' : 'text-emerald-200'}`}>{imageResetMessage}</p>
              ) : null}
            </div>
          <button
            type="button"
            onClick={() => void handleDeleteAllPlayerImages()}
            disabled={imageResetState === 'loading'}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-rose-300/30 bg-rose-500/20 px-4 text-sm font-semibold text-rose-100 transition-colors hover:bg-rose-500/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {imageResetState === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Xóa ảnh người chơi
          </button>
        </div>
      </SettingsCard>
    </PageShell>
  );
}

function SettingsCard({
  title,
  description,
  icon,
  expanded,
  danger = false,
  onToggle,
  children
}: {
  title: string;
  description: string;
  icon: ReactNode;
  expanded: boolean;
  danger?: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className={`rounded-xl border p-3 shadow-soft ${danger ? 'border-danger/25 bg-danger-soft' : 'border-border bg-surface'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${danger ? 'bg-danger-soft text-danger' : 'bg-info-soft text-info'}`}>
            {icon}
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            <p className={`mt-1 text-sm ${danger ? 'text-danger' : 'text-muted-foreground'}`}>{description}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-surface-muted text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label={expanded ? 'Thu gọn' : 'Mở rộng'}
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>
      {expanded ? <div className="mt-3">{children}</div> : null}
    </section>
  );
}

function SettingToggle({ checked, title, description, onChange }: { checked: boolean; title: string; description: string; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-border bg-surface-muted p-3 transition-colors hover:bg-muted">
      <span className="min-w-0">
        <span className="block text-sm font-medium text-foreground">{title}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
      </span>
      <span className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors ${checked ? 'border-primary/40 bg-primary' : 'border-border bg-background'}`}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="sr-only"
        />
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </span>
    </label>
  );
}
