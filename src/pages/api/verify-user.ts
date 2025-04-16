import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/mysql'; // your MySQL connection
import { generateOtp } from '@/lib/utils/generateOTP';
import { addMinutes } from "date-fns";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const { aadhaar, voterId } = req.body;

  try {
    const [rows]: any = await db.query(
      'SELECT phone FROM voters WHERE aadhaar = ? AND voter_id = ?',
      [aadhaar, voterId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const phone = rows[0].phone;
    const otp = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 1 * 60 * 1000);

    // Store OTP temporarily for verification (optional)
    await db.query(
      'UPDATE voters SET otp = ? WHERE aadhaar = ? AND voter_id = ?',
      [otp, aadhaar, voterId]
    );

    return res.status(200).json({ success: true, phone, otp }); // Frontend uses this to send OTP via Firebase
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
}
