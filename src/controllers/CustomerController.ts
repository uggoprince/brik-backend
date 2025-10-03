import { Request, Response, NextFunction } from 'express';
import { CustomerService } from '../services/CustomerService';
import { createCustomerSchema } from '../validators/customerValidator';

const customerService = new CustomerService();

export class CustomerController {
  async createCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createCustomerSchema.parse(req.body);
      const customer = await customerService.createCustomer(data);
      res.status(201).json(customer);
    } catch (error) {
      next(error);
    }
  }

  async getCustomerById(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await customerService.getCustomerById(req.params.id);
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }
      return res.json(customer);
    } catch (error) {
      next(error);
    }
  }

  async getAllCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const customers = await customerService.getAllCustomers();
      res.json(customers);
    } catch (error) {
      next(error);
    }
  }
}