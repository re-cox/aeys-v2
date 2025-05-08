import express from 'express';
import {
  getAllCustomersHandler,
  getCustomerByIdHandler,
  // createCustomerHandler,
  // updateCustomerHandler,
  // deleteCustomerHandler
} from '../controllers/customer.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

// API Endpoints
router.get('/', protect, getAllCustomersHandler);
router.get('/:id', protect, getCustomerByIdHandler);
// router.post('/', protect, createCustomerHandler);
// router.put('/:id', protect, updateCustomerHandler);
// router.delete('/:id', protect, deleteCustomerHandler);

// Eğer EJS veya başka sayfa render route'larınız varsa, onları da buraya ekleyebilirsiniz
// VEYA ayrı bir dosyada yönetebilirsiniz.

export default router;