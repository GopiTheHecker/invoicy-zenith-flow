
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Download, FileEdit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Invoice } from "@/contexts/InvoiceContext";
import { format } from "date-fns";

interface InvoiceCardProps {
  invoice: Invoice;
}

const InvoiceCard: React.FC<InvoiceCardProps> = ({ invoice }) => {
  const navigate = useNavigate();
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-medium text-lg">{invoice.invoiceNumber}</h3>
            <p className="text-gray-500 text-sm">{invoice.client.name}</p>
          </div>
          <Badge className={getStatusColor(invoice.status)}>
            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div>
            <p className="text-gray-500">Issue Date</p>
            <p>{formatDate(invoice.issueDate)}</p>
          </div>
          <div>
            <p className="text-gray-500">Due Date</p>
            <p>{formatDate(invoice.dueDate)}</p>
          </div>
          <div className="col-span-2">
            <p className="text-gray-500">Amount</p>
            <p className="text-lg font-semibold">${invoice.total.toFixed(2)}</p>
          </div>
        </div>
        
        <div className="flex justify-between gap-2 mt-4">
          <Button 
            variant="outline" 
            size="sm"
            className="flex-1"
            onClick={() => navigate(`/invoice/edit/${invoice.id}`)}
          >
            <FileEdit className="h-4 w-4 mr-1" /> Edit
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="flex-1"
            onClick={() => navigate(`/invoice/preview/${invoice.id}`)}
          >
            <Eye className="h-4 w-4 mr-1" /> Preview
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoiceCard;
