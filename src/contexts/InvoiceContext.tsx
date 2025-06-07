import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

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
  createInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt'>) => Promise<Invoice>;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<boolean>;
  getInvoice: (id: string) => Promise<Invoice | undefined>;
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
  getUserBankDetails: () => {
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  } | undefined;
  isLoading: boolean;
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
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  console.log('InvoiceProvider rendered, user:', user);

  useEffect(() => {
    console.log('InvoiceProvider useEffect triggered, user:', user);
    if (user?.id && user.id !== 'guest-user-id') {
      fetchInvoices();
    } else if (user?.id === 'guest-user-id') {
      loadGuestInvoices();
    } else {
      setInvoices([]);
    }
  }, [user]);

  const fetchInvoices = async () => {
    if (!user || user.id === 'guest-user-id') return;
    
    setIsLoading(true);
    try {
      console.log('Fetching invoices for user:', user.id);
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching invoices:', error);
        toast.error('Failed to fetch invoices: ' + error.message);
        return;
      }

      console.log('Fetched invoices:', data);
      const formattedInvoices = data.map(transformSupabaseInvoice);
      setInvoices(formattedInvoices);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to fetch invoices');
    } finally {
      setIsLoading(false);
    }
  };

  const loadGuestInvoices = () => {
    const storedGuestInvoices = localStorage.getItem('guestInvoices');
    if (storedGuestInvoices) {
      const guestInvoices = JSON.parse(storedGuestInvoices);
      setInvoices(guestInvoices);
    }
  };

  const transformSupabaseInvoice = (data: any): Invoice => {
    return {
      id: data.id,
      invoiceNumber: data.invoice_number,
      issueDate: data.issue_date,
      dueDate: data.due_date,
      paymentTerms: data.payment_terms || '',
      client: data.client,
      company: data.company,
      items: data.items,
      subtotal: parseFloat(data.subtotal),
      totalCGST: parseFloat(data.total_cgst),
      totalSGST: parseFloat(data.total_sgst),
      totalIGST: parseFloat(data.total_igst),
      totalGST: parseFloat(data.total_gst),
      discount: parseFloat(data.discount),
      total: parseFloat(data.total),
      roundedTotal: parseFloat(data.rounded_total),
      amountInWords: data.amount_in_words,
      notes: data.notes || '',
      terms: data.terms || '',
      logo: data.logo,
      status: data.status,
      createdAt: data.created_at
    };
  };

  const createInvoice = async (invoiceData: Omit<Invoice, 'id' | 'createdAt'>) => {
    try {
      console.log('Creating invoice with user:', user);
      console.log('Invoice data:', invoiceData);
      
      // For guest users, store in localStorage
      if (user?.id === 'guest-user-id') {
        const newId = `guest-invoice-${Date.now()}`;
        const newInvoice = {
          ...invoiceData,
          id: newId,
          createdAt: new Date().toISOString()
        };
        
        const storedInvoices = localStorage.getItem('guestInvoices');
        let updatedInvoices = [newInvoice];
        
        if (storedInvoices) {
          const parsedInvoices = JSON.parse(storedInvoices);
          updatedInvoices = [...parsedInvoices, newInvoice];
        }
        
        localStorage.setItem('guestInvoices', JSON.stringify(updatedInvoices));
        setInvoices(prev => [newInvoice, ...prev]);
        
        toast.success("Invoice created successfully (Guest mode)");
        return newInvoice;
      }

      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      console.log('Attempting to save to Supabase for user:', user.id);

      // For authenticated users, save to Supabase
      const { data, error } = await supabase
        .from('invoices')
        .insert({
          user_id: user.id,
          invoice_number: invoiceData.invoiceNumber,
          issue_date: invoiceData.issueDate,
          due_date: invoiceData.dueDate,
          payment_terms: invoiceData.paymentTerms,
          client: invoiceData.client,
          company: invoiceData.company,
          items: invoiceData.items,
          subtotal: invoiceData.subtotal,
          total_cgst: invoiceData.totalCGST,
          total_sgst: invoiceData.totalSGST,
          total_igst: invoiceData.totalIGST,
          total_gst: invoiceData.totalGST,
          discount: invoiceData.discount,
          total: invoiceData.total,
          rounded_total: invoiceData.roundedTotal,
          amount_in_words: invoiceData.amountInWords,
          notes: invoiceData.notes,
          terms: invoiceData.terms,
          logo: invoiceData.logo,
          status: invoiceData.status
        })
        .select()
        .single();

      console.log('Supabase insert response:', { data, error });

      if (error) {
        console.error('Error creating invoice:', error);
        toast.error('Failed to create invoice: ' + error.message);
        throw error;
      }

      const newInvoice = transformSupabaseInvoice(data);
      setInvoices(prev => [newInvoice, ...prev]);
      
      toast.success("Invoice created successfully!");
      return newInvoice;
    } catch (error: any) {
      console.error('Invoice creation error:', error);
      toast.error("Failed to create invoice: " + (error.message || 'Unknown error'));
      throw error;
    }
  };

  const updateInvoice = async (id: string, invoiceData: Partial<Invoice>) => {
    try {
      // For guest users, update in localStorage
      if (user?.id === 'guest-user-id' || id.startsWith('guest-')) {
        const updatedInvoices = invoices.map(invoice => 
          invoice.id === id ? { ...invoice, ...invoiceData } : invoice
        );
        
        setInvoices(updatedInvoices);
        localStorage.setItem('guestInvoices', JSON.stringify(updatedInvoices));
        
        toast.success("Invoice updated successfully!");
        return;
      }

      // For authenticated users, update in Supabase
      const updateData: any = {};
      
      if (invoiceData.invoiceNumber) updateData.invoice_number = invoiceData.invoiceNumber;
      if (invoiceData.issueDate) updateData.issue_date = invoiceData.issueDate;
      if (invoiceData.dueDate) updateData.due_date = invoiceData.dueDate;
      if (invoiceData.paymentTerms) updateData.payment_terms = invoiceData.paymentTerms;
      if (invoiceData.client) updateData.client = invoiceData.client;
      if (invoiceData.company) updateData.company = invoiceData.company;
      if (invoiceData.items) updateData.items = invoiceData.items;
      if (invoiceData.subtotal !== undefined) updateData.subtotal = invoiceData.subtotal;
      if (invoiceData.totalCGST !== undefined) updateData.total_cgst = invoiceData.totalCGST;
      if (invoiceData.totalSGST !== undefined) updateData.total_sgst = invoiceData.totalSGST;
      if (invoiceData.totalIGST !== undefined) updateData.total_igst = invoiceData.totalIGST;
      if (invoiceData.totalGST !== undefined) updateData.total_gst = invoiceData.totalGST;
      if (invoiceData.discount !== undefined) updateData.discount = invoiceData.discount;
      if (invoiceData.total !== undefined) updateData.total = invoiceData.total;
      if (invoiceData.roundedTotal !== undefined) updateData.rounded_total = invoiceData.roundedTotal;
      if (invoiceData.amountInWords) updateData.amount_in_words = invoiceData.amountInWords;
      if (invoiceData.notes !== undefined) updateData.notes = invoiceData.notes;
      if (invoiceData.terms !== undefined) updateData.terms = invoiceData.terms;
      if (invoiceData.logo !== undefined) updateData.logo = invoiceData.logo;
      if (invoiceData.status) updateData.status = invoiceData.status;

      const { error } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error updating invoice:', error);
        toast.error('Failed to update invoice: ' + error.message);
        throw error;
      }

      // Update local state
      setInvoices(prev => prev.map(invoice => 
        invoice.id === id ? { ...invoice, ...invoiceData } : invoice
      ));
      
      toast.success("Invoice updated successfully!");
    } catch (error: any) {
      toast.error("Failed to update invoice");
      console.error(error);
      throw error;
    }
  };

  const deleteInvoice = async (id: string) => {
    try {
      // For guest users, delete from localStorage
      if (user?.id === 'guest-user-id' || id.startsWith('guest-')) {
        const updatedInvoices = invoices.filter(invoice => invoice.id !== id);
        setInvoices(updatedInvoices);
        localStorage.setItem('guestInvoices', JSON.stringify(updatedInvoices));
        
        if (currentInvoice?.id === id) {
          setCurrentInvoice(null);
        }
        
        toast.success("Invoice deleted successfully!");
        return true;
      }

      // For authenticated users, delete from Supabase
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error deleting invoice:', error);
        toast.error('Failed to delete invoice: ' + error.message);
        return false;
      }

      setInvoices(prev => prev.filter(invoice => invoice.id !== id));
      
      if (currentInvoice?.id === id) {
        setCurrentInvoice(null);
      }
      
      toast.success("Invoice deleted successfully!");
      return true;
    } catch (error: any) {
      toast.error("Failed to delete invoice");
      console.error(error);
      return false;
    }
  };

  const getInvoice = async (id: string) => {
    try {
      // First check if we have it in state
      const localInvoice = invoices.find(invoice => invoice.id === id);
      
      if (localInvoice) {
        return localInvoice;
      }

      // For guest users, we've already checked localStorage via the invoices state
      if (user?.id === 'guest-user-id' || id.startsWith('guest-')) {
        return undefined;
      }

      // If not in state, fetch from Supabase
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .eq('user_id', user?.id)
        .single();

      if (error) {
        console.error('Error fetching invoice:', error);
        return undefined;
      }

      return transformSupabaseInvoice(data);
    } catch (error) {
      console.error('Error:', error);
      return undefined;
    }
  };

  const getUserBankDetails = () => {
    if (!user || !user.bankDetails) {
      return {
        accountName: user?.name || '',
        accountNumber: 'XXXXXXXXXXXX',
        ifscCode: 'XXXXXXXXXXXX',
        bankName: 'XXXX Bank'
      };
    }
    
    return user.bankDetails;
  };

  const generateInvoiceNumber = () => {
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
    
    let intNum = Math.floor(num);
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

  const formatDate = (dateString: string): string => {
    try {
      // Skip processing if null or undefined
      if (!dateString) return '';
      
      // First check if the date is in YYYY-MM-DD format
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-').map(Number);
        return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
      }
      
      // For ISO format with timestamp
      if (/^\d{4}-\d{2}-\d{2}T/.test(dateString)) {
        const [datePart] = dateString.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
      }
      
      // Otherwise try to parse it as any date string
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        // If invalid, return an empty string rather than throwing an error
        console.error("Invalid date format:", dateString);
        return '';
      }
      
      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    } catch (error) {
      console.error("Date formatting error:", error);
      return ''; // Return empty string if any error occurs
    }
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
      deleteInvoice, 
      getInvoice,
      generateInvoiceNumber,
      calculateInvoiceValues,
      getUserBankDetails,
      isLoading
    }}>
      {children}
    </InvoiceContext.Provider>
  );
};

export default InvoiceProvider;
