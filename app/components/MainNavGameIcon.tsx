import type { MainNavGameKey } from '@/app/lib/mainNavGames';

type Props = {
  name: MainNavGameKey;
  className?: string;
};

export function MainNavGameIcon({ name, className = 'h-3.5 w-3.5 3xl:h-4 3xl:w-4' }: Props) {
  switch (name) {
    case 'packs':
      return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
          <path
            d="M4 4.15385L4 16.8462C4 17.4834 4.70355 18 5.57143 18L13.4286 18C14.2964 18 15 17.4834 15 16.8462L15 4.15385C15 3.5166 14.2964 3 13.4286 3L5.57143 3C4.70355 3 4 3.5166 4 4.15385Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8.08771 19.0127C7.98916 19.5993 8.54002 20.1807 9.31810 20.3115L16.3622 21.495C17.1403 21.6257 17.8509 21.2562 17.9495 20.6697L19.9123 8.98725C20.0109 8.40070 19.4600 7.81924 18.6819 7.68851L15.1599 7.09675"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'battles':
      return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} -translate-y-px`} aria-hidden>
          <path d="M14.2222 16.8889L3.99998 6.66667V4H6.66665L16.8889 14.2222" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12.8889 18.2222L18.2223 12.8889" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M15.5557 15.5555L19.1113 19.1111" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M18.2223 20L20 18.2222" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14.2223 7.11112L17.3334 4H20V6.66667L16.8889 9.77779" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5.77771 13.7777L9.33328 17.3333" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7.55558 16.4445L4.88891 19.1112" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3.99998 18.2222L5.77776 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'deals':
      return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
          <path d="M7.5 3.06729C4.23742 4.71411 2 8.09576 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 8.09576 19.7626 4.71411 16.5 3.06729" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M8.6822 7C7.06551 8.07492 6 9.91303 6 12C6 15.3137 8.68629 18 12 18C15.3137 18 18 15.3137 18 12C18 9.91303 16.9345 8.07492 15.3178 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M13.8534 2H13.2857H10.7143H10.1466C9.71002 2 9.48314 2.5203 9.78021 2.84023L11.6336 4.83619C11.8314 5.04922 12.1686 5.04922 12.3664 4.83619L14.2198 2.84023C14.5169 2.5203 14.2900 2 13.8534 2Z" fill="currentColor" />
        </svg>
      );
    case 'events':
      return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
          <path d="M12 13V2L20 6L12 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M20.5610 10.222C21.0931 11.8621 21.1429 13.6206 20.7044 15.2883C20.2659 16.9559 19.3576 18.4624 18.0876 19.6287C16.8175 20.7949 15.2391 21.5718 13.5402 21.8668C11.8413 22.1619 10.0935 21.9627 8.50454 21.2929C6.91562 20.6232 5.55254 19.5111 4.57747 18.0889C3.60240 16.6668 3.05639 14.9945 3.00440 13.2709C2.95241 11.5474 3.39662 9.84522 4.28419 8.36689C5.17176 6.88856 6.46532 5.69632 8.01099 4.93201" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8.00202 9.99701C7.50092 10.664 7.17470 11.4458 7.05306 12.2712C6.93143 13.0966 7.01825 13.9392 7.30562 14.7225C7.59299 15.5057 8.07177 16.2045 8.69835 16.7554C9.32492 17.3062 10.0794 17.6915 10.8930 17.8762C11.7065 18.0608 12.5534 18.0390 13.3564 17.8126C14.1593 17.5862 14.8929 17.1625 15.4902 16.5801C16.0876 15.9977 16.5297 15.2750 16.7762 14.4780C17.0228 13.6810 17.0661 12.8350 16.9020 12.0170" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'rewards':
      return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
          <path d="M20 8H4C3.44772 8 3 8.44772 3 9V11C3 11.5523 3.44772 12 4 12H20C20.5523 12 21 11.5523 21 11V9C21 8.44772 20.5523 8 20 8Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 8V21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M19 12V19C19 19.5304 18.7893 20.0391 18.4142 20.4142C18.0391 20.7893 17.5304 21 17 21H7C6.46957 21 5.96086 20.7893 5.58579 20.4142C5.21071 20.0391 5 19.5304 5 19V12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7.5 8.00001C6.83696 8.00001 6.20107 7.73662 5.73223 7.26778C5.26339 6.79894 5 6.16305 5 5.50001C5 4.83697 5.26339 4.20108 5.73223 3.73224C6.20107 3.26340 6.83696 3.00001 7.5 3.00001C8.46469 2.98320 9.41003 3.45127 10.2127 4.34317C11.0154 5.23507 11.6383 6.50941 12 8.00001C12.3617 6.50941 12.9846 5.23507 13.7873 4.34317C14.5900 3.45127 15.5353 2.98320 16.5 3.00001C17.1630 3.00001 17.7989 3.26340 18.2678 3.73224C18.7366 4.20108 19 4.83697 19 5.50001C19 6.16305 18.7366 6.79894 18.2678 7.26778C17.7989 7.73662 17.1630 8.00001 16.5 8.00001" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}
