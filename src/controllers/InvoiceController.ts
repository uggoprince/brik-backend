import { Request, Response, NextFunction } from 'express';
import { InvoiceService } from '../services/InvoiceService';
import { createPaymentSchema } from '../validators/invoiceValidator';

const invoiceService = new InvoiceService();

export class InvoiceController {
  async getAllInvoices(req: Request, res: Response, next: NextFunction) {
    try {
      const invoices = await invoiceService.getAllInvoices();
      res.json(invoices);
    } catch (error) {
      next(error);
    }
  }

  async getInvoiceById(req: Request, res: Response, next: NextFunction) {
    try {
      const invoice = await invoiceService.getInvoiceById(req.params.id);
      res.json(invoice);
    } catch (error) {
      next(error);
    }
  }

  async createPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createPaymentSchema.parse(req.body);
      const result = await invoiceService.createPayment(req.params.id, data);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
}
