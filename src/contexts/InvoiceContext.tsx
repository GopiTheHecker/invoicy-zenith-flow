
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from "sonner";

export type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  client: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  notes: string;
  terms: string;
  logo?: string;
  status: 'draft' | 'sent' | 'paid';
  createdAt: string;
};

type InvoiceContextType = {
  invoices: Invoice[];
  currentInvoice: Invoice | null;
  setCurrentInvoice: (invoice: Invoice | null) => void;
  createInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt'>) => Invoice;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => void;
  getInvoice: (id: string) => Invoice | undefined;
  generateInvoiceNumber: () => string;
  calculateInvoiceValues: (items: InvoiceItem[], tax: number, discount: number) => { subtotal: number, total: number };
};

const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined);

export const useInvoices = () => {
  const context = useContext(InvoiceContext);
  if (!context) {
    throw new Error('useInvoices must be used within an InvoiceProvider');
  }
  return context;
};

export const InvoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    // Load invoices from localStorage
    const storedInvoices = localStorage.getItem('invoices');
    if (storedInvoices) {
      setInvoices(JSON.parse(storedInvoices));
    }
  }, []);

  // Save invoices to localStorage when they change
  useEffect(() => {
    localStorage.setItem('invoices', JSON.stringify(invoices));
  }, [invoices]);

  const createInvoice = (invoiceData: Omit<Invoice, 'id' | 'createdAt'>) => {
    const newInvoice: Invoice = {
      ...invoiceData,
      id: `inv-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    setInvoices(prev => [...prev, newInvoice]);
    toast.success("Invoice created successfully!");
    return newInvoice;
  };

  const updateInvoice = (id: string, invoiceData: Partial<Invoice>) => {
    setInvoices(prev => 
      prev.map(invoice => 
        invoice.id === id ? { ...invoice, ...invoiceData } : invoice
      )
    );
    toast.success("Invoice updated successfully!");
  };

  const getInvoice = (id: string) => {
    return invoices.find(invoice => invoice.id === id);
  };

  const generateInvoiceNumber = () => {
    const prefix = "INV";
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    return `${prefix}-${year}${month}-${randomNum}`;
  };

  const calculateInvoiceValues = (items: InvoiceItem[], tax: number, discount: number) => {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = (subtotal * tax) / 100;
    const discountAmount = (subtotal * discount) / 100;
    const total = subtotal + taxAmount - discountAmount;

    return {
      subtotal,
      total
    };
  };

  return (
    <InvoiceContext.Provider value={{ 
      invoices, 
      currentInvoice, 
      setCurrentInvoice, 
      createInvoice, 
      updateInvoice, 
      getInvoice,
      generateInvoiceNumber,
      calculateInvoiceValues
    }}>
      {children}
    </InvoiceContext.Provider>
  );
};
