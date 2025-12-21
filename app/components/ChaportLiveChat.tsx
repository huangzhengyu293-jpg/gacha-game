import Script from "next/script";

const CHAPORT_APP_ID = "69483deef3424436c3b3c237";

export default function ChaportLiveChat() {
  return (
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
  );
}


