'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react';
import { useI18n, type Lang } from './I18nProvider';

type LangLabelKey =
  | 'langPick_zh'
  | 'langPick_en'
  | 'langPick_ko'
  | 'langPick_ja'
  | 'langPick_ru'
  | 'langPick_es'
  | 'langPick_vi';

const LANG_META: { code: Lang; flagFile: string; labelKey: LangLabelKey }[] = [
  { code: 'zh', flagFile: 'cn', labelKey: 'langPick_zh' },
  { code: 'en', flagFile: 'us', labelKey: 'langPick_en' },
  { code: 'ko', flagFile: 'kr', labelKey: 'langPick_ko' },
  { code: 'ja', flagFile: 'jp', labelKey: 'langPick_ja' },
  { code: 'ru', flagFile: 'ru', labelKey: 'langPick_ru' },
  { code: 'es', flagFile: 'es', labelKey: 'langPick_es' },
  { code: 'vi', flagFile: 'vn', labelKey: 'langPick_vi' },
];

/** 与参考一致：内容区 w-80 (320px) + 水平 p-8(32×2) 或 lg:p-10(40×2)，用于固定定位估算 */
const MODAL_CONTENT_W_PX = 320;
const MODAL_MIN_WIDTH_PX = MODAL_CONTENT_W_PX + 80;

/** 弹窗与选择器共用描边 rgb(46 50 68) */
const BORDER_PANEL = 'rgb(46, 50, 68)';
/** 弹窗底 #17171c */
const BG_MODAL = '#17171c';
/** 选择器 / 下拉底层 #0d0d0e，略带透明 */
const BG_SELECTOR = 'rgba(13, 13, 14, 0.94)';
/** 取消：边 #858dad，底 #1f1f27 */
const BTN_CANCEL_BORDER = 'rgb(133, 141, 173)';
const BTN_CANCEL_BG = 'rgb(31, 31, 39)';
/** 保存：边 #cca25f，底 #332918 */
const BTN_SAVE_BORDER = 'rgb(204, 162, 95)';
const BTN_SAVE_BG = 'rgb(51, 41, 24)';

function flagSrc(flagFile: string) {
  return `/web/KD/static/flags/${flagFile}.svg`;
}

export type LanguageSettingsModalProps = {
  open: boolean;
  onClose: () => void;
  /** 设置按钮所在容器，用于对齐弹层 */
  anchorRef: RefObject<HTMLElement | null>;
};

