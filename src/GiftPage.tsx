
import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Copy,
  Gift,
  Heart,
  LoaderCircle,
  Smartphone,
  Upload,
  UserRound,
  QrCode,
} from "lucide-react";
import { supabase } from "./lib/Supabase";

const UPI_ID =
  import.meta.env.VITE_WEDDING_UPI_ID || "your-real-upi-id@bank";

const PAYEE_NAME =
  import.meta.env.VITE_WEDDING_PAYEE_NAME || "Karthick and Meenachi";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

type GuestDetails = {
  name: string;
  email: string;
  phone: string;
  amount: string;
  message: string;
};

const INITIAL_DETAILS: GuestDetails = {
  name: "",
  email: "",
  phone: "",
  amount: "",
  message: "",
};

const STEPS = [
  { number: 1, label: "Your Details", icon: UserRound },
  { number: 2, label: "Make Payment", icon: QrCode },
  { number: 3, label: "Upload Proof", icon: Upload },
];

export default function GiftPage() {
  const [step, setStep] = useState(1);
  const [details, setDetails] = useState<GuestDetails>(INITIAL_DETAILS);
  const [utr, setUtr] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const amount = Number(details.amount);

  const upiUrl = useMemo(() => {
    const params = new URLSearchParams({
      pa: UPI_ID,
      pn: PAYEE_NAME,
      am: Number(details.amount).toFixed(2),
      cu: "INR",
      tn: "Wedding Gift",
    });

    return `upi://pay?${params.toString()}`;
  }, [details.amount]);

  function updateDetails(
    field: keyof GuestDetails,
    value: string
  ) {
    setDetails((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function validateGuestDetails(): boolean {
    const name = details.name.trim();
    const email = details.email.trim();
    const phone = details.phone.trim();
    const numericAmount = Number(details.amount);

    if (name.length < 2 || name.length > 100) {
      setError("Please enter your full name.");
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return false;
    }

    if (phone.length < 7 || phone.length > 20) {
      setError("Please enter a valid phone number.");
      return false;
    }

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0 ||
      numericAmount > 10000000
    ) {
      setError("Please enter a valid gift amount.");
      return false;
    }

    if (!/^\d+(\.\d{1,2})?$/.test(details.amount.trim())) {
      setError("Please enter an amount with up to two decimal places.");
      return false;
    }

    setError("");
    return true;
  }

  function goToPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateGuestDetails()) return;

    setError("");
    setStep(2);
  }

  async function copyUpiId() {
    try {
      await navigator.clipboard.writeText(UPI_ID);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy this UPI ID:", UPI_ID);
    }
  }

  function handleScreenshot(file: File | null) {
    setError("");

    if (!file) {
      setScreenshot(null);
      return;
    }

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Please upload a JPG, PNG or WebP image.");
      setScreenshot(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Your screenshot must be 5 MB or smaller.");
      setScreenshot(null);
      return;
    }

    setScreenshot(file);
  }

  async function submitGift(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!validateGuestDetails()) {
      setStep(1);
      return;
    }

    if (utr.trim().length < 6 || utr.trim().length > 100) {
      setError("Please enter a valid transaction reference / UTR.");
      return;
    }

    if (!screenshot) {
      setError("Please upload your payment screenshot.");
      return;
    }

    setSubmitting(true);

    try {
      const extension =
        screenshot.type === "image/png"
          ? "png"
          : screenshot.type === "image/webp"
            ? "webp"
            : "jpg";

      const filePath =
        `submissions/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("gift-payment-proofs")
        .upload(filePath, screenshot, {
          contentType: screenshot.type,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(
          `Screenshot upload failed: ${uploadError.message}`
        );
      }

      const { error: insertError } = await supabase
        .from("wedding_gift_submissions")
        .insert({
          guest_name: details.name.trim(),
          email: details.email.trim().toLowerCase(),
          phone: details.phone.trim(),
          amount: Number(details.amount),
          utr: utr.trim(),
          message: details.message.trim() || null,
          screenshot_path: filePath,
          status: "PENDING",
        });

      if (insertError) {
        // Clean up the image if the database insert fails.
        const { error: cleanupError } = await supabase.storage
          .from("gift-payment-proofs")
          .remove([filePath]);

        if (cleanupError) {
          console.error(
            "Screenshot cleanup failed:",
            cleanupError.message
          );
        }

        throw new Error(
          `Could not save your submission: ${insertError.message}`
        );
      }

      setSuccess(true);
      setStep(4);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#210710] px-5 py-24 text-[#f4e6c9]">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-1/2 top-24 h-96 w-96 -translate-x-1/2 rounded-full bg-[#b08a4a]/10 blur-[110px]"
      />

      <Link
        to="/"
        className="absolute left-5 top-5 z-20 inline-flex items-center gap-2 rounded-full border border-[#c6a365]/30 bg-[#320b19]/80 px-4 py-2 text-sm text-[#e8c987] transition hover:border-[#c6a365]"
      >
        <ArrowLeft size={16} />
        Back to Invitation
      </Link>

      <div className="relative z-10 mx-auto w-full max-w-2xl">
        <header className="mb-9 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-[#c6a365]/50 bg-[#451021]">
              <Gift size={25} className="text-[#e8c987]" />
            </div>

            <p className="mb-3 text-xs uppercase tracking-[0.3em] text-[#d8b878]/80">
              A Gift From the Heart
            </p>

            <h1
              className="text-4xl font-light sm:text-5xl"
              style={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
              }}
            >
              Share Your Love
            </h1>

            <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-[#f4e6c9]/70 sm:text-base">
              Your blessings are our greatest gift. If you wish to
              send a gift, please follow the three simple steps below.
            </p>
          </motion.div>
        </header>

        {/* Step progress */}
        {!success && (
          <div className="mb-9 grid grid-cols-3 gap-2">
            {STEPS.map((item) => {
              const Icon = item.icon;
              const isCurrent = step === item.number;
              const isCompleted = step > item.number;

              return (
                <button
                  key={item.number}
                  type="button"
                  disabled={item.number > step}
                  onClick={() => {
                    setError("");
                    setStep(item.number);
                  }}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition ${
                    isCurrent
                      ? "border-[#d8b878] bg-[#572036]/70 text-[#f4dfad]"
                      : isCompleted
                        ? "border-[#c6a365]/40 bg-[#320b19]/60 text-[#d8b878]"
                        : "border-[#c6a365]/15 bg-[#320b19]/30 text-[#f4e6c9]/40"
                  }`}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-current">
                    {isCompleted ? (
                      <CheckCircle2 size={18} />
                    ) : (
                      <Icon size={18} />
                    )}
                  </span>
                  <span className="text-xs font-medium sm:text-sm">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <section className="rounded-3xl border border-[#c6a365]/30 bg-[#320b19]/75 p-5 shadow-2xl sm:p-8">
          <AnimatePresence mode="wait">
            {/* STEP 1: Guest details */}
            {step === 1 && !success && (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                transition={{ duration: 0.25 }}
              >
                <h2
                  className="text-2xl"
                  style={{
                    fontFamily: '"Cormorant Garamond", Georgia, serif',
                  }}
                >
                  Step 1 — Your Details
                </h2>

                <p className="mb-6 mt-2 text-sm leading-6 text-[#f4e6c9]/60">
                  Tell us who is sending this thoughtful gift.
                </p>

                <form onSubmit={goToPayment} className="space-y-5">
                  <div>
                    <label htmlFor="guest-name" className="mb-2 block text-sm text-[#e8c987]">
                      Full name *
                    </label>
                    <input
                      id="guest-name"
                      autoComplete="name"
                      required
                      minLength={2}
                      maxLength={100}
                      value={details.name}
                      onChange={(e) => updateDetails("name", e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full rounded-xl border border-[#c6a365]/25 bg-[#210710]/80 px-4 py-3 text-sm outline-none placeholder:text-[#f4e6c9]/30 focus:border-[#d8b878]"
                    />
                  </div>

                  <div>
                    <label htmlFor="guest-email" className="mb-2 block text-sm text-[#e8c987]">
                      Email address *
                    </label>
                    <input
                      id="guest-email"
                      type="email"
                      autoComplete="email"
                      required
                      maxLength={254}
                      value={details.email}
                      onChange={(e) => updateDetails("email", e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-[#c6a365]/25 bg-[#210710]/80 px-4 py-3 text-sm outline-none placeholder:text-[#f4e6c9]/30 focus:border-[#d8b878]"
                    />
                  </div>

                  <div>
                    <label htmlFor="guest-phone" className="mb-2 block text-sm text-[#e8c987]">
                      Phone number *
                    </label>
                    <input
                      id="guest-phone"
                      type="tel"
                      autoComplete="tel"
                      required
                      minLength={7}
                      maxLength={20}
                      value={details.phone}
                      onChange={(e) => updateDetails("phone", e.target.value)}
                      placeholder="Enter phone number"
                      className="w-full rounded-xl border border-[#c6a365]/25 bg-[#210710]/80 px-4 py-3 text-sm outline-none placeholder:text-[#f4e6c9]/30 focus:border-[#d8b878]"
                    />
                  </div>

                  <div>
                    <label htmlFor="gift-amount" className="mb-2 block text-sm text-[#e8c987]">
                      Gift amount (₹) *
                    </label>
                    <input
                      id="gift-amount"
                      type="number"
                      inputMode="decimal"
                      min="1"
                      max="10000000"
                      step="0.01"
                      required
                      value={details.amount}
                      onChange={(e) => updateDetails("amount", e.target.value)}
                      placeholder="e.g. 1500"
                      className="w-full rounded-xl border border-[#c6a365]/25 bg-[#210710]/80 px-4 py-3 text-sm outline-none placeholder:text-[#f4e6c9]/30 focus:border-[#d8b878]"
                    />
                    <p className="mt-2 text-xs text-[#f4e6c9]/45">
                      The amount will be included in the UPI payment request.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="gift-message" className="mb-2 block text-sm text-[#e8c987]">
                      Message to the couple (optional)
                    </label>
                    <textarea
                      id="gift-message"
                      rows={3}
                      maxLength={1000}
                      value={details.message}
                      onChange={(e) => updateDetails("message", e.target.value)}
                      placeholder="Write your wishes..."
                      className="w-full resize-y rounded-xl border border-[#c6a365]/25 bg-[#210710]/80 px-4 py-3 text-sm outline-none placeholder:text-[#f4e6c9]/30 focus:border-[#d8b878]"
                    />
                  </div>

                  {error && (
                    <p role="alert" className="rounded-xl border border-red-400/30 bg-red-950/30 p-3 text-sm text-red-200">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-[#c6a365] bg-gradient-to-r from-[#572036] to-[#320b19] px-6 py-4 text-sm tracking-widest text-[#f4dfad] transition hover:shadow-[0_0_25px_rgba(198,163,101,0.2)]"
                  >
                    CONTINUE TO PAYMENT
                    <ArrowRight size={17} />
                  </button>
                </form>
              </motion.div>
            )}

            {/* STEP 2: Amount-specific UPI QR */}
            {step === 2 && !success && (
              <motion.div
                key="payment"
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                transition={{ duration: 0.25 }}
                className="text-center"
              >
                <h2
                  className="text-2xl"
                  style={{
                    fontFamily: '"Cormorant Garamond", Georgia, serif',
                  }}
                >
                  Step 2 — Make Your Payment
                </h2>

                <p className="mt-2 text-sm text-[#f4e6c9]/60">
                  Hello, {details.name.trim()}! Your selected gift amount is
                </p>

                <p className="my-4 text-4xl text-[#e8c987]">
                  ₹{amount.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>

                <p className="mb-6 text-sm text-[#f4e6c9]/60">
                  Scan this QR using your UPI app, or open a UPI app on
                  this device.
                </p>

                <div className="relative mx-auto mb-6 w-fit rounded-[26px] p-[2px]">
                  <motion.div
                    aria-hidden="true"
                    className="absolute -inset-[2px] rounded-[28px] bg-[conic-gradient(from_0deg,#6d4922,#f1d89d,#8c632e,#f1d89d,#6d4922)]"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 12,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />

                  <div className="relative rounded-3xl bg-white p-4">
                    <QRCodeSVG
                      value={upiUrl}
                      size={220}
                      level="H"
                      bgColor="#ffffff"
                      fgColor="#210710"
                      title={`UPI payment QR for ₹${amount}`}
                    />
                    <p className="mt-3 text-xs font-medium tracking-widest text-[#451021]">
                      SCAN TO PAY ₹{amount.toFixed(2)}
                    </p>
                  </div>
                </div>

                <p className="break-all text-sm text-[#d8b878]">
                  {UPI_ID}
                </p>

                <p className="mt-1 text-sm text-[#f4e6c9]/50">
                  Payee: {PAYEE_NAME}
                </p>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={copyUpiId}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full border border-[#c6a365]/40 px-4 py-3 text-sm hover:bg-[#c6a365]/10"
                  >
                    <Copy size={16} />
                    {copied ? "UPI ID Copied" : "Copy UPI ID"}
                  </button>

                  <a
                    href={upiUrl}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full border border-[#c6a365] bg-[#451021] px-4 py-3 text-sm text-[#f4dfad] transition hover:bg-[#572036]"
                  >
                    <Smartphone size={17} />
                    Open UPI App
                  </a>
                </div>

                <p className="mt-4 text-xs leading-5 text-[#f4e6c9]/45">
                  Check the payee and amount in your UPI app before confirming
                  the payment. The QR pre-fills the amount, but your bank or
                  payment app controls the final transaction.
                </p>

                {error && (
                  <p role="alert" className="mt-4 rounded-xl border border-red-400/30 bg-red-950/30 p-3 text-sm text-red-200">
                    {error}
                  </p>
                )}

                <div className="mt-7 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setStep(1);
                    }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full border border-[#c6a365]/40 px-4 py-3 text-sm"
                  >
                    <ArrowLeft size={16} />
                    Back
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setStep(3);
                    }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full border border-[#c6a365] bg-gradient-to-r from-[#572036] to-[#320b19] px-4 py-3 text-sm text-[#f4dfad]"
                  >
                    I Have Paid
                    <ArrowRight size={16} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: UTR and screenshot */}
            {step === 3 && !success && (
              <motion.div
                key="proof"
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                transition={{ duration: 0.25 }}
              >
                <h2
                  className="text-2xl"
                  style={{
                    fontFamily: '"Cormorant Garamond", Georgia, serif',
                  }}
                >
                  Step 3 — Upload Payment Proof
                </h2>

                <p className="mb-6 mt-2 text-sm leading-6 text-[#f4e6c9]/60">
                  Gift amount:{" "}
                  <span className="text-[#e8c987]">
                    ₹{amount.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                  . Enter the transaction reference and upload your payment
                  screenshot.
                </p>

                <form onSubmit={submitGift} className="space-y-5">
                  <div>
                    <label htmlFor="transaction-utr" className="mb-2 block text-sm text-[#e8c987]">
                      UPI transaction reference / UTR *
                    </label>
                    <input
                      id="transaction-utr"
                      required
                      minLength={6}
                      maxLength={100}
                      value={utr}
                      onChange={(e) => setUtr(e.target.value)}
                      placeholder="Enter your transaction reference"
                      className="w-full rounded-xl border border-[#c6a365]/25 bg-[#210710]/80 px-4 py-3 text-sm outline-none placeholder:text-[#f4e6c9]/30 focus:border-[#d8b878]"
                    />
                  </div>

                  <div>
                    <label htmlFor="payment-screenshot" className="mb-2 block text-sm text-[#e8c987]">
                      Payment screenshot *
                    </label>

                    <label
                      htmlFor="payment-screenshot"
                      className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#c6a365]/40 bg-[#210710]/50 px-5 py-7 text-center transition hover:border-[#d8b878]"
                    >
                      <Upload size={25} className="mb-3 text-[#d8b878]" />

                      <span className="break-all text-sm text-[#f4e6c9]">
                        {screenshot
                          ? screenshot.name
                          : "Choose payment screenshot"}
                      </span>

                      <span className="mt-2 text-xs text-[#f4e6c9]/45">
                        JPG, PNG or WebP · Maximum 5 MB
                      </span>

                      <input
                        id="payment-screenshot"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        required
                        className="sr-only"
                        onChange={(e) =>
                          handleScreenshot(e.target.files?.[0] ?? null)
                        }
                      />
                    </label>
                  </div>

                  {error && (
                    <p role="alert" className="rounded-xl border border-red-400/30 bg-red-950/30 p-3 text-sm text-red-200">
                      {error}
                    </p>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => {
                        setError("");
                        setStep(2);
                      }}
                      className="flex flex-1 items-center justify-center gap-2 rounded-full border border-[#c6a365]/40 px-4 py-3 text-sm disabled:opacity-50"
                    >
                      <ArrowLeft size={16} />
                      Back
                    </button>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex flex-[1.5] items-center justify-center gap-2 rounded-full border border-[#c6a365] bg-gradient-to-r from-[#572036] to-[#320b19] px-4 py-3 text-sm tracking-wide text-[#f4dfad] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting ? (
                        <>
                          <LoaderCircle size={17} className="animate-spin" />
                          SUBMITTING...
                        </>
                      ) : (
                        <>
                          SUBMIT DETAILS
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-center text-xs leading-5 text-[#f4e6c9]/45">
                    Your submission remains pending until the payment is
                    verified. Do not submit a screenshot as proof of a
                    payment that was not completed.
                  </p>
                </form>
              </motion.div>
            )}

            {/* SUCCESS */}
            {success && step === 4 && (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-7 text-center"
              >
                <CheckCircle2
                  size={52}
                  className="mx-auto mb-4 text-emerald-300"
                />

                <h2
                  className="text-3xl"
                  style={{
                    fontFamily: '"Cormorant Garamond", Georgia, serif',
                  }}
                >
                  Thank You, {details.name.trim()}!
                </h2>

                <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[#f4e6c9]/70">
                  Your gift details have been submitted successfully.
                  Your submission is now pending payment verification.
                  Thank you for sharing your love and blessings with us.
                </p>

                <Link
                  to="/"
                  className="mt-7 inline-flex items-center justify-center gap-2 rounded-full border border-[#c6a365] bg-[#451021] px-6 py-3 text-sm text-[#f4dfad] transition hover:bg-[#572036]"
                >
                  <Heart size={16} />
                  Return to Invitation
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <p className="mt-8 flex items-center justify-center gap-2 text-xs tracking-widest text-[#d8b878]/60">
          WITH LOVE &amp; GRATITUDE <Heart size={12} />
        </p>
      </div>
    </main>
  );
}
