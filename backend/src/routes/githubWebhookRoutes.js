import express from 'express';
import { verifyGithubWebhook } from '../middleware/githubWebhookVerification.js';
import { webhook } from '../controllers/githubSyncController.js';
const router=express.Router();
router.post('/',express.raw({type:'application/json',limit:'4mb',inflate:false}),verifyGithubWebhook,webhook);
export default router;
