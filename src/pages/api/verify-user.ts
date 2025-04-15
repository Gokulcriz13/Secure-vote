
import { db } from "@/lib/mysql";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { aadhaar, voterId } = req.body;

  try {
    const [rows] = await db.query(
      "SELECT phone FROM voters WHERE aadhaar = ? AND voter_id = ?",
      [aadhaar, voterId]
    );

    if ((rows as any[]).length > 0) {
      const phone = (rows as any[])[0].phone;
      return res.status(200).json({ phone });
    } else {
      return res.status(404).json({ error: "User not found" });
    }
  } catch (err) {
    return res.status(500).json({ error: "DB error", details: err });
  }
}
