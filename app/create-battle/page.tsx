"use client";

export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { useI18n } from "../components/I18nProvider";
import { CreateBattlePageChrome } from "./CreateBattlePageChrome";

export default function CreateBattlePage() {
  const { t } = useI18n();
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-white">{t("loading")}</p>
    </div>
      }
    >
      <CreateBattlePageChrome />
      </Suspense>
      );
}
