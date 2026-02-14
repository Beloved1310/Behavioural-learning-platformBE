import nodemailer from 'nodemailer';
import config from '../config';
import { logger } from '../utils/logger';

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Log email configuration status (without exposing password)
    logger.info('EmailService initializing', {
      host: config.email.smtp.host,
      port: config.email.smtp.port,
      from: config.email.from,
      userConfigured: !!config.email.smtp.user,
      passConfigured: !!config.email.smtp.pass,
    });

    this.transporter = nodemailer.createTransport({
      host: config.email.smtp.host,
      port: config.email.smtp.port,
      secure: false, // true for 465, false for other ports
      auth: {
        user: config.email.smtp.user,
        pass: config.email.smtp.pass,
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    logger.debug('Attempting to send email', {
      to: options.to,
      subject: options.subject,
      from: config.email.from,
    });

    // Check if email is configured
    if (!config.email.smtp.user || !config.email.smtp.pass) {
      const errorMsg =
        'Email service not configured. Please set SMTP_USER and SMTP_PASS environment variables.';
      logger.error('Email service not configured', new Error(errorMsg));
      throw new Error(errorMsg);
    }

    try {
      const mailOptions: nodemailer.SendMailOptions = {
        from: config.email.from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      logger.debug('Sending email with options', {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject,
        hasHtml: !!mailOptions.html,
        hasText: !!mailOptions.text,
      });

      const result = await this.transporter.sendMail(mailOptions);

      logger.info('EmailService] Email sent successfully', {
        to: options.to,
        messageId: result.messageId,
        response: result.response,
      });
    } catch (error: any) {
      const errorDetails = error instanceof Error ? error.message : String(error);
      logger.error('EmailService] Failed to send email', error, {
        to: options.to,
        subject: options.subject,
        code: error?.code,
        command: error?.command,
        response: error?.response,
        responseCode: error?.responseCode,
      });

      // Provide more helpful error messages
      if (error?.code === 'EAUTH') {
        throw new Error(
          'Email authentication failed. Please check SMTP_USER and SMTP_PASS credentials.'
        );
      } else if (error?.code === 'ECONNECTION') {
        throw new Error('Failed to connect to email server. Please check SMTP_HOST and SMTP_PORT.');
      } else {
        throw new Error(`Failed to send email: ${errorDetails}`);
      }
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
        <p>LearnQuest Team</p>
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
        <p>LearnQuest Team</p>
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
        <p>LearnQuest Team</p>
      </div>
    `;

    await this.sendEmail({ to: email, subject, html });
  }

  async sendParentProgressReportEmail(
    email: string,
    firstName: string,
    reportData: {
      period: string;
      children: Array<{
        name: string;
        studyHours: number;
        quizzesCompleted: number;
        averageScore: number;
        progress: number;
        strongestSubject: string;
        weakestSubject: string;
      }>;
      familyTotalStudyHours: number;
      familyAverageProgress: number;
    }
  ): Promise<void> {
    const subject = `Your Children's ${reportData.period} Progress Report`;

    const childrenHtml = reportData.children
      .map(
        (child) => `
      <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #3b82f6;">
        <h3 style="margin: 0 0 10px 0; color: #1e293b;">${child.name}</h3>
        <div style="display: grid; gap: 10px; font-size: 14px;">
          <div><strong>Study Hours:</strong> ${child.studyHours.toFixed(1)} hours</div>
          <div><strong>Quizzes Completed:</strong> ${child.quizzesCompleted}</div>
          <div><strong>Average Score:</strong> ${child.averageScore}%</div>
          <div><strong>Overall Progress:</strong> ${child.progress}%</div>
          <div><strong>Strongest Subject:</strong> ${child.strongestSubject}</div>
          <div><strong>Needs Improvement:</strong> ${child.weakestSubject}</div>
        </div>
      </div>
    `
      )
      .join('');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3b82f6;">Your Children's ${reportData.period} Progress Report</h1>
        <p>Hi ${firstName},</p>
        
        <p>Here's a comprehensive overview of your children's learning progress:</p>
        
        ${childrenHtml}
        
        <div style="background-color: #e0f2fe; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #1e293b;">Family Summary</h3>
          <div style="display: grid; gap: 10px; font-size: 14px;">
            <div><strong>Total Family Study Hours:</strong> ${reportData.familyTotalStudyHours.toFixed(1)} hours</div>
            <div><strong>Family Average Progress:</strong> ${reportData.familyAverageProgress}%</div>
          </div>
        </div>
        
        <p>Keep encouraging your children! Consistent learning leads to great results.</p>
        
        <p>Best regards,</p>
        <p>LearnQuest Team</p>
      </div>
    `;

    await this.sendEmail({ to: email, subject, html });
  }

  async sendParentStudyHabitsEmail(
    email: string,
    firstName: string,
    reportData: {
      period: string;
      children: Array<{
        name: string;
        averageStudyTime: number;
        studyStreak: number;
        preferredStudyTime: string;
        mostActiveDay: string;
        consistencyScore: number;
      }>;
    }
  ): Promise<void> {
    const subject = `Your Children's ${reportData.period} Study Habits Report`;

    const childrenHtml = reportData.children
      .map(
        (child) => `
      <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #22c55e;">
        <h3 style="margin: 0 0 10px 0; color: #1e293b;">${child.name}</h3>
        <div style="display: grid; gap: 10px; font-size: 14px;">
          <div><strong>Average Daily Study Time:</strong> ${child.averageStudyTime.toFixed(1)} hours</div>
          <div><strong>Current Study Streak:</strong> ${child.studyStreak} days</div>
          <div><strong>Preferred Study Time:</strong> ${child.preferredStudyTime}</div>
          <div><strong>Most Active Day:</strong> ${child.mostActiveDay}</div>
          <div><strong>Consistency Score:</strong> ${child.consistencyScore}%</div>
        </div>
      </div>
    `
      )
      .join('');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #22c55e;">Your Children's ${reportData.period} Study Habits Report</h1>
        <p>Hi ${firstName},</p>
        
        <p>Here's an analysis of your children's study habits and patterns:</p>
        
        ${childrenHtml}
        
        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #1e293b;">Tips for Better Study Habits</h3>
          <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
            <li>Encourage consistent daily study time</li>
            <li>Help establish a regular study schedule</li>
            <li>Celebrate study streaks to maintain motivation</li>
            <li>Create a quiet, distraction-free study environment</li>
          </ul>
        </div>
        
        <p>Best regards,</p>
        <p>LearnQuest Team</p>
      </div>
    `;

    await this.sendEmail({ to: email, subject, html });
  }

  async sendParentBehavioralInsightsEmail(
    email: string,
    firstName: string,
    reportData: {
      period: string;
      children: Array<{
        name: string;
        engagementLevel: string;
        motivationTrend: string;
        focusAreas: string[];
        achievements: string[];
        recommendations: string[];
      }>;
    }
  ): Promise<void> {
    const subject = `Your Children's ${reportData.period} Behavioral Insights Report`;

    const childrenHtml = reportData.children
      .map(
        (child) => `
      <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #f59e0b;">
        <h3 style="margin: 0 0 10px 0; color: #1e293b;">${child.name}</h3>
        <div style="display: grid; gap: 10px; font-size: 14px; margin-bottom: 15px;">
          <div><strong>Engagement Level:</strong> <span style="color: #059669;">${child.engagementLevel}</span></div>
          <div><strong>Motivation Trend:</strong> ${child.motivationTrend}</div>
        </div>
        ${
          child.achievements.length > 0
            ? `
          <div style="margin: 10px 0;">
            <strong>Achievements:</strong>
            <ul style="margin: 5px 0; padding-left: 20px;">
              ${child.achievements.map((achievement) => `<li>${achievement}</li>`).join('')}
            </ul>
          </div>
        `
            : ''
        }
        ${
          child.recommendations.length > 0
            ? `
          <div style="margin: 10px 0; padding: 10px; background-color: #fef3c7; border-radius: 4px;">
            <strong>Recommendations:</strong>
            <ul style="margin: 5px 0; padding-left: 20px;">
              ${child.recommendations.map((rec) => `<li>${rec}</li>`).join('')}
            </ul>
          </div>
        `
            : ''
        }
      </div>
    `
      )
      .join('');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #f59e0b;">Your Children's ${reportData.period} Behavioral Insights</h1>
        <p>Hi ${firstName},</p>
        
        <p>Here's an analysis of your children's learning behavior and engagement patterns:</p>
        
        ${childrenHtml}
        
        <p>These insights help you understand how your children are engaging with their learning and where they might need additional support.</p>
        
        <p>Best regards,</p>
        <p>LearnQuest Team</p>
      </div>
    `;

    await this.sendEmail({ to: email, subject, html });
  }

  /**
   * Send weekly progress email to parent (MVP - Simplified)
   */
  async sendParentWeeklyProgressEmail(
    email: string,
    firstName: string,
    reportData: {
      weekStart: string;
      weekEnd: string;
      children: Array<{
        name: string;
        streak: number;
        goalProgress: number;
        commitmentsCompleted: number;
        commitmentsTotal: number;
        consistencyScore: number;
        status: 'on-track' | 'needs-attention' | 'at-risk';
        lastLoginAt?: Date | string;
      }>;
    }
  ): Promise<void> {
    const subject = `Weekly Progress Report - Week of ${reportData.weekStart}`;

    const getStatusEmoji = (status: string) => {
      switch (status) {
        case 'on-track':
          return '🟢';
        case 'needs-attention':
          return '🟡';
        case 'at-risk':
          return '🔴';
        default:
          return '⚪';
      }
    };

    const getStatusText = (status: string) => {
      switch (status) {
        case 'on-track':
          return 'On Track';
        case 'needs-attention':
          return 'Needs Attention';
        case 'at-risk':
          return 'At Risk';
        default:
          return 'Unknown';
      }
    };

    const childrenHtml = reportData.children
      .map((child) => {
        const statusEmoji = getStatusEmoji(child.status);
        const statusText = getStatusText(child.status);
        const commitmentRate =
          child.commitmentsTotal > 0
            ? Math.round((child.commitmentsCompleted / child.commitmentsTotal) * 100)
            : 0;

        return `
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${child.status === 'on-track' ? '#22c55e' : child.status === 'needs-attention' ? '#f59e0b' : '#ef4444'};">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h3 style="margin: 0; color: #1e293b; font-size: 18px;">${child.name}</h3>
            <span style="background-color: ${child.status === 'on-track' ? '#dcfce7' : child.status === 'needs-attention' ? '#fef3c7' : '#fee2e2'}; color: ${child.status === 'on-track' ? '#166534' : child.status === 'needs-attention' ? '#92400e' : '#991b1b'}; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">
              ${statusEmoji} ${statusText}
            </span>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 14px;">
            <div>
              <div style="color: #64748b; margin-bottom: 5px;">🔥 Current Streak</div>
              <div style="font-weight: 600; color: #1e293b; font-size: 16px;">${child.streak} ${child.streak === 1 ? 'day' : 'days'}</div>
            </div>
            
            <div>
              <div style="color: #64748b; margin-bottom: 5px;">🎯 Goal Progress</div>
              <div style="font-weight: 600; color: #1e293b; font-size: 16px;">${child.goalProgress}%</div>
            </div>
            
            <div>
              <div style="color: #64748b; margin-bottom: 5px;">✅ Commitments</div>
              <div style="font-weight: 600; color: #1e293b; font-size: 16px;">${child.commitmentsCompleted}/${child.commitmentsTotal} (${commitmentRate}%)</div>
            </div>
            
            <div>
              <div style="color: #64748b; margin-bottom: 5px;">📈 Consistency</div>
              <div style="font-weight: 600; color: #1e293b; font-size: 16px;">${child.consistencyScore}%</div>
            </div>
          </div>
          
          ${
            child.status === 'at-risk'
              ? `
            <div style="background-color: #fee2e2; padding: 12px; border-radius: 6px; margin-top: 15px; border-left: 3px solid #ef4444;">
              <div style="font-weight: 600; color: #991b1b; margin-bottom: 5px;">⚠️ Action Needed</div>
              <div style="font-size: 13px; color: #7f1d1d;">
                Your child may need additional support. Their tutor has been notified and will reach out to provide guidance.
              </div>
            </div>
          `
              : child.status === 'needs-attention'
                ? `
            <div style="background-color: #fef3c7; padding: 12px; border-radius: 6px; margin-top: 15px; border-left: 3px solid #f59e0b;">
              <div style="font-weight: 600; color: #92400e; margin-bottom: 5px;">💡 Keep Encouraging</div>
              <div style="font-size: 13px; color: #78350f;">
                Your child is making progress but could benefit from more consistent engagement. Keep encouraging them!
              </div>
            </div>
          `
                : `
            <div style="background-color: #dcfce7; padding: 12px; border-radius: 6px; margin-top: 15px; border-left: 3px solid #22c55e;">
              <div style="font-weight: 600; color: #166534; margin-bottom: 5px;">🌟 Great Progress!</div>
              <div style="font-size: 13px; color: #14532d;">
                Your child is doing well! Keep up the great work and continue supporting their learning journey.
              </div>
            </div>
          `
          }
        </div>
      `;
      })
      .join('');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">📊 Weekly Progress Report</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Week of ${reportData.weekStart} - ${reportData.weekEnd}</p>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <p style="color: #1e293b; font-size: 16px; margin: 0 0 20px 0;">Hi ${firstName},</p>
          
          <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 25px 0;">
            Here's a summary of your ${reportData.children.length === 1 ? 'child' : 'children'}'s learning progress this week. 
            ${
              reportData.children.some((c) => c.status === 'at-risk')
                ? 'Some children may need additional support - their tutors have been notified.'
                : 'Keep encouraging consistent learning!'
            }
          </p>
          
          ${childrenHtml}
          
          <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 30px 0; text-align: center;">
            <p style="color: #475569; font-size: 14px; margin: 0 0 10px 0; font-weight: 600;">💡 Remember</p>
            <p style="color: #64748b; font-size: 13px; margin: 0; line-height: 1.6;">
              Your child's tutor is actively monitoring their progress and will reach out if additional support is needed. 
              Consistent learning and encouragement from home make a huge difference!
            </p>
          </div>
          
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
            <p style="color: #64748b; font-size: 12px; margin: 0 0 5px 0;">Questions or concerns?</p>
            <p style="color: #64748b; font-size: 12px; margin: 0;">
              Contact your child's tutor directly through the platform or reach out to our support team.
            </p>
          </div>
          
          <p style="color: #64748b; font-size: 14px; margin: 25px 0 0 0;">
            Best regards,<br>
            <strong style="color: #1e293b;">LearnQuest Team</strong>
          </p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px;">
          <p style="margin: 0;">You're receiving this email because you're registered as a parent/guardian.</p>
          <p style="margin: 5px 0 0 0;">This is an automated weekly report. You can contact support to adjust email preferences.</p>
        </div>
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
export const sendParentProgressReportEmail = (
  email: string,
  firstName: string,
  reportData: {
    period: string;
    children: Array<{
      name: string;
      studyHours: number;
      quizzesCompleted: number;
      averageScore: number;
      progress: number;
      strongestSubject: string;
      weakestSubject: string;
    }>;
    familyTotalStudyHours: number;
    familyAverageProgress: number;
  }
) => emailService.sendParentProgressReportEmail(email, firstName, reportData);
export const sendParentStudyHabitsEmail = (
  email: string,
  firstName: string,
  reportData: {
    period: string;
    children: Array<{
      name: string;
      averageStudyTime: number;
      studyStreak: number;
      preferredStudyTime: string;
      mostActiveDay: string;
      consistencyScore: number;
    }>;
  }
) => emailService.sendParentStudyHabitsEmail(email, firstName, reportData);
export const sendParentBehavioralInsightsEmail = (
  email: string,
  firstName: string,
  reportData: {
    period: string;
    children: Array<{
      name: string;
      engagementLevel: string;
      motivationTrend: string;
      focusAreas: string[];
      achievements: string[];
      recommendations: string[];
    }>;
  }
) => emailService.sendParentBehavioralInsightsEmail(email, firstName, reportData);
export const sendParentWeeklyProgressEmail = (
  email: string,
  firstName: string,
  reportData: {
    weekStart: string;
    weekEnd: string;
    children: Array<{
      name: string;
      streak: number;
      goalProgress: number;
      commitmentsCompleted: number;
      commitmentsTotal: number;
      consistencyScore: number;
      status: 'on-track' | 'needs-attention' | 'at-risk';
      lastLoginAt?: Date | string;
    }>;
  }
) => emailService.sendParentWeeklyProgressEmail(email, firstName, reportData);

export default emailService;
