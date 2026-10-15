export interface EventKitPayload {
  calendarIdentifier: string;
  eventTitle: string;
  notes: string;
  startDate: string;
  endDate: string;
  structuredLocation: {
    title: string;
    address: string;
    latitude: number;
    longitude: number;
    radiusMeters: number;
  };
  alarms: Array<{
    relativeOffsetSeconds: number; // e.g. -3600 for 1 hour prior
    type: 'TRANSIT_WARNING' | 'ARRIVAL_ALERT';
  }>;
  assignedFleetAsset: string | null;
  workOrderNumber: string;
}

export function buildEventKitCalendarPayload(workOrder: {
  workOrderNumber: string;
  title: string;
  description: string;
  scheduledStartTime: Date;
  scheduledEndTime: Date;
  facility: {
    facilityName: string;
    address: string;
    latitude: number;
    longitude: number;
    geofenceRadius: number;
  };
  fleetAsset?: {
    assetCode: string;
    name: string;
    licensePlate: string;
  } | null;
}): EventKitPayload {
  return {
    calendarIdentifier: `WHIRL-DISPATCH-${workOrder.workOrderNumber}`,
    eventTitle: `[WhirlDispatch] ${workOrder.title}`,
    notes: `${workOrder.description}\n\nClient Facility: ${workOrder.facility.facilityName}\nAssigned Fleet: ${
      workOrder.fleetAsset ? `${workOrder.fleetAsset.assetCode} - ${workOrder.fleetAsset.name}` : 'None Allocated'
    }`,
    startDate: workOrder.scheduledStartTime.toISOString(),
    endDate: workOrder.scheduledEndTime.toISOString(),
    structuredLocation: {
      title: workOrder.facility.facilityName,
      address: workOrder.facility.address,
      latitude: workOrder.facility.latitude,
      longitude: workOrder.facility.longitude,
      radiusMeters: workOrder.facility.geofenceRadius,
    },
    alarms: [
      {
        relativeOffsetSeconds: -3600, // 60 minutes prior for fleet transit & tool loading
        type: 'TRANSIT_WARNING',
      },
      {
        relativeOffsetSeconds: -900, // 15 minutes prior for site geofence entry preparation
        type: 'ARRIVAL_ALERT',
      },
    ],
    assignedFleetAsset: workOrder.fleetAsset
      ? `${workOrder.fleetAsset.assetCode} (${workOrder.fleetAsset.licensePlate})`
      : null,
    workOrderNumber: workOrder.workOrderNumber,
  };
}
