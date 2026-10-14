import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/Supabase";

const TABLE = "wedding_gift_submissions";
const PAYMENT_BUCKET = "gift-payment-proofs";

const TABS = [
  { key: "PENDING", label: "Pending" },
  { key: "APPROVED", label: "Approved" },
  { key: "REJECTED", label: "Rejected" },
  { key: "ALL", label: "All" },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatAmount(amount) {
  const value = Number(amount ?? 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function displayName(value) {
  return value?.trim() || "Guest";
}

const statusOf = (item) => (item.status || "PENDING").toUpperCase();

function normalizeStoragePath(value, bucket) {
  if (!value?.trim()) return null;

  let path = value.trim();

  if (/^https?:\/\//i.test(path)) {
    try {
      const url = new URL(path);
      const marker = "/storage/v1/object/";
      const index = url.pathname.indexOf(marker);
      if (index < 0) return null;

      let rest = url.pathname.slice(index + marker.length);
      rest = rest.replace(/^(public|sign|authenticated)\//, "");
      if (rest.startsWith(`${bucket}/`)) rest = rest.slice(bucket.length + 1);

      return rest ? decodeURIComponent(rest) : null;
    } catch {
      return null;
    }
  }

  path = path.replace(/^\/+/, "");
  if (path.startsWith(`${bucket}/`)) path = path.slice(bucket.length + 1);

  return path || null;
}

async function getImageUrl(pathValue, bucket) {
  const path = normalizeStoragePath(pathValue, bucket);

  if (!path) return { url: null, error: "No valid image path is saved." };

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 3600);

  if (!error && data?.signedUrl) return { url: data.signedUrl, error: null };

  const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path);

  return {
    url: publicData?.publicUrl || null,
    error: error?.message || null,
  };
}

function csvCell(value) {
  const text = String(value ?? "").replace(/"/g, '""');
  return `"${text}"`;
}

function downloadCsv(rows) {
  const header = [
    "Name",
    "Relationship",
    "Email",
    "Phone",
    "Amount",
    "Status",
    "Message",
    "Submitted",
  ];

  const lines = rows.map((r) =>
    [
      r.guest_name,
      r.relationship,
      r.email,
      r.phone,
      r.amount,
      statusOf(r),
      r.message,
      r.created_at,
    ]
      .map(csvCell)
      .join(",")
  );

  const blob = new Blob([[header.map(csvCell).join(","), ...lines].join("\n")], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "wedding-gifts.csv";
  link.click();
  URL.revokeObjectURL(url);
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function AdminPanel() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [submissions, setSubmissions] = useState([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("PENDING");
  const [newestFirst, setNewestFirst] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [imageModal, setImageModal] = useState(null);

  const checkSession = useCallback(async () => {
    setCheckingSession(true);

    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError) {
      setAuthenticated(false);
      setIsAdmin(false);
      setErrorMessage(sessionError.message);
      setCheckingSession(false);
      return;
    }

    if (!sessionData.session?.user) {
      setAuthenticated(false);
      setIsAdmin(false);
      setCheckingSession(false);
      return;
    }

    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      setAuthenticated(false);
      setIsAdmin(false);
      setErrorMessage(error?.message || "Unable to verify account.");
      setCheckingSession(false);
      return;
    }

    const user = data.user;
    const configuredAdminEmail = String(
      import.meta.env.VITE_ADMIN_EMAIL || ""
    ).toLowerCase();

    const authorized =
      user.app_metadata?.role === "admin" ||
      Boolean(
        configuredAdminEmail &&
          (user.email || "").toLowerCase() === configuredAdminEmail
      );

    setAuthenticated(true);
    setIsAdmin(authorized);
    setCheckingSession(false);
    setErrorMessage(
      authorized
        ? ""
        : "This account is not authorized as an admin. Add role=admin to app_metadata in Supabase, then sign out and sign in again."
    );
  }, []);

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select(
          "id, guest_name, email, phone, relationship, amount, message, screenshot_path, status, created_at"
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Submission query failed:", error);
        setSubmissions([]);
        setErrorMessage(`Could not load submissions: ${error.message}`);
        return;
      }

      const hydrated = await Promise.all(
        (data || []).map(async (row) => {
          const payment = await getImageUrl(row.screenshot_path, PAYMENT_BUCKET);
          return { ...row, paymentUrl: payment.url, paymentError: payment.error };
        })
      );

      setSubmissions(hydrated);
    } catch (error) {
      console.error("Unexpected loading error:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unexpected error loading submissions."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      window.setTimeout(() => void checkSession(), 0);
    });

    return () => subscription.unsubscribe();
  }, [checkSession]);

  useEffect(() => {
    if (authenticated && isAdmin) void loadSubmissions();
    else setSubmissions([]);
  }, [authenticated, isAdmin, loadSubmissions]);

  /* Success messages disappear on their own. */
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  /* Esc closes the image viewer. */
  useEffect(() => {
    if (!imageModal) return;
    const onKey = (event) => event.key === "Escape" && setImageModal(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [imageModal]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoginLoading(true);
    setErrorMessage("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage(error.message);
      } else {
        setPassword("");
        await checkSession();
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to sign in."
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setAuthenticated(false);
    setIsAdmin(false);
    setSubmissions([]);
  };

  const updateStatus = async (item, status) => {
    // Rejecting is the only action that asks first; approve/reset are reversible.
    if (
      status === "REJECTED" &&
      !window.confirm(`Reject ${displayName(item.guest_name)}'s gift?`)
    ) {
      return;
    }

    setUpdatingId(item.id);
    setErrorMessage("");

    try {
      const { data, error } = await supabase
        .from(TABLE)
        .update({ status })
        .eq("id", item.id)
        .select("id, status")
        .maybeSingle();

      if (error) {
        setErrorMessage(`Could not update status: ${error.message}`);
        return;
      }

      if (!data) {
        setErrorMessage("No row was updated. Check your admin UPDATE policy.");
        return;
      }

      setSubmissions((current) =>
        current.map((row) => (row.id === item.id ? { ...row, status } : row))
      );

      setNotice(`${displayName(item.guest_name)} marked ${status.toLowerCase()}.`);
    } finally {
      setUpdatingId(null);
    }
  };

  const stats = useMemo(() => {
    const result = {
      ALL: { count: submissions.length, amount: 0 },
      PENDING: { count: 0, amount: 0 },
      APPROVED: { count: 0, amount: 0 },
      REJECTED: { count: 0, amount: 0 },
    };

    submissions.forEach((item) => {
      const key = statusOf(item);
      const amount = Number(item.amount || 0);
      const safe = Number.isFinite(amount) ? amount : 0;

      if (result[key]) {
        result[key].count += 1;
        result[key].amount += safe;
      }
      result.ALL.amount += safe;
    });

    return result;
  }, [submissions]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return submissions
      .filter((item) => {
        if (tab !== "ALL" && statusOf(item) !== tab) return false;
        if (!term) return true;

        return [
          item.guest_name,
          item.email,
          item.phone,
          item.relationship,
          item.amount,
          item.message,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(term);
      })
      .sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return newestFirst ? bTime - aTime : aTime - bTime;
      });
  }, [submissions, search, tab, newestFirst]);

  /* ---------------------------- Loading ---------------------------- */

  if (checkingSession) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#21070f] p-6 text-[#f6e6c5]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-2 border-[#b99a58] border-t-transparent" />
          <p className="text-sm text-[#cbb58c]">Checking admin session…</p>
        </div>
      </main>
    );
  }

  /* ----------------------------- Login ----------------------------- */

  if (!authenticated || !isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#21070f] px-4 py-10 text-[#f6e6c5]">
        <div className="w-full max-w-md rounded-3xl border border-[#74512d]/70 bg-[#330d1b] p-7 shadow-2xl sm:p-9">
          <div className="mb-7 text-center">
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-[#b99a58]">
              Karthik &amp; Meenakshi
            </p>
            <h1 className="font-serif text-3xl">Wedding Admin</h1>
            <p className="mt-2 text-sm text-[#cbb58c]">
              Sign in to manage gift submissions
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm text-[#e8d5b0]">
                Email address
              </span>
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@example.com"
                className="w-full rounded-xl border border-[#74512d] bg-[#21070f] px-4 py-3 text-[#fff3d7] outline-none placeholder:text-[#876f58] focus:border-[#d0ae67]"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-[#e8d5b0]">Password</span>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-xl border border-[#74512d] bg-[#21070f] px-4 py-3 text-[#fff3d7] outline-none placeholder:text-[#876f58] focus:border-[#d0ae67]"
              />
            </label>

            {errorMessage && <ErrorBox>{errorMessage}</ErrorBox>}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full rounded-xl bg-gradient-to-r from-[#b78a45] to-[#e0c47c] px-4 py-3 font-semibold text-[#2b0b12] transition hover:brightness-110 disabled:opacity-60"
            >
              {loginLoading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          {authenticated && !isAdmin && (
            <button
              type="button"
              onClick={handleSignOut}
              className="mt-4 w-full rounded-xl border border-[#74512d] px-4 py-3 text-sm hover:bg-[#481327]"
            >
              Sign out
            </button>
          )}

          <p className="mt-6 text-center text-xs leading-5 text-[#9c8066]">
            Admin access is restricted. Guest submissions are not publicly
            readable.
          </p>
        </div>
      </main>
    );
  }

  /* ---------------------------- Dashboard --------------------------- */

  return (
    <main className="min-h-screen bg-[#21070f] text-[#f6e6c5]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* Header */}
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 text-xs uppercase tracking-[0.3em] text-[#b99a58]">
              Karthik &amp; Meenakshi
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl">Gift Submissions</h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void loadSubmissions()}
              disabled={loading}
              className="rounded-full border border-[#74512d] px-4 py-2 text-sm hover:bg-[#481327] disabled:opacity-50"
            >
              {loading ? "Refreshing…" : "↻ Refresh"}
            </button>
            <button
              type="button"
              onClick={() => downloadCsv(filtered)}
              disabled={filtered.length === 0}
              className="rounded-full border border-[#74512d] px-4 py-2 text-sm hover:bg-[#481327] disabled:opacity-50"
            >
              ⤓ Export CSV
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-full border border-[#74512d] px-4 py-2 text-sm hover:bg-[#481327]"
            >
              Sign out
            </button>
          </div>
        </header>

        {/* Summary */}
        <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Total received"
            value={formatAmount(stats.ALL.amount)}
            footnote={`${stats.ALL.count} submissions`}
          />
          <StatCard
            label="Needs review"
            value={String(stats.PENDING.count)}
            footnote={formatAmount(stats.PENDING.amount)}
            accent="amber"
          />
          <StatCard
            label="Approved"
            value={formatAmount(stats.APPROVED.amount)}
            footnote={`${stats.APPROVED.count} verified`}
            accent="green"
          />
          <StatCard
            label="Rejected"
            value={String(stats.REJECTED.count)}
            footnote={formatAmount(stats.REJECTED.amount)}
            accent="red"
          />
        </section>

        {/* Messages */}
        {errorMessage && (
          <div className="mb-4">
            <ErrorBox>{errorMessage}</ErrorBox>
          </div>
        )}
        {notice && (
          <div
            role="status"
            className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200"
          >
            ✓ {notice}
          </div>
        )}

        {/* Filters */}
        <section className="mb-5 space-y-3">
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
                  tab === key
                    ? "border-[#d6b96f] bg-[#d6b96f] font-semibold text-[#2b0b12]"
                    : "border-[#74512d] text-[#e8d5b0] hover:bg-[#481327]"
                }`}
              >
                {label}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    tab === key
                      ? "bg-[#2b0b12]/15"
                      : "bg-[#f6e6c5]/10 text-[#cbb58c]"
                  }`}
                >
                  {stats[key].count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, phone, email or relationship…"
              className="min-w-0 flex-1 rounded-full border border-[#74512d]/80 bg-[#2b0b15] px-5 py-3 text-sm text-[#fff3d7] outline-none placeholder:text-[#876f58] focus:border-[#d0ae67]"
            />
            <button
              type="button"
              onClick={() => setNewestFirst((value) => !value)}
              className="rounded-full border border-[#74512d] px-5 py-3 text-sm hover:bg-[#481327]"
            >
              ↕ {newestFirst ? "Newest first" : "Oldest first"}
            </button>
          </div>
        </section>

        {/* List */}
        {loading && submissions.length === 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[0, 1].map((n) => (
              <div
                key={n}
                className="h-64 animate-pulse rounded-3xl border border-[#5e302d]/60 bg-[#2b0b15]"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState>
            <h3 className="font-serif text-xl">Nothing here</h3>
            <p className="mt-2 text-sm text-[#9c8066]">
              {submissions.length === 0
                ? "No records were returned. Refresh or check the error above."
                : search
                  ? "No submissions match your search."
                  : `No ${tab === "ALL" ? "" : tab.toLowerCase() + " "}submissions.`}
            </p>
          </EmptyState>
        ) : (
          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
            {filtered.map((item) => (
              <SubmissionCard
                key={item.id}
                item={item}
                busy={updatingId === item.id}
                onUpdate={updateStatus}
                onOpenImage={setImageModal}
              />
            ))}
          </div>
        )}

        <footer className="mt-10 pb-4 text-center text-xs uppercase tracking-[0.2em] text-[#8d6b50]">
          ♡ With love &amp; gratitude
        </footer>
      </div>

      {/* Image viewer */}
      {imageModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setImageModal(null)}
        >
          <div
            className="max-h-[92vh] w-full max-w-4xl rounded-2xl border border-[#74512d] bg-[#21070f] p-3 sm:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="break-words font-serif text-lg">
                {imageModal.title}
              </h3>
              <button
                type="button"
                onClick={() => setImageModal(null)}
                aria-label="Close image"
                className="rounded-full border border-[#74512d] px-3 py-1.5 text-sm hover:bg-[#481327]"
              >
                ✕
              </button>
            </div>

            <img
              src={imageModal.url}
              alt={imageModal.title}
              className="mx-auto max-h-[78vh] max-w-full rounded-lg object-contain"
            />
          </div>
        </div>
      )}
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* Pieces                                                              */
/* ------------------------------------------------------------------ */

function SubmissionCard({ item, busy, onUpdate, onOpenImage }) {
  const status = statusOf(item);
  const name = displayName(item.guest_name);

  const accent =
    status === "APPROVED"
      ? "border-l-emerald-400/70"
      : status === "REJECTED"
        ? "border-l-red-400/70"
        : "border-l-amber-400/70";

  const openProof = () =>
    onOpenImage({ url: item.paymentUrl, title: `${name} — payment screenshot` });

  return (
    <article
      className={`overflow-hidden rounded-3xl border border-[#74512d]/70 border-l-4 bg-gradient-to-br from-[#421226] to-[#2b0b15] shadow-xl ${accent}`}
    >
      <div className="p-5">
        {/* Top: who + how much */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div
              aria-hidden="true"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#b99a58]/50 bg-[#6a3b31] font-serif text-lg"
            >
              {name.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0">
              <h3 className="truncate font-serif text-xl">{name}</h3>
              <p className="text-xs text-[#b99a80]">
                {item.relationship ? `${item.relationship} · ` : ""}
                {formatDate(item.created_at)}
              </p>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <p className="font-serif text-xl text-[#e6c97c]">
              {formatAmount(item.amount)}
            </p>
            <StatusBadge status={status} />
          </div>
        </div>

        {/* Contact */}
        {(item.phone || item.email) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {item.phone && (
              <a
                href={`tel:${item.phone}`}
                className="rounded-full border border-[#74512d] px-3 py-1.5 text-xs text-[#e8d5b0] hover:bg-[#481327]"
              >
                ☎ {item.phone}
              </a>
            )}
            {item.email && (
              <a
                href={`mailto:${item.email}`}
                className="max-w-full truncate rounded-full border border-[#74512d] px-3 py-1.5 text-xs text-[#e8d5b0] hover:bg-[#481327]"
              >
                ✉ {item.email}
              </a>
            )}
          </div>
        )}

        {/* Message */}
        {item.message && (
          <blockquote className="mt-4 break-words rounded-2xl bg-[#21070f]/60 px-4 py-3 text-sm italic leading-6 text-[#d6c1a1]">
            “{item.message}”
          </blockquote>
        )}

        {/* Payment proof */}
        <div className="mt-4">
          {item.paymentUrl ? (
            <button
              type="button"
              onClick={openProof}
              className="group flex w-full items-center gap-4 rounded-2xl border border-[#74512d]/50 bg-[#21070f]/60 p-3 text-left transition hover:border-[#d0ae67]/60"
            >
              <img
                src={item.paymentUrl}
                alt={`${name} payment proof`}
                loading="lazy"
                className="h-20 w-16 shrink-0 rounded-lg bg-black/30 object-cover object-top"
              />
              <div className="min-w-0">
                <p className="text-sm text-[#e9d4a6]">Payment screenshot</p>
                <p className="mt-0.5 text-xs text-[#b99a80] group-hover:text-[#d6b96f]">
                  Tap to view full size ↗
                </p>
              </div>
            </button>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#74512d]/60 bg-[#21070f]/60 p-4 text-sm text-[#cbb58c]">
              Screenshot unavailable
              <span className="block text-xs text-[#9c8066]">
                {item.paymentError || "No image URL."}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-5 grid grid-cols-2 gap-2">
          {status !== "APPROVED" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void onUpdate(item, "APPROVED")}
              className="rounded-full bg-[#d6b96f] px-4 py-3 text-sm font-semibold text-[#2b0b12] transition hover:brightness-110 disabled:opacity-50"
            >
              {busy ? "Updating…" : "✓ Approve"}
            </button>
          )}

          {status !== "REJECTED" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void onUpdate(item, "REJECTED")}
              className="rounded-full border border-red-400/50 px-4 py-3 text-sm text-red-200 transition hover:bg-red-950/40 disabled:opacity-50"
            >
              ✕ Reject
            </button>
          )}

          {status !== "PENDING" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void onUpdate(item, "PENDING")}
              className="col-span-2 rounded-full border border-[#74512d] px-4 py-2.5 text-sm text-[#e8d5b0] hover:bg-[#481327] disabled:opacity-50"
            >
              ↺ Move back to pending
            </button>
          )}
        </div>

        <details className="mt-4 text-xs text-[#a98c6c]">
          <summary className="cursor-pointer select-none hover:text-[#e8d5b0]">
            Technical details
          </summary>
          <div className="mt-2 space-y-1 break-all rounded-xl bg-[#21070f]/70 p-3">
            <p>
              <strong>Payment path:</strong> {item.screenshot_path || "(empty)"}
            </p>
            <p>
              <strong>Payment error:</strong> {item.paymentError || "(none)"}
            </p>
          </div>
        </details>
      </div>
    </article>
  );
}

function ErrorBox({ children }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-500/40 bg-red-950/40 p-3 text-sm text-red-200"
    >
      {children}
    </div>
  );
}

function EmptyState({ children }) {
  return (
    <div className="rounded-3xl border border-dashed border-[#5e302d] p-12 text-center">
      {children}
    </div>
  );
}

function StatCard({ label, value, footnote, accent }) {
  const dot =
    accent === "amber"
      ? "bg-amber-400"
      : accent === "green"
        ? "bg-emerald-400"
        : accent === "red"
          ? "bg-red-400"
          : "bg-[#b99a58]";

  return (
    <div className="rounded-2xl border border-[#5e302d]/70 bg-[#2b0b15] p-4">
      <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-[#b99a80]">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        {label}
      </p>
      <p className="mt-2 break-words font-serif text-xl sm:text-2xl">{value}</p>
      {footnote && <p className="mt-1 text-xs text-[#9c8066]">{footnote}</p>}
    </div>
  );
}

function StatusBadge({ status }) {
  const classes =
    status === "APPROVED"
      ? "border-emerald-400/30 bg-emerald-950/40 text-emerald-200"
      : status === "REJECTED"
        ? "border-red-400/30 bg-red-950/40 text-red-200"
        : "border-amber-400/30 bg-amber-950/30 text-amber-200";

  const label =
    status === "APPROVED"
      ? "✓ Approved"
      : status === "REJECTED"
        ? "✕ Rejected"
        : "◷ Pending";

  return (
    <span
      className={`mt-1 inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] ${classes}`}
    >
      {label}
    </span>
  );
}