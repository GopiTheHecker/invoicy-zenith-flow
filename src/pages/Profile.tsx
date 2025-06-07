
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';

const Profile = () => {
  const { user, updateBankDetails, logout } = useAuth();
  
  const [accountName, setAccountName] = useState(user?.bankDetails?.accountName || '');
  const [accountNumber, setAccountNumber] = useState(user?.bankDetails?.accountNumber || '');
  const [ifscCode, setIfscCode] = useState(user?.bankDetails?.ifscCode || '');
  const [bankName, setBankName] = useState(user?.bankDetails?.bankName || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBankDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate inputs
      if (!accountName || !accountNumber || !ifscCode || !bankName) {
        toast.error("All bank details are required");
        return;
      }
      
      const bankDetails = {
        accountName,
        accountNumber,
        ifscCode,
        bankName
      };
      
      const { error } = await updateBankDetails(bankDetails);
      
      if (!error) {
        toast.success("Bank details updated successfully");
      } else {
        toast.error(error);
      }
    } catch (error) {
      console.error("Error updating bank details:", error);
      toast.error("Failed to update bank details");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* User Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
            <CardDescription>View and manage your account information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={user?.name || ''} readOnly />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user?.email || ''} readOnly />
              </div>
              {user?.id === 'guest-user-id' && (
                <div className="text-sm text-amber-500">
                  You are using the app in guest mode. Some features may be limited.
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={logout}>Sign Out</Button>
          </CardFooter>
        </Card>
        
        {/* Bank Details */}
        <Card>
          <CardHeader>
            <CardTitle>Bank Details</CardTitle>
            <CardDescription>Manage your bank information for invoices</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleBankDetailsSubmit} className="space-y-4">
              <div>
                <Label htmlFor="accountName">Account Name</Label>
                <Input 
                  id="accountName" 
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Enter account holder name"
                />
              </div>
              <div>
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input 
                  id="accountNumber" 
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Enter account number"
                />
              </div>
              <div>
                <Label htmlFor="ifscCode">IFSC Code</Label>
                <Input 
                  id="ifscCode" 
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value)}
                  placeholder="Enter IFSC code"
                />
              </div>
              <div>
                <Label htmlFor="bankName">Bank Name</Label>
                <Input 
                  id="bankName" 
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Enter bank name"
                />
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Save Bank Details'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
