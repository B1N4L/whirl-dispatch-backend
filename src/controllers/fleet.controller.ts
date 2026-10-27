import { Request, Response } from 'express';
import { db } from '../config/db';
import { fleetAssets, workOrders, siteAttendance } from '../db/schema/index';
import { createFleetAssetSchema, updateFleetStatusSchema } from '../schemas/fleet.schema';
import { eq, inArray, and, isNull } from 'drizzle-orm';

function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export async function getLiveFleetTracking(_req: Request, res: Response): Promise<void> {
  try {
    const activeOrders = await db.query.workOrders.findMany({
      where: inArray(workOrders.status, [
        'DISPATCHED',
        'EN_ROUTE',
        'ON_SITE_ACTIVE',
        'UNACKNOWLEDGED_BREAK',
        'AWAITING_PARTS_APPROVAL',
      ]),
      with: {
        facility: true,
        fleetAsset: true,
        leadTechnician: {
          columns: { id: true, fullName: true, email: true, phone: true, role: true },
        },
        assignments: {
          with: {
            technician: {
              columns: { id: true, fullName: true, email: true, phone: true, role: true },
            },
          },
        },
      },
      orderBy: (wo, { desc }) => [desc(wo.createdAt)],
    });

    const activeOrderIds = activeOrders.map((wo) => wo.id);

    let activeAttendances: any[] = [];
    if (activeOrderIds.length > 0) {
      activeAttendances = await db.query.siteAttendance.findMany({
        where: and(
          inArray(siteAttendance.workOrderId, activeOrderIds),
          isNull(siteAttendance.clockOutTimestamp)
        ),
      });
    }

    const DEPOT_LAT = 6.9271;
    const DEPOT_LON = 79.8612;

    const trackedSites = activeOrders.map((wo, index) => {
      const facility = wo.facility;
      const attendance = activeAttendances.find((a) => a.workOrderId === wo.id);

      let currentLat = facility.latitude;
      let currentLon = facility.longitude;
      let isInside = false;

      if (
        wo.status === 'ON_SITE_ACTIVE' ||
        wo.status === 'UNACKNOWLEDGED_BREAK' ||
        wo.status === 'AWAITING_PARTS_APPROVAL'
      ) {
        // Slight spread within the facility geofence (~10m to 20m)
        const offset = ((index % 5) - 2) * 0.0001;
        currentLat = facility.latitude + offset;
        currentLon = facility.longitude + offset;
        isInside = true;
      } else if (wo.status === 'EN_ROUTE') {
        const transitRatio = 0.65;
        currentLat = DEPOT_LAT + (facility.latitude - DEPOT_LAT) * transitRatio;
        currentLon = DEPOT_LON + (facility.longitude - DEPOT_LON) * transitRatio;
        isInside = false;
      } else {
        // DISPATCHED - Staged at or near depot
        const transitRatio = 0.15;
        currentLat = DEPOT_LAT + (facility.latitude - DEPOT_LAT) * transitRatio;
        currentLon = DEPOT_LON + (facility.longitude - DEPOT_LON) * transitRatio;
        isInside = false;
      }

      const distance = calculateDistanceMeters(currentLat, currentLon, facility.latitude, facility.longitude);
      const formattedDistance = distance < 1000 ? `${distance}m` : `${(distance / 1000).toFixed(1)}km`;

      const crew = wo.assignments
        .map((a) => a.technician)
        .filter((t): t is NonNullable<typeof t> => t !== null);

      return {
        workOrderId: wo.id,
        workOrderNumber: wo.workOrderNumber,
        title: wo.title,
        description: wo.description,
        status: wo.status,
        priority: wo.priority,
        scheduledStartTime: wo.scheduledStartTime ? new Date(wo.scheduledStartTime).toISOString() : null,
        scheduledEndTime: wo.scheduledEndTime ? new Date(wo.scheduledEndTime).toISOString() : null,
        facility: {
          id: facility.id,
          companyName: facility.companyName,
          facilityName: facility.facilityName,
          address: facility.address,
          latitude: facility.latitude,
          longitude: facility.longitude,
          geofenceRadius: facility.geofenceRadius,
          contactPersonName: facility.contactPersonName,
          contactPhone: facility.contactPhone,
          slaResponseHours: facility.slaResponseHours,
        },
        team: {
          leadTechnician: wo.leadTechnician
            ? {
                id: wo.leadTechnician.id,
                fullName: wo.leadTechnician.fullName,
                email: wo.leadTechnician.email,
                phone: wo.leadTechnician.phone,
                role: wo.leadTechnician.role,
              }
            : null,
          crew: crew.map((c) => ({
            id: c.id,
            fullName: c.fullName,
            email: c.email,
            phone: c.phone,
            role: c.role,
          })),
          totalHeadcount: (wo.leadTechnician ? 1 : 0) + crew.length,
        },
        vehicle: wo.fleetAsset
          ? {
              id: wo.fleetAsset.id,
              assetCode: wo.fleetAsset.assetCode,
              name: wo.fleetAsset.name,
              assetType: wo.fleetAsset.assetType,
              licensePlate: wo.fleetAsset.licensePlate,
              status: wo.fleetAsset.status,
            }
          : null,
        telemetry: {
          latitude: currentLat,
          longitude: currentLon,
          isInsideGeofence: isInside,
          distanceToFacilityMeters: distance,
          formattedDistance,
          lastPingTimestamp: attendance?.updatedAt
            ? new Date(attendance.updatedAt).toISOString()
            : new Date().toISOString(),
        },
      };
    });

    res.status(200).json({
      count: trackedSites.length,
      trackedSites,
    });
  } catch (error) {
    console.error('[FLEET ERROR] Failed to fetch live tracking:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to retrieve live fleet tracking telemetry.',
    });
  }
}

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
