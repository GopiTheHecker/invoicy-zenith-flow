
import { supabase } from '@/integrations/supabase/client';

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export const sendEmail = async (emailData: EmailData) => {
  try {
    console.log('Sending email to:', emailData.to);
    
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: emailData
    });

    if (error) {
      console.error('Email sending error:', error);
      throw new Error(error.message || 'Failed to send email');
    }

    console.log('Email sent successfully:', data);
    return { success: true, data };
  } catch (error: any) {
    console.error('Email service error:', error);
    throw new Error(error.message || 'Failed to send email');
  }
};

export const sendInvoiceEmail = async (
  invoiceId: string, 
  clientEmail: string, 
  companyName: string,
  customSubject?: string,
  customTemplate?: string
) => {
  // Get email settings from localStorage
  const savedSettings = localStorage.getItem('app-settings');
  let emailSubject = 'Invoice from {companyName}';
  let emailTemplate = `Dear Customer,

Please find attached your invoice. You can view it online using the link below:

{invoiceLink}

Thank you for your business!

Best regards,
{companyName}`;

  if (savedSettings) {
    const settings = JSON.parse(savedSettings);
    emailSubject = settings.emailSubject || emailSubject;
    emailTemplate = settings.emailTemplate || emailTemplate;
  }

  // Use custom subject/template if provided
  if (customSubject) emailSubject = customSubject;
  if (customTemplate) emailTemplate = customTemplate;

  // Process template placeholders
  const processedSubject = emailSubject.replace(/{companyName}/g, companyName);
  const invoiceLink = `${window.location.origin}/invoice/preview/${invoiceId}`;
  const processedTemplate = emailTemplate
    .replace(/{companyName}/g, companyName)
    .replace(/{customerName}/g, 'Valued Customer')
    .replace(/{invoiceLink}/g, invoiceLink);

  const emailData: EmailData = {
    to: clientEmail,
    subject: processedSubject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Invoice from ${companyName}</h2>
        <div style="white-space: pre-line; margin: 20px 0;">
          ${processedTemplate}
        </div>
        <div style="margin-top: 30px; padding: 20px; background-color: #f5f5f5; border-radius: 5px;">
          <p><strong>View Invoice Online:</strong></p>
          <a href="${invoiceLink}" style="color: #007bff; text-decoration: none;">${invoiceLink}</a>
        </div>
        <div style="margin-top: 20px; font-size: 12px; color: #666;">
          <p>This email was sent from ${companyName} invoice system.</p>
        </div>
      </div>
    `
  };

  return sendEmail(emailData);
};
