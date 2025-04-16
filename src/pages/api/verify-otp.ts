import type { NextApiRequest, NextApiResponse } from "next";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps, cert } from "firebase-admin/app";

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const db = getFirestore();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ success: false, message: "Method not allowed" });

  const { aadhaar, otp } = req.body;

  try {
    const doc = await db.collection("otp_verification").doc(aadhaar).get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: "OTP record not found" });
    }

    const { storedOtp, createdAt } = doc.data() as { storedOtp: string; createdAt: number };

    const now = Date.now();
    const isExpired = now - createdAt > 60000; // 60 seconds

    if (isExpired) {
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    if (otp !== storedOtp) {
      return res.status(401).json({ success: false, message: "Invalid OTP" });
    }

    return res.status(200).json({ success: true, message: "OTP verified successfully" });
  } catch (error) {
    console.error("OTP verification error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
