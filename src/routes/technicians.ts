import { Router } from 'express';
import { TechnicianController } from '../controllers/TechnicianController';

const router = Router();
const technicianController = new TechnicianController();

router.get('/', [technicianController.getTechnicians.bind(technicianController)]);

export default router;
