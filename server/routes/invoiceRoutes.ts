
import express from 'express';
import { Invoice } from '../models/invoiceModel';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// Get all invoices for a user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const invoices = await Invoice.find({ user: req.user!.id }).sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific invoice
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, user: req.user!.id });
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    res.json(invoice);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new invoice
router.post('/', authMiddleware, async (req, res) => {
  try {
    const invoiceData = {
      ...req.body,
      user: req.user!.id
    };
    
    const invoice = await Invoice.create(invoiceData);
    res.status(201).json(invoice);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Update an invoice
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, user: req.user!.id });
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    const updatedInvoice = await Invoice.findByIdAndUpdate(
      req.params.id, 
      req.body,
      { new: true }
    );
    
    res.json(updatedInvoice);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Delete an invoice
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, user: req.user!.id });
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    await Invoice.findByIdAndDelete(req.params.id);
    res.json({ message: 'Invoice deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export const invoiceRouter = router;
