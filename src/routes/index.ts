import { Router } from 'express';
import { customerRoutes } from './customers';
import { jobRoutes } from './jobs';
import technicianRoutes from './technicians';
import { invoiceRoutes } from './invoices';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
router.use('/customers', customerRoutes);
router.use('/jobs', jobRoutes);
router.use('/technicians', technicianRoutes);
router.use('/invoices', invoiceRoutes);

export default router;