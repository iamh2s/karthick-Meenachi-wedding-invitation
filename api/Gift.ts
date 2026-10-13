
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const allowedOrigins = new Set([
  "https://karthickmeenachiweddinginvitatio.vercel.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.setHeader("Cache-Control", "no-store");

  const origin = req.headers.origin;

  if (origin && !allowedOrigins.has(origin)) {
    return res.status(403).json({ error: "Origin not allowed." });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecret = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseSecret) {
    console.error("Missing Supabase server environment variables.");
    return res.status(500).json({
      error: "Gift service is not configured.",
    });
  }

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return res.status(400).json({ error: "Invalid request body." });
    }

    const guestName =
      typeof body.guestName === "string" ? body.guestName.trim() : "";

    const message =
      typeof body.message === "string" ? body.message.trim() : "";

    const transactionId =
      typeof body.transactionId === "string"
        ? body.transactionId.trim()
        : "";

    const amount = body.amount;

    if (guestName.length < 2 || guestName.length > 80) {
      return res.status(400).json({
        error: "Name must contain 2–80 characters.",
      });
    }

    if (
      typeof amount !== "number" ||
      !Number.isSafeInteger(amount) ||
      amount < 1 ||
      amount > 500000
    ) {
      return res.status(400).json({
        error: "Amount must be between ₹1 and ₹5,00,000.",
      });
    }

    if (message.length > 500) {
      return res.status(400).json({
        error: "Message must be 500 characters or fewer.",
      });
    }

    if (
      transactionId.length > 100 ||
      (transactionId.length > 0 &&
        !/^[a-zA-Z0-9._/-]{6,100}$/.test(transactionId))
    ) {
      return res.status(400).json({
        error: "Invalid UPI transaction reference.",
      });
    }

    const supabase = createClient(supabaseUrl, supabaseSecret, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data, error } = await supabase
      .from("wedding_gifts")
      .insert({
        guest_name: guestName,
        amount_paise: amount * 100,
        message: message || null,
        upi_transaction_id: transactionId || null,
        status: "pending",
      })
      .select("id")
      .single();

    if (error) {
      console.error("Supabase insert failed:", error.message);
      return res.status(500).json({
        error: "Could not save gift details.",
      });
    }

    return res.status(201).json({
      success: true,
      giftId: data.id,
      status: "pending",
      message:
        "Gift details saved. Payment verification is still required.",
    });
  } catch {
    return res.status(400).json({
      error: "Invalid request.",
    });
  }
}
