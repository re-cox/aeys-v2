"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const role_controller_1 = require("../controllers/role.controller");
// import { authenticateToken, authorizeRoles } from '../middleware/auth'; // Gerekirse yetkilendirme eklenebilir
const router = (0, express_1.Router)();
// Tüm rolleri listele
router.get('/', /* authenticateToken, authorizeRoles(['ADMIN']), */ role_controller_1.getRoles);
exports.default = router;
