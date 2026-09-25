import express, { Router } from 'express';
import { verifyGithubSignature } from '../middleware/verifyGithubSignature.js';
import { receiveGithubWebhook } from '../controllers/webhook.controller.js';

export const webhookRouter = Router();

// express.raw keeps the body as the exact bytes GitHub signed (type */* so the Content-Type header can't change that).
webhookRouter.post('/github', express.raw({ type: '*/*', limit: '5mb' }), verifyGithubSignature, receiveGithubWebhook);
