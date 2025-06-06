
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useInvoices } from "@/contexts/InvoiceContext";
import { FilePlus, FileText, Filter } from "lucide-react";
import InvoiceCard from "@/components/invoice/InvoiceCard";
import FilterPanel, { FilterOptions } from "@/components/filters/FilterPanel";
import SearchBar from "@/components/filters/SearchBar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InvoiceTable from "@/components/invoice/InvoiceTable";
import { format, isAfter, isBefore, parseISO } from "date-fns";

const Dashboard = () => {
  const { user } = useAuth();
  const { invoices } = useInvoices();
  const navigate = useNavigate();
  
  const [filters, setFilters] = useState<FilterOptions>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Apply filters and search
  const filteredInvoices = invoices.filter(invoice => {
    // Date range filter
    if (filters.startDate && 
        !isBefore(parseISO(invoice.issueDate), filters.startDate)) {
      return false;
    }
    
    if (filters.endDate && 
        !isAfter(parseISO(invoice.issueDate), filters.endDate)) {
      return false;
    }
    
    // Amount range filter
    if (filters.minAmount !== undefined && 
        invoice.roundedTotal < filters.minAmount) {
      return false;
    }
    
    if (filters.maxAmount !== undefined && 
        invoice.roundedTotal > filters.maxAmount) {
      return false;
    }
    
    // Company name filter
    if (filters.companyName && 
        !invoice.client.name.toLowerCase().includes(filters.companyName.toLowerCase())) {
      return false;
    }
    
    // GST number filter
    if (filters.gstNumber && 
        !invoice.client.gstin?.toLowerCase().includes(filters.gstNumber.toLowerCase())) {
      return false;
    }
    
    // Search query (across multiple fields)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const searchFields = [
        invoice.invoiceNumber,
        invoice.client.name,
        invoice.client.email,
        invoice.client.gstin || '',
        invoice.company.name,
      ].map(field => field.toLowerCase());
      
      if (!searchFields.some(field => field.includes(query))) {
        return false;
      }
    }
    
    return true;
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  return (
    <div className="container mx-auto p-2 md:p-4 space-y-4 md:space-y-6">
      {/* Header Section */}
      <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center md:justify-between gap-4">
        <div className="text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Welcome, {user?.name}
          </h1>
          <p className="text-gray-500 text-sm md:text-base">
            Manage your invoices and create new ones
          </p>
        </div>
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button 
                variant="outline" 
                className="flex md:hidden w-full"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent>
              <FilterPanel onFilterChange={handleFilterChange} />
            </SheetContent>
          </Sheet>
          
          <Button 
            onClick={() => navigate("/invoice/new")}
            className="bg-primary hover:bg-primary-300 w-full md:w-auto"
          >
            <FilePlus className="mr-2 h-4 w-4" />
            Create New Invoice
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
        {/* Desktop Filter Panel */}
        <div className="hidden lg:block w-full lg:w-64">
          <FilterPanel onFilterChange={handleFilterChange} />
        </div>
        
        {/* Main Content */}
        <div className="flex-1">
          {/* Search Bar */}
          <div className="mb-4 md:mb-6">
            <SearchBar onSearch={handleSearch} placeholder="Search invoices, clients, amounts..." />
          </div>
          
          {/* View Mode Toggle and Count */}
          <div className="mb-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <h2 className="text-lg md:text-xl font-semibold">
              Your Invoices {filteredInvoices.length > 0 && `(${filteredInvoices.length})`}
            </h2>
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'cards' | 'table')}>
              <TabsList className="w-full md:w-auto">
                <TabsTrigger value="cards" className="flex-1 md:flex-none">Cards</TabsTrigger>
                <TabsTrigger value="table" className="flex-1 md:flex-none">Table</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {/* Content */}
          {invoices.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 md:p-12 text-center">
              <div className="flex justify-center mb-4">
                <FileText className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Invoices Yet</h3>
              <p className="text-gray-500 mb-6">
                Create your first invoice to get started
              </p>
              <Button
                onClick={() => navigate("/invoice/new")}
                className="bg-primary hover:bg-primary-300"
              >
                <FilePlus className="mr-2 h-4 w-4" />
                Create New Invoice
              </Button>
            </div>
          ) : (
            <>
              {filteredInvoices.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 md:p-8 text-center">
                  <div className="flex justify-center mb-4">
                    <FileText className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2">No Matching Invoices</h3>
                  <p className="text-sm text-gray-500">
                    Try adjusting your search or filters
                  </p>
                </div>
              ) : (
                <Tabs value={viewMode} className="w-full">
                  <TabsContent value="cards" className="mt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {filteredInvoices.map((invoice) => (
                        <InvoiceCard key={invoice.id} invoice={invoice} />
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="table" className="mt-0">
                    <div className="overflow-hidden rounded-lg border">
                      <InvoiceTable invoices={filteredInvoices} />
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
