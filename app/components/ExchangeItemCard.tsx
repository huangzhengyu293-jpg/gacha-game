'use client';

import { useState } from 'react';

export type ExchangeItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  warehouseId?: string;
  productId?: string;
};

type ExchangeItemCardProps = {
  item: ExchangeItem;
  selected: boolean;
  onToggle: () => void;
  disabled?: boolean;
};

export default function ExchangeItemCard({ item, selected, onToggle, disabled }: ExchangeItemCardProps) {
  const [hovered, setHovered] = useState(false);
  const isDisabled = !!disabled;

  const borderColor = selected ? '#4299E1' : hovered ? '#34383c' : '#22272B';
  const checkboxBorder = selected ? '#4299E1' : hovered ? '#4299E1' : '#5A5E62';

  return (
    <div
      className="relative rounded-lg border h-full transition-colors duration-150"
      style={{ borderColor, backgroundColor: '#22272b', cursor: isDisabled ? 'not-allowed' : 'pointer' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => {
        if (isDisabled) return;
        onToggle();
      }}
    >
      <div
        className={`absolute top-2 left-2 hidden sm:flex gap-2 z-10 transition-opacity duration-200 ${
          hovered || selected ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <button
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors relative text-base font-bold select-none size-6 min-h-6 min-w-6 max-h-6 max-w-6 rounded-[4px]"
          style={{ backgroundColor: '#34383c', color: '#7A8084', cursor: 'pointer' }}
          type="button"
          tabIndex={-1}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#5a5e62';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#34383c';
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="size-3 flex justify-center">
            <svg viewBox="0 0 21 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-current">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M10.2015 15.9999C8.17738 16.0075 6.19172 15.4472 4.47046 14.3825C2.74883 13.3179 1.36052 11.7915 0.463115 9.97718C-0.15429 8.73041 -0.15429 7.26686 0.463115 6.02009C1.67464 3.59605 3.74642 1.71115 6.27399 0.733299C8.80128 -0.244433 11.6026 -0.244433 14.1295 0.733299C16.657 1.71103 18.7288 3.59601 19.9404 6.02009C20.5578 7.26686 20.5578 8.73041 19.9404 9.97718C19.043 11.7915 17.6547 13.3179 15.9331 14.3825C14.2116 15.4471 12.2259 16.0075 10.202 15.9999H10.2015ZM2.19045 6.87906C1.83288 7.58259 1.83288 8.41472 2.19045 9.11825C2.91884 10.6182 4.0588 11.8802 5.47715 12.7569C6.89566 13.6336 8.53407 14.0888 10.2014 14.0695C11.8687 14.0888 13.5072 13.6336 14.9256 12.7569C16.344 11.8802 17.4839 10.6182 18.2123 9.11825C18.5699 8.41472 18.5699 7.58259 18.2123 6.87906C17.4839 5.37911 16.344 4.11716 14.9256 3.24044C13.5071 2.36372 11.8687 1.90855 10.2014 1.92778C8.53403 1.90855 6.89562 2.36372 5.47715 3.24044C4.0588 4.11716 2.91884 5.37911 2.19045 6.87906ZM10.2005 11.859C9.1766 11.859 8.19469 11.4523 7.47064 10.7283C6.7466 10.0042 6.3399 9.02232 6.3399 7.99838C6.3399 6.97445 6.7466 5.99254 7.47064 5.2685C8.19469 4.54445 9.1766 4.13776 10.2005 4.13776C11.2245 4.13776 12.2064 4.54445 12.9304 5.2685C13.6545 5.99254 14.0612 6.97445 14.0612 7.99838C14.0612 9.02232 13.6545 10.0042 12.9304 10.7283C12.2064 11.4523 11.2245 11.859 10.2005 11.859Z"
                fill="currentColor"
              ></path>
            </svg>
          </div>
        </button>
      </div>
      <div className={`absolute right-2 top-2 shrink-0 transition-opacity duration-200 ${hovered || selected ? 'opacity-100' : 'opacity-0'}`}>
        <button
          type="button"
          role="checkbox"
          aria-checked={selected}
          data-state={selected ? 'checked' : 'unchecked'}
          value="on"
          className="peer shrink-0 rounded border size-5 flex items-center justify-center"
          aria-label="Select item"
          tabIndex={-1}
          style={{
            border: `1px solid ${checkboxBorder}`,
            backgroundColor: selected ? '#4299E1' : 'transparent',
            color: '#FFFFFF',
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (isDisabled) return;
            onToggle();
          }}
        >
          {selected && (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check h-4 w-4 text-white">
              <path d="M20 6 9 17l-5-5"></path>
            </svg>
          )}
        </button>
      </div>
      <div className="h-[140px] sm:h-36 flex flex-col p-3">
        <div className="relative flex-1 flex w-full justify-center items-center overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 aspect-square transition-opacity duration-200 h-5/6 rounded-full opacity-40 filter blur-[25px]" style={{ backgroundColor: '#22272b' }}></div>
          <img
            alt={item.name}
            loading="lazy"
            decoding="async"
            className="pointer-events-none h-full w-full object-contain max-h-full"
            src={item.image || '/logo.svg'}
            style={{ zIndex: 1 }}
          />
        </div>
        <div className="flex flex-col w-full gap-1">
          <p className="font-semibold truncate max-w-full text-center text-sm" style={{ color: '#7A8084' }}>{item.name}</p>
          <div className="flex justify-center">
            <p className="font-extrabold text-sm text-white">${item.price.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

