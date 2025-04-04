import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { ValidationService } from '../../common/validation.service';
import { Logger } from 'winston';
import { Cart } from './entities/cart.entity';
import { Repository } from 'typeorm';
import { User } from '../auth/entities/auth.entity';
import { Product } from '../product/entities/product.entity';
import Hashids from 'hashids';
import { CartRequest, UpdateCartRequest } from '../../models/cart.model';
import { CartValidation } from './validation/cart.validation';

@Injectable()
export class CartService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly validationService: ValidationService,
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}
  private hashIds = new Hashids(process.env.ID_SECRET, 20);

  async addCart(userId: string, cartReq: CartRequest): Promise<any> {
    try {
      // validate request
      let createReq: CartRequest;
      try {
        createReq = await this.validationService.validate(
          CartValidation.CREATECART,
          cartReq,
        );
      } catch (error: any) {
        this.logger.error('Invalid request', error.message);
        throw new HttpException('Invalid request', HttpStatus.BAD_REQUEST);
      }

      const [findUser, findProduct, existingCart] = await Promise.all([
        this.userRepository.findOne({ where: { id: userId } }),
        this.productRepository.findOne({ where: { id: createReq.productId } }),
        this.cartRepository.findOne({
          where: {
            user: {
              id: userId,
            },
            product: {
              id: createReq.productId,
            },
          },
        }),
      ]);
      // find user
      if (!findUser) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      // check if product not found or stock ready is false
      if (!findProduct || findProduct.stock_ready === false) {
        throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
      }
      // if already have cart
      let result: any;
      if (existingCart) {
        // update cart
        existingCart.quantity += createReq.quantity;
        existingCart.total_price = existingCart.quantity * findProduct.price;
        result = await this.cartRepository.save(existingCart);
      } else {
        // create new cart
        const newCart = this.cartRepository.create({
          id: this.hashIds.encode(Date.now()),
          user: {
            id: userId,
          },
          product: {
            id: createReq.productId,
          },
          quantity: createReq.quantity,
          total_price: createReq.quantity * findProduct.price,
        });
        result = await this.cartRepository.save(newCart);
      }

      this.logger.info({
        message: 'Cart added successfully',
        data: result,
      });

      return {
        message: 'Cart added successfully',
        data: result,
      };
    } catch (error: any) {
      this.logger.error('Failed to add product to cart', error.message);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to add product to cart',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // find all cart by user
  async findCart(userId: string): Promise<any> {
    try {
      const [findUser, findCart] = await Promise.all([
        this.userRepository.findOne({ where: { id: userId } }),
        this.cartRepository.find({
          where: {
            user: {
              id: userId,
            },
          },
          relations: ['product'],
          select: {
            product: {
              id: true,
            },
            id: true, // Include the cart's i
            quantity: true,
            total_price: true,
          },
        }),
      ]);
      // if user not found
      if (!findUser) {
        this.logger.error('User not found');
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      // if not found
      if (findCart.length === 0) {
        this.logger.error('Cart not found');
        throw new HttpException('Cart not found', HttpStatus.NOT_FOUND);
      }

      this.logger.info({
        message: 'Cart found successfully',
        data: findCart,
      });

      return {
        message: 'Cart found successfully',
        data: findCart,
      };
    } catch (error: any) {
      this.logger.error('Failed to find all product', error.message);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to find all product',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // update cart
  async updateCart(
    userId: string,
    cartId: string,
    action: 'increase' | 'decrease',
  ): Promise<any> {
    try {
      const [findUser, findCart] = await Promise.all([
        this.userRepository.findOne({ where: { id: userId } }),
        this.cartRepository.findOne({
          where: {
            id: cartId,
            user: {
              id: userId,
            },
          },
          relations: ['product', 'user'],
        }),
      ]);
      // if user not found
      if (!findUser) {
        this.logger.error('User not found');
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      // if cart not found
      if (!findCart || findCart.user.id !== userId) {
        this.logger.error('Cart not found or user not match');
        throw new HttpException(
          'Cart not found or user not match',
          HttpStatus.NOT_FOUND,
        );
      }

      // check stock ready or not
      if (findCart.product.stock_ready === false) {
        this.logger.error('Product stock not ready');
        throw new HttpException('Product stock not ready', HttpStatus.NOT_FOUND);
      }
  
      // 🚀 Update quantity
      if (action === 'increase') {
        findCart.quantity += 1;
      } else {
        if (findCart.quantity === 1) {
          await this.cartRepository.remove(findCart);
          this.logger.info({
            message: 'Item removed from cart',
          })
          return { message: 'Item removed from cart' };
        }
        findCart.quantity -= 1;
      }

      // 🔄 Update total price
      findCart.total_price = findCart.quantity * findCart.product.price;

      const result = await this.cartRepository.save(findCart);

      this.logger.info({
        message: 'Cart updated successfully',
        data: {
          id: result.id,
          productId: result.product.id,
          quantity: result.quantity,
          total_price: result.total_price,
          createdAt: result.createdAt,
          updatedAt: result.updatedAt,
        }
      });

      return {
        message: 'Cart updated successfully',
        data: {
          id: result.id,
          productId: result.product.id,
          quantity: result.quantity,
          total_price: result.total_price,
          createdAt: result.createdAt,
          updatedAt: result.updatedAt,
        }
      };
    } catch (error: any) {
      this.logger.error('Failed to update cart', error.message);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to update cart',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Remove product from cart
  async removeFromCart(userId: string, cartId: string): Promise<any> {
    try {
      const cart = await this.cartRepository.findOne({
        where: { id: cartId, user: { id: userId } },
        relations: ['product', 'user'],
      });

      if (!cart || cart.user.id !== userId) {
        this.logger.error('Cart not found or user not match');
        throw new HttpException(
          'Cart not found or user not match',
          HttpStatus.NOT_FOUND,
        );
      }

      await this.cartRepository.remove(cart);

      this.logger.info({
        message: 'Product removed from cart successfully',
      });

      return {
        message: 'Product removed from cart successfully',
      };
    } catch (error: any) {
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
}
