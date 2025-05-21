
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Search, FilterX } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useInvoices } from '@/contexts/InvoiceContext';

interface FilterPanelProps {
  onFilterChange: (filters: FilterOptions) => void;
}

export interface FilterOptions {
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  companyName?: string;
  gstNumber?: string;
  searchQuery?: string;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ onFilterChange }) => {
  const { invoices } = useInvoices();
  
  const [filters, setFilters] = useState<FilterOptions>({
    startDate: undefined,
    endDate: undefined,
    minAmount: undefined,
    maxAmount: undefined,
    companyName: '',
    gstNumber: '',
    searchQuery: '',
  });

  // Get unique company names for dropdown
  const uniqueCompanies = Array.from(new Set(invoices.map(inv => inv.client.name))).sort();

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleResetFilters = () => {
    const resetFilters = {
      startDate: undefined,
      endDate: undefined,
      minAmount: undefined,
      maxAmount: undefined,
      companyName: '',
      gstNumber: '',
      searchQuery: '',
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filters</CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleResetFilters}
            className="h-8 text-xs"
          >
            <FilterX className="h-3.5 w-3.5 mr-1" />
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Date Range */}
          <div className="space-y-2 col-span-full">
            <Label>Date Range</Label>
            <div className="flex space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal w-full",
                      !filters.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.startDate ? format(filters.startDate, "PPP") : <span>From</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.startDate}
                    onSelect={(date) => handleFilterChange('startDate', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal w-full",
                      !filters.endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.endDate ? format(filters.endDate, "PPP") : <span>To</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.endDate}
                    onSelect={(date) => handleFilterChange('endDate', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Amount Range */}
          <div className="space-y-2 col-span-full">
            <Label>Amount Range (₹)</Label>
            <div className="flex space-x-2">
              <div className="w-full">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.minAmount || ''}
                  onChange={(e) => handleFilterChange('minAmount', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full"
                />
              </div>
              <div className="w-full">
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.maxAmount || ''}
                  onChange={(e) => handleFilterChange('maxAmount', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Company Name */}
          <div className="space-y-2 col-span-full">
            <Label>Company Name</Label>
            <Input
              type="text"
              placeholder="Company Name"
              list="company-names"
              value={filters.companyName || ''}
              onChange={(e) => handleFilterChange('companyName', e.target.value)}
            />
            <datalist id="company-names">
              {uniqueCompanies.map(company => (
                <option key={company} value={company} />
              ))}
            </datalist>
          </div>

          {/* GST Number */}
          <div className="space-y-2 col-span-full">
            <Label>GST Number</Label>
            <Input
              type="text"
              placeholder="GST Number"
              value={filters.gstNumber || ''}
              onChange={(e) => handleFilterChange('gstNumber', e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FilterPanel;
