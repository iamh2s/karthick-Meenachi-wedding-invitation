
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/Supabase";

const TABLE = "wedding_gift_submissions";
const PAYMENT_BUCKET = "gift-payment-proofs";
const PROFILE_BUCKET = "wedding-gift-profiles";

const PROFILE_IMAGE_URL =
  "https://vseahqqnhsgiatxlheow.supabase.co/storage/v1/object/public/wedding-gift-profiles/profiles/cf32b288-b8dc-4686-9c14-4dd154ea3e34.jpg";

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

      if (rest.startsWith(`${bucket}/`)) {
        rest = rest.slice(bucket.length + 1);
      }

      return rest ? decodeURIComponent(rest) : null;
    } catch {
      return null;
    }
  }

  path = path.replace(/^\/+/, "");

  if (path.startsWith(`${bucket}/`)) {
    path = path.slice(bucket.length + 1);
  }

  return path || null;
}

async function getImageUrl(pathValue, bucket) {
  const path = normalizeStoragePath(pathValue, bucket);

  if (!path) {
    return {
      url: null,
      error: "No valid image path is saved.",
    };
  }

  // Try a signed URL first.
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 3600);

  if (!error && data?.signedUrl) {
    return {
      url: data.signedUrl,
      error: null,
    };
  }

  console.warn("Signed URL failed:", {
    bucket,
    path,
    error: error?.message,
  });

  // Public URL fallback.
  const { data: publicData } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return {
    url: publicData?.publicUrl || null,
    error: error?.message || null,
  };
}

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
  const [statusFilter, setStatusFilter] = useState("ALL");
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

    const sessionUser = sessionData.session?.user;

    if (!sessionUser) {
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
    const role = user.app_metadata?.role;

    const configuredAdminEmail = String(
      import.meta.env.VITE_ADMIN_EMAIL || ""
    ).toLowerCase();

    const matchesAdminEmail =
      configuredAdminEmail &&
      (user.email || "").toLowerCase() === configuredAdminEmail;

    const authorized = role === "admin" || Boolean(matchesAdminEmail);

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
    setNotice("");

    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select(
          "id, guest_name, email, phone, relationship, amount, message, screenshot_path, user_image, status, created_at"
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Submission query failed:", error);
        setSubmissions([]);
        setErrorMessage(`Could not load submissions: ${error.message}`);
        return;
      }

      const rows = data || [];

      const hydratedRows = await Promise.all(
        rows.map(async (row) => {
          const [payment, profile] = await Promise.all([
            getImageUrl(row.screenshot_path, PAYMENT_BUCKET),
            getImageUrl(row.user_image, PROFILE_BUCKET),
          ]);

          return {
            ...row,
            paymentUrl: payment.url,
            paymentError: payment.error,
            profileUrl: profile.url,
            profileError: profile.error,
          };
        })
      );

      setSubmissions(hydratedRows);
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
    if (authenticated && isAdmin) {
      void loadSubmissions();
    } else {
      setSubmissions([]);
    }
  }, [authenticated, isAdmin, loadSubmissions]);

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
    const confirmed = window.confirm(
      `Change ${displayName(item.guest_name)}'s status to ${status}?`
    );

    if (!confirmed) return;

    setUpdatingId(item.id);
    setErrorMessage("");
    setNotice("");

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
        setErrorMessage(
          "No row was updated. Check your admin UPDATE policy."
        );
        return;
      }

      setSubmissions((current) =>
        current.map((row) =>
          row.id === item.id ? { ...row, status } : row
        )
      );

      setNotice(
        `${displayName(item.guest_name)} marked ${status}.`
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return submissions
      .filter((item) => {
        const currentStatus = (
          item.status || "PENDING"
        ).toUpperCase();

        const statusMatches =
          statusFilter === "ALL" ||
          currentStatus === statusFilter;

        const searchableText = [
          item.guest_name,
          item.email,
          item.phone,
          item.relationship,
          item.amount,
          item.message,
          item.status,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return (
          statusMatches &&
          (!term || searchableText.includes(term))
        );
      })
      .sort((a, b) => {
        const aTime = a.created_at
          ? new Date(a.created_at).getTime()
          : 0;

        const bTime = b.created_at
          ? new Date(b.created_at).getTime()
          : 0;

        return newestFirst ? bTime - aTime : aTime - bTime;
      });
  }, [submissions, search, statusFilter, newestFirst]);

  const stats = useMemo(() => {
    const count = (status) =>
      submissions.filter(
        (item) =>
          (item.status || "PENDING").toUpperCase() === status
      ).length;

    const sum = (status) =>
      submissions.reduce((total, item) => {
        if (
          (item.status || "PENDING").toUpperCase() !== status
        ) {
          return total;
        }

        const amount = Number(item.amount || 0);

        return total + (Number.isFinite(amount) ? amount : 0);
      }, 0);

    return {
      total: submissions.length,
      pending: count("PENDING"),
      approved: count("APPROVED"),
      rejected: count("REJECTED"),
      approvedAmount: sum("APPROVED"),
      pendingAmount: sum("PENDING"),
    };
  }, [submissions]);

  if (checkingSession) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#21070f] p-6 text-[#f6e6c5]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-2 border-[#b99a58] border-t-transparent" />
          <p className="text-sm text-[#cbb58c]">
            Checking admin session…
          </p>
        </div>
      </main>
    );
  }

  if (!authenticated || !isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#21070f] px-4 py-10 text-[#f6e6c5]">
        <div className="w-full max-w-md rounded-3xl border border-[#74512d]/70 bg-[#330d1b] p-7 shadow-2xl sm:p-9">
          <div className="mb-7 text-center">
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-[#b99a58]">
              Karthik & Meenakshi
            </p>

            <h1 className="font-serif text-3xl">
              Wedding Admin
            </h1>

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
              <span className="mb-2 block text-sm text-[#e8d5b0]">
                Password
              </span>

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

            {errorMessage && (
              <ErrorBox>{errorMessage}</ErrorBox>
            )}

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
            Admin access is restricted. Guest submissions are not publicly readable.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#21070f] text-[#f6e6c5]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-[#b99a58]">
              Karthik & Meenakshi
            </p>

            <h1 className="font-serif text-3xl sm:text-4xl">
              Wedding Gift Admin
            </h1>

            <p className="mt-2 text-sm text-[#b99a80]">
              Review guest details, profile photos, and payment proofs.
            </p>
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
              onClick={handleSignOut}
              className="rounded-full border border-[#74512d] px-4 py-2 text-sm hover:bg-[#481327]"
            >
              Sign out
            </button>
          </div>
        </header>

        {errorMessage && (
          <div className="mb-5">
            <ErrorBox>{errorMessage}</ErrorBox>
          </div>
        )}

        {notice && (
          <div className="mb-5 rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-4 text-sm text-emerald-200">
            {notice}
          </div>
        )}

        <section className="mb-7 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Total guests" value={String(stats.total)} />
          <StatCard label="Pending" value={String(stats.pending)} />
          <StatCard label="Approved" value={String(stats.approved)} />
          <StatCard label="Rejected" value={String(stats.rejected)} />
          <StatCard
            label="Approved gifts"
            value={formatAmount(stats.approvedAmount)}
            footnote={`${formatAmount(stats.pendingAmount)} pending`}
          />
        </section>

        <section className="mb-7 flex flex-col gap-3 rounded-2xl border border-[#5e302d]/70 bg-[#2b0b15] p-4 sm:flex-row sm:items-center">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search guest, email, phone or relationship…"
            className="min-w-0 flex-1 rounded-full border border-[#74512d]/80 bg-[#21070f] px-4 py-3 text-sm text-[#fff3d7] outline-none placeholder:text-[#876f58] focus:border-[#d0ae67]"
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-[#74512d] bg-[#21070f] px-4 py-3 text-sm text-[#f6e6c5] outline-none"
          >
            <option value="ALL">All submissions</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <button
            type="button"
            onClick={() => setNewestFirst((value) => !value)}
            className="rounded-full border border-[#74512d] px-4 py-3 text-sm hover:bg-[#481327]"
          >
            ↕ {newestFirst ? "Newest first" : "Oldest first"}
          </button>
        </section>

        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-serif text-2xl">
            Gift Submissions
          </h2>

          <span className="rounded-full border border-[#74512d]/70 px-3 py-1.5 text-xs text-[#d6b96f]">
            {filtered.length} {filtered.length === 1 ? "guest" : "guests"}
          </span>
        </div>

        {loading && submissions.length === 0 ? (
          <EmptyState>Loading gift submissions…</EmptyState>
        ) : filtered.length === 0 ? (
          <EmptyState>
            <h3 className="font-serif text-xl">
              No submissions found
            </h3>

            <p className="mt-2 text-sm text-[#9c8066]">
              {submissions.length === 0
                ? "No records were returned. Refresh or check the error above."
                : "Try another search term or status filter."}
            </p>
          </EmptyState>
        ) : (
          <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2">
            {filtered.map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-3xl border border-[#74512d]/70 bg-gradient-to-br from-[#421226] to-[#2b0b15] shadow-xl"
              >
                <div className="p-5 sm:p-6">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 text-center">
                      {item.profileUrl ? (
                        <button
                          type="button"
                          onClick={() =>
                            setImageModal({
                              url: item.profileUrl,
                              title: `${displayName(item.guest_name)} — profile photo`,
                            })
                          }
                          className="block h-20 w-20 overflow-hidden rounded-2xl border border-[#b99a58]/60 bg-[#5a2a2d]"
                        >
                          <img
                            src={item.profileUrl}
                            alt={`${displayName(item.guest_name)} profile`}
                            className="h-full w-full object-cover"
                            loading="lazy"
                            onError={() => {
                              setSubmissions((current) =>
                                current.map((row) =>
                                  row.id === item.id
                                    ? {
                                        ...row,
                                        profileUrl: null,
                                        profileError: "Image URL could not be loaded.",
                                      }
                                    : row
                                )
                              );
                            }}
                          />
                        </button>
                      ) : (
                        <div className="grid h-20 w-20 place-items-center rounded-2xl border border-[#b99a58]/40 bg-[#6a3b31] font-serif text-2xl">
                          {displayName(item.guest_name).charAt(0).toUpperCase()}
                        </div>
                      )}

                      <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-[#9d795d]">
                        Guest
                      </p>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <h3 className="break-words font-serif text-2xl">
                            {displayName(item.guest_name)}
                          </h3>

                          <p className="mt-1 font-medium text-[#d6b96f]">
                            {formatAmount(item.amount)}
                          </p>

                          <p className="mt-2 text-xs text-[#b99a80]">
                            Submitted {formatDate(item.created_at)}
                          </p>
                        </div>

                        <StatusBadge status={item.status} />
                      </div>

                      <div className="mt-4 space-y-2.5 break-words text-sm text-[#d6c1a1]">
                        {item.relationship && (
                          <DetailLine icon="♧" label="Relationship">
                            {item.relationship}
                          </DetailLine>
                        )}

                        {item.email && (
                          <DetailLine icon="✉" label="Email">
                            <a href={`mailto:${item.email}`} className="hover:underline">
                              {item.email}
                            </a>
                          </DetailLine>
                        )}

                        {item.phone && (
                          <DetailLine icon="☎" label="Phone">
                            <a href={`tel:${item.phone}`} className="hover:underline">
                              {item.phone}
                            </a>
                          </DetailLine>
                        )}

                        {item.message && (
                          <DetailLine icon="▱" label="Message">
                            {item.message}
                          </DetailLine>
                        )}
                      </div>

                      {!item.profileUrl && (
                        <div className="mt-4 space-y-2 text-xs text-amber-300">
                          <p>
                            Profile photo unavailable: {item.profileError || "No image URL."}
                          </p>

                          <a
                            href={PROFILE_IMAGE_URL}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-block underline"
                          >
                            Open saved profile image
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 border-t border-[#74512d]/50 pt-5">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h4 className="font-serif text-base text-[#e9d4a6]">
                        Payment Screenshot
                      </h4>

                      {item.paymentUrl && (
                        <button
                          type="button"
                          onClick={() =>
                            setImageModal({
                              url: item.paymentUrl,
                              title: `${displayName(item.guest_name)} — payment screenshot`,
                            })
                          }
                          className="text-xs text-[#d6b96f] hover:underline"
                        >
                          View full image ↗
                        </button>
                      )}
                    </div>

                    {item.paymentUrl ? (
                      <button
                        type="button"
                        onClick={() =>
                          setImageModal({
                            url: item.paymentUrl,
                            title: `${displayName(item.guest_name)} — payment screenshot`,
                          })
                        }
                        className="flex max-h-72 min-h-28 w-full items-center justify-center overflow-hidden rounded-2xl border border-[#74512d]/50 bg-[#21070f]"
                      >
                        <img
                          src={item.paymentUrl}
                          alt={`${displayName(item.guest_name)} payment proof`}
                          className="max-h-72 w-full object-contain"
                          loading="lazy"
                        />
                      </button>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-[#74512d]/60 bg-[#21070f]/60 p-5 text-sm text-[#cbb58c]">
                        Payment screenshot unavailable: {item.paymentError || "No image URL."}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={
                        updatingId === item.id ||
                        (item.status || "PENDING").toUpperCase() === "APPROVED"
                      }
                      onClick={() => void updateStatus(item, "APPROVED")}
                      className="rounded-full bg-[#d6b96f] px-4 py-2.5 text-sm font-semibold text-[#2b0b12] disabled:opacity-40"
                    >
                      {updatingId === item.id ? "Updating…" : "✓ Approve"}
                    </button>

                    <button
                      type="button"
                      disabled={
                        updatingId === item.id ||
                        (item.status || "PENDING").toUpperCase() === "REJECTED"
                      }
                      onClick={() => void updateStatus(item, "REJECTED")}
                      className="rounded-full border border-red-400/50 px-4 py-2.5 text-sm text-red-200 disabled:opacity-40"
                    >
                      ✕ Reject
                    </button>

                    {(item.status || "PENDING").toUpperCase() !== "PENDING" && (
                      <button
                        type="button"
                        disabled={updatingId === item.id}
                        onClick={() => void updateStatus(item, "PENDING")}
                        className="rounded-full border border-[#74512d] px-4 py-2.5 text-sm text-[#e8d5b0] disabled:opacity-40"
                      >
                        Reset to pending
                      </button>
                    )}
                  </div>

                  <details className="mt-4 text-xs text-[#a98c6c]">
                    <summary className="cursor-pointer select-none hover:text-[#e8d5b0]">
                      Image path diagnostics
                    </summary>

                    <div className="mt-2 space-y-2 break-all rounded-xl bg-[#21070f]/70 p-3">
                      <p>
                        <strong>Profile path:</strong> {item.user_image || "(empty)"}
                      </p>
                      <p>
                        <strong>Profile error:</strong> {item.profileError || "(none)"}
                      </p>
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
            ))}
          </div>
        )}

        <footer className="mt-10 pb-4 text-center text-xs uppercase tracking-[0.2em] text-[#8d6b50]">
          ♡ With love & gratitude
        </footer>
      </div>

      {imageModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setImageModal(null)}
        >
          <div
            className="max-h-[92vh] w-full max-w-5xl rounded-2xl border border-[#74512d] bg-[#21070f] p-3 sm:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="break-words font-serif text-lg">
                {imageModal.title}
              </h3>

              <button
                type="button"
                onClick={() => setImageModal(null)}
                className="rounded-full border border-[#74512d] px-3 py-1.5 text-sm"
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

function ErrorBox({ children }) {
  return (
    <div role="alert" className="rounded-xl border border-red-500/40 bg-red-950/40 p-3 text-sm text-red-200">
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

function StatCard({ label, value, footnote }) {
  return (
    <div className="rounded-2xl border border-[#5e302d]/70 bg-[#2b0b15] p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-[#b99a80]">
        {label}
      </p>

      <p className="mt-2 break-words font-serif text-2xl text-[#f6e6c5]">
        {value}
      </p>

      {footnote && (
        <p className="mt-1 text-xs text-[#9c8066]">
          {footnote}
        </p>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const value = (status || "PENDING").toUpperCase();

  const classes =
    value === "APPROVED"
      ? "border-emerald-400/30 bg-emerald-950/40 text-emerald-200"
      : value === "REJECTED"
        ? "border-red-400/30 bg-red-950/40 text-red-200"
        : "border-amber-400/30 bg-amber-950/30 text-amber-200";

  const label =
    value === "APPROVED"
      ? "✓ Approved"
      : value === "REJECTED"
        ? "✕ Rejected"
        : "◷ Pending";

  return (
    <span className={`inline-flex shrink-0 items-center rounded-full border px-3 py-1.5 text-xs ${classes}`}>
      {label}
    </span>
  );
}

function DetailLine({ icon, label, children }) {
  return (
    <div className="flex items-start gap-2">
      <span className="w-5 shrink-0 text-center text-[#b99a58]" aria-hidden="true">
        {icon}
      </span>

      <span className="sr-only">{label}: </span>

      <span className="min-w-0">{children}</span>
    </div>
  );
}
