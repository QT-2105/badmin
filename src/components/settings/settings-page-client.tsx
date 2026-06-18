'use client';

import { AlertTriangle, Loader2, Settings2, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { useAppSettings } from '@/hooks/use-app-settings';
import { normalizeMaxCourtCount } from '@/lib/app-settings';
import { resetMatchHistory } from '@/services/settings-service';

export function SettingsPageClient() {
  const { settings, setSetting } = useAppSettings();
  const [resetState, setResetState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [resetMessage, setResetMessage] = useState<string | null>(null);

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

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-5 md:px-6">
      <header>
        <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/80">Cấu hình vận hành</p>
        <h1 className="text-2xl font-semibold text-white">Cài đặt</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-400">Tinh chỉnh các hành vi tự động của chương trình. Giữ cấu hình đơn giản để không làm nặng luồng vận hành sân.</p>
      </header>

      <section className="rounded-xl border border-white/10 bg-slate-900/70 p-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan-400/10 text-cyan-200">
              <Settings2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-white">Thu chi khi hoàn tất ca</h2>
              <p className="mt-1 text-sm text-slate-400">Bật/tắt phiếu tự động sinh ra khi operator hoàn tất ca chơi.</p>
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-400">
            Lưu trên trình duyệt
          </div>
        </div>

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
      </section>

      <section className="rounded-xl border border-white/10 bg-slate-900/70 p-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan-400/10 text-cyan-200">
              <Settings2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-white">Lịch chơi</h2>
              <p className="mt-1 text-sm text-slate-400">Giới hạn thao tác tạo/sửa ca theo số sân tối đa phù hợp với vận hành thực tế.</p>
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-400">
            Tối đa 12 sân
          </div>
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <label className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <span className="block text-sm font-medium text-white">Số sân tối đa cho một ca</span>
            <span className="mt-0.5 block text-xs text-slate-400">Màn tạo/sửa ca sẽ không cho nhập vượt giới hạn này.</span>
            <input
              type="number"
              min={1}
              max={12}
              value={settings.maxCourtCountPerSession}
              onChange={(event) => setSetting('maxCourtCountPerSession', normalizeMaxCourtCount(event.target.value))}
              className="mt-3 h-11 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none"
            />
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-rose-400/20 bg-rose-500/10 p-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-400/15 text-rose-200">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-white">Dữ liệu lịch sử trận đấu</h2>
              <p className="mt-1 text-sm text-rose-100/80">Xóa toàn bộ lịch sử các trận đã kết thúc. Thao tác này không ảnh hưởng người chơi, ca chơi, thu chi hoặc kho cầu.</p>
              {resetMessage ? (
                <p className={`mt-2 text-sm ${resetState === 'error' ? 'text-rose-100' : 'text-emerald-200'}`}>{resetMessage}</p>
              ) : null}
            </div>
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
      </section>
    </div>
  );
}

function SettingToggle({ checked, title, description, onChange }: { checked: boolean; title: string; description: string; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-white/10 bg-white/[0.03] p-3 transition-colors hover:bg-white/[0.06]">
      <span className="min-w-0">
        <span className="block text-sm font-medium text-white">{title}</span>
        <span className="mt-0.5 block text-xs text-slate-400">{description}</span>
      </span>
      <span className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors ${checked ? 'border-cyan-300/40 bg-cyan-400' : 'border-white/10 bg-slate-950'}`}>
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
