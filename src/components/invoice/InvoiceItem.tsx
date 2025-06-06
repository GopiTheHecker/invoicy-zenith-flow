
import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { InvoiceItem as InvoiceItemType } from "@/contexts/InvoiceContext";
import { Label } from "@/components/ui/label";

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
    const baseAmount = quantity * item.rate;
    const discountAmount = baseAmount * (item.discountPercent / 100);
    const amount = baseAmount - discountAmount;
    onChange(item.id, { quantity, amount });
  };

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rate = parseFloat(e.target.value) || 0;
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
    const baseAmount = item.quantity * item.rate;
    const discountAmount = baseAmount * (discountPercent / 100);
    const amount = baseAmount - discountAmount;
    onChange(item.id, { discountPercent, amount });
  };

  const baseAmount = item.quantity * item.rate;
  const discountAmount = baseAmount * (item.discountPercent / 100);
  const finalAmount = baseAmount - discountAmount;

  return (
    <>
      {/* Mobile Layout */}
      <div className="md:hidden border rounded-lg p-4 space-y-3">
        <div className="flex justify-between items-start">
          <h4 className="font-medium text-sm">Item {item.id}</h4>
          <Button 
            type="button" 
            size="sm" 
            variant="ghost"
            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
            onClick={() => onRemove(item.id)}
            disabled={!canRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-gray-600">HSN/SAC</Label>
            <Input 
              type="text" 
              placeholder="HSN/SAC" 
              value={item.hsnCode || ''} 
              onChange={handleHsnCodeChange}
              className="text-sm"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-600">GST %</Label>
            <Input 
              type="number" 
              placeholder="GST %" 
              value={item.gstRate || ''} 
              onChange={handleGstRateChange}
              min="0"
              step="0.01"
              className="text-sm"
            />
          </div>
        </div>
        
        <div>
          <Label className="text-xs text-gray-600">Description</Label>
          <Input 
            placeholder="Item description" 
            value={item.description} 
            onChange={handleDescriptionChange}
            className="text-sm"
          />
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs text-gray-600">Qty</Label>
            <Input 
              type="number" 
              placeholder="Qty" 
              value={item.quantity || ''} 
              onChange={handleQuantityChange} 
              min="0"
              step="1"
              className="text-sm"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-600">Rate (₹)</Label>
            <Input 
              type="number" 
              placeholder="Rate" 
              value={item.rate || ''} 
              onChange={handleRateChange}
              min="0"
              step="0.01"
              className="text-sm"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-600">Disc %</Label>
            <Input 
              type="number" 
              placeholder="Disc" 
              value={item.discountPercent || ''} 
              onChange={handleDiscountChange}
              min="0"
              max="100"
              step="0.01"
              className="text-sm border-amber-300 focus:border-amber-500"
            />
          </div>
        </div>
        
        <div className="flex justify-end items-center pt-2 border-t">
          <div className="text-right">
            {item.discountPercent > 0 && (
              <div className="text-xs text-gray-500 line-through">
                ₹{baseAmount.toFixed(2)}
              </div>
            )}
            <div className="font-medium">
              ₹{finalAmount.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:grid md:grid-cols-10 gap-3 items-center py-2 border-b last:border-b-0">
        <div className="col-span-1">
          <Input 
            type="text" 
            placeholder="HSN/SAC" 
            value={item.hsnCode || ''} 
            onChange={handleHsnCodeChange}
            className="text-sm"
          />
        </div>
        
        <div className="col-span-3">
          <Input 
            placeholder="Item description" 
            value={item.description} 
            onChange={handleDescriptionChange}
            className="text-sm"
          />
        </div>
        
        <div className="col-span-1">
          <Input 
            type="number" 
            placeholder="Qty" 
            value={item.quantity || ''} 
            onChange={handleQuantityChange} 
            min="0"
            step="1"
            className="text-sm"
          />
        </div>
        
        <div className="col-span-1">
          <Input 
            type="number" 
            placeholder="Rate" 
            value={item.rate || ''} 
            onChange={handleRateChange}
            min="0"
            step="0.01"
            className="text-sm"
          />
        </div>
        
        <div className="col-span-1">
          <Input 
            type="number" 
            placeholder="Disc %" 
            value={item.discountPercent || ''} 
            onChange={handleDiscountChange}
            min="0"
            max="100"
            step="0.01"
            className="text-sm border-amber-300 focus:border-amber-500"
          />
        </div>
        
        <div className="col-span-1">
          <Input 
            type="number" 
            placeholder="GST %" 
            value={item.gstRate || ''} 
            onChange={handleGstRateChange}
            min="0"
            step="0.01"
            className="text-sm"
          />
        </div>
        
        <div className="col-span-1 text-right">
          {item.discountPercent > 0 && (
            <div className="text-xs text-gray-500 line-through mb-1">
              ₹{baseAmount.toFixed(2)}
            </div>
          )}
          <div className="bg-gray-50 px-2 py-1 rounded text-sm font-medium">
            ₹{finalAmount.toFixed(2)}
          </div>
        </div>
        
        <div className="col-span-1 text-center">
          <Button 
            type="button" 
            size="sm" 
            variant="ghost"
            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
            onClick={() => onRemove(item.id)}
            disabled={!canRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
};

export default InvoiceItemRow;
