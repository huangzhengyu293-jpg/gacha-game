"use client";

import Link from "next/link";
import { useCallback, useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AccountMobileMenu from "../components/AccountMobileMenu";
import { useI18n } from "@/app/components/I18nProvider";
import { useAuth } from "@/app/hooks/useAuth";
import { api } from "@/app/lib/api";
import { showGlobalToast } from "@/app/components/ToastProvider";

export default function ReferralsPage() {
  const { t } = useI18n();
  const { user, updateUser, fetchUserInfo } = useAuth();
  
  // 从用户信息获取推荐码
  const referralCode = useMemo(() => {
    return (user?.userInfo as any)?.invite_code || '';
  }, [user?.userInfo]);

  // 获取用户类型
  const userType = useMemo(() => {
    return Number((user?.userInfo as any)?.user_type ?? 0);
  }, [user?.userInfo]);
  
  const canShowCdk = userType === 2;

  // 从 userInfo 获取数据
  const subordinateNum = useMemo(() => {
    return Number((user?.userInfo as any)?.subordinate_num ?? 0);
  }, [user?.userInfo]);

  const subordinateRecharge = useMemo(() => {
    return Number((user?.userInfo as any)?.subordinate_rechange ?? 0);
  }, [user?.userInfo]);

  const subordinateFlow = useMemo(() => {
    return Number((user?.userInfo as any)?.subordinate_flow ?? 0);
  }, [user?.userInfo]);

  const [claimAmount] = useState<number>(0);
  const isZero = claimAmount <= 0;
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [editingCode, setEditingCode] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  // CDK相关状态
  const [isAddingCdk, setIsAddingCdk] = useState(false);
  const [newCdkAmount, setNewCdkAmount] = useState('');
  const [isCreatingCdk, setIsCreatingCdk] = useState(false);
  
  const queryClient = useQueryClient();
  
  // 使用useQuery获取CDK列表
  const { data: cdkData } = useQuery({
    queryKey: ['myCdk', user?.token],
    queryFn: () => api.getMyCdk(),
    enabled: Boolean(user?.token && canShowCdk),
    staleTime: 30_000,
  });
  
  const cdkList = useMemo(() => {
    if (!cdkData?.data?.data) return [];
    return Array.isArray(cdkData.data.data) ? cdkData.data.data : [];
  }, [cdkData]);
  
  // CDK金额校验
  const cdkAmountValid = useMemo(() => {
    const amount = Number(newCdkAmount);
    if (!newCdkAmount.trim() || isNaN(amount)) return false;
    return amount >= 100 && amount % 100 === 0;
  }, [newCdkAmount]);
  
  const cdkAmountError = useMemo(() => {
    if (!newCdkAmount.trim()) return '';
    const amount = Number(newCdkAmount);
    if (isNaN(amount)) return t('pleaseEnterValidNumber');
    if (amount < 100) return t('amountMustBeGreaterThanOrEqual100');
    if (amount % 100 !== 0) return t('amountMustBeMultipleOf100');
    return '';
  }, [newCdkAmount, t]);
  
  
  const copyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      showGlobalToast({
        title: t('copySuccess'),
        description: t('referralCodeCopiedToClipboard'),
        variant: 'success',
        durationMs: 2000,
      });
    } catch (e) {
      showGlobalToast({
        title: t('copyFailed'),
        description: t('pleaseCopyReferralCodeManually'),
        variant: 'error',
        durationMs: 2000,
      });
    }
  }, [referralCode, t]);

  const handleEditCode = useCallback(() => {
    setEditingCode(referralCode);
    setIsEditingCode(true);
  }, [referralCode]);

  const handleCancelEdit = useCallback(() => {
    setIsEditingCode(false);
    setEditingCode('');
  }, []);

  const handleConfirmEdit = useCallback(async () => {
    if (!editingCode.trim() || editingCode === referralCode) {
      setIsEditingCode(false);
      return;
    }
    setIsUpdating(true);
    try {
      const result = await api.setUserProfile({ invite_code: editingCode.trim() });
      if (result?.code === 100000) {
        await fetchUserInfo();
        setIsEditingCode(false);
        setEditingCode('');
      }
    } catch (e) {
      // ignore
    } finally {
      setIsUpdating(false);
    }
  }, [editingCode, referralCode, fetchUserInfo]);

  const handleAddCdk = useCallback(() => {
    setNewCdkAmount('');
    setIsAddingCdk(true);
  }, []);

  const handleCancelAddCdk = useCallback(() => {
    setIsAddingCdk(false);
    setNewCdkAmount('');
  }, []);

  const handleConfirmAddCdk = useCallback(async () => {
    if (!cdkAmountValid) {
      if (cdkAmountError) {
        showGlobalToast({
          title: t('inputError'),
          description: cdkAmountError,
          variant: 'error',
          durationMs: 2000,
        });
      }
      return;
    }
    setIsCreatingCdk(true);
    try {
      const result = await api.createCdk({ bean: newCdkAmount.trim() });
      if (result?.code === 100000) {
        setIsAddingCdk(false);
        setNewCdkAmount('');
        showGlobalToast({
          title: t('createSuccess'),
          description: t('cdkCreated'),
          variant: 'success',
          durationMs: 2000,
        });
        // 刷新CDK列表
        queryClient.invalidateQueries({ queryKey: ['myCdk'] });
      } else {
        showGlobalToast({
          title: t('createFailed'),
          description: result?.message || t('pleaseTryAgainLater'),
          variant: 'error',
          durationMs: 2000,
        });
      }
    } catch (e: any) {
      showGlobalToast({
        title: t('createFailed'),
        description: e?.message || t('pleaseTryAgainLater'),
        variant: 'error',
        durationMs: 2000,
      });
    } finally {
      setIsCreatingCdk(false);
    }
  }, [newCdkAmount, cdkAmountValid, cdkAmountError, queryClient, t]);

  return (
    <div className="w-full max-w-screen-xl px-4 pt-4 pb-40 mx-auto" style={{ color: '#7A8084' }}>
      <style>{`
        .acct-menu-item { background-color: transparent; color: #7A8084; }
        .acct-menu-item:hover { background-color: #34383C; color: #FFFFFF; }
        .acct-menu-item--active { background-color: #34383C; color: #FFFFFF; }
      `}</style>
      <div className="flex flex-col lg:flex-row items-start gap-0 lg:gap-10">
        {/* 左侧菜单 */}
        <div className="hidden lg:flex flex-col gap-4 w-[220px] flex-none">
          <div className="flex flex-col gap-3 items-stretch w-full">
            <span className="text-sm font-bold text-white/40">{t('accountSection')}</span>
            <Link href="/account" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">{t('accountProfile')}</span></Link>
            <Link href="/account/deposits" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">{t('accountDepositsTitle')}</span></Link>
            <Link href="/account/withdrawals" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">{t('accountWithdrawalsTitle')}</span></Link>
            <Link href="/account/claims" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">{t('accountClaimsTitle')}</span></Link>
            <Link href="/account/sales" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">{t('accountSalesTitle')}</span></Link>
            <Link href="/account/battles" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">{t('accountBattlesTitle')}</span></Link>
            <Link href="/account/packs" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">{t('accountPacksTitle')}</span></Link>
            <Link href="/account/transactions" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">{t('accountTransactionsTitle')}</span></Link>
            <Link href="/account/draws" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">{t('accountDrawsTitle')}</span></Link>
            <Link href="/account/referrals" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item--active"><span className="font-bold">{t('referrals')}</span></Link>
          </div>
        </div>

        {/* 右侧内容 */}
        <div className="flex flex-col items-start w-full lg:flex-1 min-w-0 gap-2">
          <div className="flex justify-between items-center self-stretch pb-1 pt-4 lg:pt-0 min-w-0">
            <AccountMobileMenu />
            <h1 className="text-2xl font-bold hidden lg:block" style={{ color: '#FFFFFF' }}>{t('affiliateProgram')}</h1>
            <button 
              onClick={copyCode} 
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative text-sm font-bold select-none h-8 px-3" 
              style={{ backgroundColor: '#34383C', color: '#FFFFFF', cursor: 'pointer' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy size-3 text-white"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0 0 0 0 0"></path><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>
              {t('copyYourReferralCode')}
            </button>
          </div>

          <div className="flex flex-col gap-6 items-stretch self-stretch pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-lg p-4" style={{ backgroundColor: '#22272B' }}>
                <dt className="text-sm" style={{ color: '#FFFFFF' }}>{t('referralCodeLabel')}</dt>
                <dd className="font-extrabold text-white text-2xl leading-9">
                  {isEditingCode ? (
                    <div className="flex items-center justify-between max-w-full">
                      <input
                        type="text"
                        value={editingCode}
                        onChange={(e) => setEditingCode(e.target.value)}
                        className="flex h-10 w-full rounded-md border px-3 py-2 mr-2 text-base text-center disabled:cursor-not-allowed disabled:opacity-50"
                        style={{ 
                          backgroundColor: '#1D2125', 
                          color: '#FFFFFF', 
                          borderColor: '#4B5563',
                          borderWidth: '1px'
                        }}
                        disabled={isUpdating}
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleConfirmEdit}
                          disabled={isUpdating || !editingCode.trim() || editingCode === referralCode}
                          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none disabled:opacity-50 select-none size-8 min-h-8 min-w-8 max-h-8 max-w-8"
                          style={{ 
                            backgroundColor: '#47BB78',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => {
                            if (!isUpdating && editingCode.trim() && editingCode !== referralCode) {
                              e.currentTarget.style.backgroundColor = '#37A169';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isUpdating && editingCode.trim() && editingCode !== referralCode) {
                              e.currentTarget.style.backgroundColor = '#47BB78';
                            }
                          }}
                        >
                          <div className="size-4">
                            <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" clipRule="evenodd" d="M13.6152 2.21173C14.0506 2.55153 14.128 3.17994 13.7882 3.61532L6.50368 12.9486C6.32757 13.1743 6.06321 13.3137 5.77753 13.3314C5.49185 13.3492 5.21224 13.2438 5.00949 13.0417L1.62738 9.67134C1.23617 9.2815 1.23507 8.64833 1.62492 8.25713C2.01476 7.86593 2.64793 7.86483 3.03913 8.25467L5.62162 10.8282L12.2116 2.38477C12.5514 1.9494 13.1798 1.87192 13.6152 2.21173Z" fill="#FFFFFF"></path>
                            </svg>
                          </div>
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={isUpdating}
                          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none disabled:opacity-50 select-none size-8 min-h-8 min-w-8 max-h-8 max-w-8"
                          style={{ 
                            backgroundColor: '#34383C',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => {
                            if (!isUpdating) {
                              e.currentTarget.style.backgroundColor = '#5A5E62';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isUpdating) {
                              e.currentTarget.style.backgroundColor = '#34383C';
                            }
                          }}
                        >
                          <div className="size-4">
                            <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" clipRule="evenodd" d="M3.29289 3.29289C3.68342 2.90237 4.31658 2.90237 4.70711 3.29289L8 6.58579L11.2929 3.29289C11.6834 2.90237 12.3166 2.90237 12.7071 3.29289C13.0976 3.68342 13.0976 4.31658 12.7071 4.70711L9.41421 8L12.7071 11.2929C13.0976 11.6834 13.0976 12.3166 12.7071 12.7071C12.3166 13.0976 11.6834 13.0976 11.2929 12.7071L8 9.41421L4.70711 12.7071C4.31658 13.0976 3.68342 13.0976 3.29289 12.7071C2.90237 12.3166 2.90237 11.6834 3.29289 11.2929L6.58579 8L3.29289 4.70711C2.90237 4.31658 2.90237 3.68342 3.29289 3.29289Z" fill="#FFFFFF"></path>
                            </svg>
                          </div>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-[44px] flex items-center justify-between max-w-full">
                      <div className="overflow-hidden max-w-full">
                        <span className="block truncate">{referralCode || '—'}</span>
                      </div>
                      <div className="flex justify-center">
                        <button 
                          onClick={handleEditCode} 
                          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative text-base font-bold select-none size-8 min-h-8 min-w-8 max-h-8 max-w-8" 
                          style={{ backgroundColor: '#34383C', color: '#FFFFFF', cursor: 'pointer' }}
                        >
                          <div className="size-4">
                            <svg viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M5 19.3148H16C17.0609 19.3148 18.0783 18.8934 18.8284 18.1432C19.5786 17.3931 20 16.3757 20 15.3148V9.31482C20 9.0496 19.8946 8.79525 19.7071 8.60771C19.5196 8.42018 19.2652 8.31482 19 8.31482C18.7348 8.31482 18.4804 8.42018 18.2929 8.60771C18.1054 8.79525 18 9.0496 18 9.31482V15.3148C18 15.8453 17.7893 16.354 17.4142 16.729C17.0391 17.1041 16.5304 17.3148 16 17.3148H5C4.46957 17.3148 3.96086 17.1041 3.58579 16.729C3.21071 16.354 3 15.8453 3 15.3148V4.31482C3 3.78439 3.21071 3.27568 3.58579 2.90061C3.96086 2.52553 4.46957 2.31482 5 2.31482H11C11.2652 2.31482 11.5196 2.20946 11.7071 2.02193C11.8946 1.83439 12 1.58004 12 1.31482C12 1.0496 11.8946 0.795249 11.7071 0.607713C11.5196 0.420176 11.2652 0.314819 11 0.314819H5C3.93913 0.314819 2.92172 0.736247 2.17157 1.48639C1.42143 2.23654 1 3.25395 1 4.31482V15.3148C1 16.3757 1.42143 17.3931 2.17157 18.1432C2.92172 18.8934 3.93913 19.3148 5 19.3148ZM18.7137 0.647063C18.6229 0.610833 18.5271 0.587846 18.4266 0.575067C17.9949 0.520613 17.5058 0.68662 17.1335 1.05888L8.23888 9.95351C7.65401 10.5384 7.57636 11.4088 8.06388 11.8963C8.2448 12.0772 8.47947 12.1795 8.73284 12.2079C8.87002 12.2226 9.01435 12.2164 9.15701 12.187C9.3601 12.1468 9.56204 12.0609 9.74878 11.9349C9.8387 11.8726 9.92557 11.8023 10.0066 11.7213L18.9013 2.82665C19.2404 2.48748 19.409 2.05377 19.3962 1.65221C19.3917 1.52691 19.3695 1.40546 19.3308 1.29227C19.2782 1.14044 19.1937 1.00127 19.0763 0.883883L18.9962 0.812061L18.9222 0.756251C18.8575 0.713143 18.7871 0.675827 18.7137 0.647063Z" fill="currentColor"></path></svg>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </dd>
              </div>
              <div className="rounded-lg p-4" style={{ backgroundColor: '#22272B' }}>
                <dt className="text-sm" style={{ color: '#FFFFFF' }}>{t('referredUsers')}</dt>
                <div className="h-[44px] flex items-center"><dd className="font-extrabold text-white text-2xl leading-9">{subordinateNum}</dd></div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-lg p-4" style={{ backgroundColor: '#22272B' }}>
                <dt className="text-sm" style={{ color: '#FFFFFF' }}>{t('totalSubordinateRecharge')}</dt>
                <div className="h-[44px] flex items-center"><dd className="font-extrabold text-white text-2xl leading-9">${subordinateRecharge.toFixed(2)}</dd></div>
              </div>
              <div className="rounded-lg p-4" style={{ backgroundColor: '#22272B' }}>
                <dt className="text-sm" style={{ color: '#FFFFFF' }}>{t('totalSubordinateFlow')}</dt>
                <div className="h-[44px] flex items-center"><dd className="font-extrabold text-white text-2xl leading-9">${subordinateFlow.toFixed(2)}</dd></div>
              </div>
            </div>
            <div className="rounded-lg p-4" style={{ backgroundColor: '#22272B', height: 112 }}>
              <form className="flex h-full flex-col">
                <div className="flex h-full gap-2">
                  <div className="flex h-full flex-1 flex-col justify-between">
                    <label className="font-bold text-base" htmlFor="claim-amount" style={{ color: '#FFFFFF' }}>{t('claimableAmount')}</label>
                    <div className="flex gap-3" id="claim-amount-group">
                      <input
                        id="claim-amount"
                        className="flex h-10 w-full rounded-md px-3 py-2 text-base file:border-0 file:bg-transparent file:text-sm file:font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-extrabold border-0"
                        placeholder="0.00"
                        step={0.01}
                        min={0}
                        max={999999}
                        disabled
                        type="number"
                        value={claimAmount}
                        name="amount"
                        readOnly
                        style={{ backgroundColor: '#262B2F', color: isZero ? '#7A8084' : '#FFFFFF' }}
                      />
                      <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative text-base font-bold select-none h-10 px-6" type="submit" disabled={isZero} style={{ backgroundColor: '#34383C', color: isZero ? '#7A8084' : '#FFFFFF' }}>{t('claim')}</button>
                      <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative text-base font-bold select-none h-10 px-6" type="button" disabled={isZero} style={{ backgroundColor: '#34383C', color: isZero ? '#7A8084' : '#FFFFFF' }}>{t('claimAll')}</button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            {canShowCdk && (
              <div className="rounded-lg p-4" style={{ backgroundColor: '#22272B' }}>
                <div className="flex flex-col">
                  <div className="flex gap-2">
                    <div className="flex flex-1 flex-col justify-between">
                      <label className="font-bold text-base" style={{ color: '#FFFFFF' }}>{t('myCreatedCdk')}</label>
                    <div className="flex flex-col gap-2">
                      {cdkList.map((cdk: any, index: number) => (
                        <div key={index} className="h-[44px] flex items-center justify-between max-w-full">
                          <div className="overflow-hidden max-w-full">
                            <span className="block truncate font-extrabold text-white text-xl leading-9">
                              {(cdk as any)?.password || '—'}
                            </span>
                          </div>
                          <div className="overflow-hidden max-w-full">
                            <span className="block truncate font-extrabold text-white text-xl leading-9">
                              {cdk?.bean ?? '—'}
                            </span>
                          </div>
                        </div>
                      ))}
                      {isAddingCdk ? (
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between max-w-full">
                            <input
                              type="number"
                              value={newCdkAmount}
                              onChange={(e) => setNewCdkAmount(e.target.value)}
                              className="flex h-10 w-full rounded-md border px-3 py-2 mr-2 text-base text-center disabled:cursor-not-allowed disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              style={{ 
                                backgroundColor: '#1D2125', 
                                color: '#FFFFFF', 
                                borderColor: cdkAmountError ? '#EB4B4B' : '#4B5563',
                                borderWidth: '1px'
                              }}
                              disabled={isCreatingCdk}
                              placeholder={t('pleaseEnterAmount')}
                              min="100"
                              step="100"
                            />
                            <div className="flex items-center gap-2">
                              <button
                                onClick={handleConfirmAddCdk}
                                disabled={isCreatingCdk || !cdkAmountValid}
                                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none disabled:opacity-50 select-none size-8 min-h-8 min-w-8 max-h-8 max-w-8"
                                style={{ 
                                  backgroundColor: '#47BB78',
                                  cursor: cdkAmountValid ? 'pointer' : 'not-allowed'
                                }}
                                onMouseEnter={(e) => {
                                  if (!isCreatingCdk && cdkAmountValid) {
                                    e.currentTarget.style.backgroundColor = '#37A169';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!isCreatingCdk && cdkAmountValid) {
                                    e.currentTarget.style.backgroundColor = '#47BB78';
                                  }
                                }}
                              >
                                <div className="size-4">
                                  <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" clipRule="evenodd" d="M13.6152 2.21173C14.0506 2.55153 14.128 3.17994 13.7882 3.61532L6.50368 12.9486C6.32757 13.1743 6.06321 13.3137 5.77753 13.3314C5.49185 13.3492 5.21224 13.2438 5.00949 13.0417L1.62738 9.67134C1.23617 9.2815 1.23507 8.64833 1.62492 8.25713C2.01476 7.86593 2.64793 7.86483 3.03913 8.25467L5.62162 10.8282L12.2116 2.38477C12.5514 1.9494 13.1798 1.87192 13.6152 2.21173Z" fill="#FFFFFF"></path>
                                  </svg>
                                </div>
                              </button>
                              <button
                                onClick={handleCancelAddCdk}
                                disabled={isCreatingCdk}
                                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none disabled:opacity-50 select-none size-8 min-h-8 min-w-8 max-h-8 max-w-8"
                                style={{ 
                                  backgroundColor: '#34383C',
                                  cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                  if (!isCreatingCdk) {
                                    e.currentTarget.style.backgroundColor = '#5A5E62';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!isCreatingCdk) {
                                    e.currentTarget.style.backgroundColor = '#34383C';
                                  }
                                }}
                              >
                                <div className="size-4">
                                  <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" clipRule="evenodd" d="M3.29289 3.29289C3.68342 2.90237 4.31658 2.90237 4.70711 3.29289L8 6.58579L11.2929 3.29289C11.6834 2.90237 12.3166 2.90237 12.7071 3.29289C13.0976 3.68342 13.0976 4.31658 12.7071 4.70711L9.41421 8L12.7071 11.2929C13.0976 11.6834 13.0976 12.3166 12.7071 12.7071C12.3166 13.0976 11.6834 13.0976 11.2929 12.7071L8 9.41421L4.70711 12.7071C4.31658 13.0976 3.68342 13.0976 3.29289 12.7071C2.90237 12.3166 2.90237 11.6834 3.29289 11.2929L6.58579 8L3.29289 4.70711C2.90237 4.31658 2.90237 3.68342 3.29289 3.29289Z" fill="#FFFFFF"></path>
                                  </svg>
                                </div>
                              </button>
                            </div>
                          </div>
                          {cdkAmountError && (
                            <div className="text-sm" style={{ color: '#EB4B4B' }}>
                              {cdkAmountError}
                            </div>
                          )}
                        </div>
                      ) : (
                        <button 
                          onClick={handleAddCdk} 
                          className="w-full inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative text-base font-bold select-none h-10" 
                          style={{ backgroundColor: '#34383C', color: '#FFFFFF', cursor: 'pointer' }}
                        >
                          <div className="size-4">
                            <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" clipRule="evenodd" d="M8 1C8.41421 1 8.75 1.33579 8.75 1.75V7.25H14.25C14.6642 7.25 15 7.58579 15 8C15 8.41421 14.6642 8.75 14.25 8.75H8.75V14.25C8.75 14.6642 8.41421 15 8 15C7.58579 15 7.25 14.6642 7.25 14.25V8.75H1.75C1.33579 8.75 1 8.41421 1 8C1 7.58579 1.33579 7.25 1.75 7.25H7.25V1.75C7.25 1.33579 7.58579 1 8 1Z" fill="currentColor"></path>
                            </svg>
                          </div>
                        </button>
                      )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


