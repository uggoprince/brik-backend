import { Request, Response, NextFunction } from 'express';
import { TechnicianService } from '../services/TechnicianService';

const technicianService = new TechnicianService();

export class TechnicianController {
  async getAllTechnicians(req: Request, res: Response, next: NextFunction) {
    try {
      const technicians = await technicianService.getAllTechnicians();
      res.json(technicians);
    } catch (error) {
      next(error);
    }
  }

  async getTechnicianById(req: Request, res: Response, next: NextFunction) {
    try {
      const technician = await technicianService.getTechnicianById(req.params.id);
      res.json(technician);
    } catch (error) {
      next(error);
    }
  }
}
