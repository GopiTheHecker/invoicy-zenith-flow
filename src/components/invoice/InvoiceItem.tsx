
import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { InvoiceItem as InvoiceItemType } from "@/contexts/InvoiceContext";

interface InvoiceItemRowProps {
  item: InvoiceItemType;
  onChange: (id: string, updates: Partial<InvoiceItemType>) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}

const InvoiceItemRow: React.FC<InvoiceItemRowProps> = ({
  item,
  onChange,
  onRemove,
  canRemove
}) => {
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(item.id, { description: e.target.value });
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const quantity = parseFloat(e.target.value) || 0;
    // Calculate amount considering discount
    const baseAmount = quantity * item.rate;
    const discountAmount = baseAmount * (item.discountPercent / 100);
    const amount = baseAmount - discountAmount;
    onChange(item.id, { quantity, amount });
  };

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rate = parseFloat(e.target.value) || 0;
    // Calculate amount considering discount
    const baseAmount = rate * item.quantity;
    const discountAmount = baseAmount * (item.discountPercent / 100);
    const amount = baseAmount - discountAmount;
    onChange(item.id, { rate, amount });
  };

  const handleHsnCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(item.id, { hsnCode: e.target.value });
  };

  const handleGstRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(item.id, { gstRate: parseFloat(e.target.value) || 0 });
  };

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const discountPercent = parseFloat(e.target.value) || 0;
    // Recalculate amount considering new discount
    const baseAmount = item.quantity * item.rate;
    const discountAmount = baseAmount * (discountPercent / 100);
    const amount = baseAmount - discountAmount;
    onChange(item.id, { discountPercent, amount });
  };

  // Calculate the visible amount (before discount) and discounted amount
  const baseAmount = item.quantity * item.rate;
  const discountAmount = baseAmount * (item.discountPercent / 100);
  const finalAmount = baseAmount - discountAmount;

  return (
    <div className="flex flex-col md:flex-row gap-3 items-start py-2 border-b last:border-b-0">
      <div className="w-full md:w-24">
        <Input 
          type="text" 
          placeholder="HSN/SAC" 
          value={item.hsnCode || ''} 
          onChange={handleHsnCodeChange} 
        />
      </div>
      
      <div className="flex-grow">
        <Input 
          placeholder="Item description" 
          value={item.description} 
          onChange={handleDescriptionChange} 
        />
      </div>
      
      <div className="w-full md:w-20">
        <Input 
          type="number" 
          placeholder="Qty" 
          value={item.quantity || ''} 
          onChange={handleQuantityChange} 
          min="0"
          step="1"
        />
      </div>
      
      <div className="w-full md:w-28">
        <Input 
          type="number" 
          placeholder="Rate (₹)" 
          value={item.rate || ''} 
          onChange={handleRateChange}
          min="0"
          step="0.01"
        />
      </div>
      
      <div className="w-full md:w-20">
        <Input 
          type="number" 
          placeholder="Disc %" 
          value={item.discountPercent || ''} 
          onChange={handleDiscountChange}
          min="0"
          max="100"
          step="0.01"
          className="border-amber-300 focus:border-amber-500"
        />
      </div>
      
      <div className="w-full md:w-20">
        <Input 
          type="number" 
          placeholder="GST %" 
          value={item.gstRate || ''} 
          onChange={handleGstRateChange}
          min="0"
          step="0.01"
        />
      </div>
      
      <div className="w-full md:w-32 flex flex-col items-end">
        {item.discountPercent > 0 && (
          <span className="text-xs text-gray-500 line-through mb-1 w-full text-right">
            ₹{baseAmount.toFixed(2)}
          </span>
        )}
        <span className="bg-gray-50 px-3 py-2 rounded-md w-full text-right">
          ₹{finalAmount.toFixed(2)}
        </span>
      </div>
      
      <div className="flex justify-end md:w-10">
        <Button 
          type="button" 
          size="sm" 
          variant="ghost"
          className="h-10 w-10 p-0 text-red-500 hover:text-red-700"
          onClick={() => onRemove(item.id)}
          disabled={!canRemove}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Remove</span>
        </Button>
      </div>
    </div>
  );
};

export default InvoiceItemRow;
