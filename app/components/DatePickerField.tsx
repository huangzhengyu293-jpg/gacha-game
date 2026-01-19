"use client";

import React, { useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

type DatePickerFieldProps = {
  id?: string;
  /** 非受控默认值：yyyy-MM-dd */
  defaultValue?: string;
  /** 受控值：yyyy-MM-dd；传了就以 value 为准 */
  value?: string;
  /** 变更回调：yyyy-MM-dd（清空时返回空字符串） */
  onChange?: (next: string) => void;
  /** 范围选择：开始值 yyyy-MM-dd */
  startValue?: string;
  /** 范围选择：结束值 yyyy-MM-dd */
  endValue?: string;
  /** 范围选择变更回调：yyyy-MM-dd（清空时返回空字符串） */
  onRangeChange?: (start: string, end: string) => void;
  /** 模式：单选或范围 */
  mode?: 'single' | 'range';
  /** 占位符 */
  placeholder?: string;
  /** 外层最大宽度 class */
  wrapperClassName?: string;
};

function parseDateString(dateStr?: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split("-");
  if (parts.length !== 3) return null;
  const [y, m, d] = parts.map((p) => Number(p));
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function formatDateToYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const CustomInput = React.forwardRef<HTMLDivElement, any>(function CustomInput(
  { value, onClick, id, placeholder },
  ref
) {
  const display =
    value && String(value).length > 0 ? String(value) : (placeholder ? String(placeholder) : "日/月/年");
  return (
    <div
      id={id}
      ref={ref as any}
      onClick={onClick}
      role="button"
      tabIndex={0}
      className="acct-input h-10 w-full max-w-[540px] rounded-md border-0 px-3 py-2 text-base flex items-center"
      style={{ backgroundColor: "#292F34", color: "#FFFFFF", cursor: "pointer" }}
      aria-label="选择日期"
    >
      <span className="truncate">{display}</span>
      <span style={{ width: 30 }} />
      <span style={{ color: "#FFFFFF" }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
      </span>
      <span className="flex-1" />
    </div>
  );
});

export default function DatePickerField({
  id,
  defaultValue,
  value,
  onChange,
  startValue,
  endValue,
  onRangeChange,
  mode = 'single',
  placeholder,
  wrapperClassName,
}: DatePickerFieldProps) {
  const isRange = mode === 'range';
  const isControlled = isRange ? startValue !== undefined || endValue !== undefined : value !== undefined;
  const initial = useMemo(() => parseDateString(defaultValue), [defaultValue]);
  const controlledDate = useMemo(() => parseDateString(value), [value]);
  const controlledStart = useMemo(() => parseDateString(startValue), [startValue]);
  const controlledEnd = useMemo(() => parseDateString(endValue), [endValue]);
  const [uncontrolledSelected, setUncontrolledSelected] = useState<Date | null>(initial);
  const [uncontrolledRange, setUncontrolledRange] = useState<[Date | null, Date | null]>([null, null]);
  const selected = isControlled ? controlledDate : uncontrolledSelected;
  const rangeSelected = isControlled ? [controlledStart, controlledEnd] : uncontrolledRange;

  return (
    <div className={wrapperClassName ? `relative w-full ${wrapperClassName}` : "relative w-full max-w-[540px]"}>
      <style>{`
        .react-datepicker-wrapper { width: 100%; }
        .react-datepicker__input-container { width: 100%; display: block; }
        .dp-dark-cal { background-color: #22272B; color: #FFFFFF; border: 1px solid #292F34; }
        .dp-dark-cal .react-datepicker__header { background-color: #22272B; border-bottom-color: #292F34; }
        .dp-dark-cal .react-datepicker__current-month,
        .dp-dark-cal .react-datepicker-time__header,
        .dp-dark-cal .react-datepicker-year-header { color: #FFFFFF; }
        .dp-dark-cal .react-datepicker__day-name,
        .dp-dark-cal .react-datepicker__day,
        .dp-dark-cal .react-datepicker__time-name { color: #FFFFFF; }
        .dp-dark-cal .react-datepicker__day--selected,
        .dp-dark-cal .react-datepicker__day--keyboard-selected,
        .dp-dark-cal .react-datepicker__day--in-selecting-range,
        .dp-dark-cal .react-datepicker__day--in-range { background-color: #60A5FA; color: #FFFFFF; }
        .dp-dark-cal .react-datepicker__triangle { display: none; }
        /* 强制隐藏指向输入框的小三角（不同位置与伪元素） */
        .react-datepicker__triangle,
        .react-datepicker__triangle::before,
        .react-datepicker__triangle::after,
        .react-datepicker-popper[data-placement^="bottom"] .react-datepicker__triangle,
        .react-datepicker-popper[data-placement^="top"] .react-datepicker__triangle { display: none !important; border: 0 !important; }
        .dp-dark-cal .react-datepicker__today-button { background-color: #34383C; color: #FFFFFF; border-top: 1px solid #292F34; }
        .dp-dark-cal .react-datepicker__today-button:hover { background-color: #3C4044; }
        /* 隐藏头部左右导航白色箭头 */
        .dp-dark-cal .react-datepicker__navigation,
        .dp-dark-cal .react-datepicker__navigation--previous,
        .dp-dark-cal .react-datepicker__navigation--next,
        .dp-dark-cal .react-datepicker__navigation-icon::before { display: none; }
      `}</style>
      <DatePicker
        selected={isRange ? undefined : selected}
        startDate={isRange ? rangeSelected[0] : undefined}
        endDate={isRange ? rangeSelected[1] : undefined}
        selectsRange={isRange}
        onChange={(d) => {
          if (!isRange) {
            const date = d instanceof Date && !Number.isNaN(d.getTime()) ? d : null;
            if (!isControlled) setUncontrolledSelected(date);
            if (onChange) onChange(date ? formatDateToYmd(date) : "");
            return;
          }

          const raw = Array.isArray(d) ? d : [null, null];
          const start = raw[0] instanceof Date && !Number.isNaN(raw[0].getTime()) ? raw[0] : null;
          const end = raw[1] instanceof Date && !Number.isNaN(raw[1].getTime()) ? raw[1] : null;
          if (!isControlled) setUncontrolledRange([start, end]);
          if (onRangeChange) onRangeChange(start ? formatDateToYmd(start) : '', end ? formatDateToYmd(end) : '');
        }}
        dateFormat="yyyy-MM-dd"
        popperPlacement="bottom-start"
        calendarClassName="dp-dark-cal"
        todayButton="今天"
        wrapperClassName="w-full"
        customInput={<CustomInput id={id} placeholder={placeholder} />}
      />
      
    </div>
  );
}


