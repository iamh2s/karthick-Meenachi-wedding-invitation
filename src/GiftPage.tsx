import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { Link } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  Copy,
  Download,
  Gift,
  Heart,
  ImagePlus,
  Landmark,
  LoaderCircle,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Upload,
  X,
} from "lucide-react";
import { supabase } from "./lib/Supabase";

const UPI_ID =
  import.meta.env.VITE_WEDDING_UPI_ID || "hariharasudhan15953-1@oksbi";

const PAYEE_NAME =
  import.meta.env.VITE_WEDDING_PAYEE_NAME || "Wedding Gift";

/* Phone number registered on GPay / UPI, shown so guests can pay by number. */
const GPAY_NUMBER =
  import.meta.env.VITE_WEDDING_GPAY_NUMBER || "7010458527";

/* Bank transfer details. Empty fields are simply not shown. */
const BANK = {
  holder: import.meta.env.VITE_WEDDING_ACCOUNT_NAME || "",
  bank: import.meta.env.VITE_WEDDING_BANK_NAME || "",
  accountNo: import.meta.env.VITE_WEDDING_ACCOUNT_NO || "133901000045174",
  ifsc: import.meta.env.VITE_WEDDING_IFSC || "IOB0001595",
};

const PROOF_BUCKET = "gift-payment-proofs";
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

/* The form is kept in sessionStorage so an accidental reload loses nothing.
   The selfie and screenshot are files, so they cannot be saved this way. */
const DRAFT_KEY = "wedding-gift-draft";

function loadDraft(): { details: GuestDetails; step: number } | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    return {
      details: { ...INITIAL_DETAILS, ...parsed.details },
      step: parsed.step === 2 ? 2 : 1,
    };
  } catch {
    return null;
  }
}

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

/* ------------------------------------------------------------------ */
/* Selfie capture: camera only, no gallery upload.                     */
/* ------------------------------------------------------------------ */

/* Longest side of the saved selfie, in pixels. Keeps uploads small. */
const OUTPUT_SIZE = 720;

type SelfieCaptureProps = {
  value: File | null;
  onChange: (file: File | null) => void;
};

/* Crops any image source to a centred square and returns it as a JPEG. */
async function squareJpeg(
  source: CanvasImageSource,
  width: number,
  height: number
): Promise<File> {
  const side = Math.min(width, height);
  const size = Math.min(side, OUTPUT_SIZE);

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is not supported.");

  context.drawImage(
    source,
    (width - side) / 2,
    (height - side) / 2,
    side,
    side,
    0,
    0,
    size,
    size
  );

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.85)
  );

  if (!blob) throw new Error("Could not create the image.");

  return new File([blob], "selfie.jpg", { type: "image/jpeg" });
}

function cameraErrorMessage(error: unknown): string {
  const name = error instanceof DOMException ? error.name : "";

  switch (name) {
    case "NotAllowedError":
    case "SecurityError":
      return "Camera access is blocked. Allow camera access for this site in your browser settings, then try again.";
    case "NotFoundError":
    case "OverconstrainedError":
      return "No camera was found on this device.";
    case "NotReadableError":
    case "AbortError":
      return "Your camera is being used by another app. Close it and try again.";
    default:
      return "Could not start the camera. Please try again.";
  }
}

