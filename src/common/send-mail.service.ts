import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import nodemailer from 'nodemailer';
import { Logger } from 'winston';
import { EmailOrders, EmailType } from './subject-email.config';
import { SendMailOptions, SendOrderProduct } from '../models/send-mail.model';

@Injectable()
export class SendMailService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}
  private transporter = nodemailer.createTransport({
    host: 'mail.veepearls.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.USERNAME ?? "sales@veepearls.com", // Pastikan sesuai dengan email CPanel
      pass: process.env.PASSWORD ?? "Office123456!",
    },
  });

  async sendMail(type: EmailType, options: SendMailOptions) {
    const { email, otpCode, subjectMessage } = options;

    let subject = '';
    let htmlContent = '';

    switch (type) {
      case EmailType.VERIFY_ACCOUNT:
        subject = subjectMessage;
        htmlContent = `<div style="font-family: Arial, sans-serif; text-align: center;">
                    <p>${subjectMessage}</p>
                    <p>Gunakan kode OTP berikut:</p>
                    <h2 style="background: #f4f4f4; display: inline-block; padding: 10px; border-radius: 5px;">${otpCode}</h2>
                    <p>Kode ini berlaku hanya dalam beberapa menit.</p>
                </div>`;
        break;

      case EmailType.VERIFY_OTP:
        subject = subjectMessage;
        htmlContent = `<div style="font-family: Arial, sans-serif; text-align: center;">
                    <p>${subjectMessage}</p>
                    <p>Gunakan kode OTP berikut:</p>
                    <h2 style="background: #f4f4f4; display: inline-block; padding: 10px; border-radius: 5px;">${otpCode}</h2>
                    <p>Kode ini berlaku hanya dalam beberapa menit.</p>
                </div>`;
        break;

      case EmailType.GENERATE_NEW_OTP:
        subject = subjectMessage;
        htmlContent = `<p>Use the following OTP code to proceed:</p><br/><h1>${otpCode}</h1>`;
        break;

      case EmailType.RESET_PASSWORD:
        subject = subjectMessage;
        htmlContent = `<p>Click the button below to reset your password:</p><br/><h1>${otpCode}</h1>`;
        break;

      default:
        this.logger.error('Invalid email type');
        throw new Error('Invalid email type');
    }

    const mailOptions = {
      from: process.env.USERNAME,
      to: email,
      subject,
      html: htmlContent,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.info(`Email sent to ${email} - Type: ${type}`);
    } catch (error: any) {
      this.logger.error(`Failed to send email: ${error.message}`);
      throw new HttpException(
        `Failed to send email: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async sendOrderNotification(
    type: EmailOrders,
    optionOrder: SendOrderProduct,
  ) {
    const {
      email,
      orderCode,
      customerName,
      totalAmount,
      orderDetails,
      paymentMethod,
      paymentStatus,
      subjectMessage,
    } = optionOrder;

    let subject = '';
    let htmlContent = '';

    switch (type) {
      case EmailOrders.ORDER_PRODUCT:
        subject = `Order Confirmation - ${orderCode}`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
                <h2 style="color: #333;">Your Order Confirmation</h2>
                <p>Hi <strong>${customerName}</strong>,</p>
                <p>Thank you for ordering with us. Your order with ID <strong>${orderCode}</strong> has been received.</p>
                <h3>Order Details:</h3>
                <div style="background: #f9f9f9; padding: 10px; border-radius: 5px;">${orderDetails}</div>
                    <p><strong>Total: $${totalAmount.toLocaleString('en-EN')}</strong></p>
                    <p>Payment Method: ${paymentMethod}</p>
                    <p>Please proceed with the payment using your selected method.</p>
                    <hr/>
                    <p style="font-size: 12px; color: #777;">This is an automated email, please do not reply.</p>
              </div>
            </div>`;
        break;

      case EmailOrders.PAYMENT_STATUS:
        subject = subjectMessage;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; text-align: center;">
            <p>${subjectMessage}</p>
            <p>Payment Status: <strong>${paymentStatus}</strong></p>
            <p><strong>Total: $${totalAmount.toLocaleString("en-EN")}</strong></p>
            <p>Thank you for your payment.</p>
          </div>`;
        break;

      default:
        this.logger.error('Invalid email type');
        throw new Error('Invalid email type');
    }

    const mailOptions = {
      from: process.env.USERNAME,
      to: email,
      subject,
      html: htmlContent,
    };

    const ownerEmail = process.env.OWNER_EMAIL;
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];

    const adminMailOptions = {
      from: process.env.USERNAME,
      to: ownerEmail,
      cc: adminEmails.filter(Boolean).join(','),
      subject:
        type === EmailOrders.ORDER_PRODUCT
          ? `New Orders - ${orderCode}`
          : `Payment Status - ${orderCode}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
          <h2 style="color: #d9534f;">${type === EmailOrders.ORDER_PRODUCT ? "New Orders" : "Payment Status"}</h2>
          <p><strong>Details:</strong></p>
          <ul>
            <li><strong>Order ID:</strong> ${orderCode}</li>
            <li><strong>Customer:</strong> ${customerName}</li>
            <li><strong>Total Payment:</strong> $${totalAmount.toLocaleString("en-EN")}</li>
            <li><strong>Payment Method:</strong> ${paymentMethod}</li>
            ${type === EmailOrders.PAYMENT_STATUS ? `<li><strong>Payment Status:</strong> ${paymentStatus}</li>` : ''}
          </ul>
          ${type === EmailOrders.ORDER_PRODUCT ? `<h3>Order Details:</h3>
          <div style="background: #f9f9f9; padding: 10px; border-radius: 5px;">${orderDetails}</div>` : ''}
          <p>${type === EmailOrders.ORDER_PRODUCT ? `The order is being processed for ${customerName}` : `The payment has been updated`}</p>
          <hr/>
          <p style="font-size: 12px; color: #777;">This is an automated email, please do not reply.</p>
        </div>`,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.info(`Email sent to ${email} - Type: ${type}`);

      await this.transporter.sendMail(adminMailOptions);
      this.logger.info(
        `Notification sent to owner: ${ownerEmail}, CC: ${adminEmails.join(', ')}`,
      );
    } catch (error: any) {
      this.logger.error(`Failed to send email: ${error.message}`);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }
}
