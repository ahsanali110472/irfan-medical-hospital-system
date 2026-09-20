import Agent from '../models/Agent.js';
import Patient from '../models/Patient.js';
import Commission from '../models/Commission.js';

// Get all agents
export const getAgents = async (req, res) => {
  try {
    const agents = await Agent.find({}).sort({ name: 1 });
    res.json(agents);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching agents', error: error.message });
  }
};

// Create new agent
export const createAgent = async (req, res) => {
  try {
    const { name, contact } = req.body;
    const agent = await Agent.create({ name, contact });
    res.status(201).json(agent);
  } catch (error) {
    res.status(500).json({ message: 'Error creating agent', error: error.message });
  }
};

// Get agent's patients
export const getAgentPatients = async (req, res) => {
  try {
    const { agentId } = req.params;
    const agent = await Agent.findById(agentId);
    if (!agent) return res.status(404).json({ message: 'Agent not found' });

    const patients = await Patient.find({ agentName: agent.name })
      .populate('visit.testIds')
      .sort({ createdAt: -1 });
    
    res.json({ agent, patients });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching agent patients', error: error.message });
  }
};

// Calculate and add commission for a patient
export const addCommission = async (req, res) => {
  try {
    const { agentId, patientId, commissionAmount } = req.body;
    
    const agent = await Agent.findById(agentId);
    const patient = await Patient.findById(patientId);
    
    if (!agent) return res.status(404).json({ message: 'Agent not found' });
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    
    // Create commission record
    const commission = await Commission.create({
      agent: agentId,
      patient: patientId,
      commissionAmount,
      commissionRate: 0, // No predefined rate, commission is manually entered
      patientTotalAmount: patient.totalAmountReceived
    });
    
    // Update agent totals
    agent.totalCommissionEarned += commissionAmount;
    agent.pendingCommission += commissionAmount;
    await agent.save();
    
    // Calculate remaining amount that goes to hospital revenue
    const remainingAmount = patient.currentBalance - commissionAmount;
    
    res.json({ 
      commission, 
      remainingAmount,
      message: 'Commission added successfully' 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adding commission', error: error.message });
  }
};

// Pay commission to agent
export const payCommission = async (req, res) => {
  try {
    const { commissionId } = req.params;
    
    const commission = await Commission.findById(commissionId).populate('agent');
    if (!commission) return res.status(404).json({ message: 'Commission not found' });
    
    if (commission.status === 'paid') {
      return res.status(400).json({ message: 'Commission already paid' });
    }
    
    // Update commission status
    commission.status = 'paid';
    commission.paidAt = new Date();
    await commission.save();
    
    // Update agent totals
    const agent = commission.agent;
    agent.totalCommissionPaid += commission.commissionAmount;
    agent.pendingCommission -= commission.commissionAmount;
    await agent.save();
    
    res.json({ commission, message: 'Commission paid successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error paying commission', error: error.message });
  }
};

// Get agent commissions
export const getAgentCommissions = async (req, res) => {
  try {
    const { agentId } = req.params;
    const commissions = await Commission.find({ agent: agentId })
      .populate('patient', 'name contact')
      .sort({ createdAt: -1 });
    
    res.json(commissions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching commissions', error: error.message });
  }
};

// Delete agent
export const deleteAgent = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if agent has any commissions
    const commissionCount = await Commission.countDocuments({ agent: id });
    if (commissionCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete agent with existing commissions. Please remove all commissions first.' 
      });
    }
    
    // Check if agent has any patients
    const agent = await Agent.findById(id);
    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }
    
    const agentPatientCount = await Patient.countDocuments({ agentName: agent.name });
    if (agentPatientCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete agent with existing patients. Please reassign or remove patients first.' 
      });
    }
    
    const deletedAgent = await Agent.findByIdAndDelete(id);
    if (!deletedAgent) {
      return res.status(404).json({ message: 'Agent not found' });
    }
    
    res.json({ message: 'Agent deleted successfully', agent: deletedAgent });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting agent', error: error.message });
  }
};
