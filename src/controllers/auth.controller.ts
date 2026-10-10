import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { db } from '../config/db';
import { users } from '../db/schema/index';
import { loginSchema, registerSchema } from '../schemas/auth.schema';
import { generateToken } from '../utils/jwt';
import { eq } from 'drizzle-orm';

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
