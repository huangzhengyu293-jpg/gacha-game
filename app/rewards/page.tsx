'use client';
import { useI18n } from '../components/I18nProvider';
import LiveFeedElement from '../components/LiveFeedElement';
import LiveFeedTicker from '../components/LiveFeedTicker';

export default function RewardsPage() {
  const { t } = useI18n();
  return (
    <div className="w-full px-4 sm:px-6 md:px-8 pb-12" style={{ paddingLeft: 'max(env(safe-area-inset-left, 0px), 16px)', paddingRight: 'max(env(safe-area-inset-right, 0px), 16px)' }}>
      <div className="flex gap-8 max-w-[1248px] mx-auto">
        <div className="flex flex-1 items-stretch gap-6" style={{ width: 'calc(100% - 16rem)' }}>
          <div className="flex flex-col flex-1 items-stretch max-w-full pb-48">
            <div className="flex flex-col w-full  pb-20 gap-10">
              <div className="flex flex-col w-full gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {/* 每日奖励卡片 */}
                  <div className="flex justify-center items-center rounded-2xl px-6 py-6 bg-reward-card-highlight" style={{ backgroundColor: '#22272b' }}>
                    <div className="flex flex-col items-center gap-4 sm:max-w-60">
                      <div className="flex size-12 sm:size-14 rounded-2xl items-center justify-center" style={{ backgroundColor: '#292f34' }}>
                        <div className="size-7 sm:size-8" style={{ color: '#4299e1' }}>
                          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4.71275 11.4188L9.02206 14.7441C9.80906 15.3514 10.9413 15.1941 11.5329 14.3952L16.0886 8.24305L20.6561 14.4111C21.2384 15.1975 22.3474 15.3642 23.1352 14.7839L27.7528 11.3826L25.331 26.0999H6.86021L4.71275 11.4188Z" stroke="currentColor" strokeWidth="1.8"></path>
                            <ellipse cx="15.9225" cy="3.46154" rx="1.96154" ry="1.96154" fill="currentColor"></ellipse>
                            <path d="M5.46094 21.4421H26.384" stroke="currentColor" strokeWidth="1.8"></path>
                          </svg>
                        </div>
                      </div>
                      <div className="flex flex-col items-center w-full gap-2">
                        <p className="text-base text-white text-center font-extrabold leading-tight">每日奖励</p>
                        <p className="text-base text-center font-semibold leading-tight" style={{ color: '#7a8084' }}>领取您昨天游戏的奖励！</p>
                      </div>
                      <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative text-base text-white font-bold hover:opacity-90 disabled:text-blue-600 select-none h-10 px-6 w-48 sm:w-40 md:w-48" style={{ backgroundColor: '#4299e1' }}>
                        <span className="text-sm text-white font-bold">登录以领取</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* 每周奖励卡片 */}
                  <div className="flex justify-center items-center rounded-2xl px-6 py-6 bg-reward-card-highlight" style={{ backgroundColor: '#22272b' }}>
                    <div className="flex flex-col items-center gap-4 sm:max-w-60">
                      <div className="flex size-12 sm:size-14 rounded-2xl items-center justify-center" style={{ backgroundColor: '#292f34' }}>
                        <div className="size-7 sm:size-8" style={{ color: '#4299e1' }}>
                          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M16.1283 8.64702L12.594 12.2487C12.0249 12.8286 12.4358 13.8074 13.2483 13.8074H14.4409C14.9472 13.8074 15.3576 14.2178 15.3576 14.724V16.9573C15.3576 17.7916 16.3816 18.1922 16.9476 17.5792L20.1811 14.0783C20.7233 13.4911 20.3069 12.5396 19.5077 12.5396H18.6159C18.1097 12.5396 17.6993 12.1292 17.6993 11.623V9.28905C17.6993 8.46821 16.7032 8.06114 16.1283 8.64702Z" fill="currentColor"></path>
                            <path d="M26.3231 12.8889C26.3231 18.4056 21.8509 22.8778 16.3342 22.8778C10.8175 22.8778 6.34531 18.4056 6.34531 12.8889C6.34531 7.37218 10.8175 2.9 16.3342 2.9C21.8509 2.9 26.3231 7.37218 26.3231 12.8889Z" stroke="currentColor" strokeWidth="1.8"></path>
                            <path d="M9.33398 19.1111V28.4572C9.33398 29.1527 10.0781 29.5948 10.689 29.2623L15.8957 26.4275C16.1689 26.2787 16.499 26.2787 16.7723 26.4275L21.979 29.2623C22.5898 29.5948 23.334 29.1527 23.334 28.4572V19.1111" stroke="currentColor" strokeWidth="1.8"></path>
                          </svg>
                        </div>
                      </div>
                      <div className="flex flex-col items-center w-full gap-2">
                        <p className="text-base text-white text-center font-extrabold leading-tight">每周奖励</p>
                        <p className="text-base text-center font-semibold leading-tight" style={{ color: '#7a8084' }}>领取您过去 7 天游戏的奖励！</p>
                      </div>
                      <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative text-base text-white font-bold hover:opacity-90 disabled:text-blue-600 select-none h-10 px-6 w-48 sm:w-40 md:w-48" style={{ backgroundColor: '#4299e1' }}>
                        <span className="text-sm text-white font-bold">登录以领取</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* 每月奖励卡片 */}
                  <div className="flex justify-center items-center rounded-2xl px-6 py-6 bg-reward-card-highlight" style={{ backgroundColor: '#22272b' }}>
                    <div className="flex flex-col items-center gap-4 sm:max-w-60">
                      <div className="flex size-12 sm:size-14 rounded-2xl items-center justify-center" style={{ backgroundColor: '#292f34' }}>
                        <div className="size-7 sm:size-8" style={{ color: '#4299e1' }}>
                          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15.8708 7.53526L11.8303 11.6528C11.4763 12.0135 11.7318 12.6223 12.2372 12.6223H14.171C14.4859 12.6223 14.7412 12.8775 14.7412 13.1924V16.1068C14.7412 16.6258 15.3781 16.8749 15.7302 16.4937L19.4752 12.4387C19.8125 12.0736 19.5535 11.4818 19.0564 11.4818H17.418C17.1032 11.4818 16.8479 11.2265 16.8479 10.9116V7.93459C16.8479 7.42404 16.2284 7.17086 15.8708 7.53526Z" fill="currentColor"></path>
                            <path d="M24.5613 11.7962C24.5613 16.7341 20.5583 20.7371 15.6204 20.7371C10.6824 20.7371 6.67944 16.7341 6.67944 11.7962C6.67944 6.85821 10.6824 2.85522 15.6204 2.85522C20.5583 2.85522 24.5613 6.85821 24.5613 11.7962Z" stroke="currentColor" strokeWidth="1.71044"></path>
                            <path d="M8.16211 16.9902L5.52963 25.0982C5.37762 25.5664 5.84301 26.0158 6.289 25.8314L9.3466 24.5676C9.6089 24.4592 9.91496 24.572 10.0583 24.83L11.7349 27.8465C11.9778 28.2835 12.6016 28.2389 12.7561 27.7736L15.2728 20.1928" stroke="currentColor" strokeWidth="1.71044"></path>
                            <path d="M23.1113 16.9902L25.7438 25.0982C25.8958 25.5664 25.4304 26.0158 24.9844 25.8314L21.9268 24.5676C21.6645 24.4592 21.3585 24.572 21.2151 24.83L19.5361 27.8509C19.2936 28.2872 18.6711 28.2436 18.5155 27.7795L15.9719 20.1928" stroke="currentColor" strokeWidth="1.71044"></path>
                          </svg>
                        </div>
                      </div>
                      <div className="flex flex-col items-center w-full gap-2">
                        <p className="text-base text-white text-center font-extrabold leading-tight">每月奖励</p>
                        <p className="text-base text-center font-semibold leading-tight" style={{ color: '#7a8084' }}>领取您过去 30 天游戏的奖励！</p>
                      </div>
                      <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative text-base text-white font-bold hover:opacity-90 disabled:text-blue-600 select-none h-10 px-6 w-48 sm:w-40 md:w-48" style={{ backgroundColor: '#4299e1' }}>
                        <span className="text-sm text-white font-bold">登录以领取</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Free Packs 组件 */}
              <div className="flex flex-col w-full gap-4">
                <h2 className="flex gap-2 items-center text-xl text-white font-extrabold mt-4">
                  <div className="size-6 text-gray-400">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 4.15385L4 16.8462C4 17.4834 4.70355 18 5.57143 18L13.4286 18C14.2964 18 15 17.4834 15 16.8462L15 4.15385C15 3.5166 14.2964 3 13.4286 3L5.57143 3C4.70355 3 4 3.5166 4 4.15385Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
                      <path d="M8.08771 19.0127C7.98916 19.5993 8.54002 20.1807 9.3181 20.3115L16.3622 21.495C17.1403 21.6257 17.8509 21.2562 17.9495 20.6697L19.9123 8.98725C20.0109 8.4007 19.46 7.81924 18.6819 7.68851L15.1599 7.09675" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                  </div>
                  Free Packs
                </h2>
                <div className="grid grid-cols-2 xxs:grid-cols-3 xs:grid-cols-4 md:grid-cols-5 gap-4">
                  {/* 免费等级 2 */}
                  <div>
                    <div className="relative">
                      <a className="flex relative rounded-lg" href="/zh/rewards/cmfx9nwzu0000l10hv4c6aexn">
                        <img 
                          alt="pack" 
                          loading="lazy" 
                          width={200} 
                          height={304} 
                          decoding="async" 
                          srcSet="https://ik.imagekit.io/hr727kunx/packs/cljq2c8gz0eb6oo5c502nz9vi_735659__mZ42HbLiu?tr=w-256,c-at_max 1x, https://ik.imagekit.io/hr727kunx/packs/cljq2c8gz0eb6oo5c502nz9vi_735659__mZ42HbLiu?tr=w-640,c-at_max 2x" 
                          src="https://ik.imagekit.io/hr727kunx/packs/cljq2c8gz0eb6oo5c502nz9vi_735659__mZ42HbLiu?tr=w-640,c-at_max" 
                          style={{ color: 'transparent', height: 'auto', width: '100%', cursor: 'pointer' }}
                        />
                      </a>
                      <div className="flex justify-center pt-3 pb-4">
                        <div className="font-bold text-md">
                          <div className="flex gap-2 items-center">
                            <div className="flex justify-center" style={{ height: '18px', width: '18px' }}>
                              <svg viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8.00065 11.8333C8.36884 11.8333 8.66732 11.5349 8.66732 11.1667C8.66732 10.7985 8.36884 10.5 8.00065 10.5C7.63246 10.5 7.33398 10.7985 7.33398 11.1667C7.33398 11.5349 7.63246 11.8333 8.00065 11.8333Z" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                                <path d="M12.6667 7.16663H3.33333C2.59695 7.16663 2 7.76358 2 8.49996V13.8333C2 14.5697 2.59695 15.1666 3.33333 15.1666H12.6667C13.403 15.1666 14 14.5697 14 13.8333V8.49996C14 7.76358 13.403 7.16663 12.6667 7.16663Z" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                                <path d="M4.66602 7.16671V5.16671C4.66602 4.28265 5.01721 3.43481 5.64233 2.80968C6.26745 2.18456 7.11529 1.83337 7.99935 1.83337C8.8834 1.83337 9.73125 2.18456 10.3564 2.80968C10.9815 3.43481 11.3327 4.28265 11.3327 5.16671V7.16671" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                              </svg>
                            </div>
                            <p className="text-base text-white font-extrabold">免费等级 2</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 免费等级 10 */}
                  <div>
                    <div className="relative">
                      <a className="flex relative rounded-lg" href="/zh/rewards/cmfyr656z0000l50gh2s236wu">
                        <img 
                          alt="pack" 
                          loading="lazy" 
                          width={200} 
                          height={304} 
                          decoding="async" 
                          srcSet="https://ik.imagekit.io/hr727kunx/packs/cljq2k51i11kyoo5cpp9qadzu_6340085__aogsvXFJA?tr=w-256,c-at_max 1x, https://ik.imagekit.io/hr727kunx/packs/cljq2k51i11kyoo5cpp9qadzu_6340085__aogsvXFJA?tr=w-640,c-at_max 2x" 
                          src="https://ik.imagekit.io/hr727kunx/packs/cljq2k51i11kyoo5cpp9qadzu_6340085__aogsvXFJA?tr=w-640,c-at_max" 
                          style={{ color: 'transparent', height: 'auto', width: '100%', cursor: 'pointer' }}
                        />
                      </a>
                      <div className="flex justify-center pt-3 pb-4">
                        <div className="font-bold text-md">
                          <div className="flex gap-2 items-center">
                            <div className="flex justify-center" style={{ height: '18px', width: '18px' }}>
                              <svg viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8.00065 11.8333C8.36884 11.8333 8.66732 11.5349 8.66732 11.1667C8.66732 10.7985 8.36884 10.5 8.00065 10.5C7.63246 10.5 7.33398 10.7985 7.33398 11.1667C7.33398 11.5349 7.63246 11.8333 8.00065 11.8333Z" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                                <path d="M12.6667 7.16663H3.33333C2.59695 7.16663 2 7.76358 2 8.49996V13.8333C2 14.5697 2.59695 15.1666 3.33333 15.1666H12.6667C13.403 15.1666 14 14.5697 14 13.8333V8.49996C14 7.76358 13.403 7.16663 12.6667 7.16663Z" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                                <path d="M4.66602 7.16671V5.16671C4.66602 4.28265 5.01721 3.43481 5.64233 2.80968C6.26745 2.18456 7.11529 1.83337 7.99935 1.83337C8.8834 1.83337 9.73125 2.18456 10.3564 2.80968C10.9815 3.43481 11.3327 4.28265 11.3327 5.16671V7.16671" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                              </svg>
                            </div>
                            <p className="text-base text-white font-extrabold">免费等级 10</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 免费等级 20 */}
                  <div>
                    <div className="relative">
                      <a className="flex relative rounded-lg" href="/zh/rewards/cmekcf1dg0000js0fbkvdkf92">
                        <img 
                          alt="pack" 
                          loading="lazy" 
                          width={200} 
                          height={304} 
                          decoding="async" 
                          srcSet="https://ik.imagekit.io/hr727kunx/packs/cljq2k2ir11g8oo5c1r3bsebr_714342___aWf_wl7J?tr=w-256,c-at_max 1x, https://ik.imagekit.io/hr727kunx/packs/cljq2k2ir11g8oo5c1r3bsebr_714342___aWf_wl7J?tr=w-640,c-at_max 2x" 
                          src="https://ik.imagekit.io/hr727kunx/packs/cljq2k2ir11g8oo5c1r3bsebr_714342___aWf_wl7J?tr=w-640,c-at_max" 
                          style={{ color: 'transparent', height: 'auto', width: '100%', cursor: 'pointer' }}
                        />
                      </a>
                      <div className="flex justify-center pt-3 pb-4">
                        <div className="font-bold text-md">
                          <div className="flex gap-2 items-center">
                            <div className="flex justify-center" style={{ height: '18px', width: '18px' }}>
                              <svg viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8.00065 11.8333C8.36884 11.8333 8.66732 11.5349 8.66732 11.1667C8.66732 10.7985 8.36884 10.5 8.00065 10.5C7.63246 10.5 7.33398 10.7985 7.33398 11.1667C7.33398 11.5349 7.63246 11.8333 8.00065 11.8333Z" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                                <path d="M12.6667 7.16663H3.33333C2.59695 7.16663 2 7.76358 2 8.49996V13.8333C2 14.5697 2.59695 15.1666 3.33333 15.1666H12.6667C13.403 15.1666 14 14.5697 14 13.8333V8.49996C14 7.76358 13.403 7.16663 12.6667 7.16663Z" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                                <path d="M4.66602 7.16671V5.16671C4.66602 4.28265 5.01721 3.43481 5.64233 2.80968C6.26745 2.18456 7.11529 1.83337 7.99935 1.83337C8.8834 1.83337 9.73125 2.18456 10.3564 2.80968C10.9815 3.43481 11.3327 4.28265 11.3327 5.16671V7.16671" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                              </svg>
                            </div>
                            <p className="text-base text-white font-extrabold">免费等级 20</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 免费等级 30 */}
                  <div>
                    <div className="relative">
                      <a className="flex relative rounded-lg" href="/zh/rewards/cluahcv28007mjw13fq8c5wrq">
                        <img 
                          alt="pack" 
                          loading="lazy" 
                          width={200} 
                          height={304} 
                          decoding="async" 
                          srcSet="https://ik.imagekit.io/hr727kunx/packs/cljq2cflb0ekaoo5cac9e3583_7432446__swwaouq4j?tr=w-256,c-at_max 1x, https://ik.imagekit.io/hr727kunx/packs/cljq2cflb0ekaoo5cac9e3583_7432446__swwaouq4j?tr=w-640,c-at_max 2x" 
                          src="https://ik.imagekit.io/hr727kunx/packs/cljq2cflb0ekaoo5cac9e3583_7432446__swwaouq4j?tr=w-640,c-at_max" 
                          style={{ color: 'transparent', height: 'auto', width: '100%', cursor: 'pointer' }}
                        />
                      </a>
                      <div className="flex justify-center pt-3 pb-4">
                        <div className="font-bold text-md">
                          <div className="flex gap-2 items-center">
                            <div className="flex justify-center" style={{ height: '18px', width: '18px' }}>
                              <svg viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8.00065 11.8333C8.36884 11.8333 8.66732 11.5349 8.66732 11.1667C8.66732 10.7985 8.36884 10.5 8.00065 10.5C7.63246 10.5 7.33398 10.7985 7.33398 11.1667C7.33398 11.5349 7.63246 11.8333 8.00065 11.8333Z" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                                <path d="M12.6667 7.16663H3.33333C2.59695 7.16663 2 7.76358 2 8.49996V13.8333C2 14.5697 2.59695 15.1666 3.33333 15.1666H12.6667C13.403 15.1666 14 14.5697 14 13.8333V8.49996C14 7.76358 13.403 7.16663 12.6667 7.16663Z" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                                <path d="M4.66602 7.16671V5.16671C4.66602 4.28265 5.01721 3.43481 5.64233 2.80968C6.26745 2.18456 7.11529 1.83337 7.99935 1.83337C8.8834 1.83337 9.73125 2.18456 10.3564 2.80968C10.9815 3.43481 11.3327 4.28265 11.3327 5.16671V7.16671" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                              </svg>
                            </div>
                            <p className="text-base text-white font-extrabold">免费等级 30</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 免费等级 40 */}
                  <div>
                    <div className="relative">
                      <a className="flex relative rounded-lg" href="/zh/rewards/cmgl5aadl0000l50g0ccpoqte">
                        <img 
                          alt="pack" 
                          loading="lazy" 
                          width={200} 
                          height={304} 
                          decoding="async" 
                          srcSet="https://ik.imagekit.io/hr727kunx/packs/cljq2c7bi0e9ioo5ceagylvsc_2422160__V9jceX3yc?tr=w-256,c-at_max 1x, https://ik.imagekit.io/hr727kunx/packs/cljq2c7bi0e9ioo5ceagylvsc_2422160__V9jceX3yc?tr=w-640,c-at_max 2x" 
                          src="https://ik.imagekit.io/hr727kunx/packs/cljq2c7bi0e9ioo5ceagylvsc_2422160__V9jceX3yc?tr=w-640,c-at_max" 
                          style={{ color: 'transparent', height: 'auto', width: '100%', cursor: 'pointer' }}
                        />
                      </a>
                      <div className="flex justify-center pt-3 pb-4">
                        <div className="font-bold text-md">
                          <div className="flex gap-2 items-center">
                            <div className="flex justify-center" style={{ height: '18px', width: '18px' }}>
                              <svg viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8.00065 11.8333C8.36884 11.8333 8.66732 11.5349 8.66732 11.1667C8.66732 10.7985 8.36884 10.5 8.00065 10.5C7.63246 10.5 7.33398 10.7985 7.33398 11.1667C7.33398 11.5349 7.63246 11.8333 8.00065 11.8333Z" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                                <path d="M12.6667 7.16663H3.33333C2.59695 7.16663 2 7.76358 2 8.49996V13.8333C2 14.5697 2.59695 15.1666 3.33333 15.1666H12.6667C13.403 15.1666 14 14.5697 14 13.8333V8.49996C14 7.76358 13.403 7.16663 12.6667 7.16663Z" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                                <path d="M4.66602 7.16671V5.16671C4.66602 4.28265 5.01721 3.43481 5.64233 2.80968C6.26745 2.18456 7.11529 1.83337 7.99935 1.83337C8.8834 1.83337 9.73125 2.18456 10.3564 2.80968C10.9815 3.43481 11.3327 4.28265 11.3327 5.16671V7.16671" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                              </svg>
                            </div>
                            <p className="text-base text-white font-extrabold">免费等级 40</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 免费等级 50 */}
                  <div>
                    <div className="relative">
                      <a className="flex relative rounded-lg" href="/zh/rewards/cmgl3i2l80005jx0frd58863h">
                        <img 
                          alt="pack" 
                          loading="lazy" 
                          width={200} 
                          height={304} 
                          decoding="async" 
                          srcSet="https://ik.imagekit.io/hr727kunx/packs/cljq27qeh002soo5ckvvxquaj_5893402__HdeBpCLOS?tr=w-256,c-at_max 1x, https://ik.imagekit.io/hr727kunx/packs/cljq27qeh002soo5ckvvxquaj_5893402__HdeBpCLOS?tr=w-640,c-at_max 2x" 
                          src="https://ik.imagekit.io/hr727kunx/packs/cljq27qeh002soo5ckvvxquaj_5893402__HdeBpCLOS?tr=w-640,c-at_max" 
                          style={{ color: 'transparent', height: 'auto', width: '100%', cursor: 'pointer' }}
                        />
                      </a>
                      <div className="flex justify-center pt-3 pb-4">
                        <div className="font-bold text-md">
                          <div className="flex gap-2 items-center">
                            <div className="flex justify-center" style={{ height: '18px', width: '18px' }}>
                              <svg viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8.00065 11.8333C8.36884 11.8333 8.66732 11.5349 8.66732 11.1667C8.66732 10.7985 8.36884 10.5 8.00065 10.5C7.63246 10.5 7.33398 10.7985 7.33398 11.1667C7.33398 11.5349 7.63246 11.8333 8.00065 11.8333Z" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                                <path d="M12.6667 7.16663H3.33333C2.59695 7.16663 2 7.76358 2 8.49996V13.8333C2 14.5697 2.59695 15.1666 3.33333 15.1666H12.6667C13.403 15.1666 14 14.5697 14 13.8333V8.49996C14 7.76358 13.403 7.16663 12.6667 7.16663Z" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                                <path d="M4.66602 7.16671V5.16671C4.66602 4.28265 5.01721 3.43481 5.64233 2.80968C6.26745 2.18456 7.11529 1.83337 7.99935 1.83337C8.8834 1.83337 9.73125 2.18456 10.3564 2.80968C10.9815 3.43481 11.3327 4.28265 11.3327 5.16671V7.16671" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                              </svg>
                            </div>
                            <p className="text-base text-white font-extrabold">免费等级 50</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 免费等级 60 */}
                  <div>
                    <div className="relative">
                      <a className="flex relative rounded-lg" href="/zh/rewards/cmgl5d6910009l50gq1zlavfe">
                        <img 
                          alt="pack" 
                          loading="lazy" 
                          width={200} 
                          height={304} 
                          decoding="async" 
                          srcSet="https://ik.imagekit.io/hr727kunx/packs/cljq27oai0000oo5cyvygrjbq_8517038__sY1aPuzHU?tr=w-256,c-at_max 1x, https://ik.imagekit.io/hr727kunx/packs/cljq27oai0000oo5cyvygrjbq_8517038__sY1aPuzHU?tr=w-640,c-at_max 2x" 
                          src="https://ik.imagekit.io/hr727kunx/packs/cljq27oai0000oo5cyvygrjbq_8517038__sY1aPuzHU?tr=w-640,c-at_max" 
                          style={{ color: 'transparent', height: 'auto', width: '100%', cursor: 'pointer' }}
                        />
                      </a>
                      <div className="flex justify-center pt-3 pb-4">
                        <div className="font-bold text-md">
                          <div className="flex gap-2 items-center">
                            <div className="flex justify-center" style={{ height: '18px', width: '18px' }}>
                              <svg viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8.00065 11.8333C8.36884 11.8333 8.66732 11.5349 8.66732 11.1667C8.66732 10.7985 8.36884 10.5 8.00065 10.5C7.63246 10.5 7.33398 10.7985 7.33398 11.1667C7.33398 11.5349 7.63246 11.8333 8.00065 11.8333Z" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                                <path d="M12.6667 7.16663H3.33333C2.59695 7.16663 2 7.76358 2 8.49996V13.8333C2 14.5697 2.59695 15.1666 3.33333 15.1666H12.6667C13.403 15.1666 14 14.5697 14 13.8333V8.49996C14 7.76358 13.403 7.16663 12.6667 7.16663Z" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                                <path d="M4.66602 7.16671V5.16671C4.66602 4.28265 5.01721 3.43481 5.64233 2.80968C6.26745 2.18456 7.11529 1.83337 7.99935 1.83337C8.8834 1.83337 9.73125 2.18456 10.3564 2.80968C10.9815 3.43481 11.3327 4.28265 11.3327 5.16671V7.16671" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                              </svg>
                            </div>
                            <p className="text-base text-white font-extrabold">免费等级 60</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 免费等级 70 */}
                  <div>
                    <div className="relative">
                      <a className="flex relative rounded-lg" href="/zh/rewards/cmgl5sqgt0000l90hzf7yxj10">
                        <img 
                          alt="pack" 
                          loading="lazy" 
                          width={200} 
                          height={304} 
                          decoding="async" 
                          srcSet="https://ik.imagekit.io/hr727kunx/packs/cljq2jy0h113yoo5cauj0gjn3_774052__Ia6taUKG-?tr=w-256,c-at_max 1x, https://ik.imagekit.io/hr727kunx/packs/cljq2jy0h113yoo5cauj0gjn3_774052__Ia6taUKG-?tr=w-640,c-at_max 2x" 
                          src="https://ik.imagekit.io/hr727kunx/packs/cljq2jy0h113yoo5cauj0gjn3_774052__Ia6taUKG-?tr=w-640,c-at_max" 
                          style={{ color: 'transparent', height: 'auto', width: '100%', cursor: 'pointer' }}
                        />
                      </a>
                      <div className="flex justify-center pt-3 pb-4">
                        <div className="font-bold text-md">
                          <div className="flex gap-2 items-center">
                            <div className="flex justify-center" style={{ height: '18px', width: '18px' }}>
                              <svg viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8.00065 11.8333C8.36884 11.8333 8.66732 11.5349 8.66732 11.1667C8.66732 10.7985 8.36884 10.5 8.00065 10.5C7.63246 10.5 7.33398 10.7985 7.33398 11.1667C7.33398 11.5349 7.63246 11.8333 8.00065 11.8333Z" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                                <path d="M12.6667 7.16663H3.33333C2.59695 7.16663 2 7.76358 2 8.49996V13.8333C2 14.5697 2.59695 15.1666 3.33333 15.1666H12.6667C13.403 15.1666 14 14.5697 14 13.8333V8.49996C14 7.76358 13.403 7.16663 12.6667 7.16663Z" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                                <path d="M4.66602 7.16671V5.16671C4.66602 4.28265 5.01721 3.43481 5.64233 2.80968C6.26745 2.18456 7.11529 1.83337 7.99935 1.83337C8.8834 1.83337 9.73125 2.18456 10.3564 2.80968C10.9815 3.43481 11.3327 4.28265 11.3327 5.16671V7.16671" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                              </svg>
                            </div>
                            <p className="text-base text-white font-extrabold">免费等级 70</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 免费等级 80 */}
                  <div>
                    <div className="relative">
                      <a className="flex relative rounded-lg" href="/zh/rewards/cmgmgrglf0000l80gv7m17h5t">
                        <img 
                          alt="pack" 
                          loading="lazy" 
                          width={200} 
                          height={304} 
                          decoding="async" 
                          srcSet="https://ik.imagekit.io/hr727kunx/packs/cljq2cgqr0em0oo5c3n63yps4_5153854__2nIrIEfwk?tr=w-256,c-at_max 1x, https://ik.imagekit.io/hr727kunx/packs/cljq2cgqr0em0oo5c3n63yps4_5153854__2nIrIEfwk?tr=w-640,c-at_max 2x" 
                          src="https://ik.imagekit.io/hr727kunx/packs/cljq2cgqr0em0oo5c3n63yps4_5153854__2nIrIEfwk?tr=w-640,c-at_max" 
                          style={{ color: 'transparent', height: 'auto', width: '100%', cursor: 'pointer' }}
                        />
                      </a>
                      <div className="flex justify-center pt-3 pb-4">
                        <div className="font-bold text-md">
                          <div className="flex gap-2 items-center">
                            <div className="flex justify-center" style={{ height: '18px', width: '18px' }}>
                              <svg viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8.00065 11.8333C8.36884 11.8333 8.66732 11.5349 8.66732 11.1667C8.66732 10.7985 8.36884 10.5 8.00065 10.5C7.63246 10.5 7.33398 10.7985 7.33398 11.1667C7.33398 11.5349 7.63246 11.8333 8.00065 11.8333Z" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                                <path d="M12.6667 7.16663H3.33333C2.59695 7.16663 2 7.76358 2 8.49996V13.8333C2 14.5697 2.59695 15.1666 3.33333 15.1666H12.6667C13.403 15.1666 14 14.5697 14 13.8333V8.49996C14 7.76358 13.403 7.16663 12.6667 7.16663Z" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                                <path d="M4.66602 7.16671V5.16671C4.66602 4.28265 5.01721 3.43481 5.64233 2.80968C6.26745 2.18456 7.11529 1.83337 7.99935 1.83337C8.8834 1.83337 9.73125 2.18456 10.3564 2.80968C10.9815 3.43481 11.3327 4.28265 11.3327 5.16671V7.16671" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                              </svg>
                            </div>
                            <p className="text-base text-white font-extrabold">免费等级 80</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 免费等级 90 */}
                  <div>
                    <div className="relative">
                      <a className="flex relative rounded-lg" href="/zh/rewards/cmgmhg9wu0000l50m2azj8ant">
                        <img 
                          alt="pack" 
                          loading="lazy" 
                          width={200} 
                          height={304} 
                          decoding="async" 
                          srcSet="https://ik.imagekit.io/hr727kunx/packs/cljq2k8t411tioo5clxy3zb9q_6482723__-ENQ5E5Dr?tr=w-256,c-at_max 1x, https://ik.imagekit.io/hr727kunx/packs/cljq2k8t411tioo5clxy3zb9q_6482723__-ENQ5E5Dr?tr=w-640,c-at_max 2x" 
                          src="https://ik.imagekit.io/hr727kunx/packs/cljq2k8t411tioo5clxy3zb9q_6482723__-ENQ5E5Dr?tr=w-640,c-at_max" 
                          style={{ color: 'transparent', height: 'auto', width: '100%', cursor: 'pointer' }}
                        />
                      </a>
                      <div className="flex justify-center pt-3 pb-4">
                        <div className="font-bold text-md">
                          <div className="flex gap-2 items-center">
                            <div className="flex justify-center" style={{ height: '18px', width: '18px' }}>
                              <svg viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8.00065 11.8333C8.36884 11.8333 8.66732 11.5349 8.66732 11.1667C8.66732 10.7985 8.36884 10.5 8.00065 10.5C7.63246 10.5 7.33398 10.7985 7.33398 11.1667C7.33398 11.5349 7.63246 11.8333 8.00065 11.8333Z" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                                <path d="M12.6667 7.16663H3.33333C2.59695 7.16663 2 7.76358 2 8.49996V13.8333C2 14.5697 2.59695 15.1666 3.33333 15.1666H12.6667C13.403 15.1666 14 14.5697 14 13.8333V8.49996C14 7.76358 13.403 7.16663 12.6667 7.16663Z" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                                <path d="M4.66602 7.16671V5.16671C4.66602 4.28265 5.01721 3.43481 5.64233 2.80968C6.26745 2.18456 7.11529 1.83337 7.99935 1.83337C8.8834 1.83337 9.73125 2.18456 10.3564 2.80968C10.9815 3.43481 11.3327 4.28265 11.3327 5.16671V7.16671" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                              </svg>
                            </div>
                            <p className="text-base text-white font-extrabold">免费等级 90</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 免费等级 100 */}
                  <div>
                    <div className="relative">
                      <a className="flex relative rounded-lg" href="/zh/rewards/cmgmhkovk0000ju0fa5zd6rnj">
                        <img 
                          alt="pack" 
                          loading="lazy" 
                          width={200} 
                          height={304} 
                          decoding="async" 
                          srcSet="https://ik.imagekit.io/hr727kunx/packs/cljq2hguh0t5goo5ct09kfdrg_7023070__UnaJtu9gM?tr=w-256,c-at_max 1x, https://ik.imagekit.io/hr727kunx/packs/cljq2hguh0t5goo5ct09kfdrg_7023070__UnaJtu9gM?tr=w-640,c-at_max 2x" 
                          src="https://ik.imagekit.io/hr727kunx/packs/cljq2hguh0t5goo5ct09kfdrg_7023070__UnaJtu9gM?tr=w-640,c-at_max" 
                          style={{ color: 'transparent', height: 'auto', width: '100%', cursor: 'pointer' }}
                        />
                      </a>
                      <div className="flex justify-center pt-3 pb-4">
                        <div className="font-bold text-md">
                          <div className="flex gap-2 items-center">
                            <div className="flex justify-center" style={{ height: '18px', width: '18px' }}>
                              <svg viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8.00065 11.8333C8.36884 11.8333 8.66732 11.5349 8.66732 11.1667C8.66732 10.7985 8.36884 10.5 8.00065 10.5C7.63246 10.5 7.33398 10.7985 7.33398 11.1667C7.33398 11.5349 7.63246 11.8333 8.00065 11.8333Z" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                                <path d="M12.6667 7.16663H3.33333C2.59695 7.16663 2 7.76358 2 8.49996V13.8333C2 14.5697 2.59695 15.1666 3.33333 15.1666H12.6667C13.403 15.1666 14 14.5697 14 13.8333V8.49996C14 7.76358 13.403 7.16663 12.6667 7.16663Z" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                                <path d="M4.66602 7.16671V5.16671C4.66602 4.28265 5.01721 3.43481 5.64233 2.80968C6.26745 2.18456 7.11529 1.83337 7.99935 1.83337C8.8834 1.83337 9.73125 2.18456 10.3564 2.80968C10.9815 3.43481 11.3327 4.28265 11.3327 5.16671V7.16671" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                              </svg>
                            </div>
                            <p className="text-base text-white font-extrabold">免费等级 100</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="hidden lg:block flex-shrink-0" style={{ width: '224px' }}>
          <div className="rounded-lg px-0 pb-4 pt-0 h-fit" >
            <div className="flex pb-4 gap-2 items-center">
              <div className="flex size-4 text-yellow-400">
                <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g clipPath="url(#clip0_2938_10681)">
                    <path d="M7.34447 1.87599C7.37304 1.72306 7.45419 1.58493 7.57387 1.48553C7.69355 1.38614 7.84423 1.33173 7.99981 1.33173C8.15538 1.33173 8.30606 1.38614 8.42574 1.48553C8.54542 1.58493 8.62657 1.72306 8.65514 1.87599L9.35581 5.58132C9.40557 5.84475 9.53359 6.08707 9.72316 6.27664C9.91273 6.46621 10.155 6.59423 10.4185 6.64399L14.1238 7.34466C14.2767 7.37322 14.4149 7.45437 14.5143 7.57405C14.6137 7.69374 14.6681 7.84441 14.6681 7.99999C14.6681 8.15557 14.6137 8.30624 14.5143 8.42592C14.4149 8.54561 14.2767 8.62676 14.1238 8.65532L10.4185 9.35599C10.155 9.40575 9.91273 9.53377 9.72316 9.72334C9.53359 9.91291 9.40557 10.1552 9.35581 10.4187L8.65514 14.124C8.62657 14.2769 8.54542 14.415 8.42574 14.5144C8.30606 14.6138 8.15538 14.6683 7.99981 14.6683C7.84423 14.6683 7.69355 14.6138 7.57387 14.5144C7.45419 14.415 7.37304 14.2769 7.34447 14.124L6.64381 10.4187C6.59404 10.1552 6.46602 9.91291 6.27645 9.72334C6.08688 9.53377 5.84457 9.40575 5.58114 9.35599L1.87581 8.65532C1.72287 8.62676 1.58475 8.54561 1.48535 8.42592C1.38595 8.30624 1.33154 8.15557 1.33154 7.99999C1.33154 7.84441 1.38595 7.69374 1.48535 7.57405C1.58475 7.45437 1.72287 7.37322 1.87581 7.34466L5.58114 6.64399C5.84457 6.59423 6.08688 6.46621 6.27645 6.27664C6.46602 6.08707 6.59404 5.84475 6.64381 5.58132L7.34447 1.87599Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path d="M13.3335 1.33331V3.99998" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path d="M14.6667 2.66669H12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                  </g>
                  <defs>
                    <clipPath id="clip0_2938_10681">
                      <rect width="16" height="16" fill="currentColor"></rect>
                    </clipPath>
                  </defs>
                </svg>
              </div>
              <p className="text-base text-white font-extrabold">{t('bestOpens')}</p>
            </div>
            <div className="live-feed flex flex-col gap-3">
              <LiveFeedElement
                index={0}
                href="/packs/1"
                avatarUrl="https://ik.imagekit.io/hr727kunx/profile_pictures/cm0aij6zj00561rzns7vbtwxi/cm0aij6zj00561rzns7vbtwxi_68ZiGZar8.png?tr=w-128,c-at_max"
                productImageUrl="https://ik.imagekit.io/hr727kunx/products/cm9ln14rj0002l50g0sajx4dg_2344464__pFeElsrMCp?tr=w-1080,c-at_max"
                packImageUrl="https://ik.imagekit.io/hr727kunx/community_packs/cm18eb8ji001kugiildnpy8fm/packs/cm18eb8ji001kugiildnpy8fm_hQOMiytlLO.png?tr=q-50,w-1080,c-at_max"
                title="Audemars Piguet Stainless Steel USA Edition"
                priceLabel="$65,000.00"
              />
              <LiveFeedElement
                index={1}
                href="/packs/2"
                avatarUrl="https://ik.imagekit.io/hr727kunx/profile_pictures/cm0aij6zj00561rzns7vbtwxi/cm0aij6zj00561rzns7vbtwxi_68ZiGZar8.png?tr=w-128,c-at_max"
                productImageUrl="https://ik.imagekit.io/hr727kunx/packs/cmgmus9260000l80gpntkfktl_3232094__fSM1fwIYl1?tr=w-1080,c-at_max"
                packImageUrl="https://ik.imagekit.io/hr727kunx/packs/cmh2lqffk001al10paqslua2f_2229948__zIR8y5q-G?tr=w-1080,c-at_max"
                title="Limited Edition Pack"
                priceLabel="$2.99"
                glowColor="#FACC15"
              />
              <LiveFeedElement
                index={2}
                href="/packs/3"
                avatarUrl="https://ik.imagekit.io/hr727kunx/profile_pictures/cm0aij6zj00561rzns7vbtwxi/cm0aij6zj00561rzns7vbtwxi_68ZiGZar8.png?tr=w-128,c-at_max"
                productImageUrl="https://ik.imagekit.io/hr727kunx/packs/cmgo6ok710000k10g5r0il5rk_7104681__d8no0nmco?tr=w-1080,c-at_max"
                packImageUrl="https://ik.imagekit.io/hr727kunx/packs/cmgo8hdp90000l40gxmfk970t_5020787__2hFmzl5eh?tr=w-1080,c-at_max"
                title="Special Drop"
                priceLabel="$5.00"
                glowColor="#FACC15"
              />
            </div>
          </div>
          <div className="rounded-lg px-0 pb-4 pt-0 h-fit mt-6" >
            <div className="flex pb-4 gap-2 items-center">
              <div className="flex size-4 text-yellow-400">
                <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="7.5" stroke="#EB4B4B" strokeOpacity="0.5"></circle><circle cx="8" cy="8" r="2" fill="#EB4B4B"></circle></svg>
              </div>
              <p className="text-base text-white font-extrabold">{t('liveStart')}</p>
            </div>
            <LiveFeedTicker maxItems={9} intervalMs={2000} />
          </div>
        </div>
      </div>
    </div>
  );
}


