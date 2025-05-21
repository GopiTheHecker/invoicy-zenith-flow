
import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useInvoices } from "@/contexts/InvoiceContext";

interface DeleteInvoiceDialogProps {
  invoiceId: string;
  invoiceNumber: string;
  onDeleted?: () => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  icon?: React.ReactNode;
}

export const DeleteInvoiceDialog = ({ 
  invoiceId, 
  invoiceNumber,
  onDeleted,
  variant = "destructive",
  size = "sm",
  icon = <Trash2 className="h-4 w-4 mr-1" />
}: DeleteInvoiceDialogProps) => {
  const { deleteInvoice } = useInvoices();
  
  const handleDelete = async () => {
    const success = await deleteInvoice(invoiceId);
    if (success && onDeleted) {
      onDeleted();
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant={variant} size={size}>
          {icon} Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete invoice{" "}
            <strong>{invoiceNumber}</strong> and remove its data from the server.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteInvoiceDialog;
