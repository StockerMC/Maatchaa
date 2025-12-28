/**
 * Email Utilities
 * Send partnership outreach emails via Gmail SMTP
 */

import nodemailer from 'nodemailer';

interface Product {
  title?: string;
  name?: string;
}

/**
 * Create partnership email HTML template
 */
export function createPartnershipEmailTemplate(
  creatorName: string,
  shopName: string,
  products: Product[],
  customMessage?: string,
  partnershipUrl?: string
): string {
  const productNames = products
    .slice(0, 3)
    .map((p) => p.title || p.name || '')
    .join(', ');
  const productList =
    products.length > 3 ? `${productNames} and ${products.length - 3} more` : productNames;

  const defaultMessage = `We love your content and think your audience would be a perfect fit for our products!

We'd like to explore a partnership opportunity with you to feature our ${productList}.

We offer competitive commission rates and would love to discuss how we can work together to create authentic content that resonates with your audience.`;

  const messageBody = customMessage || defaultMessage;

  const partnershipSection = partnershipUrl
    ? `
    <div style="margin: 30px 0; padding: 20px; background: #f5f5f5; border-radius: 8px; text-align: center;">
        <a href="${partnershipUrl}"
           style="display: inline-block; padding: 12px 24px; background: #5c9a31; color: white;
                  text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
            Review & Accept Partnership
        </a>
        <p style="margin-top: 10px; font-size: 12px; color: #666;">
            Click the button above to view partnership details and accept
        </p>
    </div>
    `
    : `
    <p>If you're interested, please reply to this email and we can discuss the details further!</p>
    `;

  return `
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2d3748;">Partnership Opportunity with ${shopName}</h2>

            <p>Hi ${creatorName},</p>

            <p>${messageBody}</p>

            ${partnershipSection}

            <p>Best regards,<br>
            The ${shopName} Team</p>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">

            <p style="font-size: 12px; color: #718096;">
                This is an automated email sent via our partnership platform.
            </p>
        </div>
    </body>
    </html>
    `;
}

/**
 * Send email via Gmail SMTP
 *
 * Dev Mode: Set EMAIL_DEV_MODE=true to redirect all emails to EMAIL_SENDER
 */
export async function sendEmail(
  toEmail: string,
  subject: string,
  htmlContent: string,
  fromName?: string
): Promise<{ success: boolean; message: string }> {
  const senderEmail = process.env.EMAIL_SENDER;
  const senderPassword = process.env.EMAIL_APP_PASSWORD;
  const devMode = process.env.EMAIL_DEV_MODE === 'true';

  if (!senderEmail || !senderPassword) {
    return {
      success: false,
      message: 'Email credentials not configured (EMAIL_SENDER and EMAIL_APP_PASSWORD required)',
    };
  }

  if (!toEmail) {
    return { success: false, message: 'Recipient email is required' };
  }

  // Dev mode: redirect all emails to sender email
  const originalRecipient = toEmail;
  const actualRecipient = devMode ? senderEmail : toEmail;

  // Add dev mode notice to email content if in dev mode
  let finalHtmlContent = htmlContent;
  if (devMode) {
    const devNotice = `
      <div style="background: #fff3cd; border: 2px solid #ffc107; padding: 15px; margin-bottom: 20px; border-radius: 8px;">
        <p style="margin: 0; color: #856404; font-weight: bold;">
          🔧 DEV MODE: This email was originally intended for ${originalRecipient}
        </p>
      </div>
    `;
    // Insert dev notice after the opening body tag
    finalHtmlContent = htmlContent.replace(
      /<body[^>]*>/i,
      (match) => match + devNotice
    );
  }

  try {
    // Create Gmail SMTP transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: senderEmail,
        pass: senderPassword,
      },
    });

    // Send email
    await transporter.sendMail({
      from: fromName ? `"${fromName}" <${senderEmail}>` : senderEmail,
      to: actualRecipient,
      subject: devMode ? `[DEV] ${subject}` : subject,
      html: finalHtmlContent,
    });

    return { success: true, message: `Email sent successfully to ${toEmail}` };
  } catch (error) {
    console.error('Email send error:', error);
    return {
      success: false,
      message: `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Send partnership outreach email to a creator
 */
export async function sendPartnershipEmail(
  toEmail: string,
  creatorName: string,
  shopName: string,
  products: Product[],
  customMessage?: string,
  partnershipUrl?: string
): Promise<{ success: boolean; message: string }> {
  const subject = `Partnership Opportunity with ${shopName}`;
  const htmlContent = createPartnershipEmailTemplate(
    creatorName,
    shopName,
    products,
    customMessage,
    partnershipUrl
  );

  return sendEmail(toEmail, subject, htmlContent, shopName);
}
