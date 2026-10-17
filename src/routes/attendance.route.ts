import { Router } from 'express';
import {
  clockIn,
  clockOut,
  getAttendanceTimeline,
} from '../controllers/attendance.controller';
import {
  handleBoundaryEvent,
  resumeShift,
} from '../controllers/geofenceBreach.controller';
import { authenticateToken } from '../middleware/auth.middleware';

export const attendanceRouter = Router();

attendanceRouter.use(authenticateToken);

attendanceRouter.post('/clock-in', clockIn);
attendanceRouter.post('/clock-out', clockOut);
attendanceRouter.post('/boundary-event', handleBoundaryEvent);
attendanceRouter.post('/resume-shift', resumeShift);
attendanceRouter.get('/work-order/:id', getAttendanceTimeline);
