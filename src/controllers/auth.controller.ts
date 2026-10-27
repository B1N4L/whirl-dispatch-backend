import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { db } from '../config/db';
import { users } from '../db/schema/index';
import { loginSchema, registerSchema, updateProfileSchema, changePasswordSchema } from '../schemas/auth.schema';
import { generateToken } from '../utils/jwt';
import { eq, and, ne } from 'drizzle-orm';

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const { email, password } = parseResult.data;

    const user = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase().trim()),
    });

    if (!user || !user.isActive) {
      res.status(401).json({
        error: 'AuthenticationFailed',
        message: 'Invalid credentials or inactive account.',
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({
        error: 'AuthenticationFailed',
        message: 'Invalid credentials or inactive account.',
      });
      return;
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    });

    res.status(200).json({
      message: 'Authentication successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        hourlyLaborRate: user.hourlyLaborRate,
        biometricEnrolled: user.biometricEnrolled,
      },
    });
  } catch (error) {
    console.error('[AUTH ERROR] Login failed:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to process authentication request.',
    });
  }
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const { email, password, fullName, phone, role, hourlyLaborRate } = parseResult.data;

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase().trim()),
    });

    if (existingUser) {
      res.status(409).json({
        error: 'Conflict',
        message: 'A user with this email address already exists.',
      });
      return;
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const [newUser] = await db
      .insert(users)
      .values({
        email: email.toLowerCase().trim(),
        passwordHash,
        fullName,
        phone: phone || null,
        role,
        hourlyLaborRate: hourlyLaborRate || '50.00',
        biometricEnrolled: false,
        isActive: true,
      })
      .returning({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        phone: users.phone,
        role: users.role,
        hourlyLaborRate: users.hourlyLaborRate,
        biometricEnrolled: users.biometricEnrolled,
      });

    const token = generateToken({
      userId: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
      role: newUser.role,
    });

    res.status(201).json({
      message: 'User account registered successfully',
      token,
      user: newUser,
    });
  } catch (error) {
    console.error('[AUTH ERROR] Registration failed:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to register user account.',
    });
  }
}

export async function getProfile(req: Request, res: Response): Promise<void> {
  try {
    const authUser = (req as any).user;
    if (!authUser) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication token missing or invalid.',
      });
      return;
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, authUser.userId),
    });

    if (!user) {
      res.status(404).json({
        error: 'NotFound',
        message: 'User profile not found.',
      });
      return;
    }

    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        hourlyLaborRate: user.hourlyLaborRate,
        biometricEnrolled: user.biometricEnrolled,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('[AUTH ERROR] Get profile failed:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to retrieve profile.',
    });
  }
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  try {
    const authUser = (req as any).user;
    if (!authUser) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication token missing or invalid.',
      });
      return;
    }

    const parseResult = updateProfileSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const { fullName, email, phone } = parseResult.data;

    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, authUser.userId),
    });

    if (!currentUser) {
      res.status(404).json({
        error: 'NotFound',
        message: 'User profile not found.',
      });
      return;
    }

    if (email && email.toLowerCase().trim() !== currentUser.email.toLowerCase()) {
      const emailConflict = await db.query.users.findFirst({
        where: and(
          eq(users.email, email.toLowerCase().trim()),
          ne(users.id, authUser.userId)
        ),
      });

      if (emailConflict) {
        res.status(409).json({
          error: 'Conflict',
          message: 'This corporate email address is already in use by another account.',
        });
        return;
      }
    }

    const updateValues: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (fullName !== undefined) updateValues.fullName = fullName.trim();
    if (email !== undefined) updateValues.email = email.toLowerCase().trim();
    if (phone !== undefined) updateValues.phone = phone ? phone.trim() : null;

    const [updatedUser] = await db
      .update(users)
      .set(updateValues)
      .where(eq(users.id, authUser.userId))
      .returning({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        phone: users.phone,
        role: users.role,
        hourlyLaborRate: users.hourlyLaborRate,
        biometricEnrolled: users.biometricEnrolled,
        isActive: users.isActive,
        createdAt: users.createdAt,
      });

    const token = generateToken({
      userId: updatedUser.id,
      email: updatedUser.email,
      fullName: updatedUser.fullName,
      role: updatedUser.role,
    });

    res.status(200).json({
      message: 'Profile updated successfully',
      token,
      user: updatedUser,
    });
  } catch (error) {
    console.error('[AUTH ERROR] Update profile failed:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to update profile.',
    });
  }
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  try {
    const authUser = (req as any).user;
    if (!authUser) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication token missing or invalid.',
      });
      return;
    }

    const parseResult = changePasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const { currentPassword, newPassword } = parseResult.data;

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

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({
        error: 'InvalidCredentials',
        message: 'Current password does not match.',
      });
      return;
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    await db
      .update(users)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, authUser.userId));

    res.status(200).json({
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('[AUTH ERROR] Change password failed:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to change password.',
    });
  }
}
