
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
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getInvoice } = useInvoices();
  const [invoice, setInvoice] = useState<Invoice | undefined>(undefined);

  useEffect(() => {
    if (id) {
      const foundInvoice = getInvoice(id);
      if (foundInvoice) {
        setInvoice(foundInvoice);
      } else {
        navigate("/dashboard");
        toast.error("Invoice not found");
      }
    }
  }, [id, getInvoice, navigate]);

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
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (e) {
      return dateString;
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
          <h1 className="text-2xl font-bold">Invoice Preview</h1>
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
        <p className="text-gray-600 text-center">This is a preview of your invoice. Use the buttons above to download as PDF or send via email.</p>
      </div>

      <div className="flex justify-center">
        <div id="invoice-pdf" className="invoice-page">
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
                <div className="text-2xl font-bold">Your Company</div>
              )}
            </div>
            
            {/* Invoice Title */}
            <div className="text-right">
              <h1 className="text-3xl font-bold text-gray-800">INVOICE</h1>
              <p className="text-gray-500 mt-1">#{invoice.invoiceNumber}</p>
            </div>
          </div>

          {/* Invoice Info & Client Info */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h2 className="text-gray-700 font-semibold mb-2">Bill To:</h2>
              <div className="text-gray-800">
                <p className="font-medium">{invoice.client.name}</p>
                <p>{invoice.client.email}</p>
                <p>{invoice.client.phone}</p>
                <p className="whitespace-pre-line">{invoice.client.address}</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="space-y-1">
                <div className="grid grid-cols-2 gap-4">
                  <span className="text-gray-600 font-medium">Invoice Date:</span>
                  <span>{formatDate(invoice.issueDate)}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <span className="text-gray-600 font-medium">Due Date:</span>
                  <span>{formatDate(invoice.dueDate)}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <span className="text-gray-600 font-medium">Total Due:</span>
                  <span className="text-xl font-bold">${invoice.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="mb-8">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-4 text-left">Item</th>
                  <th className="py-3 px-4 text-right">Quantity</th>
                  <th className="py-3 px-4 text-right">Rate</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-3 px-4">{item.description}</td>
                    <td className="py-3 px-4 text-right">{item.quantity}</td>
                    <td className="py-3 px-4 text-right">${item.rate.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right">${item.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Invoice Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-72">
              <div className="border-t-2 pt-2">
                <div className="flex justify-between py-1">
                  <span className="font-medium">Subtotal:</span>
                  <span>${invoice.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="font-medium">Tax ({invoice.tax}%):</span>
                  <span>${((invoice.subtotal * invoice.tax) / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="font-medium">Discount ({invoice.discount}%):</span>
                  <span>${((invoice.subtotal * invoice.discount) / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-3 border-t border-b mt-2 text-lg font-bold">
                  <span>Total:</span>
                  <span>${invoice.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes & Terms */}
          <div className="mt-12 space-y-6">
            {invoice.notes && (
              <div>
                <h3 className="text-gray-700 font-semibold mb-2">Notes</h3>
                <p className="text-gray-600 whitespace-pre-line">{invoice.notes}</p>
              </div>
            )}
            
            {invoice.terms && (
              <div>
                <h3 className="text-gray-700 font-semibold mb-2">Terms & Conditions</h3>
                <p className="text-gray-600 whitespace-pre-line">{invoice.terms}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-12 pt-4 border-t text-center text-gray-500 text-sm">
            <p>Thank you for your business!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;
