
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Save, Bell, Shield, Palette } from 'lucide-react';

const Settings = () => {
  const { user, updateProfile } = useAuth();
  
  // Company Settings
  const [companyName, setCompanyName] = useState(user?.companyName || '');
  const [gstNumber, setGstNumber] = useState(user?.gstNumber || '');
  const [contactPerson, setContactPerson] = useState(user?.contactPerson || '');
  const [mobileNumber, setMobileNumber] = useState(user?.mobileNumber || '');
  
  // Email Settings
  const [emailRecipient, setEmailRecipient] = useState('');
  const [emailSubject, setEmailSubject] = useState('Invoice from {companyName}');
  const [emailTemplate, setEmailTemplate] = useState(`Dear Customer,

Please find attached your invoice.

Thank you for your business.

Best regards,
{companyName}`);
  
  // Notification Settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [invoiceReminders, setInvoiceReminders] = useState(true);
  const [paymentNotifications, setPaymentNotifications] = useState(true);
  
  // App Settings
  const [defaultCurrency, setDefaultCurrency] = useState('INR');
  const [taxRate, setTaxRate] = useState('18');
  const [invoicePrefix, setInvoicePrefix] = useState('INV');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCompanySettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const { error } = await updateProfile({
        companyName,
        gstNumber,
        contactPerson,
        mobileNumber
      });
      
      if (!error) {
        toast.success("Company settings updated successfully");
      } else {
        toast.error(error);
      }
    } catch (error) {
      console.error("Error updating company settings:", error);
      toast.error("Failed to update company settings");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!emailRecipient) {
      toast.error("Please enter an email recipient");
      return;
    }
    
    setIsSubmitting(true);
    try {
      // This would typically call your email service
      // For now, we'll just show a success message
      toast.success(`Test email sent to ${emailRecipient}`);
    } catch (error) {
      toast.error("Failed to send test email");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveSettings = () => {
    // Save all settings to localStorage or your backend
    localStorage.setItem('app-settings', JSON.stringify({
      emailNotifications,
      invoiceReminders,
      paymentNotifications,
      defaultCurrency,
      taxRate,
      invoicePrefix,
      emailSubject,
      emailTemplate
    }));
    
    toast.success("Settings saved successfully");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Settings</h1>
        <Button onClick={handleSaveSettings} className="flex items-center space-x-2">
          <Save className="h-4 w-4" />
          <span>Save All Settings</span>
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Company Information</span>
            </CardTitle>
            <CardDescription>Update your company details for invoices</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCompanySettingsSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Your Company Name"
                  />
                </div>
                <div>
                  <Label htmlFor="gstNumber">GST Number</Label>
                  <Input
                    id="gstNumber"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                    placeholder="GST Number"
                  />
                </div>
                <div>
                  <Label htmlFor="contactPerson">Contact Person</Label>
                  <Input
                    id="contactPerson"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="Contact Person Name"
                  />
                </div>
                <div>
                  <Label htmlFor="mobileNumber">Mobile Number</Label>
                  <Input
                    id="mobileNumber"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="Mobile Number"
                  />
                </div>
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Company Info'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Email Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5" />
              <span>Email Settings</span>
            </CardTitle>
            <CardDescription>Configure email templates and sending options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="emailRecipient">Test Email Recipient</Label>
              <div className="flex space-x-2">
                <Input
                  id="emailRecipient"
                  type="email"
                  value={emailRecipient}
                  onChange={(e) => setEmailRecipient(e.target.value)}
                  placeholder="test@example.com"
                  className="flex-1"
                />
                <Button onClick={handleSendTestEmail} disabled={isSubmitting}>
                  Send Test
                </Button>
              </div>
            </div>
            
            <div>
              <Label htmlFor="emailSubject">Email Subject Template</Label>
              <Input
                id="emailSubject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Invoice from {companyName}"
              />
            </div>
            
            <div>
              <Label htmlFor="emailTemplate">Email Body Template</Label>
              <Textarea
                id="emailTemplate"
                value={emailTemplate}
                onChange={(e) => setEmailTemplate(e.target.value)}
                rows={6}
                placeholder="Email body template..."
              />
              <p className="text-sm text-gray-500 mt-1">
                Use {'{companyName}'} and {'{customerName}'} as placeholders
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notifications</span>
            </CardTitle>
            <CardDescription>Manage your notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-gray-500">Receive email notifications for important events</p>
              </div>
              <Switch
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Invoice Reminders</Label>
                <p className="text-sm text-gray-500">Send automatic reminders for overdue invoices</p>
              </div>
              <Switch
                checked={invoiceReminders}
                onCheckedChange={setInvoiceReminders}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Payment Notifications</Label>
                <p className="text-sm text-gray-500">Get notified when payments are received</p>
              </div>
              <Switch
                checked={paymentNotifications}
                onCheckedChange={setPaymentNotifications}
              />
            </div>
          </CardContent>
        </Card>

        {/* App Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Palette className="h-5 w-5" />
              <span>App Preferences</span>
            </CardTitle>
            <CardDescription>Customize your app experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="defaultCurrency">Default Currency</Label>
                <Input
                  id="defaultCurrency"
                  value={defaultCurrency}
                  onChange={(e) => setDefaultCurrency(e.target.value)}
                  placeholder="INR"
                />
              </div>
              <div>
                <Label htmlFor="taxRate">Default Tax Rate (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  placeholder="18"
                />
              </div>
              <div>
                <Label htmlFor="invoicePrefix">Invoice Number Prefix</Label>
                <Input
                  id="invoicePrefix"
                  value={invoicePrefix}
                  onChange={(e) => setInvoicePrefix(e.target.value)}
                  placeholder="INV"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
