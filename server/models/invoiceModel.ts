
import mongoose, { Document, Schema } from 'mongoose';

// Define interfaces for the invoice structure
interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  hsnCode: string;
  gstRate: number;
  discountPercent: number;
}

interface Client {
  name: string;
  email: string;
  phone: string;
  address: string;
  gstin: string;
  state: string;
}

interface Company {
  name: string;
  address: string;
  gstin: string;
  state: string;
  signatory: string;
}

export interface IInvoice extends Document {
  user: Schema.Types.ObjectId;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  paymentTerms: string;
  client: Client;
  company: Company;
  items: InvoiceItem[];
  subtotal: number;
  totalCGST: number;
  totalSGST: number;
  totalIGST: number;
  totalGST: number;
  discount: number;
  total: number;
  roundedTotal: number;
  amountInWords: string;
  notes: string;
  terms: string;
  logo?: string;
  status: 'draft' | 'sent' | 'paid';
  createdAt: string;
}

const invoiceSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  invoiceNumber: {
    type: String,
    required: true
  },
  issueDate: {
    type: String,
    required: true
  },
  dueDate: {
    type: String,
    required: true
  },
  paymentTerms: {
    type: String,
    required: true
  },
  client: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    address: { type: String, required: true },
    gstin: { type: String },
    state: { type: String, required: true }
  },
  company: {
    name: { type: String, required: true },
    address: { type: String, required: true },
    gstin: { type: String, required: true },
    state: { type: String, required: true },
    signatory: { type: String, required: true }
  },
  items: [{
    id: { type: String, required: true },
    description: { type: String, required: true },
    quantity: { type: Number, required: true },
    rate: { type: Number, required: true },
    amount: { type: Number, required: true },
    hsnCode: { type: String, required: true },
    gstRate: { type: Number, required: true },
    discountPercent: { type: Number, default: 0 }
  }],
  subtotal: { type: Number, required: true },
  totalCGST: { type: Number, required: true },
  totalSGST: { type: Number, required: true },
  totalIGST: { type: Number, required: true },
  totalGST: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  roundedTotal: { type: Number, required: true },
  amountInWords: { type: String, required: true },
  notes: { type: String },
  terms: { type: String },
  logo: { type: String },
  status: { 
    type: String, 
    enum: ['draft', 'sent', 'paid'],
    default: 'draft'
  },
  createdAt: { type: String, required: true }
}, { timestamps: true });

export const Invoice = mongoose.model<IInvoice>('Invoice', invoiceSchema);
