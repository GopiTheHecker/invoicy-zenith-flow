
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const Profile = () => {
  const { user, updateUserProfile } = useAuth();
  
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [bankName, setBankName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Load existing bank details if available
  useEffect(() => {
    if (user?.bankDetails) {
      setAccountName(user.bankDetails.accountName || "");
      setAccountNumber(user.bankDetails.accountNumber || "");
      setIfscCode(user.bankDetails.ifscCode || "");
      setBankName(user.bankDetails.bankName || "");
    } else if (user) {
      // Set account name to user's name by default
      setAccountName(user.name);
    }
  }, [user]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      updateUserProfile({
        bankDetails: {
          accountName,
          accountNumber,
          ifscCode,
          bankName
        }
      });
      
      toast.success("Bank details updated successfully!");
    } catch (error) {
      toast.error("Failed to update bank details");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Please log in to view your profile</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">Your Profile</h1>
      
      <div className="space-y-8">
        {/* User Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <p className="text-gray-700 font-medium mt-1">{user.name}</p>
              </div>
              <div>
                <Label>Email</Label>
                <p className="text-gray-700 font-medium mt-1">{user.email}</p>
              </div>
              {user.id === 'guest-user-id' && (
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md mt-2">
                  <p className="text-yellow-800 text-sm">
                    You are using a guest account. Your data will be stored locally and may be lost when you clear your browser data.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Bank Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Bank Account Details</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">These details will appear on your invoices. They are stored securely.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="accountName">Account Holder Name</Label>
                <Input
                  id="accountName"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Enter account holder name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Enter account number"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ifscCode">IFSC Code</Label>
                <Input
                  id="ifscCode"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value)}
                  placeholder="Enter IFSC code"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Enter bank name"
                  required
                />
              </div>
              
              <CardFooter className="p-0 pt-4">
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary-300" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save Bank Details"}
                </Button>
              </CardFooter>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
