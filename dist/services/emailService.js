"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendProgressReportEmail = exports.sendSessionReminderEmail = exports.sendWelcomeEmail = exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_1 = __importDefault(require("../config"));
class EmailService {
    constructor() {
        this.transporter = nodemailer_1.default.createTransport({
            host: config_1.default.email.smtp.host,
            port: config_1.default.email.smtp.port,
            secure: false, // true for 465, false for other ports
            auth: {
                user: config_1.default.email.smtp.user,
                pass: config_1.default.email.smtp.pass
            }
        });
    }
    async sendEmail(options) {
        try {
            const mailOptions = {
                from: config_1.default.email.from,
                to: options.to,
                subject: options.subject,
                text: options.text,
                html: options.html
            };
            await this.transporter.sendMail(mailOptions);
            console.log(`Email sent successfully to ${options.to}`);
        }
        catch (error) {
            console.error('Failed to send email:', error);
            throw new Error('Failed to send email');
        }
    }
    async sendWelcomeEmail(email, firstName) {
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
    async sendSessionReminderEmail(email, firstName, sessionTitle, scheduledAt) {
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
    async sendProgressReportEmail(email, firstName, reportData) {
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
const sendEmail = (options) => emailService.sendEmail(options);
exports.sendEmail = sendEmail;
const sendWelcomeEmail = (email, firstName) => emailService.sendWelcomeEmail(email, firstName);
exports.sendWelcomeEmail = sendWelcomeEmail;
const sendSessionReminderEmail = (email, firstName, sessionTitle, scheduledAt) => emailService.sendSessionReminderEmail(email, firstName, sessionTitle, scheduledAt);
exports.sendSessionReminderEmail = sendSessionReminderEmail;
const sendProgressReportEmail = (email, firstName, reportData) => emailService.sendProgressReportEmail(email, firstName, reportData);
exports.sendProgressReportEmail = sendProgressReportEmail;
exports.default = emailService;
//# sourceMappingURL=emailService.js.map