function SelfieCapture({ value, onChange }: SelfieCaptureProps) {
  const [status, setStatus] = useState<"idle" | "starting" | "live">("idle");
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [cameraFailed, setCameraFailed] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nativeInputRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(false);

  /* The phone's own camera app is only offered on touch devices. On a
     desktop, a file input would open the gallery, which we don't allow. */
  const isTouchDevice =
    typeof window !== "undefined" &&
    !!window.matchMedia?.("(pointer: coarse)").matches;

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  /* Always release the camera when leaving the step or the page. */
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      stopCamera();
    };
  }, [stopCamera]);

  /* Preview of the saved selfie. */
  useEffect(() => {
    if (!value) {
      setPreviewUrl("");
      return;
    }

    const url = URL.createObjectURL(value);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [value]);

  /* Connect the stream to the <video> once it is on screen. */
  useEffect(() => {
    const video = videoRef.current;

    if (status === "live" && video && streamRef.current) {
      video.srcObject = streamRef.current;
      video.play().catch(() => undefined);
    }
  }, [status]);

  async function startCamera() {
    setMessage("");
    setReady(false);

    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage(
        "Camera is not available in this browser. Open this page in Chrome or Safari."
      );
      setCameraFailed(true);
      return;
    }

    setStatus("starting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      setCameraFailed(false);
      setStatus("live");
    } catch (error) {
      if (!mountedRef.current) return;

      setMessage(cameraErrorMessage(error));
      setCameraFailed(true);
      setStatus("idle");
    }
  }

  function cancelCamera() {
    stopCamera();
    setStatus("idle");
    setReady(false);
  }

  async function takePhoto() {
    const video = videoRef.current;

    if (!video || !video.videoWidth) return;

    try {
      const file = await squareJpeg(video, video.videoWidth, video.videoHeight);

      stopCamera();
      setStatus("idle");
      setReady(false);
      setMessage("");
      onChange(file);
    } catch {
      setMessage("Could not capture the photo. Please try again.");
    }
  }

  function retake() {
    onChange(null);
    void startCamera();
  }

  /* Fallback for in-app browsers that block getUserMedia: opens the phone's
     front camera directly. Large photos are shrunk to a square JPEG. */
  async function handleNativeCapture(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const file = input.files?.[0];
    input.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Please take a photo with your camera.");
      return;
    }

    try {
      const bitmap = await createImageBitmap(file);
      const result = await squareJpeg(bitmap, bitmap.width, bitmap.height);
      bitmap.close();

      setMessage("");
      onChange(result);
    } catch {
      setMessage("Could not read that photo. Please try again.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-xs">
      {value && previewUrl ? (
        <div className="text-center">
          <div className="mx-auto aspect-square w-44 overflow-hidden rounded-full border-2 border-[#d8b879]/60">
            <img
              src={previewUrl}
              alt="Your selfie"
              className="h-full w-full object-cover"
            />
          </div>

          <button
            type="button"
            onClick={retake}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#c9a665]/30 px-4 py-2 text-xs text-[#dfc18a] transition hover:bg-[#5a182b]/30"
          >
            <RotateCcw size={14} />
            Retake selfie
          </button>
        </div>
      ) : status !== "idle" ? (
        <div>
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-[#c9a665]/30 bg-[#170b10]">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              onLoadedData={() => setReady(true)}
              className="h-full w-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />

            {ready && (
              <div className="pointer-events-none absolute inset-[10%] rounded-full border-2 border-dashed border-[#e7c681]/60" />
            )}

            {!ready && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#170b10]">
                <LoaderCircle
                  size={26}
                  className="animate-spin text-[#e2c181]"
                />
              </div>
            )}
          </div>

          <p className="mt-3 text-center text-xs text-[#a99587]">
            Keep your face inside the circle.
          </p>

          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={takePhoto}
              disabled={!ready}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#a7793d] to-[#d2b16e] px-4 py-3 text-sm font-medium text-[#1d1010] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Camera size={17} />
              Take photo
            </button>

            <button
              type="button"
              onClick={cancelCamera}
              className="rounded-xl border border-[#c9a665]/30 px-4 py-3 text-sm text-[#e2c9a0] transition hover:bg-[#5a182b]/30"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          <button
            type="button"
            onClick={startCamera}
            className="flex w-full flex-col items-center rounded-2xl border border-dashed border-[#b89a68]/40 bg-[#170b10]/70 px-4 py-7 text-center transition hover:border-[#d8b879]/70"
          >
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#70432f]/30 text-[#e2c181]">
              <Camera size={23} />
            </span>
            <span className="text-sm text-[#ead5ae]">Take a selfie</span>
            <span className="mt-2 text-xs leading-5 text-[#a99587]">
              Uses your front camera. Photos from the gallery cannot be added.
            </span>
          </button>

          {cameraFailed && isTouchDevice && (
            <>
              <button
                type="button"
                onClick={() => nativeInputRef.current?.click()}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[#c9a665]/30 px-4 py-3 text-sm text-[#e2c9a0] transition hover:bg-[#5a182b]/30"
              >
                <Smartphone size={16} />
                Open phone camera instead
              </button>

              <input
                ref={nativeInputRef}
                type="file"
                accept="image/*"
                capture="user"
                onChange={handleNativeCapture}
                className="sr-only"
                aria-label="Take a selfie with your phone camera"
              />
            </>
          )}
        </div>
      )}

      {message && (
        <p role="alert" className="mt-3 text-center text-xs leading-5 text-rose-300">
          {message}
        </p>
      )}
    </div>
  );
}

/*
 * UPI links are built by hand. URLSearchParams encodes spaces as "+", which
 * many UPI apps (including GPay) do not decode, so the payee/note get
 * garbled and the payment is refused. encodeURIComponent gives %20.
 * The UPI ID itself is kept raw (the "@" must stay readable).
 */
function buildUpiLink(amount?: number): string {
  const parts = [
    `pa=${UPI_ID}`,
    `pn=${encodeURIComponent(PAYEE_NAME)}`,
    "cu=INR",
  ];

  if (amount && Number.isFinite(amount) && amount > 0) {
    parts.push(`am=${amount.toFixed(2)}`);
  }

  parts.push(`tn=${encodeURIComponent("Wedding Gift")}`);

  return `upi://pay?${parts.join("&")}`;
}

export default function GiftPage() {
  const [draft] = useState(loadDraft);
  const [step, setStep] = useState(draft?.step ?? 1);
  const [details, setDetails] = useState<GuestDetails>(
    draft?.details ?? INITIAL_DETAILS
  );
  const [selfie, setSelfie] = useState<File | null>(null);
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(
    null
  );
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [copiedKey, setCopiedKey] = useState("");

  /* Unsent work exists until the gift is submitted successfully. */
  const hasProgress =
    !success &&
    (Object.values(details).some((value) => value.trim() !== "") ||
      !!selfie ||
      !!paymentScreenshot);

  /* Save the typed details; clear them once submitted (or when empty). */
  useEffect(() => {
    try {
      const empty = Object.values(details).every((value) => !value.trim());

      if (success || empty) {
        sessionStorage.removeItem(DRAFT_KEY);
      } else {
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ details, step }));
      }
    } catch {
      /* storage unavailable: ignore */
    }
  }, [details, step, success]);

  /* Block reloads while there is unsent work; allow them after success. */
  useEffect(() => {
    if (!hasProgress) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const isReload =
        event.key === "F5" ||
        ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "r");

      if (isReload) event.preventDefault();
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [hasProgress]);

  const paymentPreview = useMemo(() => {
    if (!paymentScreenshot) return "";
    return URL.createObjectURL(paymentScreenshot);
  }, [paymentScreenshot]);

  /* The QR code carries the exact amount. */
  const giftAmount = Number(details.amount);
  const upiLink = useMemo(() => buildUpiLink(giftAmount), [giftAmount]);

  const qrRef = useRef<HTMLCanvasElement>(null);

  /* Saves the QR as an image so a phone user can scan it from the gallery. */
  function saveQr() {
    const canvas = qrRef.current;

    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) {
        setError("Could not save the QR code. Please take a screenshot of it.");
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "wedding-gift-qr.png";
      link.click();

      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
  }

  function updateDetails(field: keyof GuestDetails, value: string) {
    setDetails((previous) => ({
      ...previous,
      [field]: value,
    }));

    setError("");
  }

  function handlePaymentScreenshot(event: ChangeEvent<HTMLInputElement>) {
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
    if (!selfie) {
      setError("Please take a selfie to continue.");
      return false;
    }

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

    if (!details.amount.trim() || !Number.isFinite(amount) || amount <= 0) {
      setError("Please enter a valid gift amount.");
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

  async function copyText(key: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);

      window.setTimeout(() => {
        setCopiedKey("");
      }, 2000);
    } catch {
      setError("Unable to copy. Please copy it manually.");
    }
  }

  const bankRows = [
    { key: "holder", label: "Account name", value: BANK.holder, copy: false },
    { key: "bank", label: "Bank", value: BANK.bank, copy: false },
    { key: "acc", label: "Account number", value: BANK.accountNo, copy: true },
    { key: "ifsc", label: "IFSC code", value: BANK.ifsc, copy: true },
  ].filter((row) => row.value);

  async function submitGift(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateGuestDetails()) {
      setStep(1);
      return;
    }

    if (!selfie) {
      setError("Please take a selfie to continue.");
      setStep(1);
      return;
    }

    if (!paymentScreenshot) {
      setError("Please upload your payment screenshot.");
      return;
    }

    setSubmitting(true);
    setError("");

    const uploadedPaths: string[] = [];

    try {
      // Unique folder prevents filename collisions between submissions.
      const submissionFolder = crypto.randomUUID();

      const screenshotExtension = getFileExtension(paymentScreenshot);
      const screenshotPath = `${submissionFolder}/payment.${screenshotExtension}`;

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

      uploadedPaths.push(screenshotPath);

      // The selfie is always saved as a JPEG by SelfieCapture.
      const selfiePath = `${submissionFolder}/selfie.jpg`;

      const { error: selfieUploadError } = await supabase.storage
        .from(PROOF_BUCKET)
        .upload(selfiePath, selfie, {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (selfieUploadError) {
        throw new Error(`Selfie upload failed: ${selfieUploadError.message}`);
      }

      uploadedPaths.push(selfiePath);

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
          selfie_path: selfiePath,
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

      // Remove the uploaded files if saving the database record fails.
      if (uploadedPaths.length > 0) {
        await supabase.storage
          .from(PROOF_BUCKET)
          .remove(uploadedPaths)
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
    setSelfie(null);
    setPaymentScreenshot(null);
    setStep(1);
    setError("");
    setSuccess(false);
  }

  const inputClass =
    "w-full rounded-xl border border-[#b69a68]/30 bg-[#170b10] px-4 py-3 text-sm text-[#f8ecd4] outline-none transition placeholder:text-[#a38b82] focus:border-[#d8b879] focus:ring-1 focus:ring-[#d8b879]/30";

  const labelClass = "mb-2 block text-sm font-medium text-[#e8d5ad]";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#10070b] text-[#f8ecd4]">
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
            Your blessings and presence mean the world to us. If you wish to
            send a gift, you can do so here.
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
                  {step > number ? <CheckCircle2 size={18} /> : number}
                </div>

                <span
                  className={`ml-2 hidden text-xs sm:block ${
                    step >= number ? "text-[#ead3a4]" : "text-[#9b8478]"
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
                Dear {details.name}, thank you for your love and blessings.
                Your gift details, selfie and payment screenshot have been
                submitted for verification.
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
                  Please provide your details before proceeding to payment.
                </p>
              </div>

              <form onSubmit={continueToPayment} noValidate>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <p className={`${labelClass} text-center`}>
                      Your selfie *
                    </p>
                    <SelfieCapture
                      value={selfie}
                      onChange={(file) => {
                        setSelfie(file);
                        setError("");
                      }}
                    />
                  </div>

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
                  Scan the QR code using a UPI app, complete payment, and
                  upload your payment screenshot.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-[#c9a665]/25 bg-[#170b10] p-5 text-center">
                  <p className="mb-4 text-sm text-[#e8d5ad]">Scan to pay</p>

                  <div className="mx-auto inline-flex rounded-2xl bg-white p-3">
                    <QRCodeCanvas
                      ref={qrRef}
                      value={upiLink}
                      size={190}
                      level="H"
                      includeMargin
                    />
                  </div>

                  <p className="mt-4 text-xs text-[#bca89b]">Amount</p>
                  <p className="mt-1 text-2xl font-semibold text-[#f1d49a]">
                    ₹{Number(details.amount).toLocaleString("en-IN")}
                  </p>

                  <div className="mt-4 rounded-xl border border-[#c6a366]/20 px-3 py-3">
                    <p className="text-xs text-[#bca89b]">UPI ID</p>
                    <p className="mt-1 break-all text-sm text-[#ead7b7]">
                      {UPI_ID}
                    </p>
                    <button
                      type="button"
                      onClick={() => copyText("upi", UPI_ID)}
                      className="mt-2 inline-flex items-center gap-2 text-xs text-[#d8b879] hover:text-white"
                    >
                      <Copy size={14} />
                      {copiedKey === "upi" ? "Copied!" : "Copy UPI ID"}
                    </button>

                    {GPAY_NUMBER && (
                      <div className="mt-3 border-t border-[#c6a366]/20 pt-3">
                        <p className="text-xs text-[#bca89b]">
                          GPay / phone number
                        </p>
                        <p className="mt-1 text-sm text-[#ead7b7]">
                          {GPAY_NUMBER}
                        </p>
                        <button
                          type="button"
                          onClick={() => copyText("phone", GPAY_NUMBER)}
                          className="mt-2 inline-flex items-center gap-2 text-xs text-[#d8b879] hover:text-white"
                        >
                          <Copy size={14} />
                          {copiedKey === "phone" ? "Copied!" : "Copy number"}
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={saveQr}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#c9a665]/40 px-4 py-3 text-sm text-[#e2c9a0] transition hover:bg-[#5a182b]/30"
                  >
                    <Download size={16} />
                    Save QR image
                  </button>
                  <p className="mt-2 text-[11px] leading-5 text-[#a99587]">
                    Paying from this phone? Save the QR, then in your UPI app
                    choose Scan and pick the saved image from your gallery.
                  </p>

                  <p className="mt-4 text-[11px] leading-5 text-[#a99587]">
                    Or open your UPI app, choose to pay a phone number or UPI
                    ID, and use the details above. Nothing is pre-filled, so
                    please enter ₹
                    {Number(details.amount).toLocaleString("en-IN")} yourself.
                  </p>
                </div>

                <div>
                  <div className="mb-5 rounded-2xl border border-[#c6a366]/20 bg-[#170b10] p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Landmark size={18} className="text-[#d9b978]" />
                      <p className="text-sm text-[#ead5ae]">
                        Or pay by bank transfer
                      </p>
                    </div>

                    <div className="space-y-3 text-sm">
                      {bankRows.map((row) => (
                        <div
                          key={row.key}
                          className="flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="text-xs text-[#bca89b]">
                              {row.label}
                            </p>
                            <p className="break-all text-[#ead7b7]">
                              {row.value}
                            </p>
                          </div>

                          {row.copy && (
                            <button
                              type="button"
                              onClick={() => copyText(row.key, row.value)}
                              className="inline-flex shrink-0 items-center gap-1 text-xs text-[#d8b879] hover:text-white"
                            >
                              <Copy size={13} />
                              {copiedKey === row.key ? "Copied!" : "Copy"}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <p className="mt-3 text-[11px] leading-5 text-[#a99587]">
                      Use NEFT / IMPS / your bank app, then upload the
                      transfer screenshot below.
                    </p>
                  </div>

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
                          After completing your payment, upload a screenshot.
                          Your submission will remain pending until it is
                          verified.
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