import Script from "next/script";

const CHAPORT_APP_ID = "69483deef3424436c3b3c237";

export default function ChaportLiveChat() {
  return (
    <>
    <Script id="chaport-live-chat" strategy="afterInteractive">
      {`
(function(w,d,v3){
  w.chaportConfig = { appId : '${CHAPORT_APP_ID}' };
  if(w.chaport) return;
  v3 = w.chaport = {};
  v3._q = [];
  v3._l = {};
  v3.q = function(){ v3._q.push(arguments); };
  v3.on = function(e,fn){
    if(!v3._l[e]) v3._l[e] = [];
    v3._l[e].push(fn);
  };
  var s = d.createElement('script');
  s.type = 'text/javascript';
  s.async = true;
  s.src = 'https://app.chaport.com/javascripts/insert.js';
  var ss = d.getElementsByTagName('script')[0];
  ss.parentNode.insertBefore(s,ss);
})(window, document);
      `}
    </Script>

      <style>{`
        /* Chaport overrides: keep scope as tight as possible */
        #chaport-container .chaport-launcher-chat-icon,
        .chaport-container .chaport-launcher-chat-icon {
          background-image: url("/logo.svg") !important;
          background-position: center !important;
          background-repeat: no-repeat !important;
          background-size: contain !important;
        }

        #chaport-container .chaport-launcher-chat-icon svg,
        #chaport-container .chaport-launcher-chat-icon img,
        .chaport-container .chaport-launcher-chat-icon svg,
        .chaport-container .chaport-launcher-chat-icon img {
          display: none !important;
        }

        /* Mobile: make the launcher 40x40 only on small screens */
        @media (max-width: 767px) {
          #chaport-container .chaport-launcher-button,
          .chaport-container .chaport-launcher-button {
            width: 40px !important;
            height: 40px !important;
            min-width: 40px !important;
            min-height: 40px !important;
            padding: 0 !important;
            /* Keep Chaport's original fixed positioning intact (do NOT override position/right/bottom/transform) */
            position: relative;
          }

          /* Ensure the replaced logo is centered inside the 40x40 button */
          #chaport-container .chaport-launcher-chat-icon,
          .chaport-container .chaport-launcher-chat-icon {
            position: absolute !important;
            top: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            left: 0 !important;
            margin: auto !important;
            padding: 0 !important;
            display: block !important;
            transform: none !important;

            width: 40px !important;
            height: 40px !important;
            background-position: center !important;
            /* Slightly smaller than the button to match typical Chaport icon sizing */
            background-size: 24px 24px !important;
          }

          /* Close icon sizing on mobile */
          #chaport-container .chaport-launcher-close-icon,
          .chaport-container .chaport-launcher-close-icon {
            width: 20px !important;
            height: 20px !important;
            position: absolute !important;
            top: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            left: 0 !important;
            margin: auto !important;
            padding: 0 !important;
            display: block !important;
          }

          #chaport-container .chaport-launcher-close-icon svg,
          .chaport-container .chaport-launcher-close-icon svg {
            width: 100% !important;
            height: 100% !important;
          }

          /* Center the pseudo-elements (X lines) inside the close icon container */
          #chaport-container .chaport-launcher-close-icon::before,
          #chaport-container .chaport-launcher-close-icon::after,
          .chaport-container .chaport-launcher-close-icon::before,
          .chaport-container .chaport-launcher-close-icon::after {
            position: absolute !important;
            top: 50% !important;
            left: 50% !important;
            right: auto !important;
            bottom: auto !important;
            /* Center without clobbering Chaport's rotate() transform */
            translate: -50% -50% !important;
            transform-origin: 50% 50% !important;
          }
        }
      `}</style>
    </>
  );
}


