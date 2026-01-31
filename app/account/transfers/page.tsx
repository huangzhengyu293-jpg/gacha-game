"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import AccountMobileMenu from "../components/AccountMobileMenu";
import DealsPaginationBar from "@/app/components/DealsPaginationBar";
import { api } from "@/app/lib/api";
import { useI18n } from "@/app/components/I18nProvider";
import { useAuth } from "@/app/hooks/useAuth";

dayjs.extend(customParseFormat);

const formatDate = (value?: string) => {
  if (!value) return "--";
  const parsed = dayjs(value, ["YYYY-MM-DD HH:mm:ss", "YYYY/MM/DD HH:mm:ss"], true);
  if (parsed.isValid()) return parsed.format("MM-DD-YYYY HH:mm");
  const fallback = dayjs(value);
  return fallback.isValid() ? fallback.format("MM-DD-YYYY HH:mm") : value;
};

function resolveStorageIdsCount(value: unknown): number {
  if (!value) return 0;
  if (Array.isArray(value)) {
    return value.filter((v) => String(v ?? "").trim()).length;
  }
  if (typeof value === "string") {
    // 兼容后端以逗号拼接的情况：例如 "1,2,3,"
    return value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean).length;
  }
  return 0;
}

export default function TransfersPage() {
  const { t } = useI18n();
  const { user } = useAuth() as any;
  const currentUserId = useMemo(() => {
    const id = (user as any)?.userInfo?.id ?? (user as any)?.id ?? (user as any)?.user_id;
    return id !== undefined && id !== null ? String(id) : "";
  }, [user]);

  // 该接口要求 page 参数；按后端习惯 1-based
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["accountTransferLogs", page],
    queryFn: () => api.getTransferLogs(page),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const parsed = useMemo(() => {
    // api.getTransferLogs 返回的是 ApiResponse，data 里才是 payload
    const payload = data?.data as any;

    // 注意：有些接口会返回 { data: [...], total, per_page, current_page }
    // 如果我们直接 root = payload.data，会丢失 total/per_page/current_page，所以这里分别解析 list 与 meta。
    const list =
      Array.isArray(payload?.data) ? payload.data :
      Array.isArray(payload?.list) ? payload.list :
      Array.isArray(payload?.data?.data) ? payload.data.data :
      Array.isArray(payload?.data?.list) ? payload.data.list :
      Array.isArray(payload) ? payload :
      [];

    // 分页：严格使用后端返回的 total / per_page
    const totalRaw =
      payload?.total ??
      payload?.data?.total ??
      payload?.data?.data?.total;
    const perPageRaw =
      payload?.per_page ??
      payload?.data?.per_page ??
      payload?.data?.data?.per_page;
    const currentPageRaw =
      payload?.current_page ??
      payload?.page ??
      payload?.data?.current_page ??
      payload?.data?.page ??
      payload?.data?.data?.current_page ??
      payload?.data?.data?.page;

    const total = Number(totalRaw);
    const perPage = Number(perPageRaw);
    const currentPage = Number(currentPageRaw);

    const resolvedPerPage =
      Number.isFinite(perPage) && perPage > 0
        ? perPage
        : Array.isArray(list) && list.length > 0
          ? list.length
          : 1;

    return {
      list,
      total: Number.isFinite(total) && total >= 0 ? total : 0,
      perPage: resolvedPerPage,
      currentPage: Number.isFinite(currentPage) && currentPage > 0 ? currentPage : page,
    };
  }, [data, page]);

  const lastPage = useMemo(() => {
    const total = parsed.total;
    const perPage = parsed.perPage;
    if (!Number.isFinite(total) || total <= 0) return 1;
    if (!Number.isFinite(perPage) || perPage <= 0) return 1;
    return Math.max(1, Math.ceil(total / perPage));
  }, [parsed.perPage, parsed.total]);

  const paginationMeta = useMemo(() => {
    const total = parsed.total;
    const currentPage = parsed.currentPage;
    const perPage = parsed.perPage;

    if (!Number.isFinite(total) || total <= 0) {
      return { start: 0, end: 0, total: 0 };
    }

    const safePerPage = Number.isFinite(perPage) && perPage > 0 ? perPage : 1;
    const safeCurrentPage = Number.isFinite(currentPage) && currentPage > 0 ? currentPage : 1;

    // start 用 per_page 推导；end 用「本页实际返回数量」推导，最后一页会更准确
    const start = (safeCurrentPage - 1) * safePerPage + 1;
    const endByListLength = (safeCurrentPage - 1) * safePerPage + (Array.isArray(parsed.list) ? parsed.list.length : 0);
    const end = Math.min(total, Math.max(start, endByListLength));
    return { start, end, total };
  }, [parsed.currentPage, parsed.list, parsed.perPage, parsed.total]);

  const hasPrev = parsed.currentPage > 1;
  const hasNext = parsed.currentPage < lastPage;

  return (
    <div className="w-full max-w-screen-xl px-4 pt-4 pb-40 mx-auto" style={{ color: "#7A8084" }}>
      <style>{`
        .acct-menu-item { background-color: transparent; color: #7A8084; }
        .acct-menu-item:hover { background-color: #34383C; color: #FFFFFF; }
        .acct-menu-item--active { background-color: #34383C; color: #FFFFFF; }
      `}</style>

      <div className="flex flex-col lg:flex-row items-start gap-0 lg:gap-10">
        <div className="hidden lg:flex flex-col gap-4 w-[220px] flex-none">
          <div className="flex flex-col gap-3 items-stretch w-full">
            <span className="text-sm font-bold text-white/40">{t("accountSection")}</span>
            <Link href="/account" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">{t("accountProfile")}</span></Link>
            <Link href="/account/deposits" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">{t("accountDepositsTitle")}</span></Link>
            <Link href="/account/withdrawals" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">{t("accountWithdrawalsTitle")}</span></Link>
            <Link href="/account/transfers" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item--active"><span className="font-bold">{t("accountTransfersTitle")}</span></Link>
            <Link href="/account/claims" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">{t("accountClaimsTitle")}</span></Link>
            <Link href="/account/sales" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">{t("accountSalesTitle")}</span></Link>
            <Link href="/account/battles" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">{t("accountBattlesTitle")}</span></Link>
            <Link href="/account/packs" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">{t("accountPacksTitle")}</span></Link>
            <Link href="/account/transactions" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">{t("accountTransactionsTitle")}</span></Link>
            <Link href="/account/draws" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">{t("accountDrawsTitle")}</span></Link>
            <Link href="/account/referrals" className="inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-colors interactive-focus relative font-bold select-none h-10 px-6 justify-start text-md acct-menu-item"><span className="font-bold">{t("referrals")}</span></Link>
          </div>
        </div>

        <div className="flex flex-col items-start w-full lg:flex-1 min-w-0 gap-2">
          <div className="flex justify-between items-center self-stretch pb-1 pt-4 lg:pt-0 min-w-0">
            <AccountMobileMenu />
            <h1 className="text-2xl font-bold hidden lg:block" style={{ color: "#FFFFFF" }}>
              {t("accountTransfersTitle")}
            </h1>
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-3 items-center justify-center py-12 self-stretch">
              <span className="font-semibold" style={{ color: "#FFFFFF" }}>{t("loading")}</span>
            </div>
          ) : isError ? (
            <div className="flex flex-col gap-3 items-center justify-center py-12 self-stretch">
              <span className="font-semibold" style={{ color: "#FFFFFF" }}>{t("loadFailedRetry")}</span>
            </div>
          ) : parsed.list.length === 0 ? (
            <div className="flex flex-col gap-3 items-center justify-center py-12 self-stretch">
              <span className="font-semibold" style={{ color: "#FFFFFF" }}>{t("noTransfers")}</span>
            </div>
          ) : (
            <div className="self-stretch space-y-6 z-10">
              <DealsPaginationBar
                start={paginationMeta.start}
                end={paginationMeta.end}
                total={paginationMeta.total}
                onPrev={() => hasPrev && setPage((p) => Math.max(1, p - 1))}
                onNext={() => hasNext && setPage((p) => Math.min(lastPage, p + 1))}
                disabledPrev={!hasPrev}
                disabledNext={!hasNext}
              />

              {parsed.list.map((item: any, index: number) => {
                const storageCount = resolveStorageIdsCount(item?.storage_ids ?? item?.storageIds);
                const fromUserIdRaw = item?.fromuser?.id ?? item?.fromuser?.user_id ?? item?.fromUser?.id ?? item?.fromUser?.user_id;
                const toUserIdRaw = item?.touser?.id ?? item?.touser?.user_id ?? item?.toUser?.id ?? item?.toUser?.user_id;
                const fromUserId = fromUserIdRaw !== undefined && fromUserIdRaw !== null ? String(fromUserIdRaw) : "";
                const toUserId = toUserIdRaw !== undefined && toUserIdRaw !== null ? String(toUserIdRaw) : "";
                const fromUserName = String(item?.fromuser?.name ?? item?.fromUser?.name ?? "—");
                const toUserName = String(item?.touser?.name ?? item?.toUser?.name ?? "—");
                const beanRealRaw = item?.bean_real ?? item?.beanReal ?? item?.real_bean ?? item?.realBean;
                const feeRaw = item?.handling_fee_bean ?? item?.handlingFeeBean ?? item?.fee ?? item?.fee_bean;
                const beanReal = Number(beanRealRaw);
                const fee = Number(feeRaw);
                const createdAt = formatDate(String(item?.created_at ?? item?.createdAt ?? item?.time ?? item?.updated_at ?? ""));
                const titleKey =
                  currentUserId && toUserId && toUserId === currentUserId
                    ? "transferLogTitleReceived"
                    : "transferLogTitle";

                return (
                  <div key={item?.id ?? index} className="rounded-lg p-6" style={{ backgroundColor: "#22272B" }}>
                    <div className="flex justify-between items-center pb-4" style={{ color: "#FFFFFF" }}>
                      <span className="truncate text-lg font-bold mr-2">
                        {t(titleKey).replace("{count}", String(storageCount))}
                      </span>
                      <span className="whitespace-nowrap" style={{ fontSize: 16, fontFamily: "Urbanist, sans-serif" }}>
                        {createdAt}
                      </span>
                    </div>
                    <div className="flex w-full h-[1px] mb-6" style={{ backgroundColor: "#34383C" }} />
                    <div className="flex gap-10" style={{ color: "#FFFFFF" }}>
                      <div className="flex flex-col items-start gap-2">
                        <span className="font-semibold">{t("transferLogFromUser")}:</span>
                        <span className="font-semibold">{t("transferLogToUser")}:</span>
                        <span className="font-semibold">{t("transferLogBeanReal")}:</span>
                        <span className="font-semibold">{t("transferLogHandlingFee")}:</span>
                      </div>
                      <div className="flex flex-col items-start gap-2 overflow-hidden">
                        <span className="truncate max-w-full">{fromUserName}</span>
                        <span className="truncate max-w-full">{toUserName}</span>
                        <span className="truncate max-w-full">{Number.isFinite(beanReal) ? `$${beanReal.toFixed(2)}` : "—"}</span>
                        <span className="truncate max-w-full">{Number.isFinite(fee) ? `$${fee.toFixed(2)}` : "—"}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              <DealsPaginationBar
                start={paginationMeta.start}
                end={paginationMeta.end}
                total={paginationMeta.total}
                disabledPrev
                disabledNext
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

