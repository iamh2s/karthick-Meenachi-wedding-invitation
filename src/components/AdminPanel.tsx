import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { supabase } from "../lib/Supabase";

const TABLE = "wedding_gift_submissions";
const PAYMENT_BUCKET = "gift-payment-proofs";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type Status = "PENDING" | "APPROVED" | "REJECTED";
type TabKey = Status | "ALL";

interface SubmissionRow {
  id: string | number;
  guest_name: string | null;
  email: string | null;
  phone: string | null;
  relationship: string | null;
  amount: number | string | null;
  message: string | null;
  screenshot_path: string | null;
  selfie_path: string | null;
  status: string | null;
  created_at: string | null;
}

interface Submission extends SubmissionRow {
  paymentUrl: string | null;
  paymentError: string | null;
  selfieUrl: string | null;
  selfieError: string | null;
}

interface ImageModalState {
  url: string;
  title: string;
}

interface Stat {
  count: number;
  amount: number;
}

type Accent = "amber" | "green" | "red";

const TABS: { key: TabKey; label: string }[] = [
  { key: "PENDING", label: "Pending" },
  { key: "APPROVED", label: "Approved" },
  { key: "REJECTED", label: "Rejected" },
  { key: "ALL", label: "All" },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function toNumber(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function formatAmount(amount: unknown): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(toNumber(amount));
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "Date unavailable";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function displayName(value: string | null | undefined): string {
  return value?.trim() || "Guest";
}

function statusOf(item: { status: string | null }): Status {
  const value = (item.status || "PENDING").toUpperCase();
  return value === "APPROVED" || value === "REJECTED" ? value : "PENDING";
}

/* Thank-you SMS sent after a gift is approved. Edit the wording here. */
const COUPLE = "Karthik & Meenakshi";

function thankYouMessage(item: Submission): string {
  const amount = toNumber(item.amount);

  return `Dear ${displayName(item.guest_name)}, thank you so much for your wedding gift of ₹${amount.toLocaleString("en-IN")} and for your love and blessings. We are truly grateful. - ${COUPLE}`;
}

/* Opens the phone's normal messaging app with the text pre-filled. */
function smsLink(phone: string, body: string): string {
  const cleaned = String(phone).replace(/[^\d+]/g, "");
  const number = /^\d{10}$/.test(cleaned) ? `+91${cleaned}` : cleaned;

  return `sms:${number}?&body=${encodeURIComponent(body)}`;
}

function normalizeStoragePath(
  value: string | null | undefined,
  bucket: string
): string | null {
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

async function getImageUrl(
  pathValue: string | null | undefined,
  bucket: string
): Promise<{ url: string | null; error: string | null }> {
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

/* ----------------------------- Exports ----------------------------- */

function csvCell(value: unknown): string {
  const text = String(value ?? "").replace(/"/g, '""');
  return `"${text}"`;
}

function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

function downloadCsv(rows: Submission[]): void {
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

  saveBlob(blob, `wedding-gifts-${todayStamp()}.csv`);
}

/*
 * PDF export. jsPDF's built-in fonts have no ₹ glyph, so amounts are
 * written as "Rs." here. The library is imported on demand so it
 * doesn't add weight to the main bundle.
 */
function pdfAmount(amount: unknown): string {
  return `Rs. ${toNumber(amount).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

/*
 * Each guest gets one card (A4 portrait, three cards per page):
 *
 *   +----------+-----------------------------+-----------+
 *   |  selfie  |        guest details        |   gpay    |
 *   |          |                             | screenshot|
 *   +----------+-----------------------------+-----------+
 */
const PDF_MARGIN = 14;
const PDF_BOTTOM = 14;
const PDF_CARD_H = 77;
const PDF_CARD_GAP = 5;
const PDF_PAD = 5;
const PDF_COL_GAP = 5;
const PDF_PHOTO_W = 48;
const PDF_PROOF_W = 46;

interface PdfImage {
  dataUrl: string;
  width: number;
  height: number;
}

/*
 * jsPDF's built-in font only covers basic Latin. Typographic quotes and
 * spaces are simplified, and anything else (Tamil, emoji) prints as "?"
 * instead of garbled symbols.
 */
function pdfText(value: unknown): string {
  return String(value ?? "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/[^\x20-\x7e\u00a1-\u00ff]/g, "?")
    .trim();
}

function limitLines(lines: string[], max: number): string[] {
  if (lines.length <= max) return lines;

  const kept = lines.slice(0, max);
  kept[max - 1] = `${kept[max - 1].slice(0, -3).trimEnd()}...`;

  return kept;
}

function statusRgb(status: Status): [number, number, number] {
  if (status === "APPROVED") return [21, 128, 61];
  if (status === "REJECTED") return [185, 28, 28];
  return [180, 83, 9];
}

/*
 * Downloads an image from Supabase Storage and returns it as a JPEG data
 * URL that jsPDF can embed. With cropAspect the image is centre-cropped to
 * that width/height ratio (to fill a box); without it the image keeps its
 * own shape. Returns null if there is no image or the download fails, so
 * one bad file never blocks the whole PDF.
 */
async function loadPdfImage(
  pathValue: string | null | undefined,
  options: { maxSide: number; quality: number; cropAspect?: number }
): Promise<PdfImage | null> {
  const path = normalizeStoragePath(pathValue, PAYMENT_BUCKET);
  if (!path) return null;

  try {
    const { data, error } = await supabase.storage
      .from(PAYMENT_BUCKET)
      .download(path);

    if (error || !data) return null;

    const bitmap = await createImageBitmap(data);

    let sx = 0;
    let sy = 0;
    let sw = bitmap.width;
    let sh = bitmap.height;

    if (options.cropAspect) {
      if (sw / sh > options.cropAspect) {
        sw = sh * options.cropAspect;
        sx = (bitmap.width - sw) / 2;
      } else {
        sh = sw / options.cropAspect;
        sy = (bitmap.height - sh) / 2;
      }
    }

    const scale = Math.min(1, options.maxSide / Math.max(sw, sh));
    const width = Math.max(1, Math.round(sw * scale));
    const height = Math.max(1, Math.round(sh * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      bitmap.close();
      return null;
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(bitmap, sx, sy, sw, sh, 0, 0, width, height);
    bitmap.close();

    return {
      dataUrl: canvas.toDataURL("image/jpeg", options.quality),
      width,
      height,
    };
  } catch {
    return null;
  }
}

async function downloadPdf(rows: Submission[], filterLabel: string): Promise<void> {
  const { jsPDF } = await import("jspdf");

  const innerH = PDF_CARD_H - PDF_PAD * 2;

  /* Fetch every guest's selfie and payment screenshot first. */
  const images = await Promise.all(
    rows.map(async (r) => {
      const [photo, proof] = await Promise.all([
        loadPdfImage(r.selfie_path, {
          maxSide: 420,
          quality: 0.8,
          cropAspect: PDF_PHOTO_W / innerH,
        }),
        loadPdfImage(r.screenshot_path, { maxSide: 900, quality: 0.72 }),
      ]);

      return { photo, proof };
    })
  );

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const contentW = pageW - PDF_MARGIN * 2;
  const detailsW =
    contentW - PDF_PAD * 2 - PDF_PHOTO_W - PDF_PROOF_W - PDF_COL_GAP * 2;

  /* Heading */
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(60, 18, 36);
  doc.text(`Wedding Gift Submissions - ${COUPLE}`, PDF_MARGIN, 17);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110, 90, 80);
  doc.text(
    pdfText(
      `Filter: ${filterLabel}   |   Generated: ${formatDate(new Date().toISOString())}`
    ),
    PDF_MARGIN,
    23
  );

  /* Totals */
  const total = rows.reduce((sum, r) => sum + toNumber(r.amount), 0);
  const approved = rows
    .filter((r) => statusOf(r) === "APPROVED")
    .reduce((sum, r) => sum + toNumber(r.amount), 0);
  const count = (s: Status) => rows.filter((r) => statusOf(r) === s).length;

  doc.setFontSize(10);
  doc.setTextColor(40, 20, 30);
  doc.text(
    `Entries: ${rows.length}   |   Total: ${pdfAmount(total)}`,
    PDF_MARGIN,
    29.5
  );
  doc.text(
    `Approved: ${pdfAmount(approved)} (${count("APPROVED")})   |   Pending: ${count("PENDING")}   |   Rejected: ${count("REJECTED")}`,
    PDF_MARGIN,
    35
  );

  /* A framed box with an optional image and a placeholder when empty. */
  const drawBox = (
    x: number,
    y: number,
    w: number,
    h: number,
    image: PdfImage | null,
    fit: "fill" | "contain",
    placeholder: string
  ) => {
    doc.setLineWidth(0.3);
    doc.setDrawColor(205, 188, 160);
    doc.setFillColor(243, 237, 226);
    doc.roundedRect(x, y, w, h, 1.5, 1.5, "FD");

    if (image) {
      if (fit === "fill") {
        doc.addImage(image.dataUrl, "JPEG", x, y, w, h);
      } else {
        const scale = Math.min(w / image.width, h / image.height);
        const dw = image.width * scale;
        const dh = image.height * scale;
        doc.addImage(image.dataUrl, "JPEG", x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
      }

      /* Redraw the frame on top of the picture. */
      doc.roundedRect(x, y, w, h, 1.5, 1.5, "S");
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(150, 135, 125);
      doc.text(placeholder, x + w / 2, y + h / 2, { align: "center" });
    }
  };

  const drawLines = (lines: string[], x: number, y: number, lineH: number) => {
    lines.forEach((line, i) => doc.text(line, x, y + i * lineH));
    return y + lines.length * lineH;
  };

  const wrap = (text: string, max: number): string[] =>
    doc.splitTextToSize(text, detailsW).slice(0, 1000).length
      ? limitLines(doc.splitTextToSize(text, detailsW) as string[], max)
      : [];

  /* One card per guest */
  let y = 40;

  rows.forEach((r, index) => {
    if (y + PDF_CARD_H > pageH - PDF_BOTTOM) {
      doc.addPage();
      y = PDF_MARGIN;
    }

    const status = statusOf(r);
    const x = PDF_MARGIN;
    const photoX = x + PDF_PAD;
    const detailsX = photoX + PDF_PHOTO_W + PDF_COL_GAP;
    const proofX = detailsX + detailsW + PDF_COL_GAP;
    const boxY = y + PDF_PAD;

    /* Card background and status stripe */
    doc.setLineWidth(0.3);
    doc.setDrawColor(214, 196, 160);
    doc.setFillColor(251, 247, 239);
    doc.roundedRect(x, y, contentW, PDF_CARD_H, 3, 3, "FD");

    doc.setFillColor(...statusRgb(status));
    doc.rect(x, y + 4, 1.4, PDF_CARD_H - 8, "F");

    /* Left: selfie */
    drawBox(photoX, boxY, PDF_PHOTO_W, innerH, images[index].photo, "fill", "No photo");

    /* Middle: guest details */
    let ty = boxY + 4;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(150, 130, 115);
    doc.text(`#${index + 1}`, detailsX, ty);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...statusRgb(status));
    doc.text(status, detailsX + detailsW, ty, { align: "right" });
    ty += 6.5;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(60, 18, 36);
    ty = drawLines(wrap(pdfText(displayName(r.guest_name)), 2), detailsX, ty, 5.2);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(120, 95, 80);
    if (r.relationship) {
      doc.text(pdfText(r.relationship), detailsX, ty);
      ty += 5.5;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(150, 100, 30);
    doc.text(pdfAmount(r.amount), detailsX, ty + 0.5);
    ty += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(50, 35, 40);
    if (r.phone) {
      doc.text(pdfText(`Phone: ${r.phone}`), detailsX, ty);
      ty += 4.2;
    }
    if (r.email) {
      ty = drawLines(wrap(pdfText(`Email: ${r.email}`), 2), detailsX, ty, 4.2);
    }
    doc.text(pdfText(`Submitted: ${formatDate(r.created_at)}`), detailsX, ty);
    ty += 5.5;

    /* Message fills whatever space is left. */
    if (r.message?.trim()) {
      const lastBaseline = y + PDF_CARD_H - PDF_PAD;
      const room = Math.floor((lastBaseline - ty) / 3.6) + 1;

      if (room > 0) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8);
        doc.setTextColor(95, 75, 70);
        drawLines(wrap(`"${pdfText(r.message)}"`, room), detailsX, ty, 3.6);
      }
    }

    /* Right: payment screenshot */
    drawBox(proofX, boxY, PDF_PROOF_W, innerH, images[index].proof, "contain", "No screenshot");

    y += PDF_CARD_H + PDF_CARD_GAP;
  });

  /* Page numbers */
  const pages = doc.getNumberOfPages();
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(130, 110, 100);
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.text(`Page ${page} of ${pages}`, pageW - PDF_MARGIN, pageH - 7, {
      align: "right",
    });
  }

  doc.save(`wedding-gifts-${filterLabel.toLowerCase()}-${todayStamp()}.pdf`);
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
  const [exportingPdf, setExportingPdf] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<TabKey>("PENDING");
  const [newestFirst, setNewestFirst] = useState(true);
  const [updatingId, setUpdatingId] = useState<Submission["id"] | null>(null);
  const [imageModal, setImageModal] = useState<ImageModalState | null>(null);
  /* Set right after an approval so the thank-you prompt opens at once. */
  const [thankYouItem, setThankYouItem] = useState<Submission | null>(null);

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
          "id, guest_name, email, phone, relationship, amount, message, screenshot_path, selfie_path, status, created_at"
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Submission query failed:", error);
        setSubmissions([]);
        setErrorMessage(`Could not load submissions: ${error.message}`);
        return;
      }

      const rows = (data ?? []) as SubmissionRow[];

      const hydrated: Submission[] = await Promise.all(
        rows.map(async (row) => {
          const [payment, selfie] = await Promise.all([
            getImageUrl(row.screenshot_path, PAYMENT_BUCKET),
            getImageUrl(row.selfie_path, PAYMENT_BUCKET),
          ]);

          return {
            ...row,
            paymentUrl: payment.url,
            paymentError: payment.error,
            selfieUrl: selfie.url,
            selfieError: selfie.error,
          };
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

  /* Esc closes whichever dialog is open. */
  const dialogOpen = Boolean(imageModal || thankYouItem);
  useEffect(() => {
    if (!dialogOpen) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setImageModal(null);
      setThankYouItem(null);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dialogOpen]);

  /* Warn if the tab/window is closed or reloaded while still signed in as admin. */
  const signedInAsAdmin = authenticated && isAdmin;
  useEffect(() => {
    if (!signedInAsAdmin) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = ""; // required by some browsers to show the prompt
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [signedInAsAdmin]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
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
    setThankYouItem(null);
  };

  const updateStatus = async (item: Submission, status: Status) => {
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

      // After approving, offer the thank-you message straight away.
      if (status === "APPROVED") setThankYouItem({ ...item, status });
    } finally {
      setUpdatingId(null);
    }
  };

  const stats = useMemo<Record<TabKey, Stat>>(() => {
    const result: Record<TabKey, Stat> = {
      ALL: { count: submissions.length, amount: 0 },
      PENDING: { count: 0, amount: 0 },
      APPROVED: { count: 0, amount: 0 },
      REJECTED: { count: 0, amount: 0 },
    };

    submissions.forEach((item) => {
      const key = statusOf(item);
      const amount = toNumber(item.amount);

      result[key].count += 1;
      result[key].amount += amount;
      result.ALL.amount += amount;
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

  const handleExportPdf = async () => {
    setExportingPdf(true);
    setErrorMessage("");

    try {
      const label = TABS.find((t) => t.key === tab)?.label ?? "All";
      await downloadPdf(filtered, label);
    } catch (error) {
      console.error("PDF export failed:", error);
      setErrorMessage(
        error instanceof Error
          ? `Could not create the PDF: ${error.message}`
          : "Could not create the PDF."
      );
    } finally {
      setExportingPdf(false);
    }
  };

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
              onClick={() => void handleSignOut()}
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
              onClick={() => void handleExportPdf()}
              disabled={filtered.length === 0 || exportingPdf}
              className="rounded-full border border-[#d6b96f]/60 bg-[#d6b96f]/10 px-4 py-2 text-sm text-[#f0dca0] hover:bg-[#d6b96f]/20 disabled:opacity-50"
            >
              {exportingPdf ? "Creating PDF…" : "⤓ Download PDF"}
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
              onClick={() => void handleSignOut()}
              className="rounded-full border border-[#74512d] px-4 py-2 text-sm hover:bg-[#481327]"
            >
              Sign out
            </button>
          </div>
        </header>

        {/* Sign-out reminder */}
        <div
          role="note"
          className="mb-4 flex items-start gap-2 rounded-xl border border-amber-400/30 bg-amber-950/30 px-4 py-3 text-sm text-amber-200"
        >
          <span aria-hidden="true">⚠</span>
          <p>
            You&apos;re signed in as admin. Please use{" "}
            <strong>Sign out</strong> before closing this window, especially on
            a shared device.
          </p>
        </div>

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

      {/* Thank-you prompt, shown right after a gift is approved */}
      {thankYouItem && (
        <ThankYouModal
          key={thankYouItem.id}
          item={thankYouItem}
          onClose={() => setThankYouItem(null)}
        />
      )}

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

interface SubmissionCardProps {
  item: Submission;
  busy: boolean;
  onUpdate: (item: Submission, status: Status) => Promise<void>;
  onOpenImage: (modal: ImageModalState) => void;
}

function SubmissionCard({
  item,
  busy,
  onUpdate,
  onOpenImage,
}: SubmissionCardProps) {
  const status = statusOf(item);
  const name = displayName(item.guest_name);
  const message = thankYouMessage(item);

  const accent =
    status === "APPROVED"
      ? "border-l-emerald-400/70"
      : status === "REJECTED"
        ? "border-l-red-400/70"
        : "border-l-amber-400/70";

  const openProof = () => {
    if (!item.paymentUrl) return;
    onOpenImage({ url: item.paymentUrl, title: `${name} — payment screenshot` });
  };

  const openSelfie = () => {
    if (!item.selfieUrl) return;
    onOpenImage({ url: item.selfieUrl, title: `${name} — selfie` });
  };

  return (
    <article
      className={`overflow-hidden rounded-3xl border border-[#74512d]/70 border-l-4 bg-gradient-to-br from-[#421226] to-[#2b0b15] shadow-xl ${accent}`}
    >
      <div className="p-5">
        {/* Top: who + how much */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {item.selfieUrl ? (
              <button
                type="button"
                onClick={openSelfie}
                aria-label={`View ${name}'s selfie`}
                className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-[#b99a58]/60 bg-[#6a3b31] transition hover:border-[#d6b96f]"
              >
                <img
                  src={item.selfieUrl}
                  alt={`${name} selfie`}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </button>
            ) : (
              <div
                aria-hidden="true"
                className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-[#b99a58]/50 bg-[#6a3b31] font-serif text-lg"
              >
                {name.charAt(0).toUpperCase()}
              </div>
            )}

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

        {/* Approved cards keep the thank-you message so it can be sent later */}
        {status === "APPROVED" && (
          <div className="mt-4 rounded-2xl border border-emerald-400/25 bg-emerald-950/20 p-4">
            <p className="text-xs font-medium text-emerald-200">
              Gift approved — send a thank-you message
            </p>

            <p className="mt-2 break-words text-xs italic leading-5 text-[#d6c1a1]">
              “{message}”
            </p>

            <SendActions phone={item.phone} message={message} />
          </div>
        )}

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
            <p>
              <strong>Selfie path:</strong> {item.selfie_path || "(empty)"}
            </p>
            <p>
              <strong>Selfie error:</strong> {item.selfieError || "(none)"}
            </p>
          </div>
        </details>
      </div>
    </article>
  );
}

/* "Send message" opens the phone's normal messaging app with the text ready. */
function SendActions({
  phone,
  message,
}: {
  phone: string | null;
  message: string;
}) {
  const [copied, setCopied] = useState(false);

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable: ignore */
    }
  };

  return (
    <div className="mt-3">
      {!phone && (
        <p className="mb-2 text-xs text-amber-300">
          No phone number saved for this guest. You can still copy the message.
        </p>
      )}

      <div className="flex gap-2">
        {phone && (
          <a
            href={smsLink(phone, message)}
            className="flex-1 rounded-full bg-emerald-400 px-4 py-2.5 text-center text-sm font-semibold text-[#06210f] transition hover:brightness-110"
          >
            ✉ Send message
          </a>
        )}

        <button
          type="button"
          onClick={() => void copyMessage()}
          className="rounded-full border border-emerald-400/40 px-4 py-2.5 text-sm text-emerald-100 hover:bg-emerald-950/40"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}

function ThankYouModal({
  item,
  onClose,
}: {
  item: Submission;
  onClose: () => void;
}) {
  const [text, setText] = useState(() => thankYouMessage(item));
  const name = displayName(item.guest_name);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="thank-you-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-[#74512d] bg-[#330d1b] p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 id="thank-you-title" className="font-serif text-2xl">
          Gift approved
        </h3>
        <p className="mt-1 text-sm text-[#cbb58c]">
          Send {name} a thank-you message for{" "}
          <span className="text-[#e6c97c]">{formatAmount(item.amount)}</span>.
        </p>

        <label className="mt-4 block">
          <span className="mb-2 block text-xs text-[#b99a80]">
            Message (you can edit it before sending)
          </span>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={6}
            className="w-full resize-none rounded-xl border border-[#74512d] bg-[#21070f] px-4 py-3 text-sm leading-6 text-[#fff3d7] outline-none focus:border-[#d0ae67]"
          />
        </label>

        <SendActions phone={item.phone} message={text} />

        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full rounded-full border border-[#74512d] px-4 py-2.5 text-sm text-[#e8d5b0] hover:bg-[#481327]"
        >
          Not now
        </button>
      </div>
    </div>
  );
}

function ErrorBox({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-500/40 bg-red-950/40 p-3 text-sm text-red-200"
    >
      {children}
    </div>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed border-[#5e302d] p-12 text-center">
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  footnote?: string;
  accent?: Accent;
}

function StatCard({ label, value, footnote, accent }: StatCardProps) {
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

function StatusBadge({ status }: { status: Status }) {
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