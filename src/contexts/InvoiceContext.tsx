
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from "sonner";

export type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  hsnCode: string;
  gstRate: number;
  discountPercent: number;
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  paymentTerms: string;
  client: {
    name: string;
    email: string;
    phone: string;
    address: string;
    gstin: string;
    state: string;
  };
  company: {
    name: string;
    address: string;
    gstin: string;
    state: string;
    signatory: string;
  };
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
};

type InvoiceContextType = {
  invoices: Invoice[];
  currentInvoice: Invoice | null;
  setCurrentInvoice: (invoice: Invoice | null) => void;
  createInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt'>) => Invoice;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => void;
  getInvoice: (id: string) => Invoice | undefined;
  generateInvoiceNumber: () => string;
  calculateInvoiceValues: (items: InvoiceItem[], discount: number, sameState: boolean) => { 
    subtotal: number, 
    totalCGST: number, 
    totalSGST: number, 
    totalIGST: number,
    totalGST: number, 
    total: number,
    roundedTotal: number,
    amountInWords: string 
  };
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
    // Format: SIT-XXX-24-25 (Incremental number for each new bill)
    const currentYear = new Date().getFullYear();
    const yearPart = `${(currentYear % 100)}-${(currentYear % 100) + 1}`;
    
    const prefix = "SIT";
    const latestInvoice = invoices
      .filter(inv => inv.invoiceNumber.startsWith(prefix))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    
    let sequenceNumber = 1;
    
    if (latestInvoice) {
      const parts = latestInvoice.invoiceNumber.split('-');
      if (parts.length >= 2) {
        const lastNumber = parseInt(parts[1], 10);
        if (!isNaN(lastNumber)) {
          sequenceNumber = lastNumber + 1;
        }
      }
    }
    
    return `${prefix}-${String(sequenceNumber).padStart(3, '0')}-${yearPart}`;
  };

  // Function to convert number to words for Indian Rupees
  const numberToWords = (num: number) => {
    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
    const convertLessThanOneThousand = (num: number) => {
      if (num === 0) {
        return '';
      }
      if (num < 20) {
        return units[num];
      }
      const digit = num % 10;
      if (num < 100) {
        return tens[Math.floor(num / 10)] + (digit ? ' ' + units[digit] : '');
      }
      return units[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' and ' + convertLessThanOneThousand(num % 100) : '');
    };
  
    if (num === 0) return 'Zero Rupees Only';
    
    const intNum = Math.floor(num);
    const paise = Math.round((num - intNum) * 100);
    
    let result = '';
    
    if (intNum > 0) {
      let lakh = Math.floor(intNum / 100000);
      intNum %= 100000;
      
      let thousand = Math.floor(intNum / 1000);
      intNum %= 1000;
      
      let remaining = intNum;
      
      if (lakh) {
        result += convertLessThanOneThousand(lakh) + ' Lakh ';
      }
      
      if (thousand) {
        result += convertLessThanOneThousand(thousand) + ' Thousand ';
      }
      
      if (remaining) {
        result += convertLessThanOneThousand(remaining);
      }
      
      result = result.trim() + ' Rupees';
    }
    
    if (paise) {
      result += ' and ' + convertLessThanOneThousand(paise) + ' Paise';
    }
    
    return result + ' Only';
  };

  const calculateInvoiceValues = (items: InvoiceItem[], discount: number, sameState: boolean) => {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const discountAmount = (subtotal * discount) / 100;
    const taxableAmount = subtotal - discountAmount;

    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;
    
    items.forEach(item => {
      const itemAmount = item.amount - (item.amount * (item.discountPercent || 0)) / 100;
      const gstAmount = (itemAmount * item.gstRate) / 100;
      
      if (sameState) {
        // Split into CGST and SGST
        totalCGST += gstAmount / 2;
        totalSGST += gstAmount / 2;
      } else {
        // Apply full GST as IGST
        totalIGST += gstAmount;
      }
    });
    
    const totalGST = totalCGST + totalSGST + totalIGST;
    const total = taxableAmount + totalGST;
    const roundedTotal = Math.round(total);
    const amountInWords = numberToWords(roundedTotal);

    return {
      subtotal,
      totalCGST,
      totalSGST,
      totalIGST,
      totalGST,
      total,
      roundedTotal,
      amountInWords
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
