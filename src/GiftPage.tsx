
import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Copy,
  Gift,
  Heart,
  ImagePlus,
  LoaderCircle,
  ShieldCheck,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import { supabase } from "./lib/Supabase";

const UPI_ID =
  import.meta.env.VITE_WEDDING_UPI_ID || "hariharasudhan15953-1@oksbi";

const PAYEE_NAME =
  import.meta.env.VITE_WEDDING_PAYEE_NAME || "Wedding Gift";

const PROOF_BUCKET = "gift-payment-proofs";
const PROFILE_BUCKET = "wedding-gift-profiles";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const RELATIONSHIPS = [
  "Father",
  "Mother",
  "Uncle",
  "Aunt",
  "Brother",
  "Sister",
  "Cousin",
  "Grandfather",
  "Grandmother",
  "Relative",
  "Family Friend",
  "Friend",
  "Colleague",
  "Neighbour",
  "Other",
];

type GuestDetails = {
  name: string;
  email: string;
  phone: string;
  relationship: string;
  amount: string;
  message: string;
};

const INITIAL_DETAILS: GuestDetails = {
  name: "",
  email: "",
  phone: "",
  relationship: "",
  amount: "",
  message: "",
};

function validateImage(file: File): string | null {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (!allowedTypes.includes(file.type)) {
    return "Please upload a JPG, PNG, or WebP image.";
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return "Image size must be 5 MB or less.";
  }

  return null;
}

function getFileExtension(file: File): string {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension && ["jpg", "jpeg", "png", "webp"].includes(extension)) {
    return extension === "jpeg" ? "jpg" : extension;
  }

  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";

  return "jpg";
}

