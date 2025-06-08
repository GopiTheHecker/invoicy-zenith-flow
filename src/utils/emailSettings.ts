
export interface EmailSettings {
  emailSubject: string;
  emailTemplate: string;
  emailNotifications: boolean;
  invoiceReminders: boolean;
  paymentNotifications: boolean;
}

export const getEmailSettings = (): EmailSettings => {
  const savedSettings = localStorage.getItem('app-settings');
  
  const defaultSettings: EmailSettings = {
    emailSubject: 'Invoice from {companyName}',
    emailTemplate: `Dear Customer,

Please find attached your invoice. You can view it online using the link below:

{invoiceLink}

Thank you for your business!

Best regards,
{companyName}`,
    emailNotifications: true,
    invoiceReminders: true,
    paymentNotifications: true
  };

  if (!savedSettings) {
    return defaultSettings;
  }

  try {
    const settings = JSON.parse(savedSettings);
    return {
      ...defaultSettings,
      ...settings
    };
  } catch (error) {
    console.error('Error parsing email settings:', error);
    return defaultSettings;
  }
};

export const saveEmailSettings = (settings: Partial<EmailSettings>) => {
  const currentSettings = getEmailSettings();
  const updatedSettings = { ...currentSettings, ...settings };
  localStorage.setItem('app-settings', JSON.stringify(updatedSettings));
};
