'use client';
import { useI18n } from '../components/I18nProvider';
import DrawExtraComponent from '@/app/components/DrawExtraComponent';

export default function DrawPage() {
  const { t } = useI18n();
  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-[1280px]" >
          <DrawExtraComponent />
      </div>
    </div>
  );
}


