"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { useI18n } from "./I18nProvider";

export default function PayQrModal({
  isOpen,
  onClose,
  payUrl,
  channelId,
}: {
  isOpen: boolean;
  onClose: () => void;
  payUrl: string;
  channelId: number;
}) {
  const { t } = useI18n();
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  const hintText = useMemo(() => {
    if (Number(channelId) === 19) return t("pleaseScanWithAlipay");
    if (Number(channelId) === 20) return t("pleaseScanWithWeChat");
    return "";
  }, [channelId, t]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const url = String(payUrl || "").trim();
    if (!url) {
      setQrDataUrl("");
      return;
    }

    let cancelled = false;
    setIsGenerating(true);
    QRCode.toDataURL(url, {
      width: 300,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#111111", light: "#FFFFFF" },
    })
      .then((dataUrl: string) => {
        if (cancelled) return;
        setQrDataUrl(dataUrl);
      })
      .catch(() => {
        if (cancelled) return;
        setQrDataUrl("");
      })
      .finally(() => {
        if (cancelled) return;
        setIsGenerating(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, payUrl]);

  if (!isOpen) return null;

  return (
    <div
      data-state={isOpen ? "open" : "closed"}
      className="fixed px-4 inset-0 z-[130] bg-black/[0.48] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 overflow-y-auto flex justify-center items-start py-16"
      style={{ pointerEvents: "auto" }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-describedby="pay-qr-desc"
        aria-labelledby="pay-qr-title"
        data-state={isOpen ? "open" : "closed"}
        className="overflow-hidden z-[140] w-full shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 rounded-lg relative flex flex-col max-w-sm p-0 gap-0 font-bold"
        tabIndex={-1}
        style={{ pointerEvents: "auto", backgroundColor: "#161A1D", color: "#FFFFFF", fontFamily: "Urbanist, sans-serif", fontWeight: 700 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#34383C] h-14 px-5">
          <h2 id="pay-qr-title" className="text-base font-extrabold" style={{ color: "#FEFEFE" }}>
            {t("scanToPayTitle")}
          </h2>
          <button
            type="button"
            className="rounded-lg w-8 h-8 flex items-center justify-center"
            onClick={onClose}
            style={{ color: "#7A8084" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#FFFFFF";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#7A8084";
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x min-w-6 min-h-6 size-6">
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
            <span className="sr-only">Close</span>
          </button>
        </div>

        <div className="flex flex-col items-center gap-3 p-5">
          <p id="pay-qr-desc" className="text-sm font-medium text-center" style={{ color: "#7A8084" }}>
            {hintText}
          </p>

          <div
            className="w-full max-w-[260px] aspect-square rounded-lg border border-[#34383C] bg-white flex items-center justify-center overflow-hidden"
            style={{ boxShadow: "0 0 0 1px rgba(0,0,0,0.04) inset" }}
          >
            {isGenerating ? (
              <div className="text-sm font-semibold" style={{ color: "#7A8084" }}>
                {t("generatingQr")}
              </div>
            ) : qrDataUrl ? (
              // 用 img 显示 dataURL，避免 canvas 在某些设备上缩放发虚
              <img alt={t("qrCodeAlt")} src={qrDataUrl} className="w-full h-full object-contain" />
            ) : (
              <div className="text-sm font-semibold text-center px-4" style={{ color: "#7A8084" }}>
                {t("qrGenerateFailed")}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


