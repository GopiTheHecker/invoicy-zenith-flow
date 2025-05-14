
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useInvoices, InvoiceItem as InvoiceItemType } from "@/contexts/InvoiceContext";
import InvoiceItem from "@/components/invoice/InvoiceItem";
import { v4 as uuidv4 } from 'uuid';
import { ArrowLeft, Eye, Plus, Save } from "lucide-react";

const InvoiceGenerator = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { createInvoice, getInvoice, updateInvoice, generateInvoiceNumber, calculateInvoiceValues } = useInvoices();
  
  const [logo, setLogo] = useState<string | undefined>(undefined);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [items, setItems] = useState<InvoiceItemType[]>([]);
  const [tax, setTax] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [subtotal, setSubtotal] = useState(0);
  const [total, setTotal] = useState(0);
  
  // Initialize with current date or existing invoice data
  useEffect(() => {
    // Default values for new invoice
    if (!id) {
      const today = new Date();
      const dueDate = new Date();
      dueDate.setDate(today.getDate() + 30);
      
      setInvoiceNumber(generateInvoiceNumber());
      setIssueDate(today.toISOString().split('T')[0]);
      setDueDate(dueDate.toISOString().split('T')[0]);
      setItems([createEmptyItem()]);
      setTerms("Payment due within 30 days of issue.");
      return;
    }

    // Load existing invoice data
    const existingInvoice = getInvoice(id);
    if (existingInvoice) {
      setLogo(existingInvoice.logo);
      setInvoiceNumber(existingInvoice.invoiceNumber);
      setIssueDate(existingInvoice.issueDate);
      setDueDate(existingInvoice.dueDate);
      setClientName(existingInvoice.client.name);
      setClientEmail(existingInvoice.client.email);
      setClientPhone(existingInvoice.client.phone);
      setClientAddress(existingInvoice.client.address);
      setItems(existingInvoice.items);
      setTax(existingInvoice.tax);
      setDiscount(existingInvoice.discount);
      setNotes(existingInvoice.notes);
      setTerms(existingInvoice.terms);
      setSubtotal(existingInvoice.subtotal);
      setTotal(existingInvoice.total);
    } else {
      navigate("/invoice/new", { replace: true });
    }
  }, [id, getInvoice, navigate, generateInvoiceNumber]);

  // Recalculate totals whenever items, tax, or discount change
  useEffect(() => {
    const { subtotal, total } = calculateInvoiceValues(items, tax, discount);
    setSubtotal(subtotal);
    setTotal(total);
  }, [items, tax, discount, calculateInvoiceValues]);

  const createEmptyItem = (): InvoiceItemType => ({
    id: uuidv4(),
    description: "",
    quantity: 1,
    rate: 0,
    amount: 0
  });

  const handleAddItem = () => {
    setItems([...items, createEmptyItem()]);
  };

  const handleUpdateItem = (id: string, updates: Partial<InvoiceItemType>) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (preview: boolean = false) => {
    const invoiceData = {
      invoiceNumber,
      issueDate,
      dueDate,
      client: {
        name: clientName,
        email: clientEmail,
        phone: clientPhone,
        address: clientAddress
      },
      items,
      subtotal,
      tax,
      discount,
      total,
      notes,
      terms,
      logo,
      status: 'draft' as const
    };

    let savedInvoice;

    if (id) {
      updateInvoice(id, invoiceData);
      savedInvoice = { id, ...invoiceData };
    } else {
      savedInvoice = createInvoice(invoiceData);
    }

    if (preview) {
      navigate(`/invoice/preview/${savedInvoice.id}`);
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">
            {id ? "Edit Invoice" : "Create New Invoice"}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => handleSubmit(true)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button 
            onClick={() => handleSubmit(false)}
            className="bg-primary hover:bg-primary-300"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Invoice
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Logo & Invoice Info */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Company Logo & Invoice Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Logo Upload */}
            <div className="space-y-2">
              <Label htmlFor="logo">Company Logo</Label>
              <div className="flex flex-col items-center">
                {logo ? (
                  <div className="mb-2">
                    <img 
                      src={logo} 
                      alt="Company logo" 
                      className="max-h-24 max-w-full object-contain"
                    />
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="mt-2" 
                      onClick={() => setLogo(undefined)}
                    >
                      Remove Logo
                    </Button>
                  </div>
                ) : (
                  <div className="p-6 border-2 border-dashed border-gray-300 rounded-md mb-2 w-full text-center">
                    <p className="text-gray-500">Upload your company logo</p>
                  </div>
                )}
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="max-w-sm"
                />
              </div>
            </div>

            {/* Invoice Number */}
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input
                id="invoiceNumber"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="e.g. INV-2025-001"
              />
            </div>

            {/* Issue Date */}
            <div className="space-y-2">
              <Label htmlFor="issueDate">Issue Date</Label>
              <Input
                id="issueDate"
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Client Details */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Client Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name</Label>
              <Input
                id="clientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Client's full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientEmail">Client Email</Label>
              <Input
                id="clientEmail"
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="client@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientPhone">Client Phone</Label>
              <Input
                id="clientPhone"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="(123) 456-7890"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientAddress">Client Address</Label>
              <Textarea
                id="clientAddress"
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                placeholder="Full address"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Tax & Discount */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Tax & Discount</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tax">Tax (%)</Label>
              <Input
                id="tax"
                type="number"
                value={tax}
                onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discount">Discount (%)</Label>
              <Input
                id="discount"
                type="number"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
              />
            </div>
            
            <div className="mt-8 pt-4 border-t">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes for the client"
                className="mt-2"
                rows={3}
              />
            </div>
            
            <div className="mt-4">
              <Label>Terms & Conditions</Label>
              <Textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="Payment terms and conditions"
                className="mt-2"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="hidden md:grid grid-cols-11 px-4 py-3 font-medium bg-gray-50 border-b">
              <div className="col-span-4">Description</div>
              <div className="col-span-2">Quantity</div>
              <div className="col-span-2">Rate</div>
              <div className="col-span-2">Amount</div>
              <div className="col-span-1"></div>
            </div>

            <div className="p-4 space-y-2">
              {items.map((item) => (
                <InvoiceItem
                  key={item.id}
                  item={item}
                  onChange={handleUpdateItem}
                  onRemove={handleRemoveItem}
                  canRemove={items.length > 1}
                />
              ))}
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          </div>

          {/* Totals */}
          <div className="mt-6 border-t pt-4">
            <div className="flex justify-end">
              <div className="w-full md:w-64 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax ({tax}%):</span>
                  <span>${((subtotal * tax) / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount ({discount}%):</span>
                  <span>${((subtotal * discount) / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold pt-2 border-t">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button 
          variant="outline" 
          onClick={() => navigate(-1)}
        >
          Cancel
        </Button>
        <Button 
          variant="outline" 
          onClick={() => handleSubmit(true)}
        >
          <Eye className="h-4 w-4 mr-2" />
          Preview Invoice
        </Button>
        <Button 
          onClick={() => handleSubmit(false)}
          className="bg-primary hover:bg-primary-300"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Invoice
        </Button>
      </div>
    </div>
  );
};

export default InvoiceGenerator;
