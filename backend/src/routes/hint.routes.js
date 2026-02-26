import express from 'express';
import { generateHint, getAvailableProviders } from '../controllers/hint.controller.js';

const router = express.Router();

router.post('/generate', generateHint);
router.get('/providers', getAvailableProviders);

export default router;