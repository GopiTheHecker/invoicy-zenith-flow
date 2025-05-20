
import React from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Eye, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Invoice } from "@/contexts/InvoiceContext";
import DeleteInvoiceDialog from "./DeleteInvoiceDialog";

interface InvoiceCardProps {
  invoice: Invoice;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "draft":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
    case "sent":
      return "bg-blue-100 text-blue-800 hover:bg-blue-100";
    case "paid":
      return "bg-green-100 text-green-800 hover:bg-green-100";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-100";
  }
};

const formatDate = (dateString: string) => {
  try {
    // Check if the string is a valid date
    if (!dateString) return "Invalid date";
    
    // Handle ISO format dates
    if (/^\d{4}-\d{2}-\d{2}.*/.test(dateString)) {
      const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(new Date(year, month - 1, day));
    }

    // For other formats, try direct parsing
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "Invalid date";
    }
    
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  } catch (error) {
    console.error("Date formatting error:", error, "for date:", dateString);
    return "Invalid date";
  }
};

export const InvoiceCard = ({ invoice }: InvoiceCardProps) => {
  const navigate = useNavigate();

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 bg-gray-50 flex flex-row items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-gray-500" />
          <span className="font-medium">{invoice.invoiceNumber}</span>
        </div>
        <Badge className={getStatusColor(invoice.status)}>
          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
        </Badge>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-gray-500">Client</p>
            <p className="font-medium">{invoice.client.name}</p>
          </div>
          <div>
            <p className="text-gray-500">Amount</p>
            <p className="font-medium">₹{invoice.roundedTotal.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-500">Issue Date</p>
            <p>{formatDate(invoice.issueDate)}</p>
          </div>
          <div>
            <p className="text-gray-500">Due Date</p>
            <p>{formatDate(invoice.dueDate)}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 bg-gray-50 flex justify-between items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/invoice/preview/${invoice.id}`)}
        >
          <Eye className="h-4 w-4 mr-1" /> Preview
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/invoice/edit/${invoice.id}`)}
          >
            <Edit className="h-4 w-4 mr-1" /> Edit
          </Button>
          <DeleteInvoiceDialog 
            invoiceId={invoice.id} 
            invoiceNumber={invoice.invoiceNumber}
          />
        </div>
      </CardFooter>
    </Card>
  );
};

export default InvoiceCard;
