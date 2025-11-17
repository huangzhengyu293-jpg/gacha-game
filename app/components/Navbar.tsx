'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { useI18n } from './I18nProvider';
import { signIn, useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import CartModal from './CartModal';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';


export default function Navbar() {
  const { t } = useI18n();
  const { data: session, status } = useSession();
  const router = useRouter();
  const enableDevLogin = process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN === 'true';
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [highlightStyle, setHighlightStyle] = useState<{ left: number; width: number; visible: boolean }>({ left: 0, width: 0, visible: false });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const assignItemRef = (index: number) => (el: HTMLDivElement | null) => {
    itemRefs.current[index] = el;
  };

  const [hoveredMobileKey, setHoveredMobileKey] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [regPass, setRegPass] = useState('');
  const [showStrength, setShowStrength] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [regUsername, setRegUsername] = useState(''); // 用户名
  const [regEmail, setRegEmail] = useState('');
  const [regLoading, setRegLoading] = useState(false); // 注册加载状态
  const [regError, setRegError] = useState(''); // 注册错误信息
  const [showLogin, setShowLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginShowPass, setLoginShowPass] = useState(false);
  const [loginRemember, setLoginRemember] = useState(true);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [showCart, setShowCart] = useState(false);
  // 中屏（>=640 && <1024）右上角弹框
  const [isMidViewport, setIsMidViewport] = useState(() => {
    if (typeof window === 'undefined') return false;
    const w = window.innerWidth;
    return w >= 640 && w < 1024;
  });
  const [isSmall, setIsSmall] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 640;
  });

  // isOpaque 放到 return 前计算
  const [showMidMenu, setShowMidMenu] = useState(false);
  const midMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const compute = () => {
      if (typeof window === 'undefined') return;
      const w = window.innerWidth;
      const mid = w >= 640 && w < 1024;
      setIsMidViewport(mid);
      setIsSmall(w < 640);
      if (!mid) setShowMidMenu(false);
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!showMidMenu) return;
      const target = e.target as Node;
      if (midMenuRef.current && !midMenuRef.current.contains(target)) {
        setShowMidMenu(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [showMidMenu]);

  // ESC 关闭中屏弹窗
  useEffect(() => {
    if (!showMidMenu) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowMidMenu(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showMidMenu]);

  // 登录后在控制台打印用户信息
  useEffect(() => {
    if (typeof window !== 'undefined' && status === 'authenticated') {
      // eslint-disable-next-line no-console
      console.log('[Auth] 当前用户', {
        name: session?.user?.name,
        email: session?.user?.email,
        image: (session?.user as any)?.image,
        role: (session?.user as any)?.role,
      });
    }
  }, [status, session]);

  // 头像下拉 - 点击外部关闭
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!showUserMenu) return;
      const target = e.target as Node;
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [showUserMenu]);

  // 注册处理函数
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canRegister || regLoading) return;
    
    setRegLoading(true);
    setRegError('');
    
    try {
      const result = await api.register({
        name: regUsername.trim(),
        email: regEmail.trim(),
        password: regPass
      });
      
      // 注册成功
      console.log('注册成功:', result);
      // 关闭注册弹窗
      setShowRegister(false);
      // 清空表单
      setRegUsername('');
      setRegEmail('');
      setRegPass('');
      setAgreed(false);
      // 可以选择自动登录或显示成功消息
      alert('注册成功！请登录。');
      setShowLogin(true);
    } catch (error) {
      console.error('注册失败:', error);
      setRegError(error instanceof Error ? error.message : '注册失败，请稍后重试');
    } finally {
      setRegLoading(false);
    }
  };

  const usernameValid = regUsername.trim().length >= 3; // 用户名至少3个字符
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail);
  const loginEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail);
  const hasLower = /[a-z]/.test(regPass);
  const hasUpper = /[A-Z]/.test(regPass);
  const hasDigit = /\d/.test(regPass);
  const hasSymbol = /[^A-Za-z0-9]/.test(regPass);
  const passLenOK = regPass.length >= 8;
  // 至少包含大小写和数字，长度>=8 判定为有效
  const passwordValid = passLenOK && hasLower && hasUpper && hasDigit;
  const canRegister = usernameValid && emailValid && passwordValid && agreed;
  const loginCanSubmit = loginEmailValid && loginPass.length > 0;
  const forgotEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail);
  const passwordScore = (() => {
    let s = 0;
    if (passLenOK) s++;
    if (hasLower) s++;
    if (hasUpper) s++;
    if (hasDigit) s++;
    if (hasSymbol) s++;
    return s; // 0..5
  })();

  // 统一滚动锁定（任一弹框打开）
  useEffect(() => {
    const anyOpen = showRegister || showLogin || showForgot || showTerms;
    if (anyOpen) {
      document.body.style.overflow = 'hidden';
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          if (showTerms) setShowTerms(false);
          else if (showForgot) setShowForgot(false);
          else if (showLogin) setShowLogin(false);
          else if (showRegister) setShowRegister(false);
        }
      };
      window.addEventListener('keydown', onKey);
      return () => {
        window.removeEventListener('keydown', onKey);
        document.body.style.overflow = '';
      };
    }
  }, [showRegister, showLogin, showForgot, showTerms]);

  useEffect(() => {
    if (activeIndex < 0) {
      setHighlightStyle((prev) => ({ ...prev, visible: false }));
      return;
    }
    const container = containerRef.current;
    const target = itemRefs.current[activeIndex];
    if (!container || !target) return;

    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const left = targetRect.left - containerRect.left;
    const width = targetRect.width;
    setHighlightStyle({ left, width, visible: true });
  }, [activeIndex]);

  const navigationItems = [
    { key: 'packs', labelKey: 'packs', icon: 'packs', href: '/packs' },
    { key: 'battles', labelKey: 'battles', icon: 'battles', href: '/battles' },
    { key: 'deals', labelKey: 'deals', icon: 'deals', href: '/deals' },
    { key: 'draw', labelKey: 'draw', icon: 'draw', href: '/draw' },
    { key: 'events', labelKey: 'events', icon: 'events', href: '/events' },
    { key: 'rewards', labelKey: 'rewards', icon: 'rewards', href: '/rewards' },
  ];

  const getIcon = (iconName: string) => {
    const icons = {
      packs: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 4.15385L4 16.8462C4 17.4834 4.70355 18 5.57143 18L13.4286 18C14.2964 18 15 17.4834 15 16.8462L15 4.15385C15 3.5166 14.2964 3 13.4286 3L5.57143 3C4.70355 3 4 3.5166 4 4.15385Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
          <path d="M8.08771 19.0127C7.98916 19.5993 8.54002 20.1807 9.31810 20.3115L16.3622 21.495C17.1403 21.6257 17.8509 21.2562 17.9495 20.6697L19.9123 8.98725C20.0109 8.40070 19.4600 7.81924 18.6819 7.68851L15.1599 7.09675" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
      ),
      battles: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14.2222 16.8889L3.99998 6.66667V4H6.66665L16.8889 14.2222" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
          <path d="M12.8889 18.2222L18.2223 12.8889" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
          <path d="M15.5557 15.5555L19.1113 19.1111" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
          <path d="M18.2223 20L20 18.2222" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
          <path d="M14.2223 7.11112L17.3334 4H20V6.66667L16.8889 9.77779" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
          <path d="M5.77771 13.7777L9.33328 17.3333" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
          <path d="M7.55558 16.4445L4.88891 19.1112" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
          <path d="M3.99998 18.2222L5.77776 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
      ),
      deals: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7.5 3.06729C4.23742 4.71411 2 8.09576 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 8.09576 19.7626 4.71411 16.5 3.06729" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"></path>
          <path d="M8.6822 7C7.06551 8.07492 6 9.91303 6 12C6 15.3137 8.68629 18 12 18C15.3137 18 18 15.3137 18 12C18 9.91303 16.9345 8.07492 15.3178 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"></path>
          <path d="M13.8534 2H13.2857H10.7143H10.1466C9.71002 2 9.48314 2.5203 9.78021 2.84023L11.6336 4.83619C11.8314 5.04922 12.1686 5.04922 12.3664 4.83619L14.2198 2.84023C14.5169 2.5203 14.2900 2 13.8534 2Z" fill="currentColor"></path>
        </svg>
      ),
      draw: (
        <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.5 9.16667V4.16667C17.5 3.72464 17.3244 3.30072 17.0118 2.98816C16.6993 2.67559 16.2754 2.5 15.8333 2.5H4.16667C3.72464 2.5 3.30072 2.67559 2.98816 2.98816C2.67559 3.30072 2.5 3.72464 2.5 4.16667V15.8333C2.5 16.2754 2.67559 16.6993 2.98816 17.0118C3.30072 17.3244 3.72464 17.5 4.16667 17.5H9.16667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
          <path d="M13.1741 15.4C13.1384 15.2615 13.0662 15.1352 12.9652 15.0341C12.8641 14.9330 12.7377 14.8609 12.5993 14.8252L10.1454 14.1924C10.1035 14.1805 10.0667 14.1553 10.0404 14.1206C10.0142 14.0859 10 14.0435 10 14C10 13.9565 10.0142 13.9141 10.0404 13.8794C10.0667 13.8447 10.1035 13.8195 10.1454 13.8076L12.5993 13.1744C12.7377 13.1387 12.8640 13.0667 12.9651 12.9656C13.0662 12.8646 13.1383 12.7384 13.1741 12.6L13.8069 10.1461C13.8187 10.1041 13.8438 10.0670 13.8786 10.0407C13.9134 10.0143 13.9558 10 13.9995 10C14.0431 10 14.0856 10.0143 14.1204 10.0407C14.1551 10.0670 14.1803 10.1041 14.1921 10.1461L14.8245 12.6C14.8602 12.7385 14.9323 12.8648 15.0334 12.9659C15.1345 13.0670 15.2608 13.1391 15.3992 13.1748L17.8532 13.8072C17.8954 13.8188 17.9326 13.8440 17.9591 13.8788C17.9856 13.9137 18 13.9562 18 14C18 14.0438 17.9856 14.0863 17.9591 14.1212C17.9326 14.1560 17.8954 14.1812 17.8532 14.1928L15.3992 14.8252C15.2608 14.8609 15.1345 14.9330 15.0334 15.0341C14.9323 15.1352 14.8602 15.2615 14.8245 15.4L14.1917 17.8539C14.1799 17.8959 14.1547 17.9330 14.1200 17.9593C14.0852 17.9857 14.0427 18 13.9991 18C13.9554 18 13.9130 17.9857 13.8782 17.9593C13.8434 17.9330 13.8183 17.8959 13.8065 17.8539L13.1741 15.4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
      ),
      events: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 13V2L20 6L12 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
          <path d="M20.5610 10.222C21.0931 11.8621 21.1429 13.6206 20.7044 15.2883C20.2659 16.9559 19.3576 18.4624 18.0876 19.6287C16.8175 20.7949 15.2391 21.5718 13.5402 21.8668C11.8413 22.1619 10.0935 21.9627 8.50454 21.2929C6.91562 20.6232 5.55254 19.5111 4.57747 18.0889C3.60240 16.6668 3.05639 14.9945 3.00440 13.2709C2.95241 11.5474 3.39662 9.84522 4.28419 8.36689C5.17176 6.88856 6.46532 5.69632 8.01099 4.93201" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
          <path d="M8.00202 9.99701C7.50092 10.664 7.17470 11.4458 7.05306 12.2712C6.93143 13.0966 7.01825 13.9392 7.30562 14.7225C7.59299 15.5057 8.07177 16.2045 8.69835 16.7554C9.32492 17.3062 10.0794 17.6915 10.8930 17.8762C11.7065 18.0608 12.5534 18.0390 13.3564 17.8126C14.1593 17.5862 14.8929 17.1625 15.4902 16.5801C16.0876 15.9977 16.5297 15.2750 16.7762 14.4780C17.0228 13.6810 17.0661 12.8350 16.9020 12.0170" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
      ),
      rewards: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 8H4C3.44772 8 3 8.44772 3 9V11C3 11.5523 3.44772 12 4 12H20C20.5523 12 21 11.5523 21 11V9C21 8.44772 20.5523 8 20 8Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
          <path d="M12 8V21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
          <path d="M19 12V19C19 19.5304 18.7893 20.0391 18.4142 20.4142C18.0391 20.7893 17.5304 21 17 21H7C6.46957 21 5.96086 20.7893 5.58579 20.4142C5.21071 20.0391 5 19.5304 5 19V12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
          <path d="M7.5 8.00001C6.83696 8.00001 6.20107 7.73662 5.73223 7.26778C5.26339 6.79894 5 6.16305 5 5.50001C5 4.83697 5.26339 4.20108 5.73223 3.73224C6.20107 3.26340 6.83696 3.00001 7.5 3.00001C8.46469 2.98320 9.41003 3.45127 10.2127 4.34317C11.0154 5.23507 11.6383 6.50941 12 8.00001C12.3617 6.50941 12.9846 5.23507 13.7873 4.34317C14.5900 3.45127 15.5353 2.98320 16.5 3.00001C17.1630 3.00001 17.7989 3.26340 18.2678 3.73224C18.7366 4.20108 19 4.83697 19 5.50001C19 6.16305 18.7366 6.79894 18.2678 7.26778C17.7989 7.73662 17.1630 8.00001 16.5 8.00001" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
      ),
    };
    return icons[iconName as keyof typeof icons] || null;
  };

  const isOpaque = (isSmall || isMidViewport || isMenuOpen || showMidMenu || showUserMenu || showRegister || showLogin || showForgot || showTerms);
  const { data: currentUser } = useQuery({
    queryKey: ['user'],
    queryFn: api.getCurrentUser,
    enabled: status === 'authenticated',
    staleTime: 0,
  });
  const warehouseCount = (currentUser?.warehouse ?? []).reduce((s: number, w: any) => s + Math.max(0, Number(w?.quantity ?? 0)), 0);
  const balanceText = typeof currentUser?.balance === 'number' ? `$${(currentUser.balance || 0).toFixed(2)}` : '$0.00';

  return (
    <div className="flex flex-col sticky z-20 top-0 w-full items-center" style={{ backgroundColor: '#1D2125' }}>
      <style>{`
        @keyframes modalFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes modalZoomIn { from { transform: scale(0.95); opacity: 0 } to { transform: scale(1); opacity: 1 } }
        .promo-input::placeholder { color: #7A8084; opacity: 1; }
        .menu-item:hover { background-color: transparent; }
        @media (max-width: 639px) { .nav-vol { display: none !important; } }
      `}</style>
      <div className="w-full" style={{ borderBottom: '2px solid #34383C', backgroundColor: '#1D2125' }}>
        <div className="mx-auto w-full max-w-[1280px] flex items-center justify-between px-4 safe-x h-12 min-h-12 sm:h-[65px] sm:min-h-[65px] lg:h-16 lg:min-h-16 overflow-visible">
          {/* Left (Logo + Desktop Nav) */}
          <div className="flex items-center gap-2 lg:gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center h-[3rem] xs:h-[4rem] mr-5 lg:mr-10 cursor-pointer shrink-0" onClick={() => setIsMenuOpen(false)}>
              <div className="w-6 h-6 mr-2 text-white shrink-0 block">
            <svg viewBox="0 0 82.000000 90.000000" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" className="w-full h-full" aria-label="FlameDraw logo">
              <rect x="0" y="0" width="82" height="90" fill="#1d2125" />
                  <g transform="translate(0.000000,90.000000) scale(0.100000,-0.100000)" fill="currentColor" stroke="none">
                    <path d="M0 450 l0 -450 410 0 410 0 0 333 -1 332 -44 -93 c-24 -50 -47 -101
-50 -112 -15 -46 -20 -11 -23 145 -2 91 0 165 3 165 17 0 86 -43 99 -62 15
-21 16 -15 16 85 l0 107 -181 0 c-174 0 -180 -1 -160 -17 21 -18 261 -619 261
-654 0 -9 -8 -26 -17 -37 -18 -20 -373 -162 -404 -162 -38 0 -61 46 -178 350
-109 283 -121 317 -110 342 10 24 34 36 188 96 97 38 183 72 191 75 8 3 -81 6
-197 6 l-213 1 0 -450z m662 380 c16 -19 18 -42 18 -184 l-1 -161 -69 180
c-38 99 -70 184 -70 189 0 5 23 6 52 4 38 -4 57 -12 70 -28z m-472 -690 c0 -5
-4 -10 -10 -10 -5 0 -10 5 -10 10 0 6 5 10 10 10 6 0 10 -4 10 -10z"/>
                    <path d="M362 700 c-40 -15 -83 -35 -97 -44 -34 -23 -58 -73 -52 -110 8 -50
121 -336 133 -336 5 0 23 14 40 31 24 25 29 38 29 81 0 45 4 55 38 88 32 33
37 44 37 84 0 53 -6 55 -78 27 l-49 -20 -11 23 c-9 20 -6 24 39 45 57 26 82
64 77 119 -4 46 -14 48 -106 12z"/>
                  </g>
                </svg>
              </div>
              <h1 className="text-xl text-white font-black whitespace-nowrap">FlameDraw</h1>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex relative items-center h-[4rem] gap-2 overflow-clip px-[1px]">
              <div className="flex gap-0 xl:gap-2 relative" ref={containerRef}>
                {navigationItems.map((item, index) => (
                  <div key={index} className="relative z-10">
                    <Link href={item.href} className="block">
                      <div
                        ref={assignItemRef(index)}
                        className="flex relative justify-center items-center px-3 h-9 gap-1 hover:text-white cursor-pointer"
                        onMouseEnter={() => setActiveIndex(index)}
                        onMouseLeave={() => setActiveIndex(-1)}
                        style={{ color: '#7A8084' }}
                      >
                        <div className="mb-[2px] size-5">{getIcon(item.icon)}</div>
                        <p className="text-base text-white font-semibold">{t(item.labelKey as any)}</p>
                      </div>
                    </Link>
                  </div>
                ))}
                <div
                  className="absolute rounded-md h-9 transition-[left,width,opacity] duration-300 ease-out"
                  style={{
                    left: `${highlightStyle.left}px`,
                    width: `${highlightStyle.width}px`,
                    opacity: highlightStyle.visible ? 1 : 0,
                    backgroundColor: 'rgba(107,114,128,0.30)'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Right side buttons */}
          <div className="flex flex-row gap-3 items-center lg:-ml-[20px] relative">
            {/* Sound button (>=sm) */}
            <div className="hidden sm:flex mr-0 sm:mr-2 gap-0 sm:gap-2 items-center">
              <button
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md disabled:pointer-events-none interactive-focus relative bg-transparent text-base font-bold select-none size-10 min-h-10 min-w-10 max-h-10 max-w-10"
                style={{ color: '#7A8084' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#FFFFFF'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#7A8084'; }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-volume2 size-5">
                  <path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"></path>
                  <path d="M16 9a5 5 0 0 1 0 6"></path>
                  <path d="M19.364 18.364a9 9 0 0 0 0-12.728"></path>
                </svg>
              </button>
              <div className="flex h-5 w-[1px] bg-gray-600"></div>
            </div>

            {/* 桌面/中屏：登录状态 */}
            {status === 'authenticated' ? (
              <div className="hidden sm:flex gap-2 items-center">
                <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative bg-[#34383C] hover:bg-[#3C4044] text-base text-white font-bold select-none px-3 h-8 sm:h-9" onClick={() => setShowCart(true)}>
                  <div className="hidden xs:flex md:hidden lg:flex items-center gap-2">
                    <p className="text-sm text-white font-bold">购物车</p>
                    <div className="flex items-center justify-center rounded-full p-1 min-w-5 h-5" style={{ backgroundColor: '#FFFFFF', color: '#000000' }}>
                      <span className="font-bold text-xs">{warehouseCount}</span>
                    </div>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shopping-cart h-5 w-5 xs:hidden md:block lg:hidden text-white"><circle cx="8" cy="21" r="1"></circle><circle cx="19" cy="21" r="1"></circle><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path></svg>
                </button>
                <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative bg-blue-400 text-base text-white font-bold hover:bg-blue-500 select-none px-3 h-8 sm:h-9 min-w-24">
                  <p className="text-sm text-white font-bold">{balanceText}</p>
                </button>
                <div className="flex relative" ref={userMenuRef}>
                  <div className="flex justify-center items-center">
                    <div className="hidden lg:flex">
                      <button onClick={() => setShowUserMenu((v) => !v)} className="overflow-hidden border rounded-full border-gray-700" style={{ borderWidth: 1 }} aria-label="用户菜单">
                        <div className="relative rounded-full overflow-hidden" style={{ width: 32, height: 32 }}>
                          {session?.user && (session.user as any).image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={(session.user as any).image} alt="avatar" width={32} height={32} style={{ width: 32, height: 32, objectFit: 'cover', display: 'block' }} />
                          ) : (
                            <svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" width="32" height="32">
                              <mask id="avt-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36">
                                <rect width="36" height="36" rx="72" fill="#FFFFFF"></rect>
                              </mask>
                              <g mask="url(#avt-mask)">
                                <rect width="36" height="36" fill="#EDD75A"></rect>
                                <rect x="0" y="0" width="36" height="36" transform="translate(-4 8) rotate(188 18 18) scale(1.2)" fill="#333333" rx="36"></rect>
                                <g transform="translate(-4 4) rotate(-8 18 18)">
                                  <path d="M13,21 a1,0.75 0 0,0 10,0" fill="#FFFFFF"></path>
                                  <rect x="11" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#FFFFFF"></rect>
                                  <rect x="23" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#FFFFFF"></rect>
                                </g>
                              </g>
                            </svg>
                          )}
                        </div>
                      </button>
                    </div>
                  </div>
                  {/* Dropdown */}
                  <div className={`${showUserMenu ? 'flex opacity-100' : 'hidden opacity-0'} shadow-menu flex-col z-20 w-60 items-stretch absolute right-0 top-full mt-5 rounded-lg`} style={{ transition: 'opacity 160ms ease', backgroundColor: '#22272B' }}>
                    <div className="flex flex-col px-2 py-1.5 gap-2">
                      <div className="flex items-center gap-4 cursor-pointer menu-item px-3 py-2 rounded-lg transition-colors" onClick={() => { setShowUserMenu(false); router.push('/account'); }}>
                        <div className="relative size-8">
                          <div className="overflow-hidden border rounded-full border-gray-700" style={{ borderWidth: 1 }}>
                            <div className="relative rounded-full overflow-hidden" style={{ width: 32, height: 32 }}>
                              {session?.user && (session.user as any).image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={(session.user as any).image} alt="avatar" width={32} height={32} style={{ width: 32, height: 32, objectFit: 'cover', display: 'block' }} />
                              ) : (
                                <svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" width="32" height="32">
                                  <mask id="avt-mask2" maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36">
                                    <rect width="36" height="36" rx="72" fill="#FFFFFF"></rect>
                                  </mask>
                                  <g mask="url(#avt-mask2)">
                                    <rect width="36" height="36" fill="#EDD75A"></rect>
                                    <rect x="0" y="0" width="36" height="36" transform="translate(-4 8) rotate(188 18 18) scale(1.2)" fill="#333333" rx="36"></rect>
                                    <g transform="translate(-4 4) rotate(-8 18 18)">
                                      <path d="M13,21 a1,0.75 0 0,0 10,0" fill="#FFFFFF"></path>
                                      <rect x="11" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#FFFFFF"></rect>
                                      <rect x="23" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#FFFFFF"></rect>
                                    </g>
                                  </g>
                                </svg>
                              )}
                            </div>
                          </div>
                          <div className="px-1 py-0.5 flex items-center justify-center rounded-full absolute z-10 -bottom-1 size-5 -right-2 left-[unset]" style={{ backgroundColor: '#000000' }}>
                            <span className="text-xs font-bold leading-none text-xxs" style={{ color: '#FFFFFF' }}>0</span>
                          </div>
                        </div>
                        <div className="flex flex-1 flex-col overflow-hidden">
                          <p className="text-xl text-white font-bold overflow-hidden text-ellipsis whitespace-nowrap leading-tight">{session?.user?.name || (session?.user?.email ?? '用户')}</p>
                          <p className="font-semibold text-sm" style={{ color: '#7A8084' }}>查看个人资料</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex h-[1px]" style={{ backgroundColor: '#34383C' }}></div>
                    <div className="flex flex-col px-2 py-1.5 gap-2">
                      <div className="flex items-center gap-2 cursor-pointer menu-item px-3 py-2 rounded-lg transition-colors" onClick={() => { setShowUserMenu(false); signOut({ callbackUrl: '/' }); }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-log-out size-5 text-white"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" x2="9" y1="12" y2="12"></line></svg>
                        <p className="text-base text-white">注销</p>
                      </div>
                    </div>
                    <form onSubmit={(e) => { e.preventDefault(); /* eslint-disable-next-line no-console */ console.log('[Promo] apply', promoCode); }}>
                      <div className="flex h-[1px]" style={{ backgroundColor: '#34383C' }}></div>
                      <div className="flex relative items-center px-3 py-4">
                        <input className="promo-input flex h-10 w-full rounded-md px-3 py-2 text-base border-0 focus:outline-none" placeholder="促销码" type="text" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} style={{ backgroundColor: '#1D2125', color: '#7A8084' }} />
                        <button type="submit" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus bg-blue-400 text-base text-white font-bold hover:bg-blue-500 select-none min-h-8 min-w-8 max-h-8 max-w-8 absolute right-4 size-8">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check size-4 min-w-4 min-h-4"><path d="M20 6 9 17l-5-5"></path></svg>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            ) : (
              <div className="hidden sm:flex gap-2">
                <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative bg-gray-600 text-base text-white font-bold hover:bg-gray-500 disabled:text-gray-400 select-none px-6 h-8 sm:h-9 w-24" onClick={() => setShowLogin(true)}>
                  <p className="text-sm">{t('login')}</p>
                </button>
                <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative bg-blue-400 text-base text-white font-bold hover:bg-blue-500 disabled:text-blue-600 select-none px-6 h-8 sm:h-9 w-24" onClick={() => setShowRegister(true)}>
                  <p className="text-sm">{t('register')}</p>
                </button>
              </div>
            )}

            {/* 小屏右侧组件（登录） */}
            {status === 'authenticated' && (
              <div className="flex sm:hidden flex-row gap-3 items-center">
                <div className="nav-vol flex mr-0 xs:mr-2 gap-0 xs:gap-2 items-center max-[390px]:hidden">
                  <button
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md disabled:pointer-events-none interactive-focus relative bg-transparent text-base font-bold select-none size-10 min-h-10 min-w-10 max-h-10 max-w-10"
                    style={{ color: '#7A8084' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#FFFFFF'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#7A8084'; }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-volume2 size-5"><path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"></path><path d="M16 9a5 5 0 0 1 0 6"></path><path d="M19.364 18.364a9 9 0 0 0 0-12.728"></path></svg>
                  </button>
                  <div className="flex h-5 w-[1px] bg-gray-600"></div>
                </div>
                <div className="flex">
                  <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative bg-[#34383C] hover:bg-[#3C4044] text-base text-white font-bold select-none px-3 h-8 xs:h-9" onClick={() => setShowCart(true)}>
                    <div className="hidden xs:flex md:hidden lg:flex items-center gap-2">
                      <p className="text-sm text-white font-bold">购物车</p>
                      <div className="flex items-center justify-center rounded-full p-1 min-w-5 h-5" style={{ backgroundColor: '#FFFFFF', color: '#000000' }}>
                        <span className="font-bold text-xs">{warehouseCount}</span>
                      </div>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shopping-cart h-5 w-5 xs:hidden md:block lg:hidden text-white"><circle cx="8" cy="21" r="1"></circle><circle cx="19" cy="21" r="1"></circle><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path></svg>
                  </button>
                </div>
                <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative bg-blue-400 text-base text-white font-bold hover:bg-blue-500 disabled:text-blue-600 select-none px-3 h-8 xs:h-9 min-w-24">
                  <p className="text-sm text-white font-bold">{balanceText}</p>
                </button>
                <div className="flex relative">
                  <div className="flex justify-center items-center">
                    {!(isMenuOpen || showMidMenu) ? (
                      <svg onClick={() => { if (isMidViewport) setShowMidMenu(true); else setIsMenuOpen(true); }} onMouseDown={(e) => e.stopPropagation()} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu flex lg:hidden size-6 min-h-6 min-w-6 text-white cursor-pointer"><line x1="4" x2="20" y1="12" y2="12"></line><line x1="4" x2="20" y1="6" y2="6"></line><line x1="4" x2="20" y1="18" y2="18"></line></svg>
                    ) : (
                      <svg onClick={() => { if (isMidViewport) setShowMidMenu(false); else setIsMenuOpen(false); }} onMouseDown={(e) => e.stopPropagation()} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x flex lg:hidden size-6 min-h-6 min-w-6 text-white cursor-pointer"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 小屏右侧：未登录时显示菜单开关 */}
            {status !== 'authenticated' && (
              <div className="flex sm:hidden items-center">
                <div className="flex relative">
                  <div className="flex justify-center items-center">
                    {!(isMenuOpen || showMidMenu) ? (
                      <svg onClick={() => { if (isMidViewport) setShowMidMenu(true); else setIsMenuOpen(true); }} onMouseDown={(e) => e.stopPropagation()} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu flex lg:hidden size-6 min-h-6 min-w-6 text-white cursor-pointer"><line x1="4" x2="20" y1="12" y2="12"></line><line x1="4" x2="20" y1="6" y2="6"></line><line x1="4" x2="20" y1="18" y2="18"></line></svg>
                    ) : (
                      <svg onClick={() => { if (isMidViewport) setShowMidMenu(false); else setIsMenuOpen(false); }} onMouseDown={(e) => e.stopPropagation()} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x flex lg:hidden size-6 min-h-6 min-w-6 text-white cursor-pointer"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 中屏独立菜单按钮（仅 >=sm <lg） */}
            <div className="hidden sm:flex lg:hidden relative">
              <div className="flex justify-center items-center">
                {!(isMenuOpen || showMidMenu) ? (
                  <svg onClick={() => { if (isMidViewport) setShowMidMenu(true); else setIsMenuOpen(true); }} onMouseDown={(e) => e.stopPropagation()} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu flex lg:hidden size-6 min-h-6 min-w-6 text-white cursor-pointer"><line x1="4" x2="20" y1="12" y2="12"></line><line x1="4" x2="20" y1="6" y2="6"></line><line x1="4" x2="20" y1="18" y2="18"></line></svg>
                ) : (
                  <svg onClick={() => { if (isMidViewport) setShowMidMenu(false); else setIsMenuOpen(false); }} onMouseDown={(e) => e.stopPropagation()} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x flex lg:hidden size-6 min-h-6 min-w-6 text-white cursor-pointer"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
                )}
              </div>

              {/* 中屏下拉菜单和遮罩 */}
              {isMidViewport && showMidMenu && (
                <>
                  {/* 遮罩 */}
                  <div className="flex fixed inset-0 z-50" onMouseDown={() => setShowMidMenu(false)} />
                  {/* 下拉 */}
                  <div
                    ref={midMenuRef}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="flex flex-col shadow-menu w-60 items-stretch absolute right-0 top-full mt-5 rounded-lg"
                    style={{ backgroundColor: '#22272B', zIndex: 60 }}
                  >
                    {/* 顶部用户卡或登录注册 */}
                    {status === 'authenticated' ? (
                      <div className="flex flex-col px-2 py-1.5 gap-2">
                        <div className="flex items-center gap-4 cursor-pointer menu-item px-3 py-2 rounded-lg transition-colors" onClick={() => { setShowMidMenu(false); router.push('/account'); }}>
                          <div className="relative size-8">
                            <div className="overflow-hidden border rounded-full border-gray-700" style={{ borderWidth: 1 }}>
                              <div className="relative rounded-full overflow-hidden" style={{ width: 32, height: 32 }}>
                                {session?.user && (session.user as any).image ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={(session.user as any).image} alt="avatar" width={32} height={32} style={{ width: 32, height: 32, objectFit: 'cover', display: 'block' }} />
                                ) : (
                                  <svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" width="32" height="32">
                                    <mask id="mid-avt-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36"><rect width="36" height="36" rx="72" fill="#FFFFFF"></rect></mask>
                                    <g mask="url(#mid-avt-mask)"><rect width="36" height="36" fill="#EDD75A"></rect><rect x="0" y="0" width="36" height="36" transform="translate(-4 8) rotate(188 18 18) scale(1.2)" fill="#333333" rx="36"></rect><g transform="translate(-4 4) rotate(-8 18 18)"><path d="M13,21 a1,0.75 0 0,0 10,0" fill="#FFFFFF"></path><rect x="11" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#FFFFFF"></rect><rect x="23" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#FFFFFF"></rect></g></g>
                                  </svg>
                                )}
                              </div>
                            </div>
                            <div className="px-1 py-0.5 flex items-center justify-center rounded-full absolute z-10 -bottom-1 size-5 -right-2 left-[unset]" style={{ backgroundColor: '#000000' }}>
                              <span className="text-xs font-bold leading-none text-xxs" style={{ color: '#FFFFFF' }}>0</span>
                            </div>
                          </div>
                          <div className="flex flex-1 flex-col overflow-hidden">
                            <p className="text-xl text-white font-bold overflow-hidden text-ellipsis whitespace-nowrap leading-tight">{session?.user?.name || (session?.user?.email ?? '用户')}</p>
                            <p className="font-semibold text-sm" style={{ color: '#7A8084' }}>查看个人资料</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col px-2 py-2 gap-2">
                        <button className="menu-item px-3 py-2 rounded-lg text-white text-base font-semibold text-left" onClick={() => { setShowMidMenu(false); setShowLogin(true); }}>{t('login')}</button>
                        <button className="menu-item px-3 py-2 rounded-lg text-white text-base font-semibold text-left" onClick={() => { setShowMidMenu(false); setShowRegister(true); }}>{t('register')}</button>
                      </div>
                    )}

                    <div className="flex h-[1px]" style={{ backgroundColor: '#34383C' }}></div>

                    {/* 导航项 */}
                    <div className="flex flex-col px-2 py-1.5 gap-1">
                      {navigationItems.map((item, idx) => (
                        <Link key={idx} href={item.href} className="flex items-center gap-2 menu-item px-3 py-2 rounded-lg" onClick={() => setShowMidMenu(false)}>
                          <div className="size-4" style={{ color: '#7A8084' }}>{getIcon(item.icon)}</div>
                          <p className="text-base text-white font-semibold">{t(item.labelKey as any)}</p>
                        </Link>
                      ))}
                    </div>

                    <div className="flex h-[1px]" style={{ backgroundColor: '#34383C' }}></div>

                    {/* 登录状态下的注销与促销码 */}
                    {status === 'authenticated' ? (
                      <>
                        <div className="flex flex-col px-2 py-1.5 gap-2">
                          <div className="flex items-center gap-2 cursor-pointer menu-item px-3 py-2 rounded-lg" onClick={() => { setShowMidMenu(false); signOut({ callbackUrl: '/' }); }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-log-out size-5 text-white"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" x2="9" y1="12" y2="12"></line></svg>
                            <p className="text-base text-white">注销</p>
                          </div>
                        </div>
                        <form onSubmit={(e) => { e.preventDefault(); /* eslint-disable-next-line no-console */ console.log('[Promo] apply', promoCode); }}>
                          <div className="flex relative items-center px-3 py-4">
                            <input className="promo-input flex h-10 w-full rounded-md border border-gray-600 focus:border-gray-600 px-3 py-2 text-base" placeholder="促销码" type="text" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} style={{ backgroundColor: '#1D2125', color: '#7A8084' }} />
                            <button type="submit" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus bg-blue-400 text-base text-white font-bold hover:bg-blue-500 select-none min-h-8 min-w-8 max-h-8 max-w-8 absolute right-4 size-8">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check size-4 min-w-4 min-h-4"><path d="M20 6 9 17l-5-5"></path></svg>
                            </button>
                          </div>
                        </form>
                      </>
                    ) : null}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="flex lg:hidden flex-col fixed left-0 right-0 top-12 bottom-0" style={{ backgroundColor: '#1D2125' }}>
          {status === 'authenticated' ? (
            <div className="flex flex-col rounded-lg m-4 mb-6 mt-6" style={{ backgroundColor: '#22272B' }}>
              <div className="flex gap-4 p-4 cursor-pointer" style={{ borderBottom: '1px solid #34383C' }} onClick={() => { setIsMenuOpen(false); router.push('/account'); }}>
                <div className="relative size-8">
                  <div className="overflow-hidden border rounded-full border-gray-700" style={{ borderWidth: 1 }}>
                    <div className="relative rounded-full overflow-hidden" style={{ width: 32, height: 32 }}>
                      {session?.user && (session.user as any).image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={(session.user as any).image} alt="avatar" width={32} height={32} style={{ width: 32, height: 32, objectFit: 'cover', display: 'block' }} />
                      ) : (
                        <svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" width="32" height="32">
                          <mask id="avt-mask-mm" maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36">
                            <rect width="36" height="36" rx="72" fill="#FFFFFF"></rect>
                          </mask>
                          <g mask="url(#avt-mask-mm)">
                            <rect width="36" height="36" fill="#EDD75A"></rect>
                            <rect x="0" y="0" width="36" height="36" transform="translate(-4 8) rotate(188 18 18) scale(1.2)" fill="#333333" rx="36"></rect>
                            <g transform="translate(-4 4) rotate(-8 18 18)">
                              <path d="M13,21 a1,0.75 0 0,0 10,0" fill="#FFFFFF"></path>
                              <rect x="11" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#FFFFFF"></rect>
                              <rect x="23" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#FFFFFF"></rect>
                            </g>
                          </g>
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="px-1 py-0.5 flex items-center justify-center rounded-full absolute z-10 -bottom-1 size-5 -right-2 left-[unset]" style={{ backgroundColor: '#000000' }}>
                    <span className="text-xs font-bold leading-none text-xxs" style={{ color: '#FFFFFF' }}>0</span>
                  </div>
                </div>
                <div className="flex flex-1 flex-col">
                  <p className="text-xl text-white font-bold overflow-hidden text-ellipsis whitespace-nowrap leading-tight">{session?.user?.name || (session?.user?.email ?? '用户')}</p>
                  <p className="font-semibold text-sm" style={{ color: '#7A8084' }}>查看个人资料</p>
                </div>
              </div>
              <div className="flex flex-col p-4 gap-4">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => signOut({ callbackUrl: '/' })}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-log-out size-5 text-white"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" x2="9" y1="12" y2="12"></line></svg>
                  <p className="text-lg text-white font-semibold">登出</p>
                </div>
                <div className="flex relative items-center">
                  <input className="promo-input flex w-full rounded-md px-3 py-2 h-14 text-lg border-0 focus:outline-none" placeholder="促销代码" type="text" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} style={{ backgroundColor: '#1D2125', color: '#7A8084' }} />
                  <button disabled={!promoCode.trim()} onClick={(e) => { e.preventDefault(); /* eslint-disable-next-line no-console */ console.log('[Promo] apply', promoCode); }} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus bg-blue-400 text-base text-white font-bold hover:bg-blue-500 disabled:text-blue-600 select-none size-10 min-h-10 min-w-10 max-h-10 max-w-10 absolute right-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check"><path d="M20 6 9 17l-5-5"></path></svg>
                  </button>
                </div>
                {/* 移除下方分割线以符合设计 */}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 border border-gray-700 m-4 rounded-lg mb-6 px-10 py-6 mt-6" style={{ backgroundColor: '#1D2125' }}>
              <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative bg-gray-600 text-base text-white font-bold hover:bg-gray-500 disabled:text-gray-400 select-none h-10 px-6" onClick={() => { setIsMenuOpen(false); setShowLogin(true); }}>
                <p className="text-lg text-white font-bold">{t('login')}</p>
              </button>
              <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative bg-blue-400 text-base text-white font-bold hover:bg-blue-500 disabled:text-blue-600 select-none h-10 px-6" onClick={() => { setIsMenuOpen(false); setShowRegister(true); }}>
                <p className="text-lg text-white font-bold">{t('register')}</p>
              </button>
            </div>
          )}
          <div className="flex flex-col px-6">
            {navigationItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className="flex items-center gap-2 py-3 rounded-lg w-full menu-item"
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="size-5" style={{ color: '#7A8084' }}>
                  {getIcon(item.icon)}
                </div>
                <span className="text-lg text-white font-bold">{t((item as any).labelKey)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 单一遮罩（Auth） */}
      {(showRegister || showLogin || showForgot) && (
        <div className="fixed inset-0 z-50" style={{ animation: 'modalFadeIn 180ms ease', backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => { 
          setShowRegister(false); 
          setShowLogin(false); 
          setShowForgot(false); 
          // 清空注册表单
          setRegUsername('');
          setRegEmail('');
          setRegPass('');
          setAgreed(false);
        }} />
      )}

      {/* Register Modal 内容 */}
      {showRegister && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed left-1/2 top-1/2 z-60 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 sm:rounded-lg"
          style={{ backgroundColor: '#1D2125', padding: '1.5rem', boxShadow: '0 10px 40px rgba(0,0,0,0.4)', animation: 'modalZoomIn 180ms ease' }}
        >
          <div className="flex flex-col justify-center items-center pt-2 pb-1">
            <h2 className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>欢迎来到 FlameDraw</h2>
            <p className="text-md" style={{ color: '#9CA3AF' }}>注册以开始</p>
          </div>
          <div className="flex flex-col justify-center px-2 md:px-10">
            <button
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none relative text-base font-bold select-none h-10 px-6"
              style={{ backgroundColor: '#34383C', cursor: agreed ? 'pointer' : 'not-allowed', opacity: agreed ? 1 : 0.8 }}
              disabled={!agreed}
              onClick={() => {
                if (!agreed) return;
                if (enableDevLogin) {
                  signIn('credentials', { email: 'demo@local.test', name: 'Demo User', callbackUrl: '/' });
                } else {
                  signIn('google', { callbackUrl: '/' });
                }
              }}
            >
              <div className="mr-3" style={{ width: 16, height: 16 }}>
                <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.99987 6.54543V9.64362H12.3053C12.1163 10.64 11.5489 11.4837 10.698 12.0509L13.2944 14.0655C14.8071 12.6692 15.6798 10.6182 15.6798 8.18188C15.6798 7.61461 15.6289 7.06911 15.5344 6.54552L7.99987 6.54543Z" fill="#4285F4"></path><path d="M3.51645 9.52268L2.93087 9.97093L0.858112 11.5854C2.17447 14.1963 4.87245 16 7.9997 16C10.1596 16 11.9705 15.2873 13.2942 14.0655L10.6978 12.0509C9.98512 12.5309 9.07602 12.8219 7.9997 12.8219C5.91971 12.8219 4.15249 11.4182 3.51972 9.5273L3.51645 9.52268Z" fill="#34A853"></path><path d="M0.858119 4.41455C0.312695 5.49087 0 6.70543 0 7.99995C0 9.29448 0.312695 10.509 0.858119 11.5854C0.858119 11.5926 3.51998 9.51991 3.51998 9.51991C3.35998 9.03991 3.26541 8.53085 3.26541 7.99987C3.26541 7.46889 3.35998 6.95983 3.51998 6.47984L0.858119 4.41455Z" fill="#FBBC05"></path><path d="M7.99987 3.18545C9.17806 3.18545 10.2253 3.59271 11.0617 4.37818L13.3526 2.0873C11.9635 0.792777 10.1599 0 7.99987 0C4.87262 0 2.17448 1.79636 0.858119 4.41455L3.51989 6.48001C4.15258 4.58908 5.91988 3.18545 7.99987 3.18545Z" fill="#EA4335"></path></svg>
              </div>
              <p style={{ color: agreed ? '#FFFFFF' : '#9CA3AF' }}>使用 Google 登录</p>
            </button>
            <form className="flex flex-col" onSubmit={handleRegister}>
              <div className="space-y-2">
                <div className="flex justify-start items-center gap-2 mt-2">
                  <input id="agree" type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ width: 16, height: 16, accentColor: '#60A5FA' }} />
                  <label className="text-sm space-x-1 font-medium cursor-pointer" style={{ color: '#FFFFFF' }} htmlFor="agree">
                    <span>通过访问网站，我确认我已年满 18 岁并同意</span>
                    <span className="underline cursor-pointer" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowTerms(true); }}>服务条款</span>
                    <span>。</span>
                  </label>
                </div>
              </div>
              {regError && (
                <div className="mt-3 p-3 rounded-md" style={{ backgroundColor: '#FEE2E2' }}>
                  <p className="text-sm" style={{ color: '#DC2626' }}>{regError}</p>
                </div>
              )}
              <div className="flex items-center my-4">
                <div className="flex flex-1" style={{ backgroundColor: '#33363A', height: 1 }}></div>
                <p className="text-base px-3" style={{ color: '#33363A' }}>或</p>
                <div className="flex flex-1" style={{ backgroundColor: '#33363A', height: 1 }}></div>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-base font-medium" htmlFor="reg-username" style={{ color: '#FFFFFF' }}>用户名</label>
                  <input id="reg-username" type="text" autoComplete="username" value={regUsername} onChange={(e) => setRegUsername(e.target.value)} className="flex h-10 w-full rounded-md px-3 py-2 text-base" style={{ backgroundColor: '#3B4248', color: '#FFFFFF', border: 0 }} placeholder="输入用户名" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-base font-medium" htmlFor="reg-email" style={{ color: '#FFFFFF' }}>电子邮件地址</label>
                  <input id="reg-email" type="email" inputMode="email" autoComplete="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className="flex h-10 w-full rounded-md px-3 py-2 text-base" style={{ backgroundColor: '#3B4248', color: '#FFFFFF', border: 0 }} placeholder="name@example.com" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-base font-medium" htmlFor="reg-pass" style={{ color: '#FFFFFF' }}>密码</label>
                  <div className="relative">
                    <input id="reg-pass" type={showPass ? 'text' : 'password'} autoComplete="new-password" value={regPass} onChange={(e) => setRegPass(e.target.value)} onFocus={() => setShowStrength(true)} onBlur={(e) => { if (!e.target.value) setShowStrength(false); }} className="flex h-10 w-full rounded-md pr-10 px-3 py-2 text-base" style={{ backgroundColor: '#3B4248', color: '#FFFFFF', border: 0 }} />
                    <button type="button" onClick={() => setShowPass((v) => !v)} className="inline-flex items-center justify-center absolute right-0 top-0 h-full px-3 text-base font-bold" style={{ color: showPass ? '#FFFFFF' : '#9CA3AF', cursor: 'pointer' }} aria-label={showPass ? '隐藏密码' : '显示密码'}>
                      {showPass ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.58-1.36 1.55-2.73 2.82-3.88M9.9 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.89 11 8-1.05 2.47-2.92 4.57-5.06 5.74"></path><path d="M1 1l22 22"></path></svg>
                      )}
                    </button>
                  </div>
                  {showStrength || regPass ? (
                    <div className="mt-2">
                      <p className="text-sm" style={{ color: '#7A8084' }}>
                        {passwordScore >= 5 ? '这个密码看起来很好！' : passwordScore >= 4 ? '这个密码看起来很好！' : passwordScore >= 3 ? '这个密码看起来不错。' : '选择一个强密码。'}
                      </p>
                      <div className="flex gap-2 mt-2">
                        {(() => {
                          const colors = ['#EF4444', '#F59E0B', '#FBBF24', '#34D399', '#10B981'];
                          return Array.from({ length: 5 }).map((_, idx) => (
                            <div key={idx} className="flex flex-1 h-2 rounded" style={{ backgroundColor: idx < passwordScore ? colors[idx] : '#33363A' }} />
                          ));
                        })()}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="space-y-2 mt-3">
                <div className="flex justify-start items-center gap-2">
                  <input id="agree2" type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ width: 16, height: 16, accentColor: '#60A5FA' }} />
                  <label className="text-sm space-x-1 font-medium cursor-pointer" style={{ color: '#FFFFFF' }} htmlFor="agree2">
                    <span>通过访问网站，我确认我已年满 18 岁并同意</span>
                    <span className="underline cursor-pointer" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowTerms(true); }}>服务条款</span>
                    <span>。</span>
                  </label>
                </div>
              </div>
              <button 
                type="submit"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors relative text-base font-bold select-none h-10 px-6 mt-6" 
                style={{ backgroundColor: '#60A5FA', color: '#FFFFFF', cursor: (canRegister && !regLoading) ? 'pointer' : 'not-allowed', opacity: (canRegister && !regLoading) ? 1 : 0.8 }} 
                disabled={!canRegister || regLoading}
              >
                {regLoading ? '注册中...' : '注册'}
              </button>
            </form>
            <div className="flex flex-row justify-center py-2 gap-1">
              <p className="text-base" style={{ color: '#FFFFFF' }}>已有账户？</p>
              <span className="text-base cursor-pointer" style={{ color: '#4299E1' }} onClick={() => { 
                setShowRegister(false); 
                setShowLogin(true); 
                // 清空注册表单
                setRegUsername('');
                setRegEmail('');
                setRegPass('');
              }}>登录</span>
            </div>
          </div>
        </div>
      )}

      {/* Terms Modal */}
      {showTerms && (
        <div className="fixed inset-0 z-50" style={{ animation: 'modalFadeIn 180ms ease', backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowTerms(false)}>
          <div role="dialog" aria-modal="true" className="fixed left-1/2 top-1/2 z-50 grid w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 sm:rounded-lg" style={{ backgroundColor: '#1D2125', padding: '1.5rem', boxShadow: '0 10px 40px rgba(0,0,0,0.4)', animation: 'modalZoomIn 180ms ease', maxHeight: '80vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold" style={{ color: '#FFFFFF' }}>服务条款</h3>
              <button className="w-8 h-8 rounded" style={{ color: '#9CA3AF' }} onClick={() => setShowTerms(false)} aria-label="关闭">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              </button>
            </div>
            <div className="text-sm" style={{ color: '#CBD5E0' }}>
              <p>这是示例的服务条款内容。您可以在此处放置您的 HTML 文本，包括列表、段落和链接等。</p>
              <p>访问和使用本网站即表示您同意遵守这些条款。请仔细阅读并定期查看更新。</p>
              <ul style={{ paddingLeft: '1.25rem', listStyle: 'disc' }}>
                <li>用户需年满 18 岁。</li>
                <li>不得进行欺诈或违法行为。</li>
                <li>平台保留对内容和服务的解释权。</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal 内容 */}
      {showLogin && (
        <div role="dialog" aria-modal="true" className="fixed left-1/2 top-1/2 z-60 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 sm:rounded-lg" style={{ backgroundColor: '#1D2125', padding: '1.5rem', boxShadow: '0 10px 40px rgba(0,0,0,0.4)', animation: 'modalZoomIn 180ms ease' }}>
          <div className="flex flex-col justify-center items-center pt-2 pb-1">
            <h2 className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>欢迎回来</h2>
            <p className="text-md" style={{ color: '#9CA3AF' }}>登录以访问您的账户</p>
          </div>
          <div className="flex flex-col justify-center px-2 md:px-10">
            <button
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none relative text-base font-bold select-none h-10 px-6 mt-4 mb-2"
              style={{ backgroundColor: '#34383C', cursor: agreed ? 'pointer' : 'not-allowed', opacity: agreed ? 1 : 0.8 }}
              disabled={!agreed}
              onClick={() => {
                if (!agreed) return;
                if (enableDevLogin) {
                  signIn('credentials', { email: 'demo@local.test', name: 'Demo User', callbackUrl: '/' });
                } else {
                  signIn('google', { callbackUrl: '/' });
                }
              }}
            >
              <div className="mr-3" style={{ width: 16, height: 16 }}>
                <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.99987 6.54543V9.64362H12.3053C12.1163 10.64 11.5489 11.4837 10.698 12.0509L13.2944 14.0655C14.8071 12.6692 15.6798 10.6182 15.6798 8.18188C15.6798 7.61461 15.6289 7.06911 15.5344 6.54552L7.99987 6.54543Z" fill="#4285F4"></path><path d="M3.51645 9.52268L2.93087 9.97093L0.858112 11.5854C2.17447 14.1963 4.87245 16 7.9997 16C10.1596 16 11.9705 15.2873 13.2942 14.0655L10.6978 12.0509C9.98512 12.5309 9.07602 12.8219 7.9997 12.8219C5.91971 12.8219 4.15249 11.4182 3.51972 9.5273L3.51645 9.52268Z" fill="#34A853"></path><path d="M0.858119 4.41455C0.312695 5.49087 0 6.70543 0 7.99995C0 9.29448 0.312695 10.509 0.858119 11.5854C0.858119 11.5926 3.51998 9.51991 3.51998 9.51991C3.35998 9.03991 3.26541 8.53085 3.26541 7.99987C3.26541 7.46889 3.35998 6.95983 3.51998 6.47984L0.858119 4.41455Z" fill="#FBBC05"></path><path d="M7.99987 3.18545C9.17806 3.18545 10.2253 3.59271 11.0617 4.37818L13.3526 2.0873C11.9635 0.792777 10.1599 0 7.99987 0C4.87262 0 2.17448 1.79636 0.858119 4.41455L3.51989 6.48001C4.15258 4.58908 5.91988 3.18545 7.99987 3.18545Z" fill="#EA4335"></path></svg>
              </div>
              <p style={{ color: agreed ? '#FFFFFF' : '#9CA3AF' }}>使用 Google 登录</p>
            </button>
            <div className="flex justify-start items-center gap-2">
              <input id="login-agree" type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ width: 16, height: 16, accentColor: '#60A5FA' }} />
              <label className="text-sm space-x-1 font-medium cursor-pointer" style={{ color: '#FFFFFF' }} htmlFor="login-agree">
                <span>通过访问网站，我确认我已年满 18 岁并同意</span>
                <span className="underline cursor-pointer" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowTerms(true); }}>服务条款</span>
                <span>。</span>
              </label>
            </div>
            <div className="flex items-center my-4">
              <div className="flex flex-1" style={{ backgroundColor: '#33363A', height: 1 }}></div>
              <p className="text-base px-3 italic" style={{ color: '#33363A' }}>或</p>
              <div className="flex flex-1" style={{ backgroundColor: '#33363A', height: 1 }}></div>
            </div>
            <form className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-base font-medium" htmlFor="login-email" style={{ color: '#FFFFFF' }}>电子邮件地址</label>
                <input id="login-email" type="email" inputMode="email" autoComplete="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="flex h-10 w-full rounded-md px-3 py-2 text-base" style={{ backgroundColor: '#3B4248', color: '#FFFFFF', border: 0 }} placeholder="name@example.com" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-base font-medium" htmlFor="login-pass" style={{ color: '#FFFFFF' }}>密码</label>
                <div className="relative">
                  <input id="login-pass" type={loginShowPass ? 'text' : 'password'} autoComplete="current-password" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} className="flex h-10 w-full rounded-md pr-10 px-3 py-2 text-base" style={{ backgroundColor: '#3B4248', color: '#FFFFFF', border: 0 }} />
                  <button type="button" onClick={() => setLoginShowPass((v) => !v)} className="inline-flex items-center justify-center absolute right-0 top-0 h-full px-3 text-base font-bold" style={{ color: loginShowPass ? '#FFFFFF' : '#9CA3AF', cursor: 'pointer' }} aria-label={loginShowPass ? '隐藏密码' : '显示密码'}>
                    {loginShowPass ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.58-1.36 1.55-2.73 2.82-3.88M9.9 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.89 11 8-1.05 2.47-2.92 4.57-5.06 5.74"></path><path d="M1 1l22 22"></path></svg>
                    )}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={loginRemember} onChange={(e) => setLoginRemember(e.target.checked)} style={{ width: 16, height: 16, accentColor: '#60A5FA' }} />
                  <span className="text-base" style={{ color: '#FFFFFF' }}>保持登录</span>
                </label>
                <span className="text-base cursor-pointer" style={{ color: '#4299E1' }} onClick={() => { setShowLogin(false); setShowForgot(true); }}>忘记密码？</span>
              </div>
              <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors relative text-base font-bold select-none h-10 px-6" style={{ backgroundColor: '#60A5FA', color: '#FFFFFF', cursor: loginCanSubmit ? 'pointer' : 'not-allowed', opacity: loginCanSubmit ? 1 : 0.8 }} disabled={!loginCanSubmit}>登录</button>
            </form>
          </div>
          <div className="flex flex-row justify-center py-2 gap-1">
            <p className="text-base" style={{ color: '#FFFFFF' }}>还没有账户？</p>
            <span className="text-base cursor-pointer" style={{ color: '#4299E1' }} onClick={() => { setShowLogin(false); setShowRegister(true); }}>注册</span>
          </div>
        </div>
      )}

      {/* Forgot Password 内容 */}
      {showForgot && (
        <div role="dialog" aria-modal="true" className="fixed left-1/2 top-1/2 z-60 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 sm:rounded-lg" style={{ backgroundColor: '#1D2125', padding: '1.5rem', boxShadow: '0 10px 40px rgba(0,0,0,0.4)', animation: 'modalZoomIn 180ms ease' }}>
          <div className="flex flex-col justify-center items-center pt-2 pb-1">
            <h2 className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>忘记密码？</h2>
            <p className="text-md" style={{ color: '#9CA3AF' }}>请求密码重置说明</p>
          </div>
          <div className="flex flex-col justify-center px-2 md:px-10">
            <div className="flex flex-col gap-2">
              <label className="text-base font-medium" htmlFor="forgot-email" style={{ color: '#FFFFFF' }}>电子邮件地址</label>
              <input id="forgot-email" type="email" inputMode="email" autoComplete="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className="flex h-10 w-full rounded-md px-3 py-2 text-base" style={{ backgroundColor: '#3B4248', color: '#FFFFFF', border: 0 }} placeholder="name@example.com" />
            </div>
            <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors relative text-base font-bold select-none h-10 px-6 mt-4" style={{ backgroundColor: '#60A5FA', color: '#FFFFFF', cursor: forgotEmailValid ? 'pointer' : 'not-allowed', opacity: forgotEmailValid ? 1 : 0.8 }} disabled={!forgotEmailValid}>重置密码</button>
          </div>
          <div className="flex flex-row justify-center py-2 gap-1">
            <p className="text-base" style={{ color: '#FFFFFF' }}>还没有账户？</p>
            <span className="text-base cursor-pointer" style={{ color: '#4299E1' }} onClick={() => { setShowForgot(false); setShowRegister(true); }}>注册</span>
          </div>
        </div>
      )}
      <CartModal isOpen={showCart} onClose={() => setShowCart(false)} totalPrice={1.38} />
    </div>
  );
}
