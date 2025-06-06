
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
import { Calendar, ArrowLeft } from "lucide-react";
import { Invoice, InvoiceItem } from '@/contexts/InvoiceContext';
import InvoiceItemRow from '@/components/invoice/InvoiceItem';
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
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');
  const [logo, setLogo] = useState<string | undefined>(undefined);
  const [logoPreview, setLogoPreview] = useState<string | undefined>(undefined);

  const { user } = useAuth();
  const { createInvoice, updateInvoice, getInvoice, generateInvoiceNumber, calculateInvoiceValues, setCurrentInvoice } = useInvoices();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Set default dates when component loads
  useEffect(() => {
    const today = new Date();
    const formattedToday = today.toISOString().split('T')[0];
    setIssueDate(formattedToday);
    
    const dueDate = new Date();
    dueDate.setDate(today.getDate() + 30);
    const formattedDueDate = dueDate.toISOString().split('T')[0];
    setDueDate(formattedDueDate);
    
    setPaymentTerms('Net 30 days');
  }, []);

  // Set invoice number when user loads
  useEffect(() => {
    if (user && !id) {
      setInvoiceNumber(generateInvoiceNumber());
    }
  }, [user, generateInvoiceNumber, id]);

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
        setNotes(invoice.notes);
        setTerms(invoice.terms);
        setLogo(invoice.logo);
        setLogoPreview(invoice.logo);
      } else {
        toast.error("Error: Invoice not found");
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      toast.error("Error: Failed to fetch invoice");
      navigate('/dashboard');
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

  const handleItemChange = (id: string, updates: Partial<InvoiceItem>) => {
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, ...updates } : item
      )
    );
  };

  const handleClientChange = (field: string, value: string) => {
    setClient(prevClient => ({ ...prevClient, [field]: value }));
  };

  const handleCompanyChange = (field: string, value: string) => {
    setCompany(prevCompany => ({ ...prevCompany, [field]: value }));
  };

  const handleSave = async (status: 'draft' | 'sent' | 'paid' = 'draft') => {
    try {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(issueDate) || !dateRegex.test(dueDate)) {
        toast.error("Error: Please enter valid dates in YYYY-MM-DD format");
        return;
      }

      if (!client.name || !client.email || !client.address || !client.state) {
        toast.error("Error: Please fill in all required client information");
        return;
      }

      if (!company.name || !company.address || !company.gstin || !company.state || !company.signatory) {
        toast.error("Error: Please fill in all required company information");
        return;
      }

      if (items.length === 0) {
        toast.error("Error: Please add at least one item to the invoice");
        return;
      }

      for (const item of items) {
        if (!item.description || item.quantity <= 0) {
          toast.error("Error: All items must have a description and quantity greater than zero");
          return;
        }
      }

      const {
        subtotal,
        totalCGST,
        totalSGST,
        totalIGST,
        totalGST,
        total,
        roundedTotal,
        amountInWords
      } = calculateInvoiceValues(items, 0, company.state === client.state);

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
        discount: 0,
        total,
        roundedTotal,
        amountInWords,
        notes,
        terms,
        logo,
        status
      };

      let newInvoice;
      if (id) {
        await updateInvoice(id, invoiceData);
        newInvoice = { ...invoiceData, id, createdAt: new Date().toISOString() };
      } else {
        newInvoice = await createInvoice(invoiceData);
      }
      
      setCurrentInvoice(newInvoice);
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
    <div className="container mx-auto p-2 md:p-4 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 md:mb-6 gap-4">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/dashboard')}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-xl md:text-2xl font-bold">
            {id ? 'Edit Invoice' : 'Create Invoice'}
          </h1>
        </div>
        <div className="flex flex-col md:flex-row gap-2">
          <Button onClick={() => handleSave('draft')} variant="outline" className="w-full md:w-auto">
            Save as Draft
          </Button>
          <Button onClick={() => handleSave('sent')} variant="outline" className="w-full md:w-auto">
            Save & Send
          </Button>
          <Button onClick={() => handleSave('paid')} className="w-full md:w-auto">
            Save as Paid
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Company Info */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Company Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Logo Upload */}
            <div>
              <Label htmlFor="company-logo">Company Logo</Label>
              <div className="mt-2 border-2 border-dashed rounded-md p-4 text-center">
                {logoPreview ? (
                  <div className="relative inline-block">
                    <img src={logoPreview} alt="Company logo" className="h-20 object-contain" />
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="absolute -top-2 -right-2 h-6 w-6 p-0" 
                      onClick={removeLogo}
                    >
                      ×
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Label 
                      htmlFor="logo-upload" 
                      className="cursor-pointer text-gray-500 hover:text-gray-700 text-sm"
                    >
                      Upload logo
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
              <Label htmlFor="company-name">Company Name *</Label>
              <Input 
                id="company-name" 
                placeholder="Your company name" 
                value={company.name} 
                onChange={(e) => handleCompanyChange('name', e.target.value)} 
              />
            </div>

            <div>
              <Label htmlFor="company-gstin">Company GSTIN *</Label>
              <Input 
                id="company-gstin" 
                placeholder="e.g. 22AAAAA0000A1Z5" 
                value={company.gstin} 
                onChange={(e) => handleCompanyChange('gstin', e.target.value)} 
              />
            </div>

            <div>
              <Label htmlFor="company-state">Company State *</Label>
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
              <Label htmlFor="company-address">Company Address *</Label>
              <Textarea 
                id="company-address" 
                placeholder="Full address" 
                value={company.address} 
                onChange={(e) => handleCompanyChange('address', e.target.value)} 
                className="min-h-20"
              />
            </div>

            <div>
              <Label htmlFor="company-signatory">Authorized Signatory *</Label>
              <Input 
                id="company-signatory" 
                placeholder="Name of authorized person" 
                value={company.signatory} 
                onChange={(e) => handleCompanyChange('signatory', e.target.value)} 
              />
            </div>
          </CardContent>
        </Card>

        {/* Invoice Details */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input type="text" id="invoiceNumber" value={invoiceNumber} readOnly className="bg-gray-50" />
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
                className="min-h-20"
              />
            </div>
            
            <div>
              <Label htmlFor="terms">Terms & Conditions</Label>
              <Textarea 
                id="terms" 
                placeholder="1. Payment due within 30 days of issue.&#10;2. Goods once sold will not be taken back." 
                value={terms} 
                onChange={(e) => setTerms(e.target.value)} 
                className="min-h-32"
              />
            </div>
          </CardContent>
        </Card>

        {/* Client Details */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Client Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="clientName">Client Name *</Label>
              <Input 
                type="text" 
                id="clientName" 
                placeholder="Client's full name" 
                value={client.name} 
                onChange={(e) => handleClientChange('name', e.target.value)} 
              />
            </div>
            
            <div>
              <Label htmlFor="clientEmail">Client Email *</Label>
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
              <Label htmlFor="clientState">Client State *</Label>
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
              <Label htmlFor="clientAddress">Client Address *</Label>
              <Textarea 
                id="clientAddress" 
                placeholder="Full address" 
                value={client.address} 
                onChange={(e) => handleClientChange('address', e.target.value)} 
                className="min-h-20"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Items */}
      <Card className="mt-4 md:mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Invoice Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="hidden md:block">
              <div className="grid grid-cols-10 gap-3 text-sm font-medium text-gray-600 pb-2 border-b">
                <div className="col-span-1">HSN/SAC</div>
                <div className="col-span-3">Description</div>
                <div className="col-span-1">Qty</div>
                <div className="col-span-1">Rate (₹)</div>
                <div className="col-span-1">Disc %</div>
                <div className="col-span-1">GST %</div>
                <div className="col-span-1">Amount (₹)</div>
                <div className="col-span-1">Action</div>
              </div>
            </div>
            
            <div className="space-y-4">
              {items.map((item) => (
                <InvoiceItemRow
                  key={item.id}
                  item={item}
                  onChange={handleItemChange}
                  onRemove={handleRemoveItem}
                  canRemove={items.length > 1}
                />
              ))}
            </div>
            
            <Button type="button" onClick={handleAddItem} variant="outline" className="w-full md:w-auto">
              Add Item
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceGenerator;
