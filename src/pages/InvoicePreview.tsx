
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useInvoices, Invoice } from "@/contexts/InvoiceContext";
import { ArrowLeft, Download, Mail, Pencil } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

const InvoicePreview = () => {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const { id } = useParams<{ id: string }>();
  const { getInvoice, currentInvoice, updateInvoice, getUserBankDetails } = useInvoices();
  const { user } = useAuth();
  const navigate = useNavigate();
  const bankDetails = user?.bankDetails || getUserBankDetails();
  const isMobile = useIsMobile();

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
            } else {
              toast.error("Invoice not found");
              navigate('/dashboard');
            }
          }
        }
      } catch (error) {
        console.error("Error fetching invoice:", error);
        toast.error("Failed to load invoice");
        navigate('/dashboard');
      }
    };

    fetchInvoice();
  }, [id, currentInvoice, getInvoice, navigate]);

  const handleDownloadPDF = async () => {
    const element = document.getElementById('invoice-pdf');
    if (!element) return;

    try {
      toast.info("Generating PDF...");
      
      // Improved PDF generation with better scale handling
      const scale = 2; // Higher scale for better quality
      const canvas = await html2canvas(element, {
        scale: scale,
        useCORS: true,
        allowTaint: true,
        scrollY: -window.scrollY,
        windowWidth: document.documentElement.offsetWidth,
        windowHeight: document.documentElement.offsetHeight
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      
      // Calculate PDF dimensions based on content
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const heightLeft = imgHeight;
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      let position = 0;
      
      // First page
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // Add new pages if content exceeds page height
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`invoice-${invoice?.invoiceNumber}.pdf`);
      
      toast.success("Invoice downloaded as PDF");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF");
    }
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
        // If invalid, log error and return empty string
        console.error("Invalid date format:", dateString);
        return '';
      }
      
      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    } catch (error) {
      console.error("Date formatting error:", error);
      return ''; // Return empty string if any error occurs
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
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
          <h1 className="text-xl md:text-2xl font-bold">GST Invoice Preview</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            onClick={() => navigate(`/invoice/edit/${id}`)}
            className="flex-1 md:flex-none"
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit Invoice
          </Button>
          <Button 
            variant="outline" 
            onClick={handleSendEmail}
            className="flex-1 md:flex-none"
          >
            <Mail className="h-4 w-4 mr-2" />
            Send Email
          </Button>
          <Button 
            onClick={handleDownloadPDF}
            className="flex-1 md:flex-none"
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
        <div id="invoice-pdf" className="invoice-page p-4 md:p-8 bg-white border shadow-sm w-full max-w-4xl print:shadow-none print:border-none print:p-0">
          {/* Invoice Header */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6 md:mb-8">
            {/* Company Logo */}
            <div className="text-center md:text-left">
              {invoice.logo ? (
                <img 
                  src={invoice.logo} 
                  alt="Company logo" 
                  className="max-h-20 md:max-h-24 mx-auto md:mx-0 object-contain"
                />
              ) : (
                <div className="text-xl md:text-2xl font-bold">{invoice.company.name}</div>
              )}
            </div>
            
            {/* Invoice Title */}
            <div className="text-center md:text-right">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">TAX INVOICE</h1>
              <p className="text-gray-500 mt-1">#{invoice.invoiceNumber}</p>
            </div>
          </div>

          {/* Company and Client Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8 border-t border-b py-4">
            <div>
              <h2 className="text-gray-700 font-semibold mb-2">Seller Details:</h2>
              <div className="text-gray-800 text-sm md:text-base">
                <p className="font-medium">{invoice.company.name}</p>
                <p className="whitespace-pre-line">{invoice.company.address}</p>
                {invoice.company.gstin && <p>GSTIN: {invoice.company.gstin}</p>}
                <p>State: {invoice.company.state}</p>
              </div>
            </div>
            
            <div>
              <h2 className="text-gray-700 font-semibold mb-2">Bill To:</h2>
              <div className="text-gray-800 text-sm md:text-base">
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-gray-600 text-xs md:text-sm">Invoice Date:</p>
                <p className="font-medium text-sm md:text-base">{formatDate(invoice.issueDate)}</p>
              </div>
              <div>
                <p className="text-gray-600 text-xs md:text-sm">Due Date:</p>
                <p className="font-medium text-sm md:text-base">{formatDate(invoice.dueDate)}</p>
              </div>
              <div>
                <p className="text-gray-600 text-xs md:text-sm">Payment Terms:</p>
                <p className="font-medium text-sm md:text-base">{invoice.paymentTerms}</p>
              </div>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="mb-6 md:mb-8 overflow-x-auto">
            <table className="w-full border-collapse text-xs md:text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 md:py-3 px-1 md:px-2 text-left border">Sr.</th>
                  <th className="py-2 md:py-3 px-1 md:px-2 text-left border">HSN/SAC</th>
                  <th className="py-2 md:py-3 px-1 md:px-2 text-left border">Description</th>
                  <th className="py-2 md:py-3 px-1 md:px-2 text-right border">Qty</th>
                  <th className="py-2 md:py-3 px-1 md:px-2 text-right border">Rate (₹)</th>
                  <th className="py-2 md:py-3 px-1 md:px-2 text-right border">Disc %</th>
                  <th className="py-2 md:py-3 px-1 md:px-2 text-right border">Taxable Value</th>
                  <th className="py-2 md:py-3 px-1 md:px-2 text-right border">GST %</th>
                  <th className="py-2 md:py-3 px-1 md:px-2 text-right border">GST Amt</th>
                  <th className="py-2 md:py-3 px-1 md:px-2 text-right border">Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => {
                  const baseAmount = item.quantity * item.rate;
                  const itemDiscount = (baseAmount * (item.discountPercent || 0)) / 100;
                  const taxableValue = baseAmount - itemDiscount;
                  const gstAmount = (taxableValue * item.gstRate) / 100;
                  const itemTotal = taxableValue + gstAmount;
                  
                  return (
                    <tr key={item.id} className="border-b">
                      <td className="py-1 md:py-2 px-1 md:px-2 border">{index + 1}</td>
                      <td className="py-1 md:py-2 px-1 md:px-2 border">{item.hsnCode || '-'}</td>
                      <td className="py-1 md:py-2 px-1 md:px-2 border">{item.description}</td>
                      <td className="py-1 md:py-2 px-1 md:px-2 text-right border">{item.quantity}</td>
                      <td className="py-1 md:py-2 px-1 md:px-2 text-right border">₹{item.rate.toFixed(2)}</td>
                      <td className="py-1 md:py-2 px-1 md:px-2 text-right border">
                        {item.discountPercent ? (
                          <div>
                            <div>{item.discountPercent}%</div>
                            {item.discountPercent > 0 && (
                              <div className="text-xs text-gray-500">-₹{itemDiscount.toFixed(2)}</div>
                            )}
                          </div>
                        ) : '-'}
                      </td>
                      <td className="py-1 md:py-2 px-1 md:px-2 text-right border">₹{taxableValue.toFixed(2)}</td>
                      <td className="py-1 md:py-2 px-1 md:px-2 text-right border">{item.gstRate}%</td>
                      <td className="py-1 md:py-2 px-1 md:px-2 text-right border">₹{gstAmount.toFixed(2)}</td>
                      <td className="py-1 md:py-2 px-1 md:px-2 text-right border">₹{itemTotal.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Invoice Totals */}
          <div className="flex justify-end mb-6 md:mb-8">
            <div className="w-full md:w-72">
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
              
              <div className="mt-2 text-xs md:text-sm text-gray-600">
                <p className="italic">{invoice.amountInWords}</p>
              </div>
            </div>
          </div>

          {/* Bank Details & GST Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
            <div className="border p-3 md:p-4 rounded">
              <h3 className="text-gray-700 text-sm md:text-base font-semibold mb-2">Bank Details</h3>
              <p className="text-xs md:text-sm">Account Name: {bankDetails?.accountName || "Not specified"}</p>
              <p className="text-xs md:text-sm">Account Number: {bankDetails?.accountNumber || "Not specified"}</p>
              <p className="text-xs md:text-sm">IFSC Code: {bankDetails?.ifscCode || "Not specified"}</p>
              <p className="text-xs md:text-sm">Bank Name: {bankDetails?.bankName || "Not specified"}</p>
            </div>
            
            <div className="border p-3 md:p-4 rounded">
              <h3 className="text-gray-700 text-sm md:text-base font-semibold mb-2">GST Summary</h3>
              <table className="w-full text-xs md:text-sm">
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
          <div className="mt-6 md:mt-8 space-y-4 md:space-y-6 text-xs md:text-sm">
            {invoice.notes && (
              <div>
                <h3 className="text-gray-700 text-sm md:text-base font-semibold mb-2">Notes</h3>
                <p className="text-gray-600 whitespace-pre-line">{invoice.notes}</p>
              </div>
            )}
            
            {invoice.terms && (
              <div>
                <h3 className="text-gray-700 text-sm md:text-base font-semibold mb-2">Terms & Conditions</h3>
                <p className="text-gray-600 whitespace-pre-line">{invoice.terms}</p>
              </div>
            )}
          </div>

          {/* Signature */}
          <div className="mt-8 md:mt-12 pt-4 flex flex-col items-end">
            <p className="text-xs md:text-sm mb-8 md:mb-12">For {invoice.company.name}</p>
            <p className="font-medium text-sm md:text-base">{invoice.company.signatory}</p>
            <p className="text-xs md:text-sm text-gray-600">Authorized Signatory</p>
          </div>

          {/* Footer */}
          <div className="mt-8 md:mt-12 pt-4 border-t text-center text-gray-500 text-xs">
            <p>This is a computer-generated invoice, no signature required.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;
