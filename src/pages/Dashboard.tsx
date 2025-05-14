
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useInvoices } from "@/contexts/InvoiceContext";
import { FilePlus, FileText } from "lucide-react";
import InvoiceCard from "@/components/invoice/InvoiceCard";

const Dashboard = () => {
  const { user } = useAuth();
  const { invoices } = useInvoices();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome, {user?.name}
          </h1>
          <p className="text-gray-500">
            Manage your invoices and create new ones
          </p>
        </div>
        <Button 
          onClick={() => navigate("/invoice/new")}
          className="bg-primary hover:bg-primary-300"
        >
          <FilePlus className="mr-2 h-4 w-4" />
          Create New Invoice
        </Button>
      </div>

      {invoices.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
          <div className="flex justify-center">
            <FileText className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No Invoices Yet</h3>
          <p className="mt-2 text-gray-500">
            Create your first invoice to get started
          </p>
          <Button
            onClick={() => navigate("/invoice/new")}
            className="mt-6 bg-primary hover:bg-primary-300"
          >
            <FilePlus className="mr-2 h-4 w-4" />
            Create New Invoice
          </Button>
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Invoices</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {invoices.map((invoice) => (
              <InvoiceCard key={invoice.id} invoice={invoice} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