export function LanguageSettingsModal({
  open,
  onClose,
  anchorRef,
}: LanguageSettingsModalProps) {
  const { lang, setLang, t } = useI18n();
  const [draftLang, setDraftLang] = useState<Lang>(lang);
  const [listOpen, setListOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const panelRef = useRef<HTMLDivElement>(null);
  const comboRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setDraftLang(lang);
      setListOpen(false);
    }
  }, [open, lang]);

  const labelFor = useCallback(
    (code: Lang) => {
      const row = LANG_META.find((r) => r.code === code);
      return row ? t(row.labelKey) : '';
    },
    [t],
  );

  const selectedMeta = useMemo(
    () => LANG_META.find((r) => r.code === draftLang) ?? LANG_META[0],
    [draftLang],
  );

  const syncPosition = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vw = typeof window !== 'undefined' ? window.innerWidth : 0;
    const left = Math.max(
      8,
      Math.min(r.right - MODAL_MIN_WIDTH_PX, vw - MODAL_MIN_WIDTH_PX - 8),
    );
    setPos({ top: r.bottom + 8, left });
  }, [anchorRef]);

  useLayoutEffect(() => {
    if (!open) return;
    syncPosition();
  }, [open, syncPosition]);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => syncPosition();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [open, syncPosition]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (listOpen) setListOpen(false);
      else onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose, listOpen]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node;
      const panel = panelRef.current;
      const anchor = anchorRef.current;
      if (panel?.contains(t) || anchor?.contains(t)) return;
      onClose();
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [open, onClose, anchorRef]);

  useEffect(() => {
    if (!open || !listOpen) return;
    const onDocMouseDown = (e: MouseEvent | TouchEvent) => {
      const node = e.target as Node;
      if (comboRef.current?.contains(node)) return;
      setListOpen(false);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('touchstart', onDocMouseDown);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('touchstart', onDocMouseDown);
    };
  }, [open, listOpen]);

  const toggleList = useCallback(() => {
    setListOpen((prev) => !prev);
  }, []);

  const selectLang = useCallback((code: Lang) => {
    setDraftLang(code);
    setListOpen(false);
  }, []);

  const onSave = useCallback(() => {
    setLang(draftLang);
    onClose();
  }, [draftLang, setLang, onClose]);

  const onCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!open) return null;

  const displayLabel = labelFor(draftLang);

  return (
    <div
      ref={panelRef}
      data-testid="language-settings-modal"
      className="absolute top-full box-border flex w-max max-w-[calc(100vw-1rem)] flex-col rounded-xl border border-solid p-8 lg:p-10"
      style={{
        position: 'fixed',
        left: pos.left,
        top: pos.top,
        zIndex: 99,
        willChange: 'transform',
        backgroundColor: BG_MODAL,
        borderColor: BORDER_PANEL,
        borderWidth: 1,
      }}
    >
      <div className="flex w-80 max-w-full flex-col">
      <h2 className="text-center text-base font-semibold leading-tight text-white">
        {t('settingsModalTitle')}
      </h2>
      <p className="mt-1.5 text-center text-xs font-light leading-snug text-navy-300">
        {t('settingsModalDescLanguage')}
      </p>

      <label className="mb-2 mt-6 text-xs font-light text-white" htmlFor="language-settings-combobox-trigger">
        {t('settingsLanguageLabel')}
      </label>
      <div
        ref={comboRef}
        data-testid="language-settings-modal-language-combo"
        className="relative w-full max-w-full"
        data-headlessui-state=""
      >
        <div
          className="flex h-11 w-full items-stretch rounded-lg border border-solid"
          style={{
            borderColor: BORDER_PANEL,
            borderWidth: 1,
            backgroundColor: BG_SELECTOR,
          }}
        >
          <button
            type="button"
            className="flex shrink-0 items-center"
            tabIndex={-1}
            aria-haspopup="listbox"
            aria-expanded={listOpen}
            onClick={toggleList}
            data-headlessui-state=""
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={flagSrc(selectedMeta.flagFile)}
              className="ml-3 mr-3 h-5 w-5 flex-shrink-0 rounded-full sm:mr-2"
              alt=""
            />
          </button>
          <button
            type="button"
            id="language-settings-combobox-trigger"
            data-testid="combobox-input"
            className="relative h-full min-w-0 flex-1 cursor-pointer rounded-lg bg-transparent pl-2 text-left text-[16px] font-light text-white focus:outline-none focus:ring-0 lg:text-[10px]"
            role="combobox"
            aria-expanded={listOpen}
            aria-haspopup="listbox"
            aria-controls="language-settings-listbox"
            aria-autocomplete="none"
            data-headlessui-state=""
            onClick={toggleList}
          >
            <span className="block truncate select-none">{displayLabel}</span>
          </button>
          <button
            type="button"
            className="dropdown-arrow ml-auto flex shrink-0 items-center pr-3"
            tabIndex={-1}
            aria-haspopup="listbox"
            aria-expanded={listOpen}
            onClick={toggleList}
            data-headlessui-state=""
          >
            <svg
              className="icon block h-2.5 w-2.5 flex-shrink-0 text-navy-200 transition-transform duration-200"
              viewBox="0 0 10 6"
              fill="none"
              style={{ transform: listOpen ? 'rotate(180deg)' : 'none' }}
            >
              <path d="M1 1L5 5L9 1" stroke="currentColor" />
            </svg>
          </button>
        </div>

        {listOpen ? (
          <ul
            id="language-settings-listbox"
            className="custom-scrollbar absolute left-0 right-0 top-full z-[100] mt-1 max-h-52 overflow-auto rounded-lg border border-solid py-1 shadow-lg"
            role="listbox"
            style={{
              borderColor: BORDER_PANEL,
              borderWidth: 1,
              backgroundColor: BG_SELECTOR,
            }}
          >
            {LANG_META.map((row) => {
              const active = row.code === draftLang;
              return (
                <li key={row.code} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-base font-light lg:text-[10px] ${
                      active ? 'text-white' : 'text-navy-200'
                    }`}
                    style={
                      active
                        ? { backgroundColor: 'rgba(255, 255, 255, 0.08)' }
                        : { backgroundColor: 'transparent' }
                    }
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = active
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(255, 255, 255, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = active
                        ? 'rgba(255, 255, 255, 0.08)'
                        : 'transparent';
                    }}
                    onClick={() => selectLang(row.code)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={flagSrc(row.flagFile)}
                      className="h-5 w-5 shrink-0 rounded-full"
                      alt=""
                    />
                    <span className="min-w-0 flex-1 truncate">{labelFor(row.code)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4">
        <button
          data-testid="language-settings-modal-cancel"
          type="button"
          className="rounded-lg border border-solid py-2.5 text-center text-[10px] font-bold uppercase tracking-wide text-white transition-opacity hover:opacity-90"
          style={{
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: BTN_CANCEL_BORDER,
            backgroundColor: BTN_CANCEL_BG,
          }}
          onClick={onCancel}
        >
          {t('cancel')}
        </button>
        <button
          data-testid="language-settings-modal-save"
          type="button"
          className="rounded-lg border border-solid py-2.5 text-center text-[10px] font-bold uppercase tracking-wide text-[#e8d4a8] transition-opacity hover:opacity-90"
          style={{
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: BTN_SAVE_BORDER,
            backgroundColor: BTN_SAVE_BG,
          }}
          onClick={onSave}
        >
          {t('save')}
        </button>
      </div>
      </div>
    </div>
  );
}
