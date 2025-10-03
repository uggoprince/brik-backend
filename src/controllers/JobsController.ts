import { Request, Response, NextFunction } from 'express';
import { JobService } from '../services/JobService';
import {
  createJobSchema,
  createAppointmentSchema,
  updateStatusSchema,
  createInvoiceSchema,
} from '../validators/jobValidator';

const jobService = new JobService();

export class JobController {
  async createJob(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createJobSchema.parse(req.body);
      const job = await jobService.createJob(data);
      res.status(201).json(job);
    } catch (error) {
      next(error);
    }
  }

  async getAllJobs(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = req.query;
      const jobs = await jobService.getAllJobs(status as string);
      res.json(jobs);
    } catch (error) {
      next(error);
    }
  }

  async getJobById(req: Request, res: Response, next: NextFunction) {
    try {
      const job = await jobService.getJobById(req.params.id);
      res.json(job);
    } catch (error) {
      next(error);
    }
  }

  async updateJobStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateStatusSchema.parse(req.body);
      const job = await jobService.updateJobStatus(req.params.id, data);
      res.json(job);
    } catch (error) {
      next(error);
    }
  }

  async createAppointment(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createAppointmentSchema.parse(req.body);
      const appointment = await jobService.createAppointment(req.params.id, data);
      res.status(201).json(appointment);
    } catch (error) {
      next(error);
    }
  }

  async createInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createInvoiceSchema.parse(req.body);
      const invoice = await jobService.createInvoice(req.params.id, data);
      res.status(201).json(invoice);
    } catch (error) {
      next(error);
    }
  }
}
