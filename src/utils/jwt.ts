import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'whirldispatch_default_secret_key_change_in_prod';
const DEFAULT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JwtUserPayload {
  userId: string;
  email: string;
  fullName: string;
  role: 'TECHNICIAN' | 'LEAD_TECHNICIAN' | 'SUPERVISOR' | 'PAYMENT_CLERK';
}

export function generateToken(payload: JwtUserPayload, expiresIn: string = DEFAULT_EXPIRES_IN): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtUserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtUserPayload;
  } catch (error) {
    return null;
  }
}
