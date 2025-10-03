import { Router } from 'express';
import { CustomerController } from '../controllers/CustomerController';
import { validate } from '../middleware/validate';
import { createCustomerSchema } from '../validators/customerValidator';

const router = Router();
const customerController = new CustomerController();

// POST /api/customers - Create a new customer
router.post('/', validate(createCustomerSchema), (req, res, next) => {
  customerController.createCustomer(req, res, next).catch(next);
});

// GET /api/customers/:id - Get customer by ID
router.get('/:id', [customerController.getCustomerById.bind(customerController)]);

// GET /api/customers - Get all customers
router.get('/', [customerController.getAllCustomers.bind(customerController)]);

export { router as customerRoutes };