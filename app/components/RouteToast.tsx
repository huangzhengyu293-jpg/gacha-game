"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function RouteToast() {
  const router = useRouter();
  const sp = useSearchParams();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const toastParam = sp.get("toast");
  const nameParam = sp.get("name");

  useEffect(() => {
    if (toastParam === "created") {
      setTitle("创建成功");
      setMessage(nameParam ? `“${decodeURIComponent(nameParam)}” 已添加到礼包列表。` : "礼包已添加到列表。");
      setOpen(true);
      const t = window.setTimeout(() => {
        setOpen(false);
        router.replace("/packs");
      }, 2000);
      return () => window.clearTimeout(t);
    }
  }, [toastParam, nameParam, router]);

  if (!open) return null;

  return (
    <div role="region" aria-label="Notifications" tabIndex={-1}>
      <ol tabIndex={-1} className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
        <li
          role="status"
          aria-live="off"
          aria-atomic="true"
          tabIndex={0}
          data-state="open"
          className="group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md p-6 pr-8 shadow-lg transition-all border-0"
          style={{ backgroundColor: "#22272B", color: "#FAFAFA" }}
        >
          <div className="grid gap-1">
            <div className="text-base font-semibold">{title}</div>
            <div className="text-base font-semibold leading-5" style={{ color: "#FAFAFA" }}>
              {message}
            </div>
          </div>
          <button
            type="button"
            className="absolute right-2 top-2 rounded-md p-1 opacity-0 transition-opacity focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100"
            onClick={() => {
              setOpen(false);
              router.replace("/packs");
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-6"
            >
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
          </button>
        </li>
      </ol>
    </div>
  );
}
