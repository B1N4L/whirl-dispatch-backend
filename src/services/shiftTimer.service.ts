export interface ShiftDurationCalculation {
  totalElapsedSeconds: number;
  totalBreakSeconds: number;
  totalBillableSeconds: number;
  billableHours: number;
}

export function calculateShiftDurations(
  clockInTime: Date,
  clockOutTime: Date | null,
  accumulatedBreakSeconds: number = 0,
  currentBreakStartTime: Date | null = null
): ShiftDurationCalculation {
  const endTime = clockOutTime || new Date();
  const totalElapsedSeconds = Math.max(0, Math.floor((endTime.getTime() - clockInTime.getTime()) / 1000));

  let totalBreakSeconds = accumulatedBreakSeconds;
  if (currentBreakStartTime) {
    const ongoingBreak = Math.max(0, Math.floor((endTime.getTime() - currentBreakStartTime.getTime()) / 1000));
    totalBreakSeconds += ongoingBreak;
  }

  const totalBillableSeconds = Math.max(0, totalElapsedSeconds - totalBreakSeconds);
  const billableHours = Math.round((totalBillableSeconds / 3600) * 100) / 100;

  return {
    totalElapsedSeconds,
    totalBreakSeconds,
    totalBillableSeconds,
    billableHours,
  };
}
