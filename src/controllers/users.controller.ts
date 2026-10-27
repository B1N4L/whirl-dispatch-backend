import { Request, Response } from 'express';
import { db } from '../config/db';
import { users, workOrders } from '../db/schema/index';
import { eq, inArray, and } from 'drizzle-orm';

export async function getTechnicians(_req: Request, res: Response): Promise<void> {
  try {
    const techUsers = await db.query.users.findMany({
      where: and(
        inArray(users.role, ['LEAD_TECHNICIAN', 'TECHNICIAN']),
        eq(users.isActive, true)
      ),
      orderBy: (u, { asc }) => [asc(u.fullName)],
      columns: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        hourlyLaborRate: true,
        biometricEnrolled: true,
      },
    });

    // Query active work orders to determine real-time availability
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
        assignments: true,
      },
    });

    const result = techUsers.map((tech) => {
      const activeJob = activeOrders.find(
        (wo) =>
          wo.leadTechnicianId === tech.id ||
          wo.assignments.some((a) => a.technicianId === tech.id)
      );

      return {
        id: tech.id,
        fullName: tech.fullName,
        email: tech.email,
        phone: tech.phone,
        role: tech.role,
        hourlyLaborRate: tech.hourlyLaborRate,
        isAvailable: !activeJob,
        status: activeJob ? (activeJob.status === 'EN_ROUTE' ? 'En Route' : 'Active On-Site') : 'Available',
        activeWorkOrderId: activeJob?.id || null,
        activeWorkOrderNumber: activeJob?.workOrderNumber || null,
        activeWorkOrderTitle: activeJob?.title || null,
        facilityName: activeJob?.facility?.facilityName || null,
      };
    });

    res.status(200).json({
      count: result.length,
      technicians: result,
    });
  } catch (error) {
    console.error('[USERS ERROR] Failed to fetch technicians:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to retrieve technicians.',
    });
  }
}
