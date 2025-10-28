'use client';
import { useI18n } from '../components/I18nProvider';

export default function DrawPage() {
  const { t } = useI18n();
  return (
    <div className="w-full px-4 sm:px-6 md:px-8 pb-12" style={{ paddingLeft: 'max(env(safe-area-inset-left, 0px), 16px)', paddingRight: 'max(env(safe-area-inset-right, 0px), 16px)' }}>
      <div className="max-w-[1248px] mx-auto">
        <h2 className="text-2xl text-white font-bold">{t('draw')}</h2>
        <p className="text-gray-400 mt-3">这里是抽奖频道页面（占位）。</p>
      </div>
    </div>
  );
}


