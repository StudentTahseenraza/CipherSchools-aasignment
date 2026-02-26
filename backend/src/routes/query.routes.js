import express from 'express';
import { executeQuery } from '../controllers/query.controller.js';
import { validateQuery } from '../middleware/queryValidator.js';
import { authenticate } from '../middleware/auth.js'; // Optional

const router = express.Router();

router.get('/execute', validateQuery, executeQuery);
// Optional: With authentication
// router.get('/execute', authenticate, validateQuery, executeQuery);

export default router;