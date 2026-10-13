
import { Link } from "react-router-dom";
import { Gift, ArrowUpRight } from "lucide-react";

type SendGiftButtonProps = {
  className?: string;
};

export default function SendGiftButton({
  className = "",
}: SendGiftButtonProps) {
  return (
    <div className={`flex justify-center ${className}`}>
      <Link
        to="/gift"
        aria-label="Send a wedding gift to Karthick and Meenachi"
        className="
          group relative inline-flex items-center justify-center gap-3
          overflow-hidden rounded-full
          border border-[#c6a365]/70
          bg-gradient-to-br from-[#571328] via-[#350916] to-[#210710]
          px-7 py-3.5
          text-sm font-medium tracking-[0.12em]
          text-[#f0d8a8]
          shadow-[0_8px_30px_rgba(0,0,0,0.3)]
          transition-all duration-300 ease-out
          hover:-translate-y-0.5
          hover:border-[#e2c486]
          hover:shadow-[0_10px_35px_rgba(176,138,74,0.2)]
          focus-visible:outline-none
          focus-visible:ring-2 focus-visible:ring-[#d2b475]
          focus-visible:ring-offset-2 focus-visible:ring-offset-[#210710]
        "
      >
        <span
          aria-hidden="true"
          className="
            pointer-events-none absolute inset-0
            -translate-x-full bg-gradient-to-r
            from-transparent via-white/10 to-transparent
            transition-transform duration-700
            group-hover:translate-x-full
          "
        />

        <Gift
          size={18}
          strokeWidth={1.5}
          className="relative transition-transform duration-300 group-hover:scale-110"
        />

        <span className="relative">Send Gift</span>

        <ArrowUpRight
          size={15}
          strokeWidth={1.5}
          className="relative opacity-60 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
        />
      </Link>
    </div>
  );
}
