import { Request, Response } from 'express';
import { db } from '../config/db';
import { fleetAssets } from '../db/schema/index';
import { createFleetAssetSchema, updateFleetStatusSchema } from '../schemas/fleet.schema';
import { eq } from 'drizzle-orm';

export async function getFleetAssets(_req: Request, res: Response): Promise<void> {
  try {
    const list = await db.query.fleetAssets.findMany({
      orderBy: (assets, { asc }) => [asc(assets.assetCode)],
    });

    res.status(200).json({
      count: list.length,
      fleet: list,
    });
  } catch (error) {
    console.error('[FLEET ERROR] Failed to fetch fleet assets:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to retrieve fleet assets.',
    });
  }
}

export async function getFleetAssetById(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    const asset = await db.query.fleetAssets.findFirst({
      where: eq(fleetAssets.id, id),
    });

    if (!asset) {
      res.status(404).json({
        error: 'NotFound',
        message: 'Fleet asset not found.',
      });
      return;
    }

    res.status(200).json({ asset });
  } catch (error) {
    console.error('[FLEET ERROR] Failed to fetch fleet asset by ID:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to retrieve fleet asset details.',
    });
  }
}

export async function createFleetAsset(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = createFleetAssetSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const data = parseResult.data;

    const existing = await db.query.fleetAssets.findFirst({
      where: eq(fleetAssets.assetCode, data.assetCode.toUpperCase().trim()),
    });

    if (existing) {
      res.status(409).json({
        error: 'Conflict',
        message: 'Fleet asset with this code already exists.',
      });
      return;
    }

    const [newAsset] = await db
      .insert(fleetAssets)
      .values({
        assetCode: data.assetCode.toUpperCase().trim(),
        name: data.name,
        assetType: data.assetType,
        licensePlate: data.licensePlate.toUpperCase().trim(),
        status: data.status,
      })
      .returning();

    res.status(201).json({
      message: 'Fleet asset registered successfully.',
      asset: newAsset,
    });
  } catch (error) {
    console.error('[FLEET ERROR] Failed to register fleet asset:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to register fleet asset.',
    });
  }
}

export async function updateFleetAssetStatus(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const parseResult = updateFleetStatusSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const { status } = parseResult.data;

    const existing = await db.query.fleetAssets.findFirst({
      where: eq(fleetAssets.id, id),
    });

    if (!existing) {
      res.status(404).json({
        error: 'NotFound',
        message: 'Fleet asset not found.',
      });
      return;
    }

    const [updated] = await db
      .update(fleetAssets)
      .set({ status, updatedAt: new Date() })
      .where(eq(fleetAssets.id, id))
      .returning();

    res.status(200).json({
      message: 'Fleet asset status updated successfully.',
      asset: updated,
    });
  } catch (error) {
    console.error('[FLEET ERROR] Failed to update fleet asset status:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to update fleet asset status.',
    });
  }
}
