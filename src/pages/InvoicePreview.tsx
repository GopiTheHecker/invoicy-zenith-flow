
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useInvoices, Invoice } from "@/contexts/InvoiceContext";
import { ArrowLeft, Download, Mail, Pencil } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const InvoicePreview = () => {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const { id } = useParams<{ id: string }>();
  const { getInvoice, currentInvoice, updateInvoice, getUserBankDetails } = useInvoices();
  const navigate = useNavigate();
  const bankDetails = getUserBankDetails();

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        if (id) {
          // If we have a currentInvoice and its id matches the URL param, use that
          if (currentInvoice && currentInvoice.id === id) {
            setInvoice(currentInvoice);
          } else {
            // Otherwise fetch from API
            const invoiceData = await getInvoice(id);
            if (invoiceData) {
              setInvoice(invoiceData);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching invoice:", error);
        toast.error("Failed to load invoice");
      }
    };

    fetchInvoice();
  }, [id, currentInvoice, getInvoice]);

  const handleDownloadPDF = async () => {
    const element = document.getElementById('invoice-pdf');
    if (!element) return;

    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Calculate dimensions to fit the content properly
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(`invoice-${invoice?.invoiceNumber}.pdf`);
    
    toast.success("Invoice downloaded as PDF");
  };

  const handleSendEmail = () => {
    toast.success("Send email feature will be implemented in future updates");
  };

  if (!invoice) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading invoice...</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
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
          <h1 className="text-2xl font-bold">GST Invoice Preview</h1>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => navigate(`/invoice/edit/${id}`)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit Invoice
          </Button>
          <Button 
            variant="outline" 
            onClick={handleSendEmail}
          >
            <Mail className="h-4 w-4 mr-2" />
            Send Email
          </Button>
          <Button 
            onClick={handleDownloadPDF}
            className="bg-primary hover:bg-primary-300"
          >
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      <div className="no-print bg-gray-100 p-4 rounded-lg">
        <p className="text-gray-600 text-center">This is a preview of your GST invoice. Use the buttons above to download as PDF or send via email.</p>
      </div>

      <div className="flex justify-center">
        <div id="invoice-pdf" className="invoice-page p-8 bg-white border shadow-sm max-w-4xl w-full">
          {/* Invoice Header */}
          <div className="flex justify-between items-start mb-8">
            {/* Company Logo */}
            <div>
              {invoice.logo ? (
                <img 
                  src={invoice.logo} 
                  alt="Company logo" 
                  className="max-h-24 object-contain"
                />
              ) : (
                <div className="text-2xl font-bold">{invoice.company.name}</div>
              )}
            </div>
            
            {/* Invoice Title */}
            <div className="text-right">
              <h1 className="text-3xl font-bold text-gray-800">TAX INVOICE</h1>
              <p className="text-gray-500 mt-1">#{invoice.invoiceNumber}</p>
            </div>
          </div>

          {/* Company and Client Info */}
          <div className="grid grid-cols-2 gap-6 mb-8 border-t border-b py-4">
            <div>
              <h2 className="text-gray-700 font-semibold mb-2">Seller Details:</h2>
              <div className="text-gray-800">
                <p className="font-medium">{invoice.company.name}</p>
                <p className="whitespace-pre-line">{invoice.company.address}</p>
                {invoice.company.gstin && <p>GSTIN: {invoice.company.gstin}</p>}
                <p>State: {invoice.company.state}</p>
              </div>
            </div>
            
            <div>
              <h2 className="text-gray-700 font-semibold mb-2">Bill To:</h2>
              <div className="text-gray-800">
                <p className="font-medium">{invoice.client.name}</p>
                <p className="whitespace-pre-line">{invoice.client.address}</p>
                {invoice.client.email && <p>{invoice.client.email}</p>}
                {invoice.client.phone && <p>{invoice.client.phone}</p>}
                {invoice.client.gstin && <p>GSTIN: {invoice.client.gstin}</p>}
                <p>State: {invoice.client.state}</p>
              </div>
            </div>
          </div>
          
          {/* Invoice Info */}
          <div className="mb-6 border-b pb-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-gray-600 text-sm">Invoice Date:</p>
                <p className="font-medium">{formatDate(invoice.issueDate)}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Due Date:</p>
                <p className="font-medium">{formatDate(invoice.dueDate)}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Payment Terms:</p>
                <p className="font-medium">{invoice.paymentTerms}</p>
              </div>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="mb-8">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-2 text-left text-xs border">Sr.</th>
                  <th className="py-3 px-2 text-left text-xs border">HSN/SAC</th>
                  <th className="py-3 px-2 text-left text-xs border">Description</th>
                  <th className="py-3 px-2 text-right text-xs border">Qty</th>
                  <th className="py-3 px-2 text-right text-xs border">Rate (₹)</th>
                  <th className="py-3 px-2 text-right text-xs border">Disc %</th>
                  <th className="py-3 px-2 text-right text-xs border">Taxable Value</th>
                  <th className="py-3 px-2 text-right text-xs border">GST %</th>
                  <th className="py-3 px-2 text-right text-xs border">GST Amt</th>
                  <th className="py-3 px-2 text-right text-xs border">Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => {
                  const itemDiscount = (item.amount * (item.discountPercent || 0)) / 100;
                  const taxableValue = item.amount - itemDiscount;
                  const gstAmount = (taxableValue * item.gstRate) / 100;
                  const itemTotal = taxableValue + gstAmount;
                  
                  return (
                    <tr key={item.id} className="border-b">
                      <td className="py-2 px-2 border text-sm">{index + 1}</td>
                      <td className="py-2 px-2 border text-sm">{item.hsnCode || '-'}</td>
                      <td className="py-2 px-2 border text-sm">{item.description}</td>
                      <td className="py-2 px-2 text-right border text-sm">{item.quantity}</td>
                      <td className="py-2 px-2 text-right border text-sm">₹{item.rate.toFixed(2)}</td>
                      <td className="py-2 px-2 text-right border text-sm">
                        {item.discountPercent ? `${item.discountPercent}%` : '-'}
                      </td>
                      <td className="py-2 px-2 text-right border text-sm">₹{taxableValue.toFixed(2)}</td>
                      <td className="py-2 px-2 text-right border text-sm">{item.gstRate}%</td>
                      <td className="py-2 px-2 text-right border text-sm">₹{gstAmount.toFixed(2)}</td>
                      <td className="py-2 px-2 text-right border text-sm">₹{itemTotal.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Invoice Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-72">
              <div className="border-t-2 pt-2">
                <div className="flex justify-between py-1">
                  <span className="font-medium">Subtotal:</span>
                  <span>₹{invoice.subtotal.toFixed(2)}</span>
                </div>
                
                {invoice.discount > 0 && (
                  <div className="flex justify-between py-1">
                    <span className="font-medium">Discount ({invoice.discount}%):</span>
                    <span>-₹{((invoice.subtotal * invoice.discount) / 100).toFixed(2)}</span>
                  </div>
                )}
                
                {invoice.totalCGST > 0 && (
                  <div className="flex justify-between py-1">
                    <span className="font-medium">CGST:</span>
                    <span>₹{invoice.totalCGST.toFixed(2)}</span>
                  </div>
                )}
                
                {invoice.totalSGST > 0 && (
                  <div className="flex justify-between py-1">
                    <span className="font-medium">SGST:</span>
                    <span>₹{invoice.totalSGST.toFixed(2)}</span>
                  </div>
                )}
                
                {invoice.totalIGST > 0 && (
                  <div className="flex justify-between py-1">
                    <span className="font-medium">IGST:</span>
                    <span>₹{invoice.totalIGST.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between py-1">
                  <span className="font-medium">Total GST:</span>
                  <span>₹{invoice.totalGST.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between py-3 mt-2 text-lg">
                  <span>Total:</span>
                  <span>₹{invoice.total.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between py-3 border-t border-b mt-2 text-lg font-bold">
                  <span>Amount Due:</span>
                  <span>₹{invoice.roundedTotal.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="mt-2 text-sm text-gray-600">
                <p className="italic">{invoice.amountInWords}</p>
              </div>
            </div>
          </div>

          {/* Bank Details & GST Summary */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="border p-4 rounded">
              <h3 className="text-gray-700 font-semibold mb-2">Bank Details</h3>
              <p className="text-sm">Account Name: {bankDetails?.accountName || invoice.company.name}</p>
              <p className="text-sm">Account Number: {bankDetails?.accountNumber || 'XXXXXXXXXXXX'}</p>
              <p className="text-sm">IFSC Code: {bankDetails?.ifscCode || 'XXXXXXXXXXXX'}</p>
              <p className="text-sm">Bank Name: {bankDetails?.bankName || 'XXXX Bank'}</p>
            </div>
            
            <div className="border p-4 rounded">
              <h3 className="text-gray-700 font-semibold mb-2">GST Summary</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1">Tax Type</th>
                    <th className="text-right py-1">Rate</th>
                    <th className="text-right py-1">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.totalCGST > 0 && (
                    <tr>
                      <td className="py-1">CGST</td>
                      <td className="text-right py-1">{(invoice.items[0]?.gstRate / 2) || 0}%</td>
                      <td className="text-right py-1">₹{invoice.totalCGST.toFixed(2)}</td>
                    </tr>
                  )}
                  {invoice.totalSGST > 0 && (
                    <tr>
                      <td className="py-1">SGST</td>
                      <td className="text-right py-1">{(invoice.items[0]?.gstRate / 2) || 0}%</td>
                      <td className="text-right py-1">₹{invoice.totalSGST.toFixed(2)}</td>
                    </tr>
                  )}
                  {invoice.totalIGST > 0 && (
                    <tr>
                      <td className="py-1">IGST</td>
                      <td className="text-right py-1">{invoice.items[0]?.gstRate || 0}%</td>
                      <td className="text-right py-1">₹{invoice.totalIGST.toFixed(2)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes & Terms */}
          <div className="mt-8 space-y-6">
            {invoice.notes && (
              <div>
                <h3 className="text-gray-700 font-semibold mb-2">Notes</h3>
                <p className="text-gray-600 whitespace-pre-line text-sm">{invoice.notes}</p>
              </div>
            )}
            
            {invoice.terms && (
              <div>
                <h3 className="text-gray-700 font-semibold mb-2">Terms & Conditions</h3>
                <p className="text-gray-600 whitespace-pre-line text-sm">{invoice.terms}</p>
              </div>
            )}
          </div>

          {/* Signature */}
          <div className="mt-12 pt-4 flex flex-col items-end">
            <p className="text-sm mb-12">For {invoice.company.name}</p>
            <p className="font-medium">{invoice.company.signatory}</p>
            <p className="text-sm text-gray-600">Authorized Signatory</p>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-4 border-t text-center text-gray-500 text-sm">
            <p>This is a computer-generated invoice, no signature required.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;
