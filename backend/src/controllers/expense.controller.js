import Expense from '../models/Expense.js';

export const createExpense = async (req, res) => {
  const expense = await Expense.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json(expense);
};

export const listExpenses = async (req, res) => {
  const { startDate, endDate } = req.query;
  const filter = {};
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }
  const expenses = await Expense.find(filter).sort({ date: -1 });
  res.json(expenses);
};





