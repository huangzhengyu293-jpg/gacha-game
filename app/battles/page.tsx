'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import InlineSelect from '../components/InlineSelect';
import { useI18n } from '../components/I18nProvider';
import BattleModes from '../components/BattleModes';
import BestLiveSidebar from '../components/BestLiveSidebar';

export default function BattlesPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [sortValue, setSortValue] = useState<'priceDesc' | 'latest'>('latest');
  const [createOpen, setCreateOpen] = useState(false);
  const [isCreateHover, setIsCreateHover] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<'solo' | 'team' | null>(null);
  const [isCloseHover, setIsCloseHover] = useState(false);

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setCreateOpen(false);
      }
    }
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);
  return (
    <div className="w-full px-4 sm:px-6 md:px-8 pb-12" style={{ paddingLeft: 'max(env(safe-area-inset-left, 0px), 16px)', paddingRight: 'max(env(safe-area-inset-right, 0px), 16px)' }}>
      <div className="flex gap-8 max-w-[1248px] mx-auto">
        <div className="flex-1 xl:max-w-[992px] min-w-0">
          <div className="flex flex-1 flex-col-reverse sm:flex-row justify-between items-stretch gap-3">
            <InlineSelect
              value={sortValue}
              onChange={(v) => setSortValue((v as 'priceDesc' | 'latest'))}
              options={[
                { label: t('battleSortPriceDesc'), value: 'priceDesc' },
                { label: t('battleSortLatest'), value: 'latest' },
              ]}
            />
            <button
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none interactive-focus relative select-none h-10 px-6 w-full sm:w-[140px] cursor-pointer"
              style={{ backgroundColor: isCreateHover ? '#3B82F6' : '#60A5FA', color: '#FFFFFF' }}
              onMouseEnter={() => setIsCreateHover(true)}
              onMouseLeave={() => setIsCreateHover(false)}
              onClick={() => setCreateOpen(true)}
            >
              <div className="flex items-center gap-2">
                <div className="size-5">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.2222 16.8889L3.99998 6.66667V4H6.66665L16.8889 14.2222" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path><path d="M12.8889 18.2222L18.2223 12.8889" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path><path d="M15.5557 15.5555L19.1113 19.1111" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path><path d="M18.2223 20L20 18.2222" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path><path d="M14.2223 7.11112L17.3334 4H20V6.66667L16.8889 9.77779" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path><path d="M5.77771 13.7777L9.33328 17.3333" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path><path d="M7.55558 16.4445L4.88891 19.1112" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path><path d="M3.99998 18.2222L5.77776 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                </div>
                <p className="font-bold">{t('createBattle')}</p>
              </div>
            </button>
          </div>
          {createOpen && (
            <div data-state="open" className="fixed px-4 inset-0 z-50 overflow-y-auto flex justify-center items-start py-16" style={{ pointerEvents: 'auto', backgroundColor: 'rgba(0, 0, 0, 0.48)' }} onClick={() => setCreateOpen(false)}>
              <div role="dialog" aria-modal="true" data-state="open" className="overflow-hidden z-50 grid w-full gap-4 p-6 shadow-lg duration-200 rounded-lg relative max-w-xl mt-20 pt-14 pb-4 md:p-20 px-4 md:px-16" tabIndex={-1} style={{ pointerEvents: 'auto', backgroundColor: '#161A1D' }} onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-bold leading-none tracking-tight text-left" style={{ color: '#FFFFFF' }}></h2>
                <p className="text-xl font-semibold text-center" style={{ color: '#FFFFFF' }}>{t('chooseBattleType')}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    className="text-card-foreground shadow-sm p-4 md:py-8 flex flex-col items-center justify-center gap-2 rounded-2xl cursor-pointer"
                    style={{ backgroundColor: '#22272B', borderRadius: '1rem', border: `1px solid ${hoveredCard === 'solo' ? '#60A5FA' : '#34383C'}` }}
                    onMouseEnter={() => setHoveredCard('solo')}
                    onMouseLeave={() => setHoveredCard((prev) => (prev === 'solo' ? null : prev))}
                    onClick={() => { setCreateOpen(false); router.push('/create-battle?type=solo&playersInSolo=2&gameMode=classic&fastBattle=false'); }}
                  >
                    <div className="size-6" style={{ color: '#60A5FA' }}>
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.2222 16.8889L3.99998 6.66667V4H6.66665L16.8889 14.2222" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path><path d="M12.8889 18.2222L18.2223 12.8889" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path><path d="M15.5557 15.5555L19.1113 19.1111" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path><path d="M18.2223 20L20 18.2222" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path><path d="M14.2223 7.11112L17.3334 4H20V6.66667L16.8889 9.77779" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path><path d="M5.77771 13.7777L9.33328 17.3333" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path><path d="M7.55558 16.4445L4.88891 19.1112" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path><path d="M3.99998 18.2222L5.77776 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                    </div>
                    <p className="font-semibold cursor-default" style={{ color: '#FFFFFF' }}>{t('soloBattle')}</p>
                  </button>
                  <button
                    className="text-card-foreground shadow-sm p-4 md:py-8 flex flex-col items-center justify-center gap-2 rounded-2xl cursor-pointer"
                    style={{ backgroundColor: '#22272B', borderRadius: '1rem', border: `1px solid ${hoveredCard === 'team' ? '#60A5FA' : '#34383C'}` }}
                    onMouseEnter={() => setHoveredCard('team')}
                    onMouseLeave={() => setHoveredCard((prev) => (prev === 'team' ? null : prev))}
                    onClick={() => { setCreateOpen(false); router.push('/create-battle?type=team&teamStructure=2v2&gameMode=classic&fastBattle=false'); }}
                  >
                    <div className="flex gap-2 items-center" style={{ color: '#60A5FA' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                      <div className="size-6">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.2222 16.8889L3.99998 6.66667V4H6.66665L16.8889 14.2222" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path><path d="M12.8889 18.2222L18.2223 12.8889" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path><path d="M15.5557 15.5555L19.1113 19.1111" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path><path d="M18.2223 20L20 18.2222" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path><path d="M14.2223 7.11112L17.3334 4H20V6.66667L16.8889 9.77779" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path><path d="M5.77771 13.7777L9.33328 17.3333" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path><path d="M7.55558 16.4445L4.88891 19.1112" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path><path d="M3.99998 18.2222L5.77776 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    </div>
                    <p className="font-semibold cursor-default" style={{ color: '#FFFFFF' }}>{t('teamBattle')}</p>
                  </button>
                </div>
                <button
                  type="button"
                  className="absolute right-5 top-[18px] rounded-lg w-8 h-8 flex items-center justify-center"
                  style={{ color: isCloseHover ? '#FFFFFF' : '#7A8084' }}
                  onMouseEnter={() => setIsCloseHover(true)}
                  onMouseLeave={() => setIsCloseHover(false)}
                  onClick={() => setCreateOpen(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x min-w-6 min-h-6 size-6"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
                  <span className="sr-only">Close</span>
                </button>
              </div>
            </div>
          )}
          <div className="mt-6">
            <BattleModes sortValue={sortValue} />
          </div>
        </div>
        <BestLiveSidebar bestOpensTitle={t('bestOpens')} liveTitle={t('liveStart')} />
      </div>
    </div>
  );
}


