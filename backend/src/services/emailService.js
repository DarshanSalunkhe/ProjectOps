import nodemailer from 'nodemailer';
import config from '../config/index.js';

// HTML escape function to prevent XSS
function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;

    if (config.smtp?.host && config.smtp?.user && config.smtp?.pass) {
      try {
        this.transporter = nodemailer.createTransport({
          host: config.smtp.host,
          port: config.smtp.port,
          secure: config.smtp.port === 465,
          auth: {
            user: config.smtp.user,
            pass: config.smtp.pass,
          },
        });
        this.isConfigured = true;
      } catch (error) {
        console.error('Email service configuration error:', error.message);
      }
    }
  }

  async sendPasswordResetEmail(to, resetLink, userName) {
    if (!this.isConfigured) {
      console.warn('SMTP not configured. Password reset email not sent.');
      return;
    }

    const safeUserName = escapeHtml(userName);
    const safeResetLink = escapeHtml(resetLink);

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - ProjectOps</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px 40px; text-align: center; border-bottom: 1px solid #e5e7eb;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #4F46E5;">PROJECTOPS</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 600; color: #111827;">Reset your password</h2>
              
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #374151;">Hi ${safeUserName},</p>
              
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #374151;">We received a request to reset the password for your ProjectOps account.</p>
              
              <!-- CTA Button -->
              <table role="presentation" style="margin: 0 0 24px 0;">
                <tr>
                  <td>
                    <a href="${safeResetLink}" style="display: inline-block; padding: 14px 32px; background-color: #4F46E5; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Reset Password</a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 20px; color: #6B7280;">This password reset link will expire in <strong>30 minutes</strong>.</p>
              
              <!-- Security Notice -->
              <table role="presentation" style="width: 100%; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; background-color: #f9fafb; margin: 0 0 24px 0;">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #111827;">For your security:</p>
                    <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 20px; color: #374151;">
                      <li style="margin-bottom: 4px;">Never share this reset link with anyone.</li>
                      <li style="margin-bottom: 4px;">ProjectOps will never ask you for your password by email.</li>
                      <li>If you did not request a password reset, you can safely ignore this message and your password will remain unchanged.</li>
                    </ul>
                  </td>
                </tr>
              </table>
              
              <!-- Fallback URL -->
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #6B7280;">If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="margin: 0 0 24px 0; font-size: 12px; color: #4F46E5; word-break: break-all;">${safeResetLink}</p>
              
              <p style="margin: 0; font-size: 16px; line-height: 24px; color: #374151;">Regards,<br>The ProjectOps Team</p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb; background-color: #f9fafb;">
              <p style="margin: 0; font-size: 12px; color: #6B7280;">This is an automated message from ProjectOps. Please do not reply to this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const text = `
PROJECTOPS

Reset your password

Hi ${userName},

We received a request to reset the password for your ProjectOps account.

Reset your password: ${resetLink}

This password reset link will expire in 30 minutes.

For your security:
- Never share this reset link with anyone.
- ProjectOps will never ask you for your password by email.
- If you did not request a password reset, you can safely ignore this message and your password will remain unchanged.

If the button doesn't work, copy and paste this link into your browser:
${resetLink}

Regards,
The ProjectOps Team

---
This is an automated message from ProjectOps. Please do not reply to this email.
    `;

    try {
      await this.transporter.sendMail({
        from: config.smtp.from,
        to,
        subject: 'Reset Your Password - ProjectOps',
        html,
        text,
      });
    } catch (error) {
      console.error('Failed to send password reset email:', error.message);
      throw error;
    }
  }

  async sendInvitationEmail(to, projectName, inviterName, invitationLink, role = 'DEVELOPER') {
    if (!this.isConfigured) {
      console.warn('SMTP not configured. Invitation email not sent.');
      return;
    }

    const safeProjectName = escapeHtml(projectName);
    const safeInviterName = escapeHtml(inviterName);
    const safeInvitationLink = escapeHtml(invitationLink);
    const safeInvitedEmail = escapeHtml(to);
    const safeRole = escapeHtml(role);

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Project Invitation - ProjectOps</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px 40px; text-align: center; border-bottom: 1px solid #e5e7eb;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #4F46E5;">PROJECTOPS</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 600; color: #111827;">You're invited to collaborate</h2>
              
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #374151;">Hi,</p>
              
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #374151;"><strong>${safeInviterName}</strong> has invited you to join "<strong>${safeProjectName}</strong>" on ProjectOps.</p>
              
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 20px; color: #6B7280;">ProjectOps helps teams organize project work, collaborate with members, track progress, and manage project execution.</p>
              
              <!-- Invitation Details -->
              <table role="presentation" style="width: 100%; border: 1px solid #e5e7eb; border-radius: 6px; margin: 0 0 24px 0; background-color: #f9fafb;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #111827;">Invitation details:</p>
                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td style="padding: 4px 0; font-size: 14px; color: #6B7280; width: 40%;">Project:</td>
                        <td style="padding: 4px 0; font-size: 14px; color: #111827; font-weight: 500;">${safeProjectName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-size: 14px; color: #6B7280;">Invited by:</td>
                        <td style="padding: 4px 0; font-size: 14px; color: #111827; font-weight: 500;">${safeInviterName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-size: 14px; color: #6B7280;">Role:</td>
                        <td style="padding: 4px 0; font-size: 14px; color: #111827; font-weight: 500;">${safeRole}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-size: 14px; color: #6B7280;">Invited email:</td>
                        <td style="padding: 4px 0; font-size: 14px; color: #111827; font-weight: 500;">${safeInvitedEmail}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table role="presentation" style="margin: 0 0 24px 0;">
                <tr>
                  <td align="center">
                    <a href="${safeInvitationLink}" style="display: inline-block; padding: 14px 32px; background-color: #4F46E5; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Accept Invitation</a>
                  </td>
                </tr>
              </table>
              
              <!-- Security Notice -->
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 20px; color: #6B7280;">For security, this invitation is intended for <strong>${safeInvitedEmail}</strong>. Please sign in or create your ProjectOps account using this email address before accepting the invitation.</p>
              
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 20px; color: #6B7280;">If you weren't expecting this invitation, you can safely ignore this email.</p>
              
              <!-- Fallback URL -->
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #6B7280;">If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="margin: 0 0 24px 0; font-size: 12px; color: #4F46E5; word-break: break-all;">${safeInvitationLink}</p>
              
              <p style="margin: 0; font-size: 16px; line-height: 24px; color: #374151;">Regards,<br>The ProjectOps Team</p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb; background-color: #f9fafb;">
              <p style="margin: 0; font-size: 12px; color: #6B7280;">This is an automated message from ProjectOps. Please do not reply to this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const text = `
PROJECTOPS

You're invited to collaborate

Hi,

${inviterName} has invited you to join "${projectName}" on ProjectOps.

ProjectOps helps teams organize project work, collaborate with members, track progress, and manage project execution.

Invitation details:
Project: ${projectName}
Invited by: ${inviterName}
Role: ${role}
Invited email: ${to}

Accept your invitation: ${invitationLink}

For security, this invitation is intended for ${to}. Please sign in or create your ProjectOps account using this email address before accepting the invitation.

If you weren't expecting this invitation, you can safely ignore this email.

If the button doesn't work, copy and paste this link into your browser:
${invitationLink}

Regards,
The ProjectOps Team

---
This is an automated message from ProjectOps. Please do not reply to this email.
    `;

    try {
      await this.transporter.sendMail({
        from: config.smtp.from,
        to,
        subject: `You've been invited to ${safeProjectName} - ProjectOps`,
        html,
        text,
      });
    } catch (error) {
      console.error('Failed to send invitation email:', error.message);
      throw error;
    }
  }
}

export default new EmailService();
