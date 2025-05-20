
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useInvoices } from '@/contexts/InvoiceContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Upload, Calendar } from "lucide-react";
import { Invoice, InvoiceItem } from '@/contexts/InvoiceContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  const indianStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", 
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", 
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
  ];

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Invoice Generator</h1>
        <div className="flex gap-2">
          <Button onClick={() => handleSave('draft')} variant="outline">Save as Draft</Button>
          <Button onClick={() => handleSave('sent')} variant="outline">Save & Send</Button>
          <Button onClick={() => handleSave('paid')}>Save as Paid</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Company & Invoice Info Section */}
        <Card>
          <CardHeader>
            <CardTitle>Company & Invoice Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="company-logo">Company Logo</Label>
              <div className="mt-2 border-2 border-dashed rounded-md p-4 text-center">
                {logoPreview ? (
                  <div className="relative inline-block">
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
                      className="cursor-pointer text-gray-500 hover:text-gray-700"
                    >
                      Upload your company logo
                    </Label>
                    <Input 
                      type="file" 
                      id="logo-upload" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleLogoUpload}
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2" 
                      onClick={() => document.getElementById('logo-upload')?.click()}
                    >
                      Choose File
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="company-name">Company Name</Label>
              <Input 
                id="company-name" 
                placeholder="Your company name" 
                value={company.name} 
                onChange={(e) => handleCompanyChange('name', e.target.value)} 
              />
            </div>

            <div>
              <Label htmlFor="company-gstin">Company GSTIN</Label>
              <Input 
                id="company-gstin" 
                placeholder="e.g. 22AAAAA0000A1Z5" 
                value={company.gstin} 
                onChange={(e) => handleCompanyChange('gstin', e.target.value)} 
              />
            </div>

            <div>
              <Label htmlFor="company-state">Company State</Label>
              <Select 
                value={company.state} 
                onValueChange={(value) => handleCompanyChange('state', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {indianStates.map((state) => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="company-address">Company Address</Label>
              <Textarea 
                id="company-address" 
                placeholder="Full address" 
                value={company.address} 
                onChange={(e) => handleCompanyChange('address', e.target.value)} 
              />
            </div>

            <div>
              <Label htmlFor="company-signatory">Authorized Signatory</Label>
              <Input 
                id="company-signatory" 
                placeholder="Name of authorized person" 
                value={company.signatory} 
                onChange={(e) => handleCompanyChange('signatory', e.target.value)} 
              />
            </div>
          </CardContent>
        </Card>

        {/* Invoice Details Section */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input type="text" id="invoiceNumber" value={invoiceNumber} readOnly />
            </div>
            
            <div>
              <Label htmlFor="issueDate">Issue Date</Label>
              <div className="relative">
                <Input 
                  type="date" 
                  id="issueDate" 
                  value={issueDate} 
                  onChange={(e) => setIssueDate(e.target.value)} 
                />
                <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
            
            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <div className="relative">
                <Input 
                  type="date" 
                  id="dueDate" 
                  value={dueDate} 
                  onChange={(e) => setDueDate(e.target.value)} 
                />
                <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
            
            <div>
              <Label htmlFor="paymentTerms">Payment Terms</Label>
              <Input 
                type="text" 
                id="paymentTerms" 
                placeholder="Net 30 days" 
                value={paymentTerms} 
                onChange={(e) => setPaymentTerms(e.target.value)} 
              />
            </div>
            
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea 
                id="notes" 
                placeholder="Additional notes for the client" 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
              />
            </div>
            
            <div>
              <Label htmlFor="terms">Terms & Conditions</Label>
              <Textarea 
                id="terms" 
                placeholder="1. Payment due within 30 days of issue.&#10;2. Goods once sold will not be taken back." 
                value={terms} 
                onChange={(e) => setTerms(e.target.value)} 
                className="min-h-[150px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Client Details Section */}
        <Card>
          <CardHeader>
            <CardTitle>Client Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="clientName">Client Name</Label>
              <Input 
                type="text" 
                id="clientName" 
                placeholder="Client's full name" 
                value={client.name} 
                onChange={(e) => handleClientChange('name', e.target.value)} 
              />
            </div>
            
            <div>
              <Label htmlFor="clientEmail">Client Email</Label>
              <Input 
                type="email" 
                id="clientEmail" 
                placeholder="client@example.com" 
                value={client.email} 
                onChange={(e) => handleClientChange('email', e.target.value)} 
              />
            </div>
            
            <div>
              <Label htmlFor="clientPhone">Client Phone</Label>
              <Input 
                type="text" 
                id="clientPhone" 
                placeholder="(123) 456-7890" 
                value={client.phone} 
                onChange={(e) => handleClientChange('phone', e.target.value)} 
              />
            </div>
            
            <div>
              <Label htmlFor="clientGSTIN">Client GSTIN</Label>
              <Input 
                type="text" 
                id="clientGSTIN" 
                placeholder="e.g. 29AAAAA0000A1Z5" 
                value={client.gstin} 
                onChange={(e) => handleClientChange('gstin', e.target.value)} 
              />
            </div>
            
            <div>
              <Label htmlFor="clientState">Client State</Label>
              <Select 
                value={client.state} 
                onValueChange={(value) => handleClientChange('state', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {indianStates.map((state) => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="clientAddress">Client Address</Label>
              <Textarea 
                id="clientAddress" 
                placeholder="Full address" 
                value={client.address} 
                onChange={(e) => handleClientChange('address', e.target.value)} 
              />
            </div>
            
            <div>
              <Label htmlFor="discount">Discount (%)</Label>
              <Input
                type="number"
                id="discount"
                placeholder="0"
                value={discount}
                onChange={(e) => handleDiscountChange(Number(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bank Details Section */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Bank Details</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={toggleBankDetails}>
              {showBankDetails ? "Use Profile Bank Details" : "Add Custom Bank Details"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Invoice Items Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Invoice Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Description</th>
                  <th className="text-left p-2">HSN Code</th>
                  <th className="text-left p-2">Quantity</th>
                  <th className="text-left p-2">Rate (₹)</th>
                  <th className="text-left p-2">GST %</th>
                  <th className="text-left p-2">Amount (₹)</th>
                  <th className="text-left p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-2">
                      <Input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                        placeholder="Item description"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="text"
                        value={item.hsnCode}
                        onChange={(e) => handleItemChange(item.id, 'hsnCode', e.target.value)}
                        placeholder="HSN Code"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(item.id, 'quantity', Number(e.target.value))}
                        className="w-20"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        value={item.rate}
                        onChange={(e) => handleItemChange(item.id, 'rate', Number(e.target.value))}
                        className="w-24"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        value={item.gstRate}
                        onChange={(e) => handleItemChange(item.id, 'gstRate', Number(e.target.value))}
                        className="w-20"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        value={item.amount}
                        readOnly
                        className="w-24 bg-gray-50"
                      />
                    </td>
                    <td className="p-2">
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={items.length <= 1}
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button type="button" onClick={handleAddItem} className="mt-4">Add Item</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceGenerator;
