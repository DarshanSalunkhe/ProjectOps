import crypto from 'node:crypto';
import { AppError } from './errorHandler.js';

export function validGithubSignature(body, signature, secret) {
 if (!secret || !Buffer.isBuffer(body) || !/^sha256=[a-f0-9]{64}$/.test(signature || '')) return false;
 const expected=crypto.createHmac('sha256',secret).update(body).digest();
 return crypto.timingSafeEqual(expected,Buffer.from(signature.slice(7),'hex'));
}
export function verifyGithubWebhook(req,res,next) {
 if (!process.env.GITHUB_WEBHOOK_SECRET) return next(new AppError('GitHub webhook is not configured',503));
 if (!validGithubSignature(req.body,req.get('x-hub-signature-256'),process.env.GITHUB_WEBHOOK_SECRET)) return next(new AppError('Invalid webhook signature',401));
 try { req.githubPayload=JSON.parse(req.body.toString('utf8')); next(); }
 catch { next(new AppError('Invalid webhook JSON',400)); }
}
