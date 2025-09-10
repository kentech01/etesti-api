import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    } as any);
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: process.env.SMTP_USER,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html),
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error("Email sending failed:", error);
      return false;
    }
  }

  async sendWelcomeEmail(
    userEmail: string,
    firstName: string
  ): Promise<boolean> {
    const subject = "Welcome to Our Platform!";
    const html = `
      <h1>Welcome ${firstName}!</h1>
      <p>Thank you for joining our platform. We're excited to have you on board!</p>
      <p>If you have any questions, feel free to reach out to our support team.</p>
      <br>
      <p>Best regards,</p>
      <p>The Team</p>
    `;

    return this.sendEmail({ to: userEmail, subject, html });
  }

  async sendPasswordResetEmail(
    userEmail: string,
    resetToken: string
  ): Promise<boolean> {
    const subject = "Password Reset Request";
    const resetUrl = `${process.env.CORS_ORIGIN}/reset-password?token=${resetToken}`;
    const html = `
      <h1>Password Reset Request</h1>
      <p>You requested a password reset for your account.</p>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
      <p>If you didn't request this, please ignore this email.</p>
      <p>This link will expire in 1 hour.</p>
      <br>
      <p>Best regards,</p>
      <p>The Team</p>
    `;

    return this.sendEmail({ to: userEmail, subject, html });
  }

  async sendNotificationEmail(
    userEmail: string,
    title: string,
    message: string
  ): Promise<boolean> {
    const subject = title;
    const html = `
      <h1>${title}</h1>
      <p>${message}</p>
      <br>
      <p>Best regards,</p>
      <p>The Team</p>
    `;

    return this.sendEmail({ to: userEmail, subject, html });
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, "");
  }
}

export const emailService = new EmailService();