export default function GiftPage() {
  const [step, setStep] = useState(1);
  const [details, setDetails] = useState<GuestDetails>(INITIAL_DETAILS);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(
    null
  );
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const profilePreview = useMemo(() => {
    if (!profileImage) return "";
    return URL.createObjectURL(profileImage);
  }, [profileImage]);

  const paymentPreview = useMemo(() => {
    if (!paymentScreenshot) return "";
    return URL.createObjectURL(paymentScreenshot);
  }, [paymentScreenshot]);

  const upiLink = useMemo(() => {
    const params = new URLSearchParams({
      pa: UPI_ID,
      pn: PAYEE_NAME,
      cu: "INR",
    });

    const amount = Number(details.amount);

    if (details.amount && Number.isFinite(amount) && amount > 0) {
      params.set("am", amount.toFixed(2));
    }

    params.set("tn", "Wedding Gift");

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

    setError("");
  }

  function handleProfileImage(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    const validationError = validateImage(file);

    if (validationError) {
      setError(validationError);
      event.target.value = "";
      return;
    }

    setProfileImage(file);
    setError("");
  }

  function handlePaymentScreenshot(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    const validationError = validateImage(file);

    if (validationError) {
      setError(validationError);
      event.target.value = "";
      return;
    }

    setPaymentScreenshot(file);
    setError("");
  }

  function validateGuestDetails(): boolean {
    if (!details.name.trim()) {
      setError("Please enter your full name.");
      return false;
    }

    if (!details.email.trim()) {
      setError("Please enter your email address.");
      return false;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(details.email.trim())) {
      setError("Please enter a valid email address.");
      return false;
    }

    if (!details.phone.trim()) {
      setError("Please enter your phone number.");
      return false;
    }

    const digits = details.phone.replace(/\D/g, "");

    if (digits.length < 10 || digits.length > 15) {
      setError("Please enter a valid phone number.");
      return false;
    }

    if (!details.relationship) {
      setError("Please select your relationship with the couple.");
      return false;
    }

    const amount = Number(details.amount);

    if (
      !details.amount.trim() ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setError("Please enter a valid gift amount.");
      return false;
    }

    if (!profileImage) {
      setError("Please upload your profile photo.");
      return false;
    }

    setError("");
    return true;
  }

  function continueToPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateGuestDetails()) return;

    setStep(2);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function copyUpiId() {
    try {
      await navigator.clipboard.writeText(UPI_ID);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setError("Unable to copy the UPI ID. Please copy it manually.");
    }
  }

  async function submitGift(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateGuestDetails()) {
      setStep(1);
      return;
    }

    if (!paymentScreenshot) {
      setError("Please upload your payment screenshot.");
      return;
    }

    if (!profileImage) {
      setError("Please upload your profile photo.");
      setStep(1);
      return;
    }

    setSubmitting(true);
    setError("");

    let screenshotPath: string | null = null;
    let profilePath: string | null = null;

    try {
      const { data: authData } = await supabase.auth.getUser();

      // Unique folders prevent filename collisions between submissions.
      const submissionFolder = crypto.randomUUID();

      const screenshotExtension = getFileExtension(paymentScreenshot);
      screenshotPath = `${submissionFolder}/payment.${screenshotExtension}`;

      const { error: screenshotUploadError } = await supabase.storage
        .from(PROOF_BUCKET)
        .upload(screenshotPath, paymentScreenshot, {
          contentType: paymentScreenshot.type,
          upsert: false,
        });

      if (screenshotUploadError) {
        throw new Error(
          `Payment screenshot upload failed: ${screenshotUploadError.message}`
        );
      }

      const profileExtension = getFileExtension(profileImage);
      profilePath = `${submissionFolder}/profile.${profileExtension}`;

      const { error: profileUploadError } = await supabase.storage
        .from(PROFILE_BUCKET)
        .upload(profilePath, profileImage, {
          contentType: profileImage.type,
          upsert: false,
        });

      if (profileUploadError) {
        throw new Error(
          `Profile photo upload failed: ${profileUploadError.message}`
        );
      }

const { error: insertError } = await supabase
  .from("wedding_gift_submissions")
  .insert({
    guest_name: details.name.trim(),
    email: details.email.trim(),
    phone: details.phone.trim(),
    relationship: details.relationship,
    amount: Number(details.amount),
    message: details.message.trim() || null,
    screenshot_path: screenshotPath,
    user_image: profilePath,
    status: "PENDING",
  });


if (insertError) {
  console.error("Gift submission error:", insertError);
  throw new Error(
    `Could not save your gift submission: ${insertError.message}`
  );
}


      setSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (submissionError) {
      console.error("Wedding gift submission error:", submissionError);

      // Remove uploaded files if saving the database record fails.
      const pathsToRemove = [screenshotPath, profilePath].filter(
        (path): path is string => Boolean(path)
      );

      if (screenshotPath) {
        await supabase.storage
          .from(PROOF_BUCKET)
          .remove([screenshotPath])
          .catch(() => undefined);
      }

      if (profilePath) {
        await supabase.storage
          .from(PROFILE_BUCKET)
          .remove([profilePath])
          .catch(() => undefined);
      }

      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setDetails(INITIAL_DETAILS);
    setProfileImage(null);
    setPaymentScreenshot(null);
    setStep(1);
    setError("");
    setSuccess(false);
  }

  const inputClass =
    "w-full rounded-xl border border-[#b69a68]/30 bg-[#170b10] px-4 py-3 text-sm text-[#f8ecd4] outline-none transition placeholder:text-[#a38b82] focus:border-[#d8b879] focus:ring-1 focus:ring-[#d8b879]/30";

  const labelClass =
    "mb-2 block text-sm font-medium text-[#e8d5ad]";

  return (
    <main className="min-h-screen overflow-hidden bg-[#10070b] text-[#f8ecd4]">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-32 top-0 h-80 w-80 rounded-full bg-[#792c40]/15 blur-[100px]" />
        <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-[#c59a50]/10 blur-[110px]" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
        <Link
          to="/home"
          className="mb-8 inline-flex items-center gap-2 text-sm text-[#cdb995] transition hover:text-[#ffe7ad]"
        >
          <ArrowLeft size={17} />
          Back to invitation
        </Link>

        <header className="mb-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#d4b16b]/40 bg-[#5a182b]/30"
          >
            <Gift size={26} className="text-[#e7c681]" />
          </motion.div>

          <p className="mb-3 text-xs uppercase tracking-[0.35em] text-[#c4a76f]">
            With love and gratitude
          </p>

          <h1 className="font-serif text-4xl text-[#f4dfb1] sm:text-5xl">
            Wedding Gift
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#c8b6aa] sm:text-base">
            Your blessings and presence mean the world to us. If you
            wish to send a gift, you can do so here.
          </p>

          <div className="mt-5 flex items-center justify-center gap-2 text-[#c7a66a]">
            <span className="h-px w-12 bg-[#b89b63]/50" />
            <Heart size={15} />
            <span className="h-px w-12 bg-[#b89b63]/50" />
          </div>
        </header>

        {!success && (
          <div className="mx-auto mb-8 flex max-w-md items-center">
            {[1, 2].map((number, index) => (
              <div key={number} className="flex flex-1 items-center">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm ${
                    step >= number
                      ? "border-[#dfbd7a] bg-[#8a5c2b] text-white"
                      : "border-[#7b6252] text-[#a99587]"
                  }`}
                >
                  {step > number ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    number
                  )}
                </div>

                <span
                  className={`ml-2 hidden text-xs sm:block ${
                    step >= number
                      ? "text-[#ead3a4]"
                      : "text-[#9b8478]"
                  }`}
                >
                  {number === 1 ? "Guest details" : "Payment"}
                </span>

                {index === 0 && (
                  <div
                    className={`mx-3 h-px flex-1 ${
                      step === 2 ? "bg-[#d6b36f]" : "bg-[#6b5148]"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {success ? (
            <motion.section
              key="success"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto max-w-xl rounded-3xl border border-[#c9a665]/30 bg-[#241117]/90 p-7 text-center shadow-2xl sm:p-10"
            >
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 size={38} />
              </div>

              <h2 className="font-serif text-3xl text-[#f3ddb0]">
                Thank You!
              </h2>

              <p className="mt-4 leading-7 text-[#cdbcb0]">
                Dear {details.name}, thank you for your love and
                blessings. Your gift details and payment screenshot
                have been submitted for verification.
              </p>

              <div className="mt-6 rounded-2xl border border-[#c6a366]/20 bg-[#160b10] p-5">
                <p className="text-xs uppercase tracking-widest text-[#c1a36d]">
                  Gift amount
                </p>
                <p className="mt-2 text-3xl font-semibold text-[#f1d49a]">
                  ₹{Number(details.amount).toLocaleString("en-IN")}
                </p>
                <p className="mt-2 text-xs text-[#bba99d]">
                  Status: Pending verification
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
                className="mt-7 rounded-xl border border-[#d2b16e]/40 px-6 py-3 text-sm text-[#ecd4a5] transition hover:bg-[#5a182b]/40"
              >
                Submit another gift
              </button>

              <div className="mt-5">
                <Link
                  to="/home"
                  className="text-sm text-[#c8b49a] hover:text-white"
                >
                  Return to invitation
                </Link>
              </div>
            </motion.section>
          ) : step === 1 ? (
            <motion.section
              key="details"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              className="mx-auto max-w-2xl rounded-3xl border border-[#c9a665]/25 bg-[#241117]/90 p-5 shadow-2xl sm:p-8"
            >
              <div className="mb-7">
                <h2 className="font-serif text-2xl text-[#f0d9ab]">
                  Guest Details
                </h2>
                <p className="mt-2 text-sm text-[#bca89b]">
                  Please provide your details before proceeding to
                  payment.
                </p>
              </div>

              <form onSubmit={continueToPayment} noValidate>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="guest-name" className={labelClass}>
                      Full name *
                    </label>
                    <input
                      id="guest-name"
                      className={inputClass}
                      value={details.name}
                      onChange={(event) =>
                        updateDetails("name", event.target.value)
                      }
                      placeholder="Enter your full name"
                      autoComplete="name"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="guest-relationship"
                      className={labelClass}
                    >
                      Relationship with the couple *
                    </label>
                    <select
                      id="guest-relationship"
                      className={inputClass}
                      value={details.relationship}
                      onChange={(event) =>
                        updateDetails("relationship", event.target.value)
                      }
                    >
                      <option value="">Select relationship</option>
                      {RELATIONSHIPS.map((relationship) => (
                        <option
                          key={relationship}
                          value={relationship}
                          className="bg-[#170b10]"
                        >
                          {relationship}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="guest-email" className={labelClass}>
                      Email address *
                    </label>
                    <input
                      id="guest-email"
                      type="email"
                      className={inputClass}
                      value={details.email}
                      onChange={(event) =>
                        updateDetails("email", event.target.value)
                      }
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                  </div>

                  <div>
                    <label htmlFor="guest-phone" className={labelClass}>
                      Phone number *
                    </label>
                    <input
                      id="guest-phone"
                      type="tel"
                      className={inputClass}
                      value={details.phone}
                      onChange={(event) =>
                        updateDetails("phone", event.target.value)
                      }
                      placeholder="Enter phone number"
                      autoComplete="tel"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="gift-amount" className={labelClass}>
                      Gift amount (₹) *
                    </label>
                    <input
                      id="gift-amount"
                      type="number"
                      min="1"
                      step="1"
                      className={inputClass}
                      value={details.amount}
                      onChange={(event) =>
                        updateDetails("amount", event.target.value)
                      }
                      placeholder="Enter amount"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="guest-profile-image"
                      className={labelClass}
                    >
                      Your profile photo *
                    </label>

                    <div className="rounded-2xl border border-dashed border-[#b89a68]/40 bg-[#170b10]/70 p-4">
                      {profilePreview ? (
                        <div className="flex items-center gap-4">
                          <img
                            src={profilePreview}
                            alt="Your profile preview"
                            className="h-20 w-20 rounded-full border border-[#d4b16b]/50 object-cover"
                          />

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm text-[#f1dfbd]">
                              {profileImage?.name}
                            </p>
                            <p className="mt-1 text-xs text-[#bca89b]">
                              {(
                                (profileImage?.size || 0) /
                                (1024 * 1024)
                              ).toFixed(2)}{" "}
                              MB
                            </p>

                            <button
                              type="button"
                              onClick={() => setProfileImage(null)}
                              className="mt-2 inline-flex items-center gap-1 text-xs text-rose-300 hover:text-rose-200"
                            >
                              <X size={13} />
                              Remove photo
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label
                          htmlFor="guest-profile-image"
                          className="flex cursor-pointer flex-col items-center py-5 text-center"
                        >
                          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#70432f]/30 text-[#e2c181]">
                            <UserRound size={24} />
                          </div>
                          <span className="text-sm text-[#ead5ae]">
                            Upload your profile photo
                          </span>
                          <span className="mt-2 text-xs text-[#a99587]">
                            JPG, PNG or WebP · Maximum 5 MB
                          </span>
                        </label>
                      )}

                      <input
                        id="guest-profile-image"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleProfileImage}
                        className="sr-only"
                        aria-label="Upload your profile photo"
                      />
                    </div>

                    <p className="mt-2 text-xs text-[#a99587]">
                      A profile photo is required to continue.
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="gift-message" className={labelClass}>
                      Message to the couple (optional)
                    </label>
                    <textarea
                      id="gift-message"
                      rows={3}
                      maxLength={500}
                      className={inputClass}
                      value={details.message}
                      onChange={(event) =>
                        updateDetails("message", event.target.value)
                      }
                      placeholder="Write your wishes and blessings..."
                    />
                    <p className="mt-1 text-right text-xs text-[#9f8a7e]">
                      {details.message.length}/500
                    </p>
                  </div>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="mt-5 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#a7793d] to-[#d2b16e] px-5 py-3.5 font-medium text-[#1d1010] transition hover:brightness-110"
                >
                  Continue to payment
                  <ArrowRight size={18} />
                </button>
              </form>
            </motion.section>
          ) : (
            <motion.section
              key="payment"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              className="mx-auto max-w-2xl rounded-3xl border border-[#c9a665]/25 bg-[#241117]/90 p-5 shadow-2xl sm:p-8"
            >
              <div className="mb-7">
                <h2 className="font-serif text-2xl text-[#f0d9ab]">
                  Complete Your Gift
                </h2>
                <p className="mt-2 text-sm text-[#bca89b]">
                  Scan the QR code using a UPI app, complete payment,
                  and upload your payment screenshot.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-[#c9a665]/25 bg-[#170b10] p-5 text-center">
                  <p className="mb-4 text-sm text-[#e8d5ad]">
                    Scan to pay
                  </p>

                  <div className="mx-auto inline-flex rounded-2xl bg-white p-3">
                    <QRCodeSVG
                      value={upiLink}
                      size={190}
                      level="H"
                      includeMargin
                    />
                  </div>

                  <p className="mt-4 text-xs text-[#bca89b]">
                    Amount
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-[#f1d49a]">
                    ₹{Number(details.amount).toLocaleString("en-IN")}
                  </p>

                  <div className="mt-4 rounded-xl border border-[#c6a366]/20 px-3 py-3">
                    <p className="break-all text-sm text-[#ead7b7]">
                      {UPI_ID}
                    </p>
                    <button
                      type="button"
                      onClick={copyUpiId}
                      className="mt-3 inline-flex items-center gap-2 text-xs text-[#d8b879] hover:text-white"
                    >
                      <Copy size={14} />
                      {copied ? "Copied!" : "Copy UPI ID"}
                    </button>
                  </div>

                  <a
                    href={upiLink}
                    className="mt-4 flex items-center justify-center rounded-xl bg-[#e0bd77] px-4 py-3 text-sm font-semibold text-[#21120f] transition hover:brightness-110"
                  >
                    Open UPI app
                  </a>
                </div>

                <div>
                  <div className="mb-5 rounded-2xl border border-[#c6a366]/20 bg-[#170b10] p-4">
                    <div className="flex items-start gap-3">
                      <ShieldCheck
                        size={20}
                        className="mt-0.5 shrink-0 text-[#d9b978]"
                      />
                      <div>
                        <p className="text-sm text-[#ead5ae]">
                          Payment verification
                        </p>
                        <p className="mt-1 text-xs leading-6 text-[#bca89b]">
                          After completing your payment, upload a
                          screenshot. Your submission will remain
                          pending until it is verified.
                        </p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={submitGift}>
                    <label
                      htmlFor="payment-screenshot"
                      className={labelClass}
                    >
                      Payment screenshot *
                    </label>

                    <div className="rounded-2xl border border-dashed border-[#b89a68]/40 bg-[#170b10]/70 p-4">
                      {paymentPreview ? (
                        <div>
                          <img
                            src={paymentPreview}
                            alt="Payment screenshot preview"
                            className="max-h-64 w-full rounded-xl object-contain"
                          />

                          <button
                            type="button"
                            onClick={() => setPaymentScreenshot(null)}
                            className="mt-3 inline-flex items-center gap-1 text-xs text-rose-300 hover:text-rose-200"
                          >
                            <X size={13} />
                            Remove screenshot
                          </button>
                        </div>
                      ) : (
                        <label
                          htmlFor="payment-screenshot"
                          className="flex cursor-pointer flex-col items-center py-6 text-center"
                        >
                          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#70432f]/30 text-[#e2c181]">
                            <ImagePlus size={23} />
                          </div>
                          <span className="text-sm text-[#ead5ae]">
                            Upload payment screenshot
                          </span>
                          <span className="mt-2 text-xs text-[#a99587]">
                            JPG, PNG or WebP · Maximum 5 MB
                          </span>
                          <span className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[#c9a665]/30 px-3 py-2 text-xs text-[#dfc18a]">
                            <Upload size={14} />
                            Choose image
                          </span>
                        </label>
                      )}

                      <input
                        id="payment-screenshot"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handlePaymentScreenshot}
                        className="sr-only"
                        aria-label="Upload payment screenshot"
                      />
                    </div>

                    <div className="mt-5 rounded-xl border border-[#c6a366]/20 bg-[#170b10] p-4 text-sm">
                      <div className="flex justify-between gap-4 text-[#bca89b]">
                        <span>Guest</span>
                        <span className="text-right text-[#ead5ae]">
                          {details.name}
                        </span>
                      </div>
                      <div className="mt-3 flex justify-between gap-4 text-[#bca89b]">
                        <span>Relationship</span>
                        <span className="text-right text-[#ead5ae]">
                          {details.relationship}
                        </span>
                      </div>
                      <div className="mt-3 flex justify-between gap-4 text-[#bca89b]">
                        <span>Gift amount</span>
                        <span className="text-right text-[#f1d49a]">
                          ₹{Number(details.amount).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>

                    {error && (
                      <div
                        role="alert"
                        className="mt-4 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
                      >
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#a7793d] to-[#d2b16e] px-5 py-3.5 font-medium text-[#1d1010] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting ? (
                        <>
                          <LoaderCircle size={18} className="animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          Submit gift details
                          <CheckCircle2 size={18} />
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setStep(1);
                        setError("");
                      }}
                      disabled={submitting}
                      className="mt-3 w-full rounded-xl border border-[#c9a665]/30 px-5 py-3 text-sm text-[#e2c9a0] transition hover:bg-[#5a182b]/30 disabled:opacity-50"
                    >
                      <span className="inline-flex items-center gap-2">
                        <ArrowLeft size={16} />
                        Back to guest details
                      </span>
                    </button>
                  </form>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        <footer className="mt-10 text-center text-xs leading-6 text-[#8f796f]">
          <p>Made with love and gratitude.</p>
          <p>Please never share your UPI PIN or banking password.</p>
        </footer>
      </div>
    </main>
  );
}
