import dayjs from 'dayjs';
import Bill from '../models/Bill.js';
import Expense from '../models/Expense.js';
import Patient from '../models/Patient.js';
import Commission from '../models/Commission.js';

export const summary = async (req, res) => {
  // supports: ?range=daily|weekly|monthly|yearly OR ?date=YYYY-MM-DD OR ?from=YYYY-MM-DD&to=YYYY-MM-DD OR ?month=YYYY-MM OR ?year=YYYY
  const { range, date, from, to, month, year } = req.query;
  let start;
  let end = dayjs();

  if (date) {
    start = dayjs(date).startOf('day');
    end = dayjs(date).endOf('day');
  } else if (month) {
    start = dayjs(month).startOf('month');
    end = dayjs(month).endOf('month');
  } else if (year) {
    start = dayjs(year).startOf('year');
    end = dayjs(year).endOf('year');
  } else if (from || to) {
    start = dayjs(from || dayjs().startOf('day'));
    end = dayjs(to || dayjs());
  } else {
    const now = dayjs();
    switch (range) {
      case 'weekly':
        start = now.startOf('week');
        break;
      case 'monthly':
        start = now.startOf('month');
        break;
      case 'yearly':
        start = now.startOf('year');
        break;
      default:
        start = now.startOf('day');
        break;
    }
  }

  const startDate = start.toDate();
  const endDate = end.toDate();
  const bills = await Bill.find({ createdAt: { $gte: startDate, $lte: endDate } });
  const expenses = await Expense.find({ date: { $gte: startDate, $lte: endDate } });
  const commissions = await Commission.find({ createdAt: { $gte: startDate, $lte: endDate } });
  
  // Only paid bills contribute to revenue, unpaid bills are dues
  const paidBills = bills.filter(b => b.status === 'paid');
  const totalPaidAmount = paidBills.reduce((s, b) => s + b.totalAmount, 0);
  
  // Calculate agent commissions for paid bills only
  const paidCommissions = commissions.filter(c => c.status === 'paid');
  const totalCommissions = paidCommissions.reduce((s, c) => s + c.commissionAmount, 0);
  
  // Revenue = Paid bills amount - Agent commissions
  const revenue = totalPaidAmount - totalCommissions;
  
  // Dues = Unpaid bills total
  const dues = bills.filter(b => b.status === 'unpaid').reduce((s, b) => s + b.totalAmount, 0);
  const expenseTotal = expenses.reduce((s, e) => s + e.amount, 0);
  
  res.json({ revenue, dues, expenseTotal, from: startDate, to: endDate });
};

export const closing = async (req, res) => {
  const start = dayjs().startOf('day');
  const end = dayjs().endOf('day');
  const bills = await Bill.find({ createdAt: { $gte: start.toDate(), $lte: end.toDate() } });
  const expenses = await Expense.find({ date: { $gte: start.toDate(), $lte: end.toDate() } });
  const commissions = await Commission.find({ createdAt: { $gte: start.toDate(), $lte: end.toDate() } });
  
  // Only paid bills contribute to revenue, unpaid bills are dues
  const paidBills = bills.filter(b => b.status === 'paid');
  const totalPaidAmount = paidBills.reduce((s, b) => s + b.totalAmount, 0);
  
  // Calculate agent commissions for paid bills only
  const paidCommissions = commissions.filter(c => c.status === 'paid');
  const totalCommissions = paidCommissions.reduce((s, c) => s + c.commissionAmount, 0);
  
  // Revenue = Paid bills amount - Agent commissions
  const revenue = totalPaidAmount - totalCommissions;
  
  // Dues = Unpaid bills total
  const dues = bills.filter(b => b.status === 'unpaid').reduce((s, b) => s + b.totalAmount, 0);
  const expenseTotal = expenses.reduce((s, e) => s + e.amount, 0);
  res.json({ date: start.toDate(), revenue, dues, expenseTotal, bills, expenses });
};

