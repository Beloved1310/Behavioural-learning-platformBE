import nodemailer from 'nodemailer';
import config from '../config';

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.smtp.host,
      port: config.email.smtp.port,
      secure: false, // true for 465, false for other ports
      auth: {
        user: config.email.smtp.user,
        pass: config.email.smtp.pass
      }
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const mailOptions = {
        from: config.email.from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${options.to}`);
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    const subject = 'Welcome to Behavioral Learning Platform!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3b82f6;">Welcome ${firstName}!</h1>
        <p>Thank you for joining the Behavioral Learning Platform. We're excited to help you on your learning journey.</p>
        
        <h2>Getting Started:</h2>
        <ul>
          <li>Complete your profile setup</li>
          <li>Set your learning goals</li>
          <li>Schedule your first study session</li>
          <li>Connect with qualified tutors</li>
        </ul>
        
        <p>If you have any questions, don't hesitate to reach out to our support team.</p>
        
        <p>Happy learning!</p>
        <p>The Behavioral Learning Platform Team</p>
      </div>
    `;

    await this.sendEmail({ to: email, subject, html });
  }

  async sendSessionReminderEmail(
    email: string, 
    firstName: string, 
    sessionTitle: string, 
    scheduledAt: Date
  ): Promise<void> {
    const subject = 'Session Reminder - Behavioral Learning Platform';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3b82f6;">Session Reminder</h1>
        <p>Hi ${firstName},</p>
        
        <p>This is a reminder that you have an upcoming session:</p>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #1e293b;">${sessionTitle}</h3>
          <p style="margin: 0; color: #64748b;">
            <strong>Date & Time:</strong> ${scheduledAt.toLocaleDateString('en-GB')} at ${scheduledAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        
        <p>Make sure you're ready 5 minutes before the session starts!</p>
        
        <p>Good luck with your session!</p>
        <p>The Behavioral Learning Platform Team</p>
      </div>
    `;

    await this.sendEmail({ to: email, subject, html });
  }

  async sendProgressReportEmail(
    email: string,
    firstName: string,
    reportData: {
      period: string;
      studyTime: number;
      sessionsCompleted: number;
      averageScore: number;
      streak: number;
    }
  ): Promise<void> {
    const subject = `Your ${reportData.period} Progress Report`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3b82f6;">Your ${reportData.period} Progress Report</h1>
        <p>Hi ${firstName},</p>
        
        <p>Here's a summary of your learning progress:</p>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <div style="display: grid; gap: 15px;">
            <div>
              <strong>Total Study Time:</strong> ${Math.floor(reportData.studyTime / 60)} hours ${reportData.studyTime % 60} minutes
            </div>
            <div>
              <strong>Sessions Completed:</strong> ${reportData.sessionsCompleted}
            </div>
            <div>
              <strong>Average Quiz Score:</strong> ${reportData.averageScore}%
            </div>
            <div>
              <strong>Current Streak:</strong> ${reportData.streak} days
            </div>
          </div>
        </div>
        
        <p>Keep up the great work! Consistency is key to successful learning.</p>
        
        <p>Best regards,</p>
        <p>The Behavioral Learning Platform Team</p>
      </div>
    `;

    await this.sendEmail({ to: email, subject, html });
  }
}

const emailService = new EmailService();

export const sendEmail = (options: EmailOptions) => emailService.sendEmail(options);
export const sendWelcomeEmail = (email: string, firstName: string) => 
  emailService.sendWelcomeEmail(email, firstName);
export const sendSessionReminderEmail = (
  email: string, 
  firstName: string, 
  sessionTitle: string, 
  scheduledAt: Date
) => emailService.sendSessionReminderEmail(email, firstName, sessionTitle, scheduledAt);
export const sendProgressReportEmail = (
  email: string,
  firstName: string,
  reportData: {
    period: string;
    studyTime: number;
    sessionsCompleted: number;
    averageScore: number;
    streak: number;
  }
) => emailService.sendProgressReportEmail(email, firstName, reportData);

export default emailService;