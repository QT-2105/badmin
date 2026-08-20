'use client';

import { useEffect, useState } from 'react';

import { useAppSettings } from '@/hooks/use-app-settings';
import { useBranding, useBrandingMutations } from '@/hooks/use-branding';
import { usePaymentBankAccountMutations, usePaymentBankAccounts } from '@/hooks/use-payment-bank-accounts';
import { normalizeMaxCourtCount } from '@/lib/app-settings';
import { deleteAllPlayerImages, resetMatchHistory } from '@/services/settings-service';

import {
  SettingsPageView,
  type BrandingSaveState,
  type DestructiveAction,
  type DestructiveActionCopy,
  type ExpandedSettingsSections,
  type ResetState,
  type SettingsSectionId
} from './settings-presentation';

const initialExpandedSections: ExpandedSettingsSections = {
  branding: false,
  payment: false,
  finance: false,
  appearance: false,
  schedule: false,
  history: false,
  images: false
};

export function SettingsPageClient() {
  const { settings, setSetting } = useAppSettings();
  const { data: branding } = useBranding();
  const { data: paymentBankAccounts = [] } = usePaymentBankAccounts();
  const brandingMutations = useBrandingMutations();
  const paymentBankAccountMutations = usePaymentBankAccountMutations();
  const [clubName, setClubName] = useState('');
  const [paymentAccountName, setPaymentAccountName] = useState('');
  const [paymentBankName, setPaymentBankName] = useState('');
  const [paymentQrFile, setPaymentQrFile] = useState<File | null>(null);
  const [paymentFormKey, setPaymentFormKey] = useState(0);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const [resetState, setResetState] = useState<ResetState>('idle');
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [imageResetState, setImageResetState] = useState<ResetState>('idle');
  const [imageResetMessage, setImageResetMessage] = useState<string | null>(null);
  const [brandingSaveState, setBrandingSaveState] = useState<BrandingSaveState>('idle');
  const [brandingSaveMessage, setBrandingSaveMessage] = useState<string | null>(null);
  const [pendingDestructiveAction, setPendingDestructiveAction] = useState<DestructiveAction | null>(null);
  const [expandedSections, setExpandedSections] = useState<ExpandedSettingsSections>(initialExpandedSections);
  const [activeSection, setActiveSection] = useState<SettingsSectionId>('branding');

  useEffect(() => {
    setClubName(branding?.clubName || 'Badmin');
  }, [branding?.clubName]);

  function openSection(sectionId: SettingsSectionId) {
    setActiveSection(sectionId);
    setExpandedSections((current) => ({ ...current, [sectionId]: true }));
  }

  function handleToggleSection(sectionId: SettingsSectionId) {
    setActiveSection(sectionId);
    setExpandedSections((current) => ({ ...current, [sectionId]: !current[sectionId] }));
  }

  function handleNavigateSection(sectionId: SettingsSectionId) {
    openSection(sectionId);
    window.requestAnimationFrame(() => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      document.getElementById(`settings-${sectionId}`)?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
    });
  }

  function handleClubNameChange(value: string) {
    setClubName(value);
    setBrandingSaveState('idle');
    setBrandingSaveMessage(null);
  }

  function handleResetClubName() {
    setClubName(savedClubName);
    setBrandingSaveState('idle');
    setBrandingSaveMessage(null);
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

  async function handleCreatePaymentBankAccount() {
    if (!paymentQrFile) {
      setPaymentMessage('Vui lòng chọn ảnh QR thanh toán.');
      return;
    }
    setPaymentMessage(null);
    try {
      await paymentBankAccountMutations.createAccount.mutateAsync({
        accountName: paymentAccountName,
        bankName: paymentBankName,
        qrImage: paymentQrFile
      });
      setPaymentAccountName('');
      setPaymentBankName('');
      setPaymentQrFile(null);
      setPaymentFormKey((key) => key + 1);
      setPaymentMessage('Đã thêm tài khoản thanh toán.');
    } catch (caught) {
      setPaymentMessage(caught instanceof Error ? caught.message : 'Không thể thêm tài khoản thanh toán.');
    }
  }

  async function handleDeletePaymentBankAccount(accountId: string) {
    setPaymentMessage(null);
    try {
      await paymentBankAccountMutations.deleteAccount.mutateAsync(accountId);
      setPaymentMessage('Đã xóa tài khoản thanh toán.');
    } catch (caught) {
      setPaymentMessage(caught instanceof Error ? caught.message : 'Không thể xóa tài khoản thanh toán.');
    }
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

  const savedClubName = branding?.clubName || 'Badmin';
  const isClubNameDirty = clubName !== savedClubName;
  const destructiveActionCopy: DestructiveActionCopy = pendingDestructiveAction === 'history'
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

  return (
    <SettingsPageView
      settings={settings}
      branding={branding}
      paymentBankAccounts={paymentBankAccounts}
      clubName={clubName}
      paymentAccountName={paymentAccountName}
      paymentBankName={paymentBankName}
      paymentQrFileName={paymentQrFile?.name ?? null}
      paymentFormKey={paymentFormKey}
      paymentMessage={paymentMessage}
      isClubNameDirty={isClubNameDirty}
      brandingSaveState={brandingSaveState}
      brandingSaveMessage={brandingSaveMessage}
      resetState={resetState}
      resetMessage={resetMessage}
      imageResetState={imageResetState}
      imageResetMessage={imageResetMessage}
      expandedSections={expandedSections}
      activeSection={activeSection}
      destructiveActionCopy={destructiveActionCopy}
      isConfirmingDestructiveAction={isConfirmingDestructiveAction}
      updateNamePending={brandingMutations.updateName.isPending}
      uploadLogoPending={brandingMutations.uploadLogo.isPending}
      deleteLogoPending={brandingMutations.deleteLogo.isPending}
      createPaymentAccountPending={paymentBankAccountMutations.createAccount.isPending}
      deletePaymentAccountPending={paymentBankAccountMutations.deleteAccount.isPending}
      onNavigateSection={handleNavigateSection}
      onToggleSection={handleToggleSection}
      onClubNameChange={handleClubNameChange}
      onResetClubName={handleResetClubName}
      onSaveBrandingName={() => void handleSaveBrandingName()}
      onUploadLogo={(file) => void handleUploadLogo(file)}
      onDeleteLogo={() => void brandingMutations.deleteLogo.mutateAsync()}
      onPaymentAccountNameChange={(value) => {
        setPaymentAccountName(value);
        setPaymentMessage(null);
      }}
      onPaymentBankNameChange={(value) => {
        setPaymentBankName(value);
        setPaymentMessage(null);
      }}
      onPaymentQrFileChange={(file) => {
        setPaymentQrFile(file ?? null);
        setPaymentMessage(null);
      }}
      onCreatePaymentBankAccount={() => void handleCreatePaymentBankAccount()}
      onDeletePaymentBankAccount={(accountId) => void handleDeletePaymentBankAccount(accountId)}
      onDefaultPaymentBankAccountChange={(accountId) => setSetting('defaultPaymentBankAccountId', accountId)}
      onCourtFeeTransactionChange={(checked) => setSetting('autoCreateCourtFeeTransaction', checked)}
      onShuttlecockUsageTransactionChange={(checked) => setSetting('autoCreateShuttlecockUsageTransaction', checked)}
      onMaxCourtCountChange={(value) => setSetting('maxCourtCountPerSession', normalizeMaxCourtCount(value))}
      onOpenDestructiveAction={setPendingDestructiveAction}
      onCloseDestructiveAction={() => setPendingDestructiveAction(null)}
      onConfirmDestructiveAction={() => void handleConfirmDestructiveAction()}
    />
  );
}
