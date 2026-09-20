import { Router } from 'express';
import { authorize, protect } from '../middleware/auth.js';
import express from 'express';
import { 
  getAgents, 
  createAgent, 
  getAgentPatients, 
  addCommission, 
  payCommission, 
  getAgentCommissions,
  deleteAgent
} from '../controllers/agent.controller.js';

const router = express.Router();

router.use(protect);

router.get('/', getAgents);
router.post('/', createAgent);
router.delete('/:id', deleteAgent);
router.get('/:agentId/patients', getAgentPatients);
router.get('/:agentId/commissions', getAgentCommissions);
router.post('/commission', addCommission);
router.post('/commission/:commissionId/pay', payCommission);

export default router;
