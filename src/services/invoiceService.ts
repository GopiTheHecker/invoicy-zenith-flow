
import api from './api';
import { Invoice } from '@/contexts/InvoiceContext';

export const invoiceService = {
  async getAllInvoices(): Promise<Invoice[]> {
    const response = await api.get('/invoices');
    return response.data;
  },
  
  async getInvoiceById(id: string): Promise<Invoice> {
    const response = await api.get(`/invoices/${id}`);
    return response.data;
  },
  
  async createInvoice(invoice: Omit<Invoice, 'id' | 'createdAt'>): Promise<Invoice> {
    const response = await api.post('/invoices', invoice);
    return response.data;
  },
  
  async updateInvoice(id: string, invoiceData: Partial<Invoice>): Promise<Invoice> {
    const response = await api.put(`/invoices/${id}`, invoiceData);
    return response.data;
  },
  
  async deleteInvoice(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/invoices/${id}`);
    return response.data;
  }
};
