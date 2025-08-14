import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ContactUsDto } from 'src/dto/contact-us.dto';
import { User } from 'prisma';
import { Resend } from 'resend';
@Injectable()
export class MailService {
  resend = new Resend(this.configService.get('RESEND'));

  constructor(private readonly configService: ConfigService) {}

  async sendEmail(to: string, subject: string, text: string): Promise<void> {
    try {
      await this.resend.emails.send({
        from: this.configService.get('EMAIL_FROM') || 'onboarding@resend.dev',
        to,
        subject,
        text,
      });
    } catch (error) {
      console.log(error);
    }
  }

  ///

  async contactUsAdmin(contact: ContactUsDto) {
    await this.resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'info@optimaconnect.io',
      subject: 'Contact Us',
      text: `${contact.firstName} ${contact.lastName} has contacted us`,
      html: `
          <h3>See the message below</h3>
          <p>${contact.subject}</p>
          <p>${contact.message}</p>
          <p>You can reach out to ${contact.firstName} with this email ${contact.email}</p>
        `,
    });
  }

  async contactUs(contact: ContactUsDto) {
    try {
      await this.resend.emails.send({
        from: 'onboarding@resend.dev',
        to: contact.email,
        subject: contact.subject,
        text: contact.message,
        html: `
          <h3>Hi ${contact.firstName},</h3>
          <p>Thank you for contacting Optima Connect</p>
          <p>Our Support team will respond to you shortly</p>
          <p>For any further assistance or if you have any questions, please don't hesitate to reach out to our support team at info@optimaconnect.io</p>
          <p>Thank you for using Optima Connect.</p>
          <p>Best regards,</p>
          <p>Optima Support</p>
        `,
      });
      this.contactUsAdmin(contact);
    } catch (error) {
      console.log(error);
    }
  }

  async verificationMessage(user: User, code: string): Promise<void> {
    try {
      const mailOptions = {
        from: 'onboarding@resend.dev',
        to: user.email,
        subject: 'Optima Connect Account Verification',
        text: `Hello. This email is to verify your credentials in Optima Connect account.`,
        html: `
          <h3>Dear ${user.name},</h3>
          <p>Your account has been created successfully</p>
          <p>Please enter OTP: ${code}</p>
          <p>If you did not request this, please ignore this email. Your account is still secure, and no changes have been made.</p>
          <p>For any further assistance or if you have any questions, please don't hesitate to reach out to our support team at info@optimaconnect.io</p>
          <p>Thank you for using Optima Connect.</p>
          <p>Best regards,</p>
          <p>Optima Support</p>
        `,
      };

      await this.resend.emails.send(mailOptions);
    } catch (error) {
      throw new HttpException('Failed to send otp', 400);
    }
  }

  async syncLogMessage(email: string, message: string): Promise<void> {
    try {
      const mailOptions = {
        from: 'onboarding@resend.dev',
        to: process.env.NODE_ENV === 'production' ? email : 'onosgb@gmail.com',
        subject: 'Optima Connect Sync',
        text: `Hello. This email is for your sync log in Optima Connect.`,
        html: `
          <h3>Hi Dear!</h3>
          <p>${message}</p>
          <p>For any further assistance or if you have any questions, please don't hesitate to reach out to our support team at Info@optimaconnect.io</p>
          <p>Thank you for using Optima Connect.</p>
          <p>Best regards,</p>
          <p>Optima Support</p>
        `,
      };

      await this.resend.emails.send(mailOptions);
    } catch (error) {
      console.log('error: ', error);
      throw new HttpException('Failed to send otp', 400);
    }
  }
}
