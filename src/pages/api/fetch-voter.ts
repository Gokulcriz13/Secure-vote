import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/mysql"; // Make sure mysql.ts exports db = createPool(...)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const { aadhaar, voterId } = req.body;

  if (!aadhaar || !voterId) {
    return res.status(400).json({ success: false, error: "Missing Aadhaar or Voter ID" });
  }

  try {
    const [rows]: any = await db.query(
      "SELECT name, aadhaar, voter_id, phone, address, gender, dob, photo, otu FROM voters WHERE aadhaar = ? AND voter_id = ?",
      [aadhaar, voterId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: "Voter not found" });
    }

    const voter = rows[0];

    // Convert image blob to base64 string for rendering
    const base64Photo = voter.photo
      ? Buffer.from(voter.photo).toString("base64")
      : null;

    return res.status(200).json({
      success: true,
      voter: {
        ...voter,
        photo: base64Photo,
      },
    });
  } catch (error: any) {
    console.error("Database error:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
}
