import { Router } from 'express';
import { InvoiceController } from '../controllers/InvoiceController';
import { validate } from '../middleware/validate';
import { createPaymentSchema } from '../validators/invoiceValidator';

const router = Router();
const invoiceController = new InvoiceController();

// GET /api/invoices - Get all invoices
router.get('/', [invoiceController.getAllInvoices.bind(invoiceController)]);

// GET /api/invoices/:id - Get invoice by ID
router.get('/:id', [invoiceController.getInvoiceById.bind(invoiceController)]);

// POST /api/invoices/:id/payments - Record payment for invoice
router.post('/:id/payments', validate(createPaymentSchema), [invoiceController.createPayment.bind(invoiceController)]);

export { router as invoiceRoutes };