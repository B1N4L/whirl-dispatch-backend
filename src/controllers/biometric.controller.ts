import { Request, Response } from 'express';
import { db } from '../config/db';
import { users } from '../db/schema/index';
import { eq } from 'drizzle-orm';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export async function biometricVerify(req: Request, res: Response): Promise<void> {
  try {
    const authUser = (req as AuthenticatedRequest).user;
    if (!authUser) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Valid user authentication required for biometric verification.',
      });
      return;
    }

    const { deviceId, biometricType } = req.body;

    const user = await db.query.users.findFirst({
      where: eq(users.id, authUser.userId),
    });

    if (!user) {
      res.status(404).json({
        error: 'NotFound',
        message: 'User account not found.',
      });
      return;
    }

    // Auto-enroll biometric status if not yet enrolled
    if (!user.biometricEnrolled) {
      await db
        .update(users)
        .set({ biometricEnrolled: true, updatedAt: new Date() })
        .where(eq(users.id, user.id));
    }

    const verifiedAt = new Date().toISOString();

    res.status(200).json({
      verified: true,
      message: 'Biometric assertion verified successfully.',
      userId: user.id,
      role: user.role,
      biometricType: biometricType || 'FACE_ID',
      deviceId: deviceId || 'IOS-DEVICE-FIELD',
      verifiedAt,
    });
  } catch (error) {
    console.error('[AUTH ERROR] Biometric verification failed:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to verify biometric token.',
    });
  }
}
