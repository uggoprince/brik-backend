import { Router } from 'express';
import { JobController } from '../controllers/JobsController';
import { createAppointmentSchema, createJobSchema } from '../validators/jobValidator';
import { validate } from '../middleware/validate';

const router = Router();
const jobController = new JobController();

// POST /api/jobs - Create a new job
router.post('/', validate(createJobSchema), [jobController.createJob.bind(jobController)]);

// GET /api/jobs - Get all jobs (with optional status filter)
router.get('/', [jobController.getAllJobs.bind(jobController)]);

// GET /api/jobs/:id - Get job by ID with full details
router.get('/:id', [jobController.getJobById.bind(jobController)]);

// PATCH /api/jobs/:id/status - Update job status
router.patch('/:id/status', [jobController.updateJobStatus.bind(jobController)]);

// POST /api/jobs/:id/appointments - Schedule technician for job
router.post('/:id/appointments', validate(createAppointmentSchema), [
  jobController.createAppointment.bind(jobController),
]);

// POST /api/jobs/:id/invoice - Create invoice for job
router.post('/:id/invoice', [jobController.createInvoice.bind(jobController)]);

export { router as jobRoutes };
