// src/pages/api/generate-otp.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/mysql"; // MySQL pool connection
import { generateOtp } from "@/lib/utils/generateOTP"; // optional utility

console.log("Generated OTP:", generateOtp);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  const { aadhaar, voterId } = req.body;

  if (!aadhaar || !voterId) {
    return res.status(400).json({ success: false, message: "Aadhaar and Voter ID are required." });
  }

  try {
    const otp = generateOtp(); // or generate directly here
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // expires in 1 min

    // Store OTP and expiry in DB
    await db.query(
      "UPDATE voters SET otp = ?, created_at = ? WHERE aadhaar = ? AND voter_id = ?",
      [otp, expiresAt, aadhaar, voterId]
    );

    // Return to client to use with Firebase or SMS
    return res.status(200).json({ success: true, otp });
  } catch (error) {
    console.error("OTP Generation Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}