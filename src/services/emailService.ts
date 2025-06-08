
import { supabase } from '@/integrations/supabase/client';

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export const sendEmail = async (emailData: EmailData) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: emailData
    });

    if (error) {
      console.error('Email sending error:', error);
      throw new Error(error.message || 'Failed to send email');
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Email service error:', error);
    throw new Error(error.message || 'Failed to send email');
  }
};

export const sendInvoiceEmail = async (invoiceId: string, clientEmail: string, companyName: string) => {
  const emailData: EmailData = {
    to: clientEmail,
    subject: `Invoice from ${companyName}`,
    html: `
      <h2>Invoice from ${companyName}</h2>
      <p>Dear Client,</p>
      <p>Please find your invoice attached. You can view it online using the link below:</p>
      <p><a href="${window.location.origin}/invoice/preview/${invoiceId}">View Invoice</a></p>
      <p>Thank you for your business!</p>
      <p>Best regards,<br>${companyName}</p>
    `
  };

  return sendEmail(emailData);
};
