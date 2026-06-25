// apps/api/src/modules/users/users.controller.ts
import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { successResponse } from '../../utils/response';
import { NotFoundError } from '../../utils/errors';
import { SkillLevel } from '@prisma/client';

export class UsersController {
  async getMe(req: Request, res: Response) {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        profile: true,
        skills: true,
        educations: true,
        gamification: true,
        dnaProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return successResponse(res, user, 'User profile retrieved successfully');
  }

  async updateProfile(req: Request, res: Response) {
    const userId = req.user.id;
    const { fullName, headline, bio, location, targetRoles, dreamCompanies, yearsExp } = req.body;

    const updatedProfile = await prisma.profile.update({
      where: { userId },
      data: {
        fullName,
        headline,
        bio,
        location,
        targetRoles: targetRoles ? (Array.isArray(targetRoles) ? targetRoles : [targetRoles]) : undefined,
        dreamCompanies: dreamCompanies ? (Array.isArray(dreamCompanies) ? dreamCompanies : [dreamCompanies]) : undefined,
        yearsExp: yearsExp !== undefined ? parseFloat(yearsExp) : undefined,
      },
    });

    return successResponse(res, updatedProfile, 'Profile updated successfully');
  }

  async addSkill(req: Request, res: Response) {
    const userId = req.user.id;
    const { name, category, level } = req.body;

    const skill = await prisma.skill.create({
      data: {
        userId,
        name,
        category,
        level: level || SkillLevel.INTERMEDIATE,
        source: 'manual',
      },
    });

    return successResponse(res, skill, 'Skill added successfully', 201);
  }

  async deleteSkill(req: Request, res: Response) {
    const userId = req.user.id;
    const { id } = req.params;

    const skill = await prisma.skill.findFirst({
      where: { id, userId },
    });

    if (!skill) {
      throw new NotFoundError('Skill not found or access denied');
    }

    await prisma.skill.delete({
      where: { id },
    });

    return successResponse(res, null, 'Skill removed successfully');
  }

  async addEducation(req: Request, res: Response) {
    const userId = req.user.id;
    const { institution, degree, field, cgpa, startYear, endYear, isCurrent } = req.body;

    const education = await prisma.education.create({
      data: {
        userId,
        institution,
        degree,
        field,
        cgpa: cgpa ? parseFloat(cgpa) : undefined,
        startYear: parseInt(startYear),
        endYear: endYear ? parseInt(endYear) : undefined,
        isCurrent: !!isCurrent,
      },
    });

    return successResponse(res, education, 'Education record added successfully', 201);
  }

  async deleteEducation(req: Request, res: Response) {
    const userId = req.user.id;
    const { id } = req.params;

    const education = await prisma.education.findFirst({
      where: { id, userId },
    });

    if (!education) {
      throw new NotFoundError('Education record not found or access denied');
    }

    await prisma.education.delete({
      where: { id },
    });

    return successResponse(res, null, 'Education record removed successfully');
  }
}

export const usersController = new UsersController();
