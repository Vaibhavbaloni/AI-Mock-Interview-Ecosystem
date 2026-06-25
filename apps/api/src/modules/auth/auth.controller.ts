// apps/api/src/modules/auth/auth.controller.ts
import { Request, Response } from 'express';
import { authService } from './auth.service';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from './auth.schema';
import { successResponse } from '../../utils/response';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export class AuthController {
  async register(req: Request, res: Response) {
    const validatedInput = registerSchema.parse(req.body);
    const { user, accessToken, refreshToken } = await authService.register(validatedInput);

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
    return successResponse(res, { user, accessToken }, 'User registered successfully', 201);
  }

  async login(req: Request, res: Response) {
    const validatedInput = loginSchema.parse(req.body);
    const { user, accessToken, refreshToken } = await authService.login(validatedInput);

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
    return successResponse(res, { user, accessToken }, 'User logged in successfully');
  }

  async refresh(req: Request, res: Response) {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    const { accessToken } = await authService.refresh(refreshToken);

    return successResponse(res, { accessToken }, 'Access token refreshed');
  }

  async logout(req: Request, res: Response) {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (refreshToken) {
      await authService.logout(refreshToken);
    }
    res.clearCookie('refreshToken');
    return successResponse(res, null, 'Logged out successfully');
  }

  async forgotPassword(req: Request, res: Response) {
    const { email } = forgotPasswordSchema.parse(req.body);
    const resetToken = await authService.forgotPassword(email);

    // In a real app we'd email this. Here we return it for testing.
    return successResponse(
      res,
      { resetToken },
      'Reset token generated successfully. In production, this would be sent to your email.'
    );
  }

  async resetPassword(req: Request, res: Response) {
    const { token, newPassword } = resetPasswordSchema.parse(req.body);
    await authService.resetPassword(token, newPassword);

    return successResponse(res, null, 'Password reset successfully');
  }
}

export const authController = new AuthController();
