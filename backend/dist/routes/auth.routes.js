"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// POST /api/auth/login
router.post('/login', (req, res, next) => {
    (0, auth_controller_1.loginUser)(req, res).catch(next);
});
// GET /api/auth/me (Token gerektirir)
router.get('/me', (req, res, next) => {
    (0, auth_middleware_1.protect)(req, res, next).catch(next);
}, (req, res, next) => {
    (0, auth_controller_1.getMe)(req, res).catch(next);
});
// Gerekirse buraya register, refresh token vb. rotalar eklenebilir
exports.default = router;
