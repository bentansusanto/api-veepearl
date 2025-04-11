import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { ValidationService } from '../../common/validation.service';
import { Logger } from 'winston';
import {
  Order,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ShippingMethod,
} from './entities/order.entity';
import { Repository } from 'typeorm';
import { Cart } from '../cart/entities/cart.entity';
import { Pemesan } from '../pemesan/entities/pemesan.entity';
import { User, UserRole } from '../auth/entities/auth.entity';
import Hashids from 'hashids';
import { OrderRequest } from '../../models/order.model';
import { OrderValidation } from './validation/order.validation';
import { randomInt } from 'crypto';
import { SendMailService } from '../../common/send-mail.service';
import { EmailOrders } from '../../common/subject-email.config';

@Injectable()
export class OrderService {
  constructor(
    private readonly validationService: ValidationService,
    private readonly sendMailService: SendMailService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(Pemesan)
    private readonly pemesanRepository: Repository<Pemesan>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}
  private hashIds = new Hashids(process.env.ID_SECRET, 20);

  // generate order code
  private async generateOrderCode(): Promise<string> {
    try {
      const randomCode = randomInt(1000, 9999);
      const existingOrder = await this.orderRepository.findOne({
        where: { order_code: randomCode.toString() },
      });

      if (existingOrder) {
        return this.generateOrderCode();
      }

      return randomCode.toString();
    } catch (error: any) {
      this.logger.error(error.message);
      throw new HttpException(
        'Failed to generate order code',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // authorization paypal
  private async authorizationPaypal() {
    const authResponse = await fetch(
      `${process.env.PAYPAL_API}/v1/oauth2/token`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`,
          ).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      },
    );

    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      throw new Error(`PayPal Auth Error: ${errorText}`);
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    return accessToken;
  }

  // create paypal order
  private async payPalOrder(orderId: string, totalPrice: number) {
    // Dapatkan token akses dari PayPal
    const accessToken = await this.authorizationPaypal();

    // Buat order di PayPal
    const orderResponse = await fetch(
      `${process.env.PAYPAL_API}/v2/checkout/orders`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [
            {
              amount: {
                currency_code: 'USD',
                value: totalPrice.toFixed(2),
              },
              description: `Order ID: ${orderId}`,
            },
          ],
          application_context: {
            // return_url: `${process.env.FRONTEND_URL}/checkout/?orderId=${orderId}`,
            // cancel_url: `${process.env.FRONTEND_URL}`,
            return_url: `https://veepearls.com/checkout/?orderId=${orderId}`,
            cancel_url: `https://veepearls.com`,
            shipping_preference: 'NO_SHIPPING',
            user_action: 'PAY_NOW',
            brand_name: 'veepearls.com',
          },
        }),
      },
    );

    const orderData = await orderResponse.json();
    if (!orderResponse.ok) {
      throw new Error(`PayPal Order Error: ${JSON.stringify(orderData)}`);
    }

    const payerEmail =
      orderData?.purchase_units?.[0]?.payee?.email_address || null;

