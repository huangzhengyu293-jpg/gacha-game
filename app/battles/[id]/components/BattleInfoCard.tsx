'use client';

import { useI18n } from '../../../components/I18nProvider';
import type { BattleData } from '../types';
import { formatDate } from '../utils';

interface BattleInfoCardProps {
  battleData: BattleData;
}

export default function BattleInfoCard({ battleData }: BattleInfoCardProps) {
  const { t } = useI18n();

  const getStatusText = () => {
    if (battleData.status === 'completed') return t('completedStatus');
    if (battleData.status === 'active') return t('preparing');
    return t('waitingPlayers');
  };

  const getStatusColor = () => {
    if (battleData.status === 'completed') return '#10B981';
    if (battleData.status === 'active') return '#3B82F6';
    return '#6B7280';
  };

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 rounded-lg" style={{ backgroundColor: '#22272B' }}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">{battleData.title}</h1>
          <div className="flex items-center gap-2">
            <span
              className="px-3 py-1 rounded-full text-xs font-bold"
              style={{
                backgroundColor: getStatusColor(),
                color: '#FFFFFF',
              }}
            >
              {getStatusText()}
            </span>
            <span className="text-sm text-gray-400">
              {battleData.status === 'completed' && battleData.completedAt
                ? t('completedAt').replace('{time}', formatDate(battleData.completedAt))
                : t('createdAt').replace('{time}', formatDate(battleData.createdAt))}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-bold" style={{ color: '#7A8084' }}>{t('cost')}</p>
          <p className="text-lg font-extrabold text-white">{battleData.cost}</p>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-bold" style={{ color: '#7A8084' }}>{t('opened')}</p>
          <p className="text-lg font-extrabold text-white">{battleData.totalOpened}</p>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-bold" style={{ color: '#7A8084' }}>{t('participantsLabel')}</p>
          <p className="text-lg font-extrabold text-white">{battleData.participants.length}</p>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-bold" style={{ color: '#7A8084' }}>{t('packCountLabel')}</p>
          <p className="text-lg font-extrabold text-white">{battleData.packs.length}</p>
        </div>
      </div>
    </div>
  );
}

