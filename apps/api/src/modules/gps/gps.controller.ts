// apps/api/src/modules/gps/gps.controller.ts
import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { successResponse } from '../../utils/response';
import { NotFoundError, ValidationError } from '../../utils/errors';
import { NodeType, NodeStatus } from '@prisma/client';

export class GpsController {
  async getActiveRoute(req: Request, res: Response) {
    const userId = req.user.id;

    let path = await prisma.careerPath.findFirst({
      where: { userId, isActive: true },
      include: { nodes: { orderBy: { sequenceOrder: 'asc' } } },
    });

    // Seed a baseline path if empty
    if (!path) {
      path = await prisma.careerPath.create({
        data: {
          userId,
          targetRole: 'Software Developer',
          targetCompany: 'Google',
          estimatedDurationDays: 30,
          currentProgressPercent: 0,
          isActive: true,
        },
        include: { nodes: true },
      });

      // Create sequence nodes
      const baselineNodes = [
        {
          title: 'Review System Design Fundamentals',
          description: 'Study caching, scalability, and load balancers.',
          type: NodeType.READ,
          sequenceOrder: 1,
          status: NodeStatus.ACTIVE,
          timeEstimateMinutes: 30,
        },
        {
          title: 'Solve 2 Graph Challenges',
          description: 'Complete BFS and DFS problems in the Coding Arena.',
          type: NodeType.CODING,
          sequenceOrder: 2,
          status: NodeStatus.PENDING,
          timeEstimateMinutes: 45,
        },
        {
          title: 'Simulate Mock behavioral interview',
          description: 'Conduct a STAR format rehearsal with Sarah Kim.',
          type: NodeType.INTERVIEW,
          sequenceOrder: 3,
          status: NodeStatus.PENDING,
          timeEstimateMinutes: 30,
        },
        {
          title: 'ATS Resume Keyword Injection',
          description: 'Add critical distributed systems skills to resume.',
          type: NodeType.RESUME,
          sequenceOrder: 4,
          status: NodeStatus.PENDING,
          timeEstimateMinutes: 20,
        },
      ];

      for (const node of baselineNodes) {
        await prisma.pathNode.create({
          data: {
            pathId: path.id,
            ...node,
          },
        });
      }

      // Re-query with nodes
      path = await prisma.careerPath.findFirst({
        where: { id: path.id },
        include: { nodes: { orderBy: { sequenceOrder: 'asc' } } },
      }) as any;
    }

    return successResponse(res, path, 'Career GPS path retrieved successfully');
  }

  async completeNode(req: Request, res: Response) {
    const userId = req.user.id;
    const { nodeId } = req.body;

    if (!nodeId) {
      throw new ValidationError('Node ID is required');
    }

    const node = await prisma.pathNode.findUnique({
      where: { id: nodeId },
      include: { path: true },
    });

    if (!node || node.path.userId !== userId) {
      throw new NotFoundError('Path node not found or access denied');
    }

    // Update node status
    await prisma.pathNode.update({
      where: { id: nodeId },
      data: { status: NodeStatus.COMPLETED },
    });

    // Unlock next node in sequence
    const nextNode = await prisma.pathNode.findFirst({
      where: {
        pathId: node.pathId,
        sequenceOrder: node.sequenceOrder + 1,
      },
    });

    if (nextNode) {
      await prisma.pathNode.update({
        where: { id: nextNode.id },
        data: { status: NodeStatus.ACTIVE },
      });
    }

    // Recalculate overall path progress
    const allNodes = await prisma.pathNode.findMany({
      where: { pathId: node.pathId },
    });
    const completedCount = allNodes.filter((n) => n.status === NodeStatus.COMPLETED).length;
    const progress = Math.round((completedCount / allNodes.length) * 100);

    const updatedPath = await prisma.careerPath.update({
      where: { id: node.pathId },
      data: { currentProgressPercent: progress },
      include: { nodes: { orderBy: { sequenceOrder: 'asc' } } },
    });

    return successResponse(res, updatedPath, 'Path node completed and next stop unlocked');
  }
}

export const gpsController = new GpsController();
