
import React from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Eye, Edit, Trash2 } from "lucide-react";
import { Invoice } from "@/contexts/InvoiceContext";
import DeleteInvoiceDialog from "./DeleteInvoiceDialog";
import { format } from "date-fns";

interface InvoiceTableProps {
  invoices: Invoice[];
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
    if (!dateString) return "Invalid date";
    
    if (/^\d{4}-\d{2}-\d{2}.*/.test(dateString)) {
      return format(new Date(dateString), "dd MMM yyyy");
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "Invalid date";
    }
    
    return format(date, "dd MMM yyyy");
  } catch (error) {
    console.error("Date formatting error:", error);
    return "Invalid date";
  }
};

const InvoiceTable: React.FC<InvoiceTableProps> = ({ invoices }) => {
  const navigate = useNavigate();

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead>Bill No</TableHead>
            <TableHead>Company</TableHead>
            <TableHead className="hidden md:table-cell">Date</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="hidden md:table-cell">GST</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
              <TableCell>{invoice.client.name}</TableCell>
              <TableCell className="hidden md:table-cell">{formatDate(invoice.issueDate)}</TableCell>
              <TableCell className="text-right">₹{invoice.roundedTotal.toLocaleString()}</TableCell>
              <TableCell className="hidden md:table-cell">{invoice.client.gstin || '-'}</TableCell>
              <TableCell className="text-center">
                <Badge className={getStatusColor(invoice.status)}>
                  {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/invoice/preview/${invoice.id}`)}
                    title="View"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/invoice/edit/${invoice.id}`)}
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <DeleteInvoiceDialog 
                    invoiceId={invoice.id} 
                    invoiceNumber={invoice.invoiceNumber}
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 className="h-4 w-4" />}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default InvoiceTable;
