import { Router } from 'express';
import { getAttendances, saveAttendance, updateAttendance, deleteAttendance, getAttendanceById } from '../controllers/attendance.controller';
// import { protect, authorize } from '../middleware/auth.middleware'; // Yetkilendirme middleware'i eklenecek

console.log("--- attendance.routes.ts dosyası yüklendi ---"); // Test logu eklendi

const router = Router();

// Rotalar
router.route('/')
    .get(/* protect, authorize('admin', 'manager'), */ getAttendances) // Yetkilendirme eklenecek
    .post(/* protect, */ saveAttendance); // Yetkilendirme eklenecek

router.route('/:id')
    .get(/* protect, */ getAttendanceById)
    .put(/* protect, */ updateAttendance)
    .delete(/* protect, authorize('admin'), */ deleteAttendance);

export default router; 