    // Return approval link untuk redirect user
    return {
      approval_url: orderData.links.find((link: any) => link.rel === 'approve')
        .href,
      paypal_order_id: orderData.id,
      payer_email: payerEmail,
    };
  }

  private buildOrderHtml(cart: any[], order: Order): string {
    return `
      <div style="margin-bottom: 10px;">
        <p><strong>Order Code:</strong> ${order.order_code}</p>
        <p><strong>Total Price:</strong> ${order.amount}</p>
        <ul>
          ${cart.map(item => `
            <li>
              <strong>Product:</strong> ${item.product.name_product}, 
              <strong>Qty:</strong> ${item.quantity}
            </li>`).join('')
          }
        </ul>
        <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString('id-ID', {
          weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
        })}</p>
      </div>
    `;
  }
  

  // create order product
  async createOrderPaypal(userId: string, orderReq: OrderRequest): Promise<any> {
    try {
      let createReq: OrderRequest;
      try {
        createReq = this.validationService.validate(
          OrderValidation.CREATEORDER,
          orderReq,
        );
      } catch (error: any) {
        this.logger.error('Invalid request create order');
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }
      // find user, pemesan, cart, order
      const [findUser, findPemesan, findCart] = await Promise.all([
        this.userRepository.findOne({ where: { id: userId } }),
        this.pemesanRepository.findOne({
          where: {
            id: createReq.pemesanId,
          },
          relations: ['user'],
        }),
        this.cartRepository.find({
          where: { user: { id: userId } },
          relations: ['product'],
        }),
      ]);
      // check if user or pemesan not found
      if (!findUser) {
        this.logger.error('User not found');
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      if (!findPemesan) {
        this.logger.error('Pemesan not found');
        throw new HttpException('Pemesan not found', HttpStatus.NOT_FOUND);
      }
      // check if cart not found
      if (findCart.length === 0) {
        this.logger.error('Cart not found');
        throw new HttpException('Cart not found', HttpStatus.NOT_FOUND);
      }

      const totalPrice = findCart.reduce(
        (sum, cart) => sum + cart.total_price,
        0,
      );
      console.log('Total Price:', totalPrice); // Debugging
      if (isNaN(totalPrice) || totalPrice <= 0) {
        throw new HttpException(
          'Total price is invalid',
          HttpStatus.BAD_REQUEST,
        );
      }

      const orderCode = `#${await this.generateOrderCode()}`;
      const newOrder = this.orderRepository.create({
        id: this.hashIds.encode(Date.now()),
        pemesan: {
          id: findPemesan.id,
        },
        user: {
          id: findUser.id,
        },
        payment_method: PaymentMethod.PAYPAL,
        shipping_method: createReq.shipping_method || ShippingMethod.STANDARD,
        order_code: orderCode,
        carts: findCart,
        amount: totalPrice,
      });

      await this.orderRepository.save(newOrder);

      // const orders = `
      //         <div style="margin-bottom: 10px;">
      //           <p><strong>Oder Code:#</strong> ${
      //             newOrder.order_code
      //           }</p>
      //           <p><strong>Total Price:#</strong> ${
      //             newOrder.amount
      //           }</p>
      //           <div><strong>List product:</strong> 
      //             <ul>
      //               ${findCart.map((list:any) => (
      //                 `<li>
      //                    <p><strong>Product Name:</strong> ${list.product.name_product}</p>
      //                    <p><strong>Quantity:</strong> ${list.quantity}</p>
      //                 </li>`
      //               ))}
      //             </ul>
      //           </div>
      //           <p><strong>Date:</strong> ${new Date(
      //             newOrder.createdAt
      //           ).toLocaleDateString("id-ID", {
      //             weekday: "short", // "Sun"
      //             day: "2-digit", // "12"
      //             month: "short", // "Des"
      //             year: "numeric", // "2025"
      //           })}</p>
      //           <hr style="border: 0; border-top: 1px solid #ddd;" />
      //         </div>
      //       `;

      await this.sendMailService.sendOrderNotification(EmailOrders.ORDER_PRODUCT, {
        orderCode: newOrder.order_code,
        email: findPemesan.email,
        customerName: findPemesan.name,
        totalAmount: newOrder.amount,
        orderDetails: this.buildOrderHtml(findCart, newOrder),
        paymentMethod: newOrder.payment_method,
        paymentStatus: newOrder.payment_status,
        subjectMessage: `New orders from ${newOrder.pemesan.name}`
      })

      const paypalOrder = await this.payPalOrder(
        newOrder.id,
        totalPrice,
      );

      this.logger.info({
        message: 'Order paypay created successfully',
        data: {
          id: newOrder.id,
          order_code: newOrder.order_code,
          payment_method: newOrder.payment_method,
          pemesanId: newOrder.pemesan.id,
          amount: newOrder.amount,
          transactionId: paypalOrder.paypal_order_id,
          payerEmail: paypalOrder.payer_email,
          redirect_url: paypalOrder.approval_url,
        },
      });
      return {
        message: 'Order papay created successfully',
        data: {
          id: newOrder.id,
          order_code: newOrder.order_code,
          payment_method: newOrder.payment_method,
          pemesanId: newOrder.pemesan.id,
          amount: newOrder.amount,
          transactionId: paypalOrder.paypal_order_id,
          payerEmail: paypalOrder.payer_email,
          redirect_url: paypalOrder.approval_url,
        },
      };
      
    } catch (error: any) {
      this.logger.error('Failed to create order', error.message);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to create order',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createOrderCod(userId: string, orderReq: OrderRequest): Promise<any> {
    try {
      let createReq: OrderRequest;
      try {
        createReq = this.validationService.validate(
          OrderValidation.CREATEORDER,
          orderReq,
        );
      } catch (error: any) {
        this.logger.error('Invalid request create order');
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }
      // find user, pemesan, cart, order
      const [findUser, findPemesan, findCart] = await Promise.all([
        this.userRepository.findOne({ where: { id: userId } }),
        this.pemesanRepository.findOne({
          where: {
            id: createReq.pemesanId,
          },
          relations: ['user'],
        }),
        this.cartRepository.find({
          where: { user: { id: userId } },
          relations: ['product'],
        }),
      ]);
      // check if user or pemesan not found
      if (!findUser) {
        this.logger.error('User not found');
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      if (!findPemesan) {
        this.logger.error('Pemesan not found');
        throw new HttpException('Pemesan not found', HttpStatus.NOT_FOUND);
      }
      // check if cart not found
      if (findCart.length === 0) {
        this.logger.error('Cart not found');
        throw new HttpException('Cart not found', HttpStatus.NOT_FOUND);
      }

      const totalPrice = findCart.reduce(
        (sum, cart) => sum + cart.total_price,
        0,
      );
      console.log('Total Price:', totalPrice); // Debugging
      if (isNaN(totalPrice) || totalPrice <= 0) {
        throw new HttpException(
          'Total price is invalid',
          HttpStatus.BAD_REQUEST,
        );
      }

      const orderCode = `#${await this.generateOrderCode()}`;
      const newOrder = this.orderRepository.create({
        id: this.hashIds.encode(Date.now()),
        pemesan: {
          id: findPemesan.id,
        },
        user: {
          id: findUser.id,
        },
        payment_method: PaymentMethod.COD,
        shipping_method: createReq.shipping_method || ShippingMethod.STANDARD,
        order_code: orderCode,
        carts: findCart,
        amount: totalPrice,
      });

      await this.orderRepository.save(newOrder);

      const orders = `
              <div style="margin-bottom: 10px;">
                <p><strong>Oder Code:#</strong> ${
                  newOrder.order_code
                }</p>
                <p><strong>Total Price:#</strong> ${
                  newOrder.amount
                }</p>
                <div><strong>List product:</strong> 
                  <ul>
                    ${findCart.map((list:any) => (
                      `<li>
                         <p><strong>Product Name:</strong> ${list.product.name_product}</p>
                         <p><strong>Quantity:</strong> ${list.quantity}</p>
                      </li>`
                    ))}
                  </ul>
                </div>
                <p><strong>Date:</strong> ${new Date(
                  newOrder.createdAt
                ).toLocaleDateString("id-ID", {
                  weekday: "short", // "Sun"
                  day: "2-digit", // "12"
                  month: "short", // "Des"
                  year: "numeric", // "2025"
                })}</p>
                <hr style="border: 0; border-top: 1px solid #ddd;" />
              </div>
            `;

      await this.sendMailService.sendOrderNotification(EmailOrders.ORDER_PRODUCT, {
        orderCode: newOrder.order_code,
        email: findPemesan.email,
        customerName: findPemesan.name,
        totalAmount: newOrder.amount,
        orderDetails: orders,
        paymentMethod: newOrder.payment_method,
        paymentStatus: newOrder.payment_status,
        subjectMessage: `New orders from ${newOrder.pemesan.name}`
      })

      await this.orderRepository.update(newOrder.id, {
        order_status: OrderStatus.SHIPPED
      })
      
      this.logger.info({
        message: 'Order created successfully',
        data: {
          id: newOrder.id,
          order_code: newOrder.order_code,
          payment_method: newOrder.payment_method,
          pemesanId: newOrder.pemesan.id,
          amount: newOrder.amount,
          order_status: OrderStatus.SHIPPED,
          payment_status: PaymentStatus.PENDING
        },
      });
      return {
        message: 'Order papay created successfully',
        data: {
          id: newOrder.id,
          order_code: newOrder.order_code,
          payment_method: newOrder.payment_method,
          pemesanId: newOrder.pemesan.id,
          amount: newOrder.amount,
          order_status: OrderStatus.SHIPPED,
          payment_status: PaymentStatus.PENDING
        },
      };
    } catch (error: any) {
      this.logger.error('Failed to create order', error.message);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to create order',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // capture payment paypal
  private async capturePaypalPayment(transactionId: string) {
    const accessToken = await this.authorizationPaypal();
    const captureResponse = await fetch(
      `${process.env.PAYPAL_API}/v2/checkout/orders/${transactionId}/capture`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );
    const captureData = await captureResponse.json();
  console.log('📦 PayPal Capture Response:', JSON.stringify(captureData, null, 2));

    if (captureData.status !== 'COMPLETED') {
      throw new Error('Payment capture not completed');
    }

    // Step 4: Extract payer email from response
    const payerEmail = captureData.payer?.email_address || null;
    console.log(payerEmail)

    return {
      payerEmail,
    };
  }

  // capture payment
  async capturePayment(userId: string, transactionId: string): Promise<any> {
    try {
      const capture = await this.capturePaypalPayment(transactionId);
      const findOrder = await this.orderRepository.findOne({
        where: {
          user: {
            id: userId,
          },
          transactionId,
        },
        relations: ['user'],
      });
      if (!findOrder || findOrder.user.id !== userId) {
        this.logger.error('Order not found or user not match');
        throw new HttpException(
          'Order not found or user not match',
          HttpStatus.NOT_FOUND,
        );
      }

      // get data from capture
      findOrder.payerEmail = capture.payerEmail;
      const result = await this.orderRepository.save(findOrder);
      return {
        message: 'Payment captured successfully',
        data: {
          id: result.id,
          payerEmail: result.payerEmail,
          transactionId: result.transactionId,
        },
      };
    } catch (error: any) {
      this.logger.error('Failed to capture payment');
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.stack || 'Failed to capture payment',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // verify payment paypal
  async verifyPaypalPayment(userId: string, token: string): Promise<any> {
    try {
      const accessToken = await this.authorizationPaypal();
      // Get PayPal order details
      const orderResponse = await fetch(
        `${process.env.PAYPAL_API}/v2/checkout/orders/${token}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!orderResponse.ok) {
        this.logger.error('Failed to get order details');
        throw new HttpException(
          'Failed to fetch order details from PayPal',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const orderData = await orderResponse.json();

      if (!orderData || !orderData.id || orderData.status !== 'COMPLETED') {
        this.logger.error("Order doesn't exist or is not completed");
        throw new HttpException(
          'Payment not completed or invalid PayPal response',
          HttpStatus.BAD_REQUEST,
        );
      }

      const findOrder = await this.orderRepository.findOne({
        where: {
          user: {
            id: userId,
          },
          transactionId: token,
        },
        relations: ['user', 'pemesan'],
      });
      if (!findOrder || findOrder.user.id !== userId) {
        this.logger.error("Order not found or user doesn't match");
        throw new HttpException(
          "Order not found or user doesn't match",
          HttpStatus.NOT_FOUND,
        );
      }

      findOrder.payment_status = PaymentStatus.COMPLETED;
      findOrder.order_status = OrderStatus.SHIPPED;
       await this.orderRepository.save(findOrder);

      await this.sendMailService.sendOrderNotification(EmailOrders.PAYMENT_STATUS,{
        subjectMessage: `Status Payment Successfully`,
        paymentStatus: findOrder.payment_status,
        totalAmount: findOrder.amount,
        email: findOrder.pemesan.email,
        orderCode: findOrder.order_code,
        customerName: findOrder.pemesan.name,
        paymentMethod: findOrder.payment_method,
      })

      this.logger.info({
        message: `Order status updated to shipped for user ${userId}`,
        data: {
          id: findOrder.id,
          order_code: findOrder.order_code,
          amount: findOrder.amount,
          pemesanId: findOrder.user.id,
          order_status: findOrder.order_status,
          payment_method: findOrder.payment_method,
          payment_status: findOrder.payment_status,
          transactionId: findOrder.transactionId,
          shipping_method: findOrder.shipping_method,
          createdAt: findOrder.createdAt,
          updatedAt: findOrder.updatedAt,
        },
      });
      return {
        message: `Order status updated to shipped for user ${userId}`,
        data: {
          id: findOrder.id,
          order_code: findOrder.order_code,
          amount: findOrder.amount,
          pemesanId: findOrder.user.id,
          order_status: findOrder.order_status,
          payment_method: findOrder.payment_method,
          payment_status: findOrder.payment_status,
          transactionId: findOrder.transactionId,
          shipping_method: findOrder.shipping_method,
          createdAt: findOrder.createdAt,
          updatedAt: findOrder.updatedAt,
        },
      };
    } catch (error: any) {
      this.logger.error('Failed to verify payment paypal', error.message);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to verify payment paypal',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // confirm order from payment using paypal by user
  async confirmOrder(userId: string, orderId: string): Promise<any> {
    try {
      const findOrder = await this.orderRepository.findOne({
        where: {
          id: orderId,
          user: {
            id: userId,
          },
        },
        relations: ['user'],
      }); 
      if (!findOrder || findOrder.user.id!== userId) {
        this.logger.error('Order not found or user not match');
        throw new HttpException(
          'Order not found or user not match',
          HttpStatus.NOT_FOUND,
        );
      }
      findOrder.order_status = OrderStatus.DELIVERED;
      await this.orderRepository.save(findOrder);

      // send email notification to customer
      await this.sendMailService.sendOrderNotification(EmailOrders.PAYMENT_STATUS,{
        subjectMessage: `Status Payment Successfully`,
        paymentStatus: findOrder.payment_status,
        totalAmount: findOrder.amount,
        email: findOrder.pemesan.email,
        orderCode: findOrder.order_code,
        customerName: findOrder.pemesan.name,
        paymentMethod: findOrder.payment_method,
      })

      this.logger.info({
        message: `Order status updated to delivered for user ${userId}`,
        data: {
          id: findOrder.id,
          order_code: findOrder.order_code,
          amount: findOrder.amount,
          pemesanId: findOrder.user.id,
          order_status: findOrder.order_status,
          payment_status: findOrder.payment_status,
          payment_method: findOrder.payment_method,
          createdAt: findOrder.createdAt,
          updatedAt: findOrder.updatedAt,
        }
      })

      return{
        message: `Order status updated to delivered for user ${userId}`,
        data: {
          id: findOrder.id,
          order_code: findOrder.order_code,
          amount: findOrder.amount,
          pemesanId: findOrder.user.id,
          order_status: findOrder.order_status,
          payment_status: findOrder.payment_status,
          payment_method: findOrder.payment_method,
          createdAt: findOrder.createdAt,
          updatedAt: findOrder.updatedAt,
        }
      }
    } catch (error: any) {
      this.logger.error('Failed to confirm order', error.message);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to confirm order',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // verify payment COD by admin
  async verifyCODPayment(userId: string, orderId: string):Promise<any>{
    try {
      const [findUser, findOrder] = await Promise.all([
        this.userRepository.findOne({
          where: {
            id: userId,
            role: UserRole.ADMIN,
          }
        }),
        this.orderRepository.findOne({
          where: {
            id: orderId,
          }
        })
      ])
      if(!findUser){
        this.logger.error('User not found or not admin');
        throw new HttpException(
          'User not found or not admin',
          HttpStatus.FORBIDDEN,
        );
      }
      if(!findOrder){
        this.logger.error('Order not found');
        throw new HttpException(
          'Order not found',
          HttpStatus.NOT_FOUND,
        );
      }
      findOrder.payment_status = PaymentStatus.COMPLETED;
      findOrder.order_status = OrderStatus.DELIVERED;
      await this.orderRepository.save(findOrder);

      // send email notification to customer
      await this.sendMailService.sendOrderNotification(EmailOrders.PAYMENT_STATUS,{
        subjectMessage: `Status Payment Successfully`,
        paymentStatus: findOrder.payment_status,
        totalAmount: findOrder.amount,
        email: findOrder.pemesan.email,
        orderCode: findOrder.order_code,
        customerName: findOrder.pemesan.name,
        paymentMethod: findOrder.payment_method,
      })

      this.logger.info({
        message: `Order status updated to delivered for user ${userId}`,
        data: {
          id: findOrder.id,
          order_code: findOrder.order_code,
          amount: findOrder.amount,
          pemesanId: findOrder.user.id,
          order_status: findOrder.order_status,
          payment_status: findOrder.payment_status,
          payment_method: findOrder.payment_method,
          createdAt: findOrder.createdAt,
          updatedAt: findOrder.updatedAt,
        }
      })

      return{
        message: `Order status updated to delivered for user ${userId}`,
        data: {
          id: findOrder.id,
          order_code: findOrder.order_code,
          amount: findOrder.amount,
          pemesanId: findOrder.user.id,
          order_status: findOrder.order_status,
          payment_status: findOrder.payment_status,
          payment_method: findOrder.payment_method,
          createdAt: findOrder.createdAt,
          updatedAt: findOrder.updatedAt,
        }
      }
    } catch (error:any) {
      this.logger.error('Failed to remove product from cart', error.message);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to remove product from cart',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // get all history order by user as customer
  async findAllOrderByUser(userId: string): Promise<any> {
    try {
      const findOrder = await this.orderRepository.find({
        where: {
          user: {
            id: userId,
          },
        },
        select: {
          id: true,
          order_code: true,
          user: {
            id: true,
          },
          pemesan: {
            id: true,
          },
          order_status: true,
          payment_method: true,
          payment_status: true,
          transactionId: true,
          shipping_method: true,
          payerEmail: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      // check if order not found
      if (!findOrder || findOrder.length === 0) {
        this.logger.error('Order not found');
        throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
      }

      this.logger.info({
        message: `Get all order history for user ${userId}`,
        data: findOrder,
      });

      return {
        message: `Get all order history for user ${userId}`,
        data: findOrder,
      };
    } catch (error: any) {
      this.logger.error('Failed to find all order', error.message);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to find all order',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // get all history order by user as customer
  async findAllOrderByAdmin(userId: string): Promise<any> {
    try {
      const [findUser, findOrder] = await Promise.all([
        this.userRepository.findOne({
          where: { id: userId, role: UserRole.ADMIN },
        }),
        this.orderRepository.find({
          relations: ['user', 'pemesan'],
          select: {
            id: true,
            order_code: true,
            user: {
              id: true,
            },
            pemesan: {
              id: true,
            },
            order_status: true,
            payment_method: true,
            payment_status: true,
            transactionId: true,
            shipping_method: true,
            payerEmail: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
      ]);

      if (findUser.role !== UserRole.ADMIN) {
        this.logger.error('User is not admin');
        throw new HttpException('User is not admin', HttpStatus.FORBIDDEN);
      }
      if (!findOrder || findOrder.length === 0) {
        this.logger.error('Order not found');
        throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
      }

      this.logger.info({
        message: 'Get all order user',
        data: findOrder,
      });
      return {
        message: 'Get all order user',
        data: findOrder,
      };
    } catch (error: any) {
      this.logger.error('Failed to find all order', error.message);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to find all order',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} order`;
  }

  update(id: number) {
    return `This action updates a #${id} order`;
  }

  remove(id: number) {
    return `This action removes a #${id} order`;
  }
}
