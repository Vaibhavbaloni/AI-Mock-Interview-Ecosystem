// apps/api/src/modules/auth/auth.service.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { ConflictError, AuthenticationError, NotFoundError } from '../../utils/errors';
import { RegisterInput, LoginInput } from './auth.schema';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  private generateAccessToken(userId: string, role: string): string {
    return jwt.sign(
      { sub: userId, role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );
  }

  private generateRefreshToken(userId: string, role: string): string {
    return jwt.sign(
      { sub: userId, role },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
    );
  }

  async register(input: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new ConflictError('Email already in use');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    // Create User, Profile, Gamification, and DNA profile in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: input.email,
          passwordHash,
          role: input.role,
          isVerified: true, // Auto-verified for simplicity in development
          profile: {
            create: {
              fullName: input.fullName,
            },
          },
          gamification: {
            create: {
              xpTotal: 0,
              level: 1,
              streakCurrent: 0,
              streakBest: 0,
            },
          },
          dnaProfile: {
            create: {
              communication: 50,
              leadership: 50,
              problemSolving: 50,
              technical: 50,
              adaptability: 50,
              confidence: 50,
            },
          },
        },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      return newUser;
    });

    const accessToken = this.generateAccessToken(user.id, user.role);
    const refreshToken = this.generateRefreshToken(user.id, user.role);

    // Save refresh token to DB
    const expiresAt = new Date();
    // Assuming 7d expiry based on default
    expiresAt.setDate(expiresAt.getDate() + 7);
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
      },
    });

    return { user, accessToken, refreshToken };
  }

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      include: { profile: true },
    });

    if (!user || !user.passwordHash || !user.isActive) {
      throw new AuthenticationError('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      throw new AuthenticationError('Invalid email or password');
    }

    const accessToken = this.generateAccessToken(user.id, user.role);
    const refreshToken = this.generateRefreshToken(user.id, user.role);

    // Save refresh token to DB
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
      },
    });

    const sanitizedUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      profile: user.profile,
    };

    return { user: sanitizedUser, accessToken, refreshToken };
  }

  async refresh(token: string): Promise<{ accessToken: string }> {
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date()) {
      throw new AuthenticationError('Invalid or expired refresh token');
    }

    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as { sub: string; role: string };
    const accessToken = this.generateAccessToken(decoded.sub, decoded.role);

    return { accessToken };
  }

  async logout(token: string) {
    try {
      await prisma.refreshToken.update({
        where: { token },
        data: { isRevoked: true },
      });
    } catch {
      // Fail silently for logout if token not found
    }
  }

  async forgotPassword(email: string): Promise<string> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundError('User with this email does not exist');
    }

    // Return a mock token for frontend to use in verification
    const resetToken = jwt.sign({ sub: user.id }, env.JWT_SECRET, { expiresIn: '1h' });
    return resetToken;
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as { sub: string };
      const passwordHash = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: decoded.sub },
        data: { passwordHash },
      });
    } catch {
      throw new AuthenticationError('Invalid or expired password reset token');
    }
  }
}

export const authService = new AuthService();
