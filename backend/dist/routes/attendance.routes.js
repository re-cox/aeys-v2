"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const attendance_controller_1 = require("../controllers/attendance.controller");
// import { protect, authorize } from '../middleware/auth.middleware'; // Yetkilendirme middleware'i eklenecek
console.log("--- attendance.routes.ts dosyası yüklendi ---"); // Test logu eklendi
const router = (0, express_1.Router)();
// Rotalar
router.route('/')
    .get(/* protect, authorize('admin', 'manager'), */ attendance_controller_1.getAttendances) // Yetkilendirme eklenecek
    .post(/* protect, */ attendance_controller_1.saveAttendance); // Yetkilendirme eklenecek
router.route('/:id')
    .get(/* protect, */ attendance_controller_1.getAttendanceById)
    .put(/* protect, */ attendance_controller_1.updateAttendance)
    .delete(/* protect, authorize('admin'), */ attendance_controller_1.deleteAttendance);
exports.default = router;
