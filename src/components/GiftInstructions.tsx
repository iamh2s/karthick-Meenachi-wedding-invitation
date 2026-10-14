
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  Gift,
  ScanLine,
  ShieldCheck,
  Upload,
  UserRound,
} from "lucide-react";
import { motion } from "framer-motion";

const INSTRUCTIONS = [
  {
    title: "Step 1: Add your details",
    description:
      "Enter your full name, email address, phone number, relationship with Karthick and Meenachi, and the gift amount.",
    icon: UserRound,
  },
  {
    title: "Step 2: Continue to payment",
    description:
      "Review your details and tap Continue to payment to view the UPI QR code and available payment options.",
    icon: Gift,
  },
  {
    title: "Step 3: Make the payment",
    description:
      "Tap Open UPI app on your phone, or scan the QR code using GPay, PhonePe, Paytm or another UPI app. Verify the payee and amount before paying.",
    icon: ScanLine,
  },
  {
    title: "Step 4: Upload the screenshot",
    description:
      "After the payment succeeds, take a screenshot of the transaction and upload it. JPG, PNG and WebP images up to 5 MB are accepted.",
    icon: Camera,
  },
  {
    title: "Step 5: Submit your gift",
    description:
      "Review your details and payment screenshot, then tap Submit gift details to send your submission for verification.",
    icon: Upload,
  },
];

export default function GiftInstructions() {
  const navigate = useNavigate();
  const [secondsLeft, setSecondsLeft] = useState(7);

  useEffect(() => {
    const startedAt = Date.now();

    const interval = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const remaining = Math.max(0, 7 - elapsed);

      setSecondsLeft(remaining);

      if (remaining === 0) {
        window.clearInterval(interval);
      }
    }, 100);

    return () => window.clearInterval(interval);
  }, []);

  const canContinue = secondsLeft === 0;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#10070b] px-4 py-8 text-[#f8ecd4] sm:px-6 sm:py-12">
      {/* Maroon and antique-gold background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 top-0 h-80 w-80 rounded-full bg-[#792c40]/20 blur-[100px]" />
        <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-[#c59a50]/10 blur-[110px]" />
      </div>

      <div className="relative mx-auto max-w-2xl">
        <Link
          to="/home"
          className="mb-8 inline-flex items-center gap-2 text-sm text-[#cdb995] transition hover:text-[#ffe7ad]"
        >
          <ArrowLeft size={17} />
          Back to invitation
        </Link>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="rounded-3xl border border-[#c9a665]/30 bg-[#241117]/95 p-5 shadow-2xl sm:p-8"
        >
          <header className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[#d4b16b]/40 bg-[#5a182b]/40">
              <Gift size={30} className="text-[#e7c681]" />
            </div>

            <p className="mb-3 text-xs uppercase tracking-[0.3em] text-[#c4a76f]">
              Karthick &amp; Meenachi
            </p>

            <h1 className="font-serif text-3xl leading-tight text-[#f4dfb1] sm:text-4xl">
              Wedding Gift Instructions
            </h1>

            <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-[#c8b6aa]">
              Thank you for sharing your love and blessings with us.
              Please read these simple steps before proceeding with your gift.
            </p>
          </header>

          <ol className="space-y-5">
            {INSTRUCTIONS.map((item, index) => {
              const Icon = item.icon;

              return (
                <li
                  key={item.title}
                  className="flex items-start gap-4 rounded-2xl border border-[#c6a366]/15 bg-[#170b10]/80 p-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#dfbd7a]/40 bg-[#8a5c2b]/25 text-[#f4dfb1]">
                    <Icon size={19} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-semibold leading-6 text-[#ead5ae] sm:text-base">
                      {item.title}
                    </h2>

                    <p className="mt-1 text-xs leading-6 text-[#bca89b] sm:text-sm">
                      {item.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="mt-6 rounded-2xl border border-[#c6a366]/20 bg-[#5a182b]/20 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck
                size={20}
                className="mt-0.5 shrink-0 text-[#dfbd7a]"
              />

              <p className="text-xs leading-6 text-[#d7c4a8] sm:text-sm">
                <span className="font-semibold text-[#f0d9ab]">
                  Stay safe:
                </span>{" "}
                Never share your UPI PIN, OTP or banking password with anyone.
                Your gift submission remains pending until payment verification.
              </p>
            </div>
          </div>

          <div className="mt-7 text-center">
            {!canContinue ? (
              <>
                <p
                  aria-live="polite"
                  className="mb-3 text-sm text-[#c8b6aa]"
                >
                  Please read the instructions. Continue available in{" "}
                  <span className="font-semibold text-[#f1d49a]">
                    {secondsLeft} second{secondsLeft === 1 ? "" : "s"}
                  </span>
                </p>

                <button
                  type="button"
                  disabled
                  className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-[#c9a665]/20 bg-[#6b5148]/30 px-5 py-4 text-sm font-semibold text-[#a99587] opacity-70"
                >
                  <ShieldCheck size={18} />
                  Please wait...
                </button>
              </>
            ) : (
              <>
                <p className="mb-3 text-sm text-[#d8b879]">
                  Thank you for reading the instructions.
                </p>

                <button
                  type="button"
                  onClick={() => navigate("/gift")}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#a7793d] to-[#d2b16e] px-5 py-4 text-sm font-semibold text-[#1d1010] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4dfb1]"
                >
                  OK, Continue to Gift Form
                  <ArrowRight size={18} />
                </button>
              </>
            )}

            <p className="mt-4 text-xs text-[#8f796f]">
              Made with love and gratitude.
            </p>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
