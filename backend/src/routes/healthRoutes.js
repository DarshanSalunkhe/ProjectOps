import express from 'express';
import { healthCheck, getApiInfo } from '../controllers/healthController.js';

const router = express.Router();

router.get('/health', healthCheck);
router.get('/', getApiInfo);

export default router;
