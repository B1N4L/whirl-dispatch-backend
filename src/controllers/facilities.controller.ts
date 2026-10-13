import { Request, Response } from 'express';
import { db } from '../config/db';
import { clientFacilities } from '../db/schema/index';
import { createFacilitySchema } from '../schemas/facilities.schema';
import { eq } from 'drizzle-orm';

export async function getFacilities(_req: Request, res: Response): Promise<void> {
  try {
    const list = await db.query.clientFacilities.findMany({
      orderBy: (facilities, { desc }) => [desc(facilities.createdAt)],
    });

    res.status(200).json({
      count: list.length,
      facilities: list,
    });
  } catch (error) {
    console.error('[FACILITIES ERROR] Failed to fetch facilities:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to retrieve commercial facilities.',
    });
  }
}

export async function getFacilityById(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    const facility = await db.query.clientFacilities.findFirst({
      where: eq(clientFacilities.id, id),
    });

    if (!facility) {
      res.status(404).json({
        error: 'NotFound',
        message: 'Client facility not found.',
      });
      return;
    }

    res.status(200).json({ facility });
  } catch (error) {
    console.error('[FACILITIES ERROR] Failed to fetch facility by ID:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to retrieve facility details.',
    });
  }
}

export async function createFacility(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = createFacilitySchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const data = parseResult.data;

    const [newFacility] = await db
      .insert(clientFacilities)
      .values({
        companyName: data.companyName,
        facilityName: data.facilityName,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        geofenceRadius: data.geofenceRadius,
        contactPersonName: data.contactPersonName,
        contactPhone: data.contactPhone,
        contactEmail: data.contactEmail || null,
        contractStartDate: data.contractStartDate ? new Date(data.contractStartDate) : null,
        contractEndDate: data.contractEndDate ? new Date(data.contractEndDate) : null,
        slaResponseHours: data.slaResponseHours,
        contractHourlyRate: data.contractHourlyRate,
        partsMarkupPercent: data.partsMarkupPercent,
      })
      .returning();

    res.status(201).json({
      message: 'Commercial client facility registered successfully.',
      facility: newFacility,
    });
  } catch (error) {
    console.error('[FACILITIES ERROR] Failed to create facility:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to create client facility.',
    });
  }
}
