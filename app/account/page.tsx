'use client';

import Link from "next/link";
import AccountMobileMenu from "./components/AccountMobileMenu";
import { useAuth } from "../hooks/useAuth";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useI18n } from "../components/I18nProvider";

export default function AccountPage() {
  const { t } = useI18n();
  const { user, updateUser } = useAuth() as any;

  // 10个热门国家（排除中国），不包含默认值选项
  const COUNTRY_OPTIONS: { label: string; value: string }[] = [
    { label: t('countryUnitedStates'), value: 'United States' },
    { label: t('countryJapan'), value: 'Japan' },
    { label: t('countrySouthKorea'), value: 'South Korea' },
    { label: t('countrySingapore'), value: 'Singapore' },
    { label: t('countryMalaysia'), value: 'Malaysia' },
    { label: t('countryThailand'), value: 'Thailand' },
    { label: t('countryIndia'), value: 'India' },
    { label: t('countryAustralia'), value: 'Australia' },
    { label: t('countryUnitedKingdom'), value: 'United Kingdom' },
    { label: t('countryCanada'), value: 'Canada' },
  ];

const userName =
    (user as any)?.userInfo?.name ||
    (user as any)?.name ||
    "";

  const [avatarPreview, setAvatarPreview] = useState<string>(user?.userInfo?.avatar || "");
  const [userNameInput, setUserNameInput] = useState<string>(userName || "");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [legalName, setLegalName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [address1, setAddress1] = useState<string>('');
  const [address2, setAddress2] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [stateName, setStateName] = useState<string>('');
  const [postalCode, setPostalCode] = useState<string>('');
  const [country, setCountry] = useState<string>('');
  const [countrySelectOpen, setCountrySelectOpen] = useState(false);
  const countrySelectRef = useRef<HTMLDivElement | null>(null);

  // 点击外部关闭国家选择器
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (countrySelectRef.current && !countrySelectRef.current.contains(e.target as Node)) {
        setCountrySelectOpen(false);
      }
    }
    if (countrySelectOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [countrySelectOpen]);

  // 当全局用户数据异步就绪时同步头像预览（避免刷新后为空）
  useEffect(() => {
    if (user?.userInfo?.avatar || user?.avatar) {
      setAvatarPreview(user?.userInfo?.avatar || (user as any)?.avatar || "");
    }
    if (userName) {
      setUserNameInput(userName);
    }

    const info = (user as any)?.userInfo ?? user;
    const addrRaw = (info as any)?.address_info ?? (info as any)?.addressInfo;
    let safeAddr: Record<string, any> = {};
    
    // 处理 address_info：如果是 JSON 字符串则解析，如果是对象则直接使用
    if (addrRaw != null) {
      if (typeof addrRaw === 'string') {
        try {
          const parsed = JSON.parse(addrRaw);
          if (parsed && typeof parsed === 'object') {
            safeAddr = parsed;
          }
        } catch {
          // JSON 解析失败，使用空对象
          safeAddr = {};
        }
      } else if (typeof addrRaw === 'object') {
        safeAddr = addrRaw;
      }
    }
    
    // 安全地提取字段值，确保为字符串类型
    setLegalName(typeof safeAddr?.name === 'string' ? safeAddr.name : '');
    setPhone(typeof safeAddr?.phone === 'string' ? safeAddr.phone : '');
    setAddress1(typeof safeAddr?.address_1 === 'string' ? safeAddr.address_1 : '');
    setAddress2(typeof safeAddr?.address_2 === 'string' ? safeAddr.address_2 : '');
    setCity(typeof safeAddr?.city === 'string' ? safeAddr.city : '');
    setStateName(typeof safeAddr?.state === 'string' ? safeAddr.state : '');
    setPostalCode(typeof safeAddr?.postal_code === 'string' ? safeAddr.postal_code : '');
    setCountry(typeof safeAddr?.countries === 'string' ? safeAddr.countries : '');
  }, [user, userName]);
  const photoPool = [
    '/photo/photo_6163277584888696109_y.jpg',
    '/photo/photo_6163277584888696110_y.jpg',
    '/photo/photo_6163277584888696111_y.jpg',
    '/photo/photo_6163277584888696112_y.jpg',
    '/photo/photo_6163277584888696113_y.jpg',
    '/photo/photo_6163277584888696114_y.jpg',
    '/photo/photo_6163277584888696115_y.jpg',
    '/photo/photo_6163277584888696116_y.jpg',
    '/photo/photo_6163277584888696117_y.jpg',
    '/photo/photo_6163277584888696118_y.jpg',
  ];
  const handleGenerateAvatar = () => {
    const pick = photoPool[Math.floor(Math.random() * photoPool.length)];
    fetch(pick)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], 'avatar.jpg', { type: blob.type || 'image/jpeg' });
        uploadAvatarMutation.mutate(file);
      })
      .catch(() => {
        setAvatarPreview(pick);
      });
  };

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.uploadAvatar(formData);
    },
    onSuccess: (res: any) => {
      if (res?.code === 100000) {
        const url =
          (res as any)?.data?.url ||
          (Array.isArray((res as any)?.data) ? (res as any)?.data?.[0] : undefined);
        if (url) {
          setAvatarPreview(url);
        }
      }
    },
  });
  const setProfileMutation = useMutation({
    mutationFn: async () => {
      return api.setUserProfile({
        avatar: avatarPreview || '',
        name: userNameInput || '',
      });
    },
    onSuccess: async (res: any) => {
      if (res?.code === 100000) {
        const token = (user as any)?.token || '';
        try {
          const info = await api.getUserInfo(token);
          if (info?.code === 100000) {
            const newInfo = info.data;
            updateUser({
              userInfo: newInfo,
              token: (user as any)?.token,
              tokenType: (user as any)?.tokenType,
            });
            if (newInfo?.name) setUserNameInput(newInfo.name);
            if (newInfo?.avatar) setAvatarPreview(newInfo.avatar);
          }
        } catch {
          // ignore refresh errors
        }
      }
    },
  });

  const setAddressInfoMutation = useMutation({
    mutationFn: async () => {
      return api.setUserProfile({
        address_info: {
          name: legalName || '',
          phone: phone || '',
          address_1: address1 || '',
          address_2: address2 || '',
          countries: country || '',
          state: stateName || '',
          city: city || '',
          postal_code: postalCode || '',
        },
      });
    },
    onSuccess: async (res: any) => {
      if (res?.code === 100000) {
        // 显示成功提示
        import('../components/ToastProvider').then(({ showGlobalToast }) => {
          showGlobalToast({
            title: t('success'),
            description: t('saveSuccess'),
            variant: 'success',
            durationMs: 3000,
          });
        });
        const token = (user as any)?.token || '';
        try {
          const info = await api.getUserInfo(token);
          if (info?.code === 100000) {
            const newInfo = info.data;
            // 更新全局用户信息，保留原有字段（如 bean, refreshToken 等）
            updateUser({
              userInfo: newInfo,
              token: (user as any)?.token,
              tokenType: (user as any)?.tokenType,
              refreshToken: (user as any)?.refreshToken,
              expiresIn: (user as any)?.expiresIn,
              loginTime: (user as any)?.loginTime,
              bean: (user as any)?.bean,
            });
          }
        } catch {
          // ignore refresh errors
        }
      }
    },
  });

  const handleSaveProfile = () => {
    setProfileMutation.mutate();
  };

  // 检查所有个人信息字段是否都已填写
  const isAddressInfoComplete = useMemo(() => {
    return !!(
      legalName?.trim() &&
      phone?.trim() &&
      address1?.trim() &&
      address2?.trim() &&
      city?.trim() &&
      stateName?.trim() &&
      postalCode?.trim() &&
      country?.trim()
    );
  }, [legalName, phone, address1, address2, city, stateName, postalCode, country]);

  const handleSaveAddressInfo = () => {
    // 校验所有字段是否都已填写
    if (!isAddressInfoComplete) {
      // 动态导入 showGlobalToast 避免 SSR 问题
      import('../components/ToastProvider').then(({ showGlobalToast }) => {
        showGlobalToast({
          title: t('error'),
          description: t('pleaseFillAllFields'),
          variant: 'error',
          durationMs: 3000,
        });
      });
      return;
    }
    setAddressInfoMutation.mutate();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadAvatarMutation.mutate(file);
  };

  const handlePickAvatar = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-screen-xl px-4 pt-4 pb-40 mx-auto" style={{ color: '#7A8084' }}>
      <style>{`
        .acct-menu-item { background-color: transparent; color: #7A8084; }
        .acct-menu-item:hover { background-color: #34383C; color: #FFFFFF; }
        .acct-menu-item--active { background-color: #34383C; color: #FFFFFF; }
        .btn-dark { background-color: #34383C; color: #FFFFFF; }
        .btn-dark:hover { background-color: #3C4044; }
        .acct-input::placeholder { color: #FFFFFF; opacity: 0.7; }
        .acct-input-muted { color: #7A8084; }
        .acct-input-muted::placeholder { color: #7A8084; opacity: 1; }
      `}</style>
      <div className="flex flex-col lg:flex-row items-start gap-0 lg:gap-10">
        {/* 左侧菜单 */}
        <div className="hidden lg:flex flex-col gap-4 w-[220px] flex-none">
          <div className="flex flex-col gap-3 items-stretch w-full">
            <span className="text-sm font-bold text-white/40">{t('accountSection')}</span>
            <Link href="/account" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md" style={{ backgroundColor: '#34383C', color: '#FFFFFF' }}>
              <span className="font-bold">{t('accountProfile')}</span>
            </Link>
            <Link href="/account/deposits" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item">
              <span className="font-bold">{t('deposits')}</span>
            </Link>
            <Link href="/account/withdrawals" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item">
              <span className="font-bold">{t('withdrawals')}</span>
            </Link>
            <Link href="/account/claims" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item">
              <span className="font-bold">{t('claims')}</span>
            </Link>
            <Link href="/account/sales" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item">
              <span className="font-bold">{t('sales')}</span>
            </Link>
            <Link href="/account/battles" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item">
              <span className="font-bold">{t('battleHistory')}</span>
            </Link>
            <Link href="/account/packs" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item">
              <span className="font-bold">{t('packHistory')}</span>
            </Link>
            <Link href="/account/transactions" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item">
              <span className="font-bold">{t('transactionHistory')}</span>
            </Link>
            <Link href="/account/draws" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item">
              <span className="font-bold">{t('drawHistory')}</span>
            </Link>
            <Link href="/account/referrals" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item">
              <span className="font-bold">{t('referrals')}</span>
            </Link>
          </div>
        </div>

        {/* 右侧内容 */}
        <div className="flex flex-col items-start w-full lg:flex-1 min-w-0 gap-2">
          <div className="flex justify-between items-center self-stretch pb-1 pt-4 lg:pt-0 min-w-0">
            <AccountMobileMenu />
            <h1 className="text-2xl font-bold hidden lg:block" style={{ color: '#FFFFFF' }}>{t('profileTitle')}</h1>
          </div>
          <div className="flex flex-col w-full gap-4">
            <div className="flex flex-col items-stretch w-full p-6 rounded-lg" style={{ backgroundColor: '#22272B' }}>
              <h3 className="text-xl text-white font-bold pb-4">{t('basicInfo')}</h3>
              <div className="flex w-full h-[1px]" style={{ backgroundColor: '#292F34' }}></div>
              <div className="flex flex-col gap-2 xs:flex-row xs:gap-0 items-start py-6">
                <div className="flex min-w-40 items-center">
                  <label className="font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-base text-white" htmlFor="profilePicture">{t('avatarLabel')}</label>
                </div>
                <div className="flex flex-col gap-4 lg:flex-1 lg:flex-row lg:justify-between items-start">
                  <div className="flex gap-4">
                    <div className="flex relative rounded-full overflow-clip items-end cursor-pointer" onClick={handlePickAvatar}>
                      <div className="overflow-hidden rounded-full border border-gray-700" style={{ borderWidth: 1 }}>
                        <div className="relative rounded-full overflow-hidden" style={{ width: 64, height: 64 }}>
                          {avatarPreview ? (
                            <img
                              alt="avatar"
                              src={avatarPreview}
                              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', color: 'transparent' }}
                            />
                          ) : (
                            <svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" width="64" height="64">
                              <mask id="avt-acct" maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36"><rect width="36" height="36" rx="72" fill="#FFFFFF"></rect></mask>
                              <g mask="url(#avt-acct)"><rect width="36" height="36" fill="#EDD75A"></rect><rect x="0" y="0" width="36" height="36" transform="translate(-4 8) rotate(188 18 18) scale(1.2)" fill="#333333" rx="36"></rect><g transform="translate(-4 4) rotate(-8 18 18)"><path d="M13,21 a1,0.75 0 0,0 10,0" fill="#FFFFFF"></path><rect x="11" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#FFFFFF"></rect><rect x="23" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#FFFFFF"></rect></g></g>
                            </svg>
                          )}
                        </div>
                      </div>
                      <div className="flex absolute left-0 right-0 justify-center bg-gray-400/50">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-camera size-4 text-white m-1"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path><circle cx="12" cy="13" r="3"></circle></svg>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <p className="text-base" style={{ color: '#7A8084' }}>{t('avatarHelp')}</p>
                      <div className="flex">
                        <button
                          className="btn-dark inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative text-base font-bold select-none h-9 px-6 py-[10px]"
                          onClick={handleGenerateAvatar}
                        >
                          {t('generateAvatar')}
                        </button>
                      </div>
                      <input
                        ref={fileInputRef}
                        className="h-10 w-full rounded-md border border-gray-600 focus:border-gray-600 bg-gray-800 px-3 py-2 text-base file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-red-700 interactive-focus !-outline-offset-1 hidden"
                        id="profilePicture"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </div>
                    <input className="h-10 w-full rounded-md border border-gray-600 focus:border-gray-600 bg-gray-800 px-3 py-2 text-base file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-red-700 interactive-focus !-outline-offset-1 hidden" id="profilePicture" type="file" />
                  </div>
                </div>
              </div>
              <div className="flex w-full h-[1px]" style={{ backgroundColor: '#292F34' }}></div>
              <div className="flex flex-col gap-2 xs:flex-row xs:gap-0 items-start pt-6">
                <div className="flex min-w-40 items-center mt-0 xs:mt-2"><label className="font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-base text-white" htmlFor="username">{t('usernameLabel')}</label></div>
                <div className="flex w-full max-w-[540px] flex-col gap-6">
                  <input
                    className="acct-input flex h-10 w-full rounded-md border-0 px-3 py-2 text-base"
                    id="username"
                    maxLength={20}
                    placeholder={t('usernamePlaceholder')}
                    type="text"
                    value={userNameInput}
                    onChange={(e) => setUserNameInput(e.target.value)}
                    style={{ backgroundColor: '#292F34', color: '#FFFFFF' }}
                  />
                  <button
                    className="btn-dark inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative text-base font-bold select-none h-10 px-6 self-end min-w-36"
                    onClick={handleSaveProfile}
                  >
                    {t('save')}
                  </button>
                </div>
              </div>
              {/* 账户地址设置功能已移除 */}
            </div>
            <div className="flex flex-col items-stretch w-full p-6 rounded-lg" style={{ backgroundColor: '#22272B' }}>
              <h3 className="text-xl text-white font-bold pb-2">{t('personalInfo')}</h3>
              <p className="text-base pb-4 max-w-[700px]" style={{ color: '#7A8084' }}>
                {t('personalInfoDesc')}
              </p>
              <div className="flex w-full h-[1px]" style={{ backgroundColor: '#292F34' }}></div>
              <div className="flex flex-col gap-2 xs:flex-row xs:gap-0 items-start py-6">
                <label className="font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-base text-white min-w-40 mt-0 xs:mt-2" htmlFor="legalName">{t('fullName')}</label>
                <input
                  className="acct-input acct-input-muted flex h-10 w-full rounded-md border-0 px-3 py-2 text-base max-w-[540px]"
                  id="legalName"
                  maxLength={50}
                  placeholder={t('fullNamePlaceholder')}
                  type="text"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  style={{ backgroundColor: '#292F34' }}
                />
              </div>
              <div className="flex w-full h-[1px]" style={{ backgroundColor: '#292F34' }}></div>
              <div className="flex flex-col gap-2 xs:flex-row xs:gap-0 items-start py-6">
                <label className="font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-base text-white min-w-40 mt-0 xs:mt-2" htmlFor="phoneTop">{t('phoneLabel')}</label>
                <input
                  className="acct-input acct-input-muted flex h-10 w-full rounded-md border-0 px-3 py-2 text-base max-w-[540px]"
                  id="phoneTop"
                  maxLength={50}
                  placeholder={t('phonePlaceholder')}
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ backgroundColor: '#292F34' }}
                />
              </div>
              <div className="flex w-full h-[1px]" style={{ backgroundColor: '#292F34' }}></div>
              <div className="flex flex-col gap-2 xs:flex-row xs:gap-0 items-start pt-6">
                <label className="font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-base text-white min-w-40 mt-0 xs:mt-2" htmlFor="address">{t('residenceAddress')}</label>
                <div className="flex w-full max-w-[540px] flex-col gap-4">
                  <input
                    className="acct-input acct-input-muted flex h-10 w-full rounded-md border-0 px-3 py-2 text-base max-w-[540px]"
                    id="address1"
                    maxLength={50}
                    placeholder={t('address1')}
                    type="text"
                    value={address1}
                    onChange={(e) => setAddress1(e.target.value)}
                    style={{ backgroundColor: '#292F34' }}
                  />
                  <input
                    className="acct-input acct-input-muted flex h-10 w-full rounded-md border-0 px-3 py-2 text-base max-w-[540px]"
                    id="address2"
                    maxLength={50}
                    placeholder={t('address2')}
                    type="text"
                    value={address2}
                    onChange={(e) => setAddress2(e.target.value)}
                    style={{ backgroundColor: '#292F34' }}
                  />
                  <input
                    className="acct-input acct-input-muted flex h-10 w-full rounded-md border-0 px-3 py-2 text-base max-w-[540px]"
                    id="city"
                    maxLength={50}
                    placeholder={t('city')}
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    style={{ backgroundColor: '#292F34' }}
                  />
                  <input
                    className="acct-input acct-input-muted flex h-10 w-full rounded-md border-0 px-3 py-2 text-base max-w-[540px]"
                    id="state"
                    maxLength={50}
                    placeholder={t('state')}
                    type="text"
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    style={{ backgroundColor: '#292F34' }}
                  />
                  <input
                    className="acct-input acct-input-muted flex h-10 w-full rounded-md border-0 px-3 py-2 text-base max-w-[540px]"
                    id="zip"
                    maxLength={15}
                    placeholder={t('zip')}
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    style={{ backgroundColor: '#292F34' }}
                  />
                  <div className="relative w-full max-w-[540px]" ref={countrySelectRef}>
                    <button
                      type="button"
                      className="flex h-10 w-full items-center justify-between rounded-md px-3 py-2 text-base font-bold cursor-pointer"
                      style={{ backgroundColor: '#292F34', color: '#7A8084' }}
                      onClick={() => setCountrySelectOpen(!countrySelectOpen)}
                    >
                      <span>{country ? COUNTRY_OPTIONS.find(opt => opt.value === country)?.label || t('country') : t('country')}</span>
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
                        className="lucide lucide-chevron-down h-4 w-4 opacity-50"
                        aria-hidden="true"
                      >
                        <path d="m6 9 6 6 6-6"></path>
                      </svg>
                    </button>
                    {countrySelectOpen && (
                      <div className="absolute left-0 top-full mt-2 z-50 rounded-lg overflow-hidden shadow-lg w-full" style={{ backgroundColor: '#22272B' }}>
                        <div className="flex flex-col p-1">
                          {COUNTRY_OPTIONS.map(opt => (
                            <button
                              key={opt.value}
                              className="flex items-center justify-between h-10 px-3 rounded-md text-base font-bold cursor-pointer transition-colors"
                              style={{
                                backgroundColor: '#22272B',
                                color: '#FFFFFF',
                              }}
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#34383C';
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#22272B';
                              }}
                              onClick={() => {
                                setCountry(opt.value);
                                setCountrySelectOpen(false);
                              }}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    className="btn-dark inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative text-base font-bold select-none h-10 px-6 self-end min-w-36 mt-2 cursor-pointer"
                    onClick={handleSaveAddressInfo}
                    disabled={setAddressInfoMutation.isPending}
                    type="button"
                  >
                    {t('saveChanges')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


