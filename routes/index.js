import express from 'express';
import AppController from '../controllers/AppController';

const router = express.Router();

router.use(express.json());

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);

export default router;
