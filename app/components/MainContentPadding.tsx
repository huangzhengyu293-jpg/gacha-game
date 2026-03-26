"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export default function MainContentPadding({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isFissionPage = pathname === "/fission";

  return <div className={`flex-1 ${isFissionPage ? "pt-0" : "pt-8"}`}>{children}</div>;
}
