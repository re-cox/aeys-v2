"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
require('dotenv').config();
exports.env = {
    PORT: process.env.PORT || 5000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    JWT_SECRET: process.env.JWT_SECRET || 'default-jwt-secret-key-change-in-production',
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
};
