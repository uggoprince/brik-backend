import { Request, Response } from 'express';
import { TechnicianService } from '../services/TechnicianService';

const technicianService = new TechnicianService();

export class TechnicianController {
  async getTechnicians(req: Request, res: Response) {
    const technicians = await technicianService.getAllTechnicians();
    res.json(technicians);
  }
}