export const timeseries = async (req, res) => {
  const { days, month, year } = req.query;
  let start, end;

  if (month) {
    start = dayjs(month).startOf('month');
    end = dayjs(month).endOf('month');
  } else if (year) {
    start = dayjs(year).startOf('year');
    end = dayjs(year).endOf('year');
  } else {
    const numDays = Math.max(1, Math.min(parseInt(days || '14', 10), 90));
    end = dayjs().endOf('day');
    start = end.subtract(numDays - 1, 'day').startOf('day');
  }

  const bills = await Bill.find({ createdAt: { $gte: start.toDate(), $lte: end.toDate() } });
  const expenses = await Expense.find({ date: { $gte: start.toDate(), $lte: end.toDate() } });

  const byDay = {};
  const totalDays = end.diff(start, 'day') + 1;
  
  for (let i = 0; i < totalDays; i++) {
    const d = start.add(i, 'day').format('YYYY-MM-DD');
    byDay[d] = { date: d, revenue: 0, dues: 0, expenses: 0 };
  }

  // Calculate daily revenue from paid bills minus commissions
  const commissions = await Commission.find({ createdAt: { $gte: start.toDate(), $lte: end.toDate() } });
  
  bills.forEach((b) => {
    const d = dayjs(b.createdAt).format('YYYY-MM-DD');
    if (!byDay[d]) return;
    
    if (b.status === 'paid') {
      byDay[d].revenue += b.totalAmount;
    } else if (b.status === 'unpaid') {
      byDay[d].dues += b.totalAmount;
    }
  });
  
  // Subtract agent commissions from revenue
  commissions.forEach((c) => {
    if (c.status === 'paid') {
      const d = dayjs(c.createdAt).format('YYYY-MM-DD');
      if (!byDay[d]) return;
      byDay[d].revenue -= c.commissionAmount;
    }
  });
  expenses.forEach((e) => {
    const d = dayjs(e.date).format('YYYY-MM-DD');
    if (!byDay[d]) return;
    byDay[d].expenses += e.amount;
  });

  res.json(Object.values(byDay));
};

// Get today's revenue and dues
export const todaySummary = async (req, res) => {
  const start = dayjs().startOf('day').toDate();
  const end = dayjs().endOf('day').toDate();
  
  const bills = await Bill.find({ createdAt: { $gte: start, $lte: end } });
  const commissions = await Commission.find({ createdAt: { $gte: start, $lte: end } });
  
  // Only paid bills contribute to revenue, unpaid bills are dues
  const paidBills = bills.filter(b => b.status === 'paid');
  const totalPaidAmount = paidBills.reduce((s, b) => s + b.totalAmount, 0);
  
  // Calculate agent commissions for paid bills only
  const paidCommissions = commissions.filter(c => c.status === 'paid');
  const totalCommissions = paidCommissions.reduce((s, c) => s + c.commissionAmount, 0);
  
  // Revenue = Paid bills amount - Agent commissions
  const revenue = totalPaidAmount - totalCommissions;
  
  // Dues = Unpaid bills total
  const dues = bills.filter(b => b.status === 'unpaid').reduce((s, b) => s + b.totalAmount, 0);
  
  res.json({ revenue, dues });
};

// Get all-time revenue and dues
export const allTimeSummary = async (req, res) => {
  const bills = await Bill.find({});
  const commissions = await Commission.find({});
  
  // Only paid bills contribute to revenue, unpaid bills are dues
  const paidBills = bills.filter(b => b.status === 'paid');
  const totalPaidAmount = paidBills.reduce((s, b) => s + b.totalAmount, 0);
  
  // Calculate agent commissions for paid bills only
  const paidCommissions = commissions.filter(c => c.status === 'paid');
  const totalCommissions = paidCommissions.reduce((s, c) => s + c.commissionAmount, 0);
  
  // Revenue = Paid bills amount - Agent commissions
  const revenue = totalPaidAmount - totalCommissions;
  
  // Dues = Unpaid bills total
  const dues = bills.filter(b => b.status === 'unpaid').reduce((s, b) => s + b.totalAmount, 0);
  
  res.json({ revenue, dues });
};
