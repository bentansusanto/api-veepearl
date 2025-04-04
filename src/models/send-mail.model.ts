export class SendMailOptions {
  email: string;
  otpCode?: string;
  subjectMessage?: string;
  webhookInfo?: string;
}

export class SendOrderProduct {
  email: string;
  orderCode: string;
  customerName: string;
  totalAmount: number;
  orderDetails?: any;
  paymentMethod: string;
  paymentStatus: string;
  subjectMessage: string;
}

export class SendPaymentStatus {
  order_code: string;
  customerName: string;
  totalAmount: number;
  paymentStatus: string;
  subjectMessage: string;
}
