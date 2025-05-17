
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useInvoices } from '@/contexts/InvoiceContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { Invoice, InvoiceItem } from '@/contexts/InvoiceContext';

const InvoiceGenerator = () => {
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [client, setClient] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    gstin: '',
    state: ''
  });
  const [company, setCompany] = useState({
    name: '',
    address: '',
    gstin: '',
    state: '',
    signatory: ''
  });
  const [items, setItems] = useState<InvoiceItem[]>([{
    id: '1',
    description: '',
    quantity: 1,
    rate: 0,
    amount: 0,
    hsnCode: '',
    gstRate: 0,
    discountPercent: 0
  }]);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');
  const [logo, setLogo] = useState<string | undefined>(undefined);
  const [logoPreview, setLogoPreview] = useState<string | undefined>(undefined);
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [bankDetails, setBankDetails] = useState({
    accountName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: ''
  });
  const { user } = useAuth();
  const { createInvoice, updateInvoice, getInvoice, generateInvoiceNumber, calculateInvoiceValues, setCurrentInvoice } = useInvoices();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Set default dates when component loads
  useEffect(() => {
    // Set today as the default issue date
    const today = new Date();
    const formattedToday = today.toISOString().split('T')[0];
    setIssueDate(formattedToday);
    
    // Set due date as 30 days from today
    const dueDate = new Date();
    dueDate.setDate(today.getDate() + 30);
    const formattedDueDate = dueDate.toISOString().split('T')[0];
    setDueDate(formattedDueDate);
    
    // Set default payment terms
    setPaymentTerms('Net 30 days');
  }, []);

  // Set invoice number and fill bank details from user profile
  useEffect(() => {
    if (user) {
      setInvoiceNumber(generateInvoiceNumber());
      
      if (user.bankDetails) {
        setBankDetails({
          accountName: user.bankDetails.accountName || '',
          accountNumber: user.bankDetails.accountNumber || '',
          ifscCode: user.bankDetails.ifscCode || '',
          bankName: user.bankDetails.bankName || ''
        });
      }
    }
  }, [user, generateInvoiceNumber]);

  // Fetch invoice if editing
  useEffect(() => {
    if (id) {
      fetchInvoice(id);
    }
  }, [id]);

  const fetchInvoice = async (id: string) => {
    try {
      const invoice = await getInvoice(id);
      if (invoice) {
        setInvoiceNumber(invoice.invoiceNumber);
        setIssueDate(invoice.issueDate);
        setDueDate(invoice.dueDate);
        setPaymentTerms(invoice.paymentTerms);
        setClient(invoice.client);
        setCompany(invoice.company);
        setItems(invoice.items);
        setDiscount(invoice.discount);
        setNotes(invoice.notes);
        setTerms(invoice.terms);
        setLogo(invoice.logo);
        setLogoPreview(invoice.logo);
      } else {
        toast.error("Error: Invoice not found");
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      toast.error("Error: Failed to fetch invoice");
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Logo image must be smaller than 2MB");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLogo(base64String);
        setLogoPreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const removeLogo = () => {
    setLogo(undefined);
    setLogoPreview(undefined);
  };

  const toggleBankDetails = () => {
    setShowBankDetails(!showBankDetails);
  };

  const handleAddItem = () => {
    setItems(prevItems => [...prevItems, {
      id: String(Date.now()),
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0,
      hsnCode: '',
      gstRate: 0,
      discountPercent: 0
    }]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const handleItemChange = (id: string, field: string, value: any) => {
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleClientChange = (field: string, value: string) => {
    setClient(prevClient => ({ ...prevClient, [field]: value }));
  };

  const handleCompanyChange = (field: string, value: string) => {
    setCompany(prevCompany => ({ ...prevCompany, [field]: value }));
  };

  const handleBankDetailsChange = (field: string, value: string) => {
    setBankDetails(prev => ({ ...prev, [field]: value }));
  };

  const calculateItemAmount = useCallback((item: InvoiceItem): number => {
    return item.quantity * item.rate;
  }, []);

  useEffect(() => {
    const updatedItems = items.map(item => ({
      ...item,
      amount: calculateItemAmount(item)
    }));
    
    // Only update if the calculated amount is different
    const hasChanged = updatedItems.some((item, index) => item.amount !== items[index].amount);
    if (hasChanged) {
      setItems(updatedItems);
    }
  }, [items, calculateItemAmount]);

  const handleDiscountChange = (value: number) => {
    setDiscount(value);
  };

  const handleSave = async (status: 'draft' | 'sent' | 'paid' = 'draft') => {
    try {
      // Validate dates to ensure they are valid
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(issueDate) || !dateRegex.test(dueDate)) {
        toast.error("Error: Please enter valid dates in YYYY-MM-DD format");
        return;
      }

      // Make sure all required fields are filled
      if (!client.name || !client.email || !client.address || !client.state) {
        toast.error("Error: Please fill in all required client information");
        return;
      }

      if (!company.name || !company.address || !company.gstin || !company.state || !company.signatory) {
        toast.error("Error: Please fill in all required company information");
        return;
      }

      // Check if there are any items
      if (items.length === 0) {
        toast.error("Error: Please add at least one item to the invoice");
        return;
      }

      // Validate each item
      for (const item of items) {
        if (!item.description || item.quantity <= 0) {
          toast.error("Error: All items must have a description and quantity greater than zero");
          return;
        }
      }

      // Calculate values based on invoice items
      const {
        subtotal,
        totalCGST,
        totalSGST,
        totalIGST,
        totalGST,
        total,
        roundedTotal,
        amountInWords
      } = calculateInvoiceValues(items, discount, company.state === client.state);

      const invoiceData = {
        invoiceNumber,
        issueDate,
        dueDate,
        paymentTerms,
        client,
        company,
        items,
        subtotal,
        totalCGST,
        totalSGST,
        totalIGST,
        totalGST,
        discount,
        total,
        roundedTotal,
        amountInWords,
        notes,
        terms,
        logo,
        status
      };

      const newInvoice = await createInvoice(invoiceData);
      
      // Now set the current invoice with the returned invoice data
      setCurrentInvoice(newInvoice);
      
      // Navigate to preview
      navigate(`/invoice/preview/${newInvoice.id}`);
      toast.success("Invoice saved successfully");
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast.error("Error: Failed to save invoice");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Invoice Generator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input type="text" id="invoiceNumber" value={invoiceNumber} readOnly />
            </div>
            <div>
              <Label htmlFor="issueDate">Issue Date</Label>
              <Input type="date" id="issueDate" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input type="date" id="dueDate" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="paymentTerms">Payment Terms</Label>
              <Input type="text" id="paymentTerms" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} />
            </div>
          </div>

          {/* Logo Upload Section */}
          <div className="mt-6 border-t pt-4">
            <h3 className="text-xl font-semibold mb-3">Company Logo</h3>
            <div className="flex items-center gap-4">
              {logoPreview ? (
                <div className="relative">
                  <img src={logoPreview} alt="Company logo" className="h-20 object-contain" />
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="absolute top-0 right-0 h-6 w-6 p-0" 
                    onClick={removeLogo}
                  >
                    ×
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Label 
                    htmlFor="logo-upload" 
                    className="flex flex-col items-center justify-center w-32 h-20 border-2 border-dashed rounded-md border-gray-300 cursor-pointer hover:bg-gray-50"
                  >
                    <Upload size={24} className="text-gray-500" />
                    <span className="mt-2 text-sm text-gray-500">Upload Logo</span>
                  </Label>
                  <Input 
                    type="file" 
                    id="logo-upload" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleLogoUpload}
                  />
                </div>
              )}
              <div className="text-sm text-gray-500">
                <p>Maximum size: 2MB</p>
                <p>Recommended format: PNG or JPG</p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-2">Client Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clientName">Name</Label>
                <Input type="text" id="clientName" value={client.name} onChange={(e) => handleClientChange('name', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="clientEmail">Email</Label>
                <Input type="email" id="clientEmail" value={client.email} onChange={(e) => handleClientChange('email', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="clientPhone">Phone</Label>
                <Input type="text" id="clientPhone" value={client.phone} onChange={(e) => handleClientChange('phone', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="clientAddress">Address</Label>
                <Input type="text" id="clientAddress" value={client.address} onChange={(e) => handleClientChange('address', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="clientGSTIN">GSTIN</Label>
                <Input type="text" id="clientGSTIN" value={client.gstin} onChange={(e) => handleClientChange('gstin', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="clientState">State</Label>
                <Input type="text" id="clientState" value={client.state} onChange={(e) => handleClientChange('state', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-2">Company Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyName">Name</Label>
                <Input type="text" id="companyName" value={company.name} onChange={(e) => handleCompanyChange('name', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="companyAddress">Address</Label>
                <Input type="text" id="companyAddress" value={company.address} onChange={(e) => handleCompanyChange('address', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="companyGSTIN">GSTIN</Label>
                <Input type="text" id="companyGSTIN" value={company.gstin} onChange={(e) => handleCompanyChange('gstin', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="companyState">State</Label>
                <Input type="text" id="companyState" value={company.state} onChange={(e) => handleCompanyChange('state', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="companySignatory">Signatory</Label>
                <Input type="text" id="companySignatory" value={company.signatory} onChange={(e) => handleCompanyChange('signatory', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Bank Details Section */}
          <div className="mt-6 border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-semibold">Bank Details</h3>
              <Button type="button" variant="outline" size="sm" onClick={toggleBankDetails}>
                {showBankDetails ? "Use Profile Bank Details" : "Add Custom Bank Details"}
              </Button>
            </div>
            
            {showBankDetails ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="accountName">Account Name</Label>
                  <Input 
                    type="text" 
                    id="accountName" 
                    value={bankDetails.accountName} 
                    onChange={(e) => handleBankDetailsChange('accountName', e.target.value)} 
                  />
                </div>
                <div>
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input 
                    type="text" 
                    id="accountNumber" 
                    value={bankDetails.accountNumber} 
                    onChange={(e) => handleBankDetailsChange('accountNumber', e.target.value)} 
                  />
                </div>
                <div>
                  <Label htmlFor="ifscCode">IFSC Code</Label>
                  <Input 
                    type="text" 
                    id="ifscCode" 
                    value={bankDetails.ifscCode} 
                    onChange={(e) => handleBankDetailsChange('ifscCode', e.target.value)} 
                  />
                </div>
                <div>
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input 
                    type="text" 
                    id="bankName" 
                    value={bankDetails.bankName} 
                    onChange={(e) => handleBankDetailsChange('bankName', e.target.value)} 
                  />
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-sm">Using bank details from your profile. You can update them in your profile or add custom details for this invoice.</p>
                {user?.bankDetails ? (
                  <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                    <div><span className="font-medium">Account Name:</span> {user.bankDetails.accountName}</div>
                    <div><span className="font-medium">Account Number:</span> {user.bankDetails.accountNumber}</div>
                    <div><span className="font-medium">IFSC Code:</span> {user.bankDetails.ifscCode}</div>
                    <div><span className="font-medium">Bank Name:</span> {user.bankDetails.bankName}</div>
                  </div>
                ) : (
                  <p className="text-amber-500 text-sm mt-1">No bank details found in your profile. Please add them in your profile or add custom details for this invoice.</p>
                )}
              </div>
            )}
          </div>

          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-2">Invoice Items</h3>
            {items.map((item) => (
              <div key={item.id} className="grid grid-cols-1 md:grid-cols-7 gap-2 mb-4 items-end">
                <div className="md:col-span-2">
                  <Label htmlFor={`itemDescription-${item.id}`}>Description</Label>
                  <Input
                    type="text"
                    id={`itemDescription-${item.id}`}
                    value={item.description}
                    onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`itemQuantity-${item.id}`}>Quantity</Label>
                  <Input
                    type="number"
                    id={`itemQuantity-${item.id}`}
                    value={item.quantity}
                    onChange={(e) => handleItemChange(item.id, 'quantity', Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor={`itemRate-${item.id}`}>Rate</Label>
                  <Input
                    type="number"
                    id={`itemRate-${item.id}`}
                    value={item.rate}
                    onChange={(e) => handleItemChange(item.id, 'rate', Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor={`itemHSNCode-${item.id}`}>HSN Code</Label>
                  <Input
                    type="text"
                    id={`itemHSNCode-${item.id}`}
                    value={item.hsnCode}
                    onChange={(e) => handleItemChange(item.id, 'hsnCode', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`itemGSTRate-${item.id}`}>GST %</Label>
                  <Input
                    type="number"
                    id={`itemGSTRate-${item.id}`}
                    value={item.gstRate}
                    onChange={(e) => handleItemChange(item.id, 'gstRate', Number(e.target.value))}
                  />
                </div>
                <div className="flex items-center mt-4 md:mt-0">
                  <Button 
                    type="button" 
                    onClick={() => handleRemoveItem(item.id)} 
                    variant="destructive" 
                    size="sm"
                    className="w-full"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" onClick={handleAddItem} className="mt-2 mb-4">Add Item</Button>
          </div>

          <div className="mt-4">
            <Label htmlFor="discount">Discount (%)</Label>
            <Input
              type="number"
              id="discount"
              value={discount}
              onChange={(e) => handleDiscountChange(Number(e.target.value))}
              className="max-w-xs"
            />
          </div>

          <div className="mt-4">
            <Label htmlFor="notes">Notes</Label>
            <Input
              type="text"
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="mt-4">
            <Label htmlFor="terms">Terms</Label>
            <Input
              type="text"
              id="terms"
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
            />
          </div>

          <div className="mt-8 flex justify-end gap-4">
            <Button onClick={() => handleSave('draft')} variant="outline">Save as Draft</Button>
            <Button onClick={() => handleSave('sent')} variant="outline">Save & Send</Button>
            <Button onClick={() => handleSave('paid')}>Save as Paid</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceGenerator;
