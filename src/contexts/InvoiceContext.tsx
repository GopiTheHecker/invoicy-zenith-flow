import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from "sonner";
import { invoiceService } from '@/services/invoiceService';
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
  const { user } = useAuth();

  // Fetch invoices when user changes
  useEffect(() => {
    if (user) {
      fetchInvoices();
    } else {
      // If user is logged out, clear invoices
      setInvoices([]);
    }
  }, [user]);

  const fetchInvoices = async () => {
    if (!user) return;
    
    try {
      // For all users, first check localStorage
      const storedLocalInvoices = localStorage.getItem('localInvoices');
      let localInvoices: Invoice[] = [];
      
      if (storedLocalInvoices) {
        localInvoices = JSON.parse(storedLocalInvoices);
      }
      
      // For guest users, use only localStorage
      if (user.id === 'guest-user-id') {
        const storedGuestInvoices = localStorage.getItem('guestInvoices');
        if (storedGuestInvoices) {
          const guestInvoices = JSON.parse(storedGuestInvoices);
          setInvoices([...guestInvoices, ...localInvoices]);
        } else {
          setInvoices(localInvoices);
        }
        return;
      }
      
      // For regular users, try to fetch from API
      try {
        const data = await invoiceService.getAllInvoices();
        
        // Merge remote data with local data (prioritizing remote data)
        const remoteIds = data.map(invoice => invoice.id);
        const uniqueLocalInvoices = localInvoices.filter(invoice => !remoteIds.includes(invoice.id));
        
        setInvoices([...data, ...uniqueLocalInvoices]);
        
        // Sync local invoices to server if there are any
        if (uniqueLocalInvoices.length > 0) {
          toast.info(`Syncing ${uniqueLocalInvoices.length} local invoices to server...`);
          syncLocalInvoicesToServer(uniqueLocalInvoices);
        }
      } catch (error) {
        console.error("API error, using local data:", error);
        setInvoices(localInvoices);
        toast.error("Could not connect to server. Using locally stored invoices.");
      }
    } catch (error: any) {
      toast.error("Failed to fetch invoices");
      console.error(error);
    }
  };

  // New function to sync local invoices to server
  const syncLocalInvoicesToServer = async (localInvoices: Invoice[]) => {
    if (!user || user.id === 'guest-user-id') return;
    
    for (const invoice of localInvoices) {
      try {
        // Remove local-specific ID format if present
        const { id, createdAt, ...invoiceData } = invoice;
        await invoiceService.createInvoice(invoiceData);
      } catch (error) {
        console.error("Failed to sync invoice to server:", error);
      }
    }
    
    // Clear local invoices after successful sync
    localStorage.removeItem('localInvoices');
  };

  const createInvoice = async (invoiceData: Omit<Invoice, 'id' | 'createdAt'>) => {
    try {
      // Ensure we have valid dates
      if (typeof invoiceData.issueDate !== 'string' || !invoiceData.issueDate) {
        invoiceData.issueDate = new Date().toISOString().split('T')[0];
      }
      
      if (typeof invoiceData.dueDate !== 'string' || !invoiceData.dueDate) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);
        invoiceData.dueDate = dueDate.toISOString().split('T')[0];
      }
      
      // For guest users or when offline, store in localStorage
      if (user?.id === 'guest-user-id' || !navigator.onLine) {
        const storageKey = user?.id === 'guest-user-id' ? 'guestInvoices' : 'localInvoices';
        const newId = `${storageKey.replace('Invoices', '')}-invoice-${Date.now()}`;
        const newInvoice = {
          ...invoiceData,
          id: newId,
          createdAt: new Date().toISOString()
        };
        
        const storedInvoices = localStorage.getItem(storageKey);
        let updatedInvoices = [newInvoice];
        
        if (storedInvoices) {
          const parsedInvoices = JSON.parse(storedInvoices);
          updatedInvoices = [...parsedInvoices, newInvoice];
        }
        
        localStorage.setItem(storageKey, JSON.stringify(updatedInvoices));
        setInvoices(prev => [...prev, newInvoice]);
        
        toast.success(user?.id === 'guest-user-id' 
          ? "Invoice created successfully (Guest mode)"
          : "Invoice saved locally (Offline mode)");
        
        return newInvoice;
      }
      
      try {
        // For regular users, try online mode first
        const newInvoice = await invoiceService.createInvoice(invoiceData);
        setInvoices(prev => [...prev, newInvoice]);
        
        // Also store in localStorage as backup
        const localCopy = {
          ...newInvoice,
          _synced: true // Mark as already synced with server
        };
        
        const storedInvoices = localStorage.getItem('localInvoices');
        let updatedLocalInvoices = [localCopy];
        
        if (storedInvoices) {
          const parsedInvoices = JSON.parse(storedInvoices);
          updatedLocalInvoices = [...parsedInvoices, localCopy];
        }
        
        localStorage.setItem('localInvoices', JSON.stringify(updatedLocalInvoices));
        
        toast.success("Invoice created and stored successfully!");
        return newInvoice;
      } catch (error: any) {
        console.error("API error:", error);
        
        // Fallback to localStorage if the API fails
        console.log("API failed, falling back to localStorage");
        const newId = `local-invoice-${Date.now()}`;
        const newInvoice = {
          ...invoiceData,
          id: newId,
          createdAt: new Date().toISOString()
        };
        
        const storedInvoices = localStorage.getItem('localInvoices');
        let updatedInvoices = [newInvoice];
        
        if (storedInvoices) {
          const parsedInvoices = JSON.parse(storedInvoices);
          updatedInvoices = [...parsedInvoices, newInvoice];
        }
        
        localStorage.setItem('localInvoices', JSON.stringify(updatedInvoices));
        setInvoices(prev => [...prev, newInvoice]);
        
        toast.success("Invoice saved locally due to connection issues");
        return newInvoice;
      }
    } catch (error: any) {
      toast.error("Failed to create invoice");
      console.error(error);
      throw error;
    }
  };

  const updateInvoice = async (id: string, invoiceData: Partial<Invoice>) => {
    try {
      // First, update the invoice in state
      const updatedInvoices = invoices.map(invoice => 
        invoice.id === id ? { ...invoice, ...invoiceData } : invoice
      );
      
      setInvoices(updatedInvoices);
      
      // For guest users or offline mode, update only in localStorage
      if (user?.id === 'guest-user-id' || !navigator.onLine) {
        const storageKey = id.startsWith('guest-') ? 'guestInvoices' : 'localInvoices';
        localStorage.setItem(storageKey, JSON.stringify(updatedInvoices));
        
        toast.success("Invoice updated successfully!");
        return;
      }
      
      // For regular users in online mode
      try {
        await invoiceService.updateInvoice(id, invoiceData);
        
        // Also update in localStorage as backup
        const allLocalInvoices = localStorage.getItem('localInvoices');
        if (allLocalInvoices) {
          const parsedInvoices = JSON.parse(allLocalInvoices);
          const updatedLocalInvoices = parsedInvoices.map((invoice: Invoice) => 
            invoice.id === id ? { ...invoice, ...invoiceData, _synced: true } : invoice
          );
          localStorage.setItem('localInvoices', JSON.stringify(updatedLocalInvoices));
        }
        
        toast.success("Invoice updated successfully!");
      } catch (error) {
        console.error("API update failed, saving locally:", error);
        
        // On API failure, ensure the update is saved locally
        const allLocalInvoices = localStorage.getItem('localInvoices');
        const updatedInvoice = updatedInvoices.find(inv => inv.id === id);
        
        if (updatedInvoice) {
          let localInvoices = [];
          if (allLocalInvoices) {
            localInvoices = JSON.parse(allLocalInvoices);
            // Check if invoice exists in local storage
            const localIndex = localInvoices.findIndex((inv: Invoice) => inv.id === id);
            if (localIndex >= 0) {
              localInvoices[localIndex] = { ...updatedInvoice, _synced: false };
            } else {
              localInvoices.push({ ...updatedInvoice, _synced: false });
            }
          } else {
            localInvoices = [{ ...updatedInvoice, _synced: false }];
          }
          
          localStorage.setItem('localInvoices', JSON.stringify(localInvoices));
        }
        
        toast.info("Invoice saved locally due to connection issues");
      }
    } catch (error: any) {
      toast.error("Failed to update invoice");
      console.error(error);
      throw error;
    }
  };

  // Add delete invoice functionality
  const deleteInvoice = async (id: string) => {
    try {
      // For guest users, delete from localStorage
      if (user?.id === 'guest-user-id') {
        const updatedInvoices = invoices.filter(invoice => invoice.id !== id);
        setInvoices(updatedInvoices);
        localStorage.setItem('guestInvoices', JSON.stringify(updatedInvoices));
        
        // If the deleted invoice is the current one, clear it
        if (currentInvoice?.id === id) {
          setCurrentInvoice(null);
        }
        
        toast.success("Invoice deleted successfully!");
        return true;
      }
      
      // For regular users
      await invoiceService.deleteInvoice(id);
      
      // Update state to remove the deleted invoice
      setInvoices(prev => prev.filter(invoice => invoice.id !== id));
      
      // If the deleted invoice is the current one, clear it
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
      if (user?.id === 'guest-user-id') {
        return undefined;
      }
      
      // If not in state, fetch from API
      const fetchedInvoice = await invoiceService.getInvoiceById(id);
      return fetchedInvoice;
    } catch (error) {
      toast.error("Failed to get invoice");
      console.error(error);
      return undefined;
    }
  };

  // Function to get the user's bank details
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

  // Update the formatDate function used in InvoicePreview to be more robust
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
      getUserBankDetails
    }}>
      {children}
    </InvoiceContext.Provider>
  );
};

export default InvoiceProvider;
