import { Router } from 'express';
import { TechnicianController } from '../controllers/TechnicianController';

const router = Router();
const technicianController = new TechnicianController();

// GET /api/technicians - Get all technicians
router.get('/', [technicianController.getAllTechnicians.bind(technicianController)]);

// GET /api/technicians/:id - Get technician by ID with appointments
router.get('/:id', [technicianController.getTechnicianById.bind(technicianController)]);


export default router;
