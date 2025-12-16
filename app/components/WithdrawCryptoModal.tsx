import { useEffect, useMemo, useState } from 'react';
import { useI18n } from './I18nProvider';
import { useWithdrawalTypes } from '../hooks/useWithdrawalTypes';
import type { WithdrawalType } from '@/types/withdrawal';
import { useAuth } from '../hooks/useAuth';
import InfoTooltip from './InfoTooltip';

export type WithdrawAssetOption = {
  id: string; // unique
  cover: string;
  currency_name: string;
  currency_chain: string;
  status: 0 | 1;
};

export type WithdrawCryptoRequest = {
  assetId: string;
  address: string;
};

export default function WithdrawCryptoModal({
  isOpen,
  onClose,
  amountUsd,
  estimatedFeeUsd = 0,
  initialAssetId,
  onRequestWithdraw,
  requestDisabled,
  isSubmitting,
}: {
  isOpen: boolean;
  onClose: () => void;
  amountUsd: number;
  estimatedFeeUsd?: number;
  initialAssetId?: string;
  onRequestWithdraw?: (payload: WithdrawCryptoRequest) => void;
  requestDisabled?: boolean;
  isSubmitting?: boolean;
}) {
  const { t } = useI18n();
  const { user } = useAuth() as any;
  const { data: withdrawalTypes, isLoading: withdrawalTypesLoading } = useWithdrawalTypes({ enabled: isOpen });
  const safeAssets = useMemo<WithdrawAssetOption[]>(
    () =>
      (Array.isArray(withdrawalTypes) ? (withdrawalTypes as WithdrawalType[]) : []) as WithdrawAssetOption[],
    [withdrawalTypes],
  );

  const defaultAssetId = useMemo(() => {
    const enabledList = safeAssets.filter((a) => a?.status === 1);
    const idsEnabled = enabledList.map((a) => a.id);
    if (typeof initialAssetId === 'string' && idsEnabled.includes(initialAssetId)) return initialAssetId;
    return enabledList[0]?.id ?? safeAssets[0]?.id ?? '';
  }, [initialAssetId, safeAssets]);

  const [selectedAssetId, setSelectedAssetId] = useState(defaultAssetId);
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setSelectedAssetId(defaultAssetId);
    const wallet =
      (user as any)?.userInfo?.wallet_address ||
      (user as any)?.wallet_address ||
      (user as any)?.userInfo?.walletAddress ||
      (user as any)?.walletAddress ||
      '';
    setAddress(wallet ? String(wallet) : '');
  }, [isOpen, defaultAssetId, user]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const selectedAsset = safeAssets.find((a) => a.id === selectedAssetId) ?? safeAssets.find((a) => a?.status === 1) ?? safeAssets[0];
  const normalizedAmountUsd = Number.isFinite(amountUsd) ? amountUsd : 0;
  const normalizedFeeUsd = Number.isFinite(estimatedFeeUsd) ? estimatedFeeUsd : 0;
  const receiveUsd = Math.max(0, normalizedAmountUsd - normalizedFeeUsd);

  if (!isOpen) return null;

  const canRequest = Boolean(address.trim()) && Boolean(selectedAsset?.id) && !requestDisabled && !isSubmitting;

  return (
    <div
      data-state={isOpen ? 'open' : 'closed'}
      className="fixed px-4 inset-0 z-[100] bg-black/[0.48] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 overflow-y-auto flex justify-center items-start py-16"
      style={{ pointerEvents: 'auto' }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-describedby="withdraw-crypto-desc"
        aria-labelledby="withdraw-crypto-title"
        data-state={isOpen ? 'open' : 'closed'}
        className="overflow-hidden z-[110] max-w-lg w-full shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 rounded-lg relative flex flex-col sm:max-w-2xl p-0 gap-0 font-bold"
        tabIndex={-1}
        style={{ pointerEvents: 'auto', backgroundColor: '#161A1D' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-col gap-1.5 text-center sm:text-left flex border-b border-[#34383C] h-16 p-6">
          <h2
            id="withdraw-crypto-title"
            className="tracking-tight text-left text-base font-extrabold pr-3"
            style={{ color: '#FEFEFE' }}
          >
            {t('withdrawCryptoTitle')}
          </h2>
          <p id="withdraw-crypto-desc"></p>
        </div>

        <div className="flex flex-col flex-1 p-6 gap-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {withdrawalTypesLoading && (!Array.isArray(safeAssets) || safeAssets.length === 0) ? (
              <div className="col-span-2 sm:col-span-3 text-[#7A8084] text-sm">{t('loadingText')}</div>
            ) : null}
            {!withdrawalTypesLoading && (!Array.isArray(safeAssets) || safeAssets.length === 0) ? (
              <div className="col-span-2 sm:col-span-3 text-[#7A8084] text-sm">{t('noData')}</div>
            ) : null}
            {safeAssets.map((asset) => {
              const isActive = asset.id === selectedAssetId;
              const isDisabled = asset?.status !== 1;
              return (
                <button
                  key={asset.id}
                  type="button"
                  disabled={isDisabled}
                  className={[
                    'inline-flex items-center gap-2 whitespace-nowrap transition-colors disabled:pointer-events-none interactive-focus relative border rounded-lg justify-start hover:bg-blue-400/10 hover:border-blue-400 h-16 px-4',
                    isActive ? 'border-blue-400' : 'border-[#34383C]',
                    isDisabled ? 'opacity-60' : '',
                  ].join(' ')}
                  onClick={() => setSelectedAssetId(asset.id)}
                  style={{ cursor: isDisabled ? 'default' : 'pointer' }}
                >
                  <img alt={asset.currency_name} className="size-8" src={asset.cover} />
                  <div className="flex flex-col items-start">
                    <p className={`text-figma-body-base-600 ${isDisabled ? 'text-[#7A8084]' : 'text-white'}`}>{asset.currency_name}</p>
                    <p className="text-[14px] text-[#7A8084]">{asset.currency_chain}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 p-4 gap-4 rounded-lg bg-[#22272B] text-[#FAFAFA]">
            <p>{t('withdrawAmountLabel')}</p>
            <p className="text-end">${normalizedAmountUsd.toFixed(2)}</p>
            <p>{t('estimatedNetworkFee').replace('{value}', `$${normalizedFeeUsd.toFixed(2)}`)}</p>
            <p className="text-end">${normalizedFeeUsd.toFixed(2)}</p>
            <hr className="col-span-2 border-[#34383C]" />
            <p>{t('youWillReceiveLabel')}</p>
            <p className="text-end">${receiveUsd.toFixed(2)}</p>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-figma-body-base-600 text-[#FAFAFA]">
              {t('withdrawTargetAddressLabel').replace('{asset}', selectedAsset?.currency_name ?? '')}
            </p>
            <div className="flex relative border border-[#34383C] rounded-lg p-1 gap-1 text-[#7A8084]">
              <input
                className="flex h-10 w-full rounded-md border-[#34383C] focus:border-[#34383C] px-3 py-2 text-base file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-[#7A8084] disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-red-700 interactive-focus !-outline-offset-1 bg-black/0 border border-none text-figma-body-base-600 text-ellipsis mr-11 text-[#7A8084]"
                id="withdrawAddress"
                placeholder={t('withdrawAddressPlaceholder')}
                value={address}
                readOnly
              />
              <div className="absolute flex right-1 top-1 bottom-1 items-center justify-center size-10 min-h-10 min-w-10">
                <InfoTooltip
                  content={t('withdrawAddressPlaceholder')}
                  showArrow={false}
                  usePortal
                  buttonClassName="inline-flex items-center justify-center transition-colors disabled:pointer-events-none interactive-focus relative size-10 min-h-10 min-w-10 rounded-lg"
                  tooltipClassName="z-50 overflow-hidden rounded-md border border-[#34383C] px-3 py-1.5 text-sm font-bold shadow-md animate-in fade-in-0 zoom-in-95 max-w-80 bg-[#34383C] text-[#7A8084]"
                  trigger={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-circle-alert size-6 text-[#7A8084]"
                      style={{ cursor: 'pointer' }}
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" x2="12" y1="8" y2="12"></line>
                      <line x1="12" x2="12.01" y1="16" y2="16"></line>
                    </svg>
                  }
                />
              </div>
            </div>
          </div>

          <p className="text-[14px] text-[#7A8084]">
            <span>{t('withdrawCryptoNotice1')}</span>
            <span>{t('withdrawCryptoNotice2')}</span>
          </p>

          <div className="flex self-end gap-4">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative select-none h-10 px-6 font-bold"
              onClick={onClose}
              disabled={Boolean(isSubmitting)}
              style={{ backgroundColor: '#34383C', color: '#FFFFFF', cursor: isSubmitting ? 'default' : 'pointer' }}
              onMouseEnter={(e) => { if (!isSubmitting) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#5A5E62'; }}
              onMouseLeave={(e) => { if (!isSubmitting) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#34383C'; }}
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative select-none h-10 px-6 font-bold"
              disabled={!canRequest}
              onClick={() => {
                if (!canRequest) return;
                onRequestWithdraw?.({ assetId: selectedAssetId, address: address.trim() });
              }}
              style={{
                backgroundColor: canRequest ? '#4299E1' : '#34383C',
                color: canRequest ? '#FFFFFF' : '#2B6CB0',
                cursor: canRequest ? 'pointer' : 'default',
              }}
              onMouseEnter={(e) => { if (canRequest) (e.currentTarget as HTMLButtonElement).style.opacity = '0.9'; }}
              onMouseLeave={(e) => { if (canRequest) (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
            >
              {isSubmitting ? t('loadingText') : t('requestWithdraw')}
            </button>
          </div>
        </div>

        <button
          type="button"
          className="absolute right-5 top-[18px] rounded-lg text-gray-400 hover:text-white w-8 h-8 flex items-center justify-center"
          onClick={onClose}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-x min-w-6 min-h-6 size-6"
          >
            <path d="M18 6 6 18"></path>
            <path d="m6 6 12 12"></path>
          </svg>
          <span className="sr-only">Close</span>
        </button>
      </div>
    </div>
  );
}


