import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Phone,
  MapPin,
  X,
  Navigation,
  UserRound,
  ChevronRight,
} from "lucide-react";

export default function ContactButton() {
  const [open, setOpen] = useState(false);

  const contacts = [
    {
      name: "Groom's Family",
      phone: "+91 90000 00000",
    },
    {
      name: "Bride's Family",
      phone: "+91 90000 00001",
    },
  ];

  const venue = {
    name: "Puthu Surangudi Marriage Hall",
    address: "Puthu Surangudi, Tamil Nadu",
    mapsUrl: "https://maps.google.com/",
  };

  return (
    <>
      {/* =====================================================
          FLOATING CONTACT BUTTON
          Bottom Right — Responsive
      ===================================================== */}

      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Contact and Venue"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        className="
          fixed
          bottom-5
          right-5
          z-[150]

          flex
          items-center
          gap-2

          rounded-full

          border
          border-[#c9a95d]/80

          bg-[#5b0711]

          px-4
          py-3

          text-[#e7c875]

          shadow-[0_8px_30px_rgba(0,0,0,0.45)]

          backdrop-blur-md

          transition-all
          duration-300

          hover:bg-[#700b17]

          sm:bottom-6
          sm:right-6
          sm:px-5
          sm:py-3.5

          md:bottom-7
          md:right-7
        "
      >
        <Phone
          className="
            h-4
            w-4
            shrink-0
            sm:h-5
            sm:w-5
          "
          strokeWidth={1.7}
        />
      </motion.button>


      {/* =====================================================
          MODAL BACKDROP
      ===================================================== */}

      <AnimatePresence>
        {open && (
          <motion.div
            className="
              fixed
              inset-0
              z-[200]

              flex
              items-end
              justify-center

              bg-black/70

              px-3
              pb-3

              backdrop-blur-sm

              sm:items-center
              sm:px-5
              sm:pb-0
            "
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >

            {/* =================================================
                MODAL
            ================================================= */}

            <motion.div
              className="
                relative

                w-full
                max-w-md

                overflow-hidden

                rounded-2xl
                border
                border-[#c9a95d]/70

                bg-[#43060e]

                text-[#f5e7c0]

                shadow-[0_25px_80px_rgba(0,0,0,0.65)]

                sm:rounded-3xl
              "
              initial={{
                opacity: 0,
                y: 40,
                scale: 0.96,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: 30,
                scale: 0.96,
              }}
              transition={{
                duration: 0.28,
                ease: "easeOut",
              }}
              onClick={(event) => event.stopPropagation()}
            >

              {/* =================================================
                  TOP GOLD LINE
              ================================================= */}

              <div
                className="
                  h-[2px]
                  w-full
                  bg-[#c9a95d]
                "
              />


              {/* =================================================
                  HEADER
              ================================================= */}

              <div
                className="
                  relative
                  px-5
                  pb-4
                  pt-5

                  sm:px-7
                  sm:pb-5
                  sm:pt-6
                "
              >

                {/* CLOSE BUTTON */}

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close contact window"
                  className="
                    absolute
                    right-4
                    top-4

                    flex
                    h-8
                    w-8
                    items-center
                    justify-center

                    rounded-full

                    border
                    border-[#c9a95d]/30

                    text-[#d9c58d]

                    transition-all
                    duration-200

                    hover:border-[#c9a95d]
                    hover:bg-[#c9a95d]/10
                    hover:text-[#e7c875]

                    sm:right-5
                    sm:top-5
                  "
                >
                  <X
                    className="h-4 w-4"
                    strokeWidth={1.7}
                  />
                </button>


                {/* TITLE */}

                <div className="pr-10">

                  <div
                    className="
                      mb-2
                      flex
                      items-center
                      gap-2
                      text-[#c9a95d]
                    "
                  >
                    <Phone
                      className="h-4 w-4"
                      strokeWidth={1.6}
                    />

                    <span
                      className="
                        text-[10px]
                        font-semibold
                        uppercase
                        tracking-[0.22em]
                      "
                    >
                      Assistance
                    </span>
                  </div>

                  <h2
                    className="
                      font-serif
                      text-xl
                      font-medium
                      tracking-wide
                      text-[#f1dfae]

                      sm:text-2xl
                    "
                  >
                    Contact & Venue
                  </h2>

                  <div
                    className="
                      mt-3
                      h-px
                      w-20
                      bg-[#c9a95d]
                    "
                  />

                </div>

              </div>


              {/* =================================================
                  CONTENT
              ================================================= */}

              <div
                className="
                  max-h-[72vh]
                  overflow-y-auto

                  px-5
                  pb-6

                  sm:px-7
                  sm:pb-7
                "
              >

                {/* =================================================
                    CONTACT SECTION
                ================================================= */}

                <div className="mb-6">

                  <div
                    className="
                      mb-3
                      flex
                      items-center
                      gap-2
                    "
                  >

                    <UserRound
                      className="
                        h-4
                        w-4
                        text-[#c9a95d]
                      "
                      strokeWidth={1.6}
                    />

                    <h3
                      className="
                        text-sm
                        font-semibold
                        uppercase
                        tracking-[0.14em]
                        text-[#e7c875]
                      "
                    >
                      Contact
                    </h3>

                  </div>


                  <div className="space-y-2.5">

                    {contacts.map((contact) => (

                      <a
                        key={contact.phone}
                        href={`tel:${contact.phone.replace(/\s/g, "")}`}
                        className="
                          group
                          flex
                          items-center
                          justify-between
                          gap-4

                          rounded-xl

                          border
                          border-[#c9a95d]/20

                          bg-black/15

                          p-3.5

                          transition-all
                          duration-200

                          hover:border-[#c9a95d]/60
                          hover:bg-[#c9a95d]/5

                          sm:p-4
                        "
                      >

                        <div className="min-w-0">

                          <p
                            className="
                              truncate
                              text-sm
                              font-medium
                              text-[#f1dfae]
                            "
                          >
                            {contact.name}
                          </p>

                          <p
                            className="
                              mt-1
                              text-xs
                              text-[#d8cba7]/70
                            "
                          >
                            {contact.phone}
                          </p>

                        </div>


                        <div
                          className="
                            flex
                            h-9
                            w-9
                            shrink-0
                            items-center
                            justify-center

                            rounded-full

                            border
                            border-[#c9a95d]/30

                            text-[#c9a95d]

                            transition-all

                            group-hover:border-[#c9a95d]
                            group-hover:bg-[#c9a95d]/10
                          "
                        >
                          <Phone
                            className="h-4 w-4"
                            strokeWidth={1.6}
                          />
                        </div>

                      </a>

                    ))}

                  </div>

                </div>


                {/* =================================================
                    VENUE SECTION
                ================================================= */}

                <div>

                  <div
                    className="
                      mb-3
                      flex
                      items-center
                      gap-2
                    "
                  >

                    <MapPin
                      className="
                        h-4
                        w-4
                        text-[#c9a95d]
                      "
                      strokeWidth={1.6}
                    />

                    <h3
                      className="
                        text-sm
                        font-semibold
                        uppercase
                        tracking-[0.14em]
                        text-[#e7c875]
                      "
                    >
                      Wedding Venue
                    </h3>

                  </div>


                  <div
                    className="
                      rounded-xl

                      border
                      border-[#c9a95d]/20

                      bg-black/15

                      p-4

                      sm:p-5
                    "
                  >

                    <div
                      className="
                        flex
                        items-start
                        gap-3
                      "
                    >

                      <div
                        className="
                          flex
                          h-9
                          w-9
                          shrink-0
                          items-center
                          justify-center

                          rounded-full

                          border
                          border-[#c9a95d]/30

                          text-[#c9a95d]
                        "
                      >
                        <MapPin
                          className="h-4 w-4"
                          strokeWidth={1.6}
                        />
                      </div>


                      <div className="min-w-0">

                        <p
                          className="
                            text-sm
                            font-medium
                            text-[#f1dfae]
                          "
                        >
                          {venue.name}
                        </p>

                        <p
                          className="
                            mt-1
                            text-xs
                            leading-relaxed
                            text-[#d8cba7]/70
                          "
                        >
                          {venue.address}
                        </p>

                      </div>

                    </div>


                    {/* MAP BUTTON */}

                    <a
                      href={venue.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="
                        mt-4
                        flex
                        w-full
                        items-center
                        justify-center
                        gap-2

                        rounded-lg

                        border
                        border-[#c9a95d]/60

                        bg-[#5b0711]

                        px-4
                        py-3

                        text-[11px]
                        font-semibold
                        uppercase
                        tracking-[0.14em]
                        text-[#e7c875]

                        transition-all
                        duration-200

                        hover:bg-[#700b17]
                        hover:border-[#c9a95d]

                        active:scale-[0.98]
                      "
                    >

                      <Navigation
                        className="h-4 w-4"
                        strokeWidth={1.6}
                      />

                      <span>
                        Get Directions
                      </span>

                      <ChevronRight
                        className="
                          h-4
                          w-4
                          opacity-60
                        "
                        strokeWidth={1.5}
                      />

                    </a>

                  </div>

                </div>

              </div>

            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}