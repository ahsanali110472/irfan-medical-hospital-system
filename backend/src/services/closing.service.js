import dayjs from 'dayjs';
import Bill from '../models/Bill.js';
import Expense from '../models/Expense.js';
import Commission from '../models/Commission.js';

export const generateDailyClosingReport = async () => {
  const start = dayjs().subtract(1, 'day').startOf('day');
  const end = dayjs().subtract(1, 'day').endOf('day');
  
  const bills = await Bill.find({ createdAt: { $gte: start.toDate(), $lte: end.toDate() } });
  const expenses = await Expense.find({ date: { $gte: start.toDate(), $lte: end.toDate() } });
  
  // Only paid bills contribute to revenue
  const paidBills = bills.filter(b => b.status === 'paid');
  const dues = bills.filter(b => b.status === 'unpaid').reduce((s, b) => s + b.totalAmount, 0);
  
  // Calculate total paid amount
  const totalPaidAmount = paidBills.reduce((s, b) => s + b.totalAmount, 0);
  
  // Calculate total agent commissions for paid bills
  const paidBillIds = paidBills.map(b => b._id);
  const commissions = await Commission.find({ 
    bill: { $in: paidBillIds },
    status: 'paid'
  });
  const totalCommissions = commissions.reduce((s, c) => s + c.commissionAmount, 0);
  
  // Revenue = Total paid amount - Agent commissions
  const revenue = totalPaidAmount - totalCommissions;
  const expenseTotal = expenses.reduce((s, e) => s + e.amount, 0);
  
  return { 
    date: start.toDate(), 
    revenue, 
    dues, 
    expenseTotal,
    totalPaidAmount,
    totalCommissions
  };
};





