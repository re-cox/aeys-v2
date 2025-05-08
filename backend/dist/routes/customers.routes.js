"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const customer_controller_1 = require("../controllers/customer.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
// API Endpoints
router.get('/', auth_middleware_1.protect, customer_controller_1.getAllCustomersHandler);
router.get('/:id', auth_middleware_1.protect, customer_controller_1.getCustomerByIdHandler);
// router.post('/', protect, createCustomerHandler);
// router.put('/:id', protect, updateCustomerHandler);
// router.delete('/:id', protect, deleteCustomerHandler);
// Eğer EJS veya başka sayfa render route'larınız varsa, onları da buraya ekleyebilirsiniz
// VEYA ayrı bir dosyada yönetebilirsiniz.
exports.default = router;
