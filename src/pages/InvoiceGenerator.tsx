import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useInvoices } from '@/contexts/InvoiceContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
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
  const { user } = useAuth();
  const { createInvoice, updateInvoice, getInvoice, generateInvoiceNumber, calculateInvoiceValues, setCurrentInvoice } = useInvoices();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    if (user) {
      setInvoiceNumber(generateInvoiceNumber());
    }
  }, [user, generateInvoiceNumber]);

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
      } else {
        toast.error('Invoice not found');
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      toast.error('Failed to fetch invoice');
    }
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

  const calculateItemAmount = (item: InvoiceItem): number => {
    return item.quantity * item.rate;
  };

  useEffect(() => {
    setItems(prevItems =>
      prevItems.map(item => ({ ...item, amount: calculateItemAmount(item) }))
    );
  }, [items.quantity, items.rate]);

  const handleDiscountChange = (value: number) => {
    setDiscount(value);
  };

  const handleSave = async (status: 'draft' | 'sent' | 'paid' = 'draft') => {
    try {
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
      navigate(`/invoice/${newInvoice.id}/preview`);
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast.error('Failed to save invoice');
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

          <div className="mt-4">
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

          <div className="mt-4">
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

          <div className="mt-4">
            <h3 className="text-xl font-semibold mb-2">Invoice Items</h3>
            {items.map((item) => (
              <div key={item.id} className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-2">
                <div>
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
                  <Label htmlFor={`itemGSTRate-${item.id}`}>GST Rate (%)</Label>
                  <Input
                    type="number"
                    id={`itemGSTRate-${item.id}`}
                    value={item.gstRate}
                    onChange={(e) => handleItemChange(item.id, 'gstRate', Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor={`itemDiscount-${item.id}`}>Discount (%)</Label>
                  <Input
                    type="number"
                    id={`itemDiscount-${item.id}`}
                    value={item.discountPercent}
                    onChange={(e) => handleItemChange(item.id, 'discountPercent', Number(e.target.value))}
                  />
                </div>
                <Button type="button" onClick={() => handleRemoveItem(item.id)} variant="destructive">
                  Remove
                </Button>
              </div>
            ))}
            <Button type="button" onClick={handleAddItem}>Add Item</Button>
          </div>

          <div className="mt-4">
            <Label htmlFor="discount">Discount (%)</Label>
            <Input
              type="number"
              id="discount"
              value={discount}
              onChange={(e) => handleDiscountChange(Number(e.target.value))}
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

          <div className="mt-4">
            <Button onClick={() => handleSave('draft')}>Save as Draft</Button>
            <Button onClick={() => handleSave('sent')}>Save & Send</Button>
            <Button onClick={() => handleSave('paid')}>Save as Paid</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceGenerator;
