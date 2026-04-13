import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Hashids from 'hashids';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { In, Repository } from 'typeorm';
import { Logger } from 'winston';
import { ValidationService } from '../../common/validation.service';
import { ProductRequest, UpdateProductRequest } from '../../models/product.model';
import { User } from '../auth/entities/auth.entity';
import { Product } from './entities/product.entity';
import { Jeweltype } from './jeweltype/entities/jeweltype.entity';
import { ProductValidation } from './validation/product.validation';

@Injectable()
export class ProductService {
  constructor(
    private readonly validationService: ValidationService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Jeweltype)
    private readonly jeweltypeRepository: Repository<Jeweltype>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}
  private hashids = new Hashids(process.env.ID_SECRET, 20);

    // generate slug
    private async generatedSlug(name: string): Promise<string> {
        const baseSlug = name
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^\w-]+/g, '')
          .replace(/--+/g, '-')
          .replace(/^-+/, '')
          .replace(/-+$/, '');
    
        // Check if slug exists
        const checkSlug = async (attemptedSlug: string): Promise<string> => {
          const existingProduct = await this.productRepository.findOne({
            where: { slug: attemptedSlug },
          });
    
          if (!existingProduct) {
            return attemptedSlug;
          }
    
          // Find all slugs that match the base pattern
          const similarSlugs = await this.productRepository
            .createQueryBuilder('product')
            .where('product.slug LIKE :pattern', { pattern: `${baseSlug}%` })
            .getMany();
    
          if (similarSlugs.length === 0) {
            return `${baseSlug}-1`;
          }
    
          // Find the highest number suffix
          const numbers = similarSlugs
            .map(product => {
              const match = product.slug.match(new RegExp(`${baseSlug}-(\\d+)$`));
              return match ? parseInt(match[1]) : 0;
            })
            .filter(n => !isNaN(n));
    
          const highestNumber = Math.max(0, ...numbers);
          return `${baseSlug}-${highestNumber + 1}`;
        };
    
        return checkSlug(baseSlug);
      }

  // create product
  async createProduct(
    userId: string,
    productReq: ProductRequest,
  ): Promise<any> {
    try {
      let createReq: ProductRequest;
      try {
        createReq = await this.validationService.validate(
          ProductValidation.CREATEPRODUCT,
          productReq,
        );
      } catch (error: any) {
        this.logger.error('Invalid create jeweltype request');
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }

      const [findAuthor, findJeweltype] = await Promise.all([
        this.userRepository.findOne({
          where: {
            id: userId,
            role: { name: In(['admin', 'owner', 'developer']) },
          },
          relations: ['role'],
        }),
        this.jeweltypeRepository.findOne({
          where: {
            id: createReq.jeweltypeId,
          },
        }),
      ]);
      // check user authorization
      if (!findAuthor) {
        this.logger.error('User is not authorized to create products');
        throw new HttpException('User is not authorized to create products', HttpStatus.FORBIDDEN);
      }
      // check jeweltype
      if (!findJeweltype) {
        this.logger.error('Jeweltype not found');
        throw new HttpException('Jeweltype not found', HttpStatus.NOT_FOUND);
      }
      const generateSlug = await this.generatedSlug(createReq.name_product);
      // create product
      const newProduct = this.productRepository.create({
        id: this.hashids.encode(Date.now()),
        ...createReq,
        slug: generateSlug,
        video: Array.isArray(createReq.video)
          ? createReq.video
          : [],
        images: Array.isArray(createReq.images)
          ? createReq.images
          : [],
          jeweltype: {
            id: createReq.jeweltypeId,
          }
      });
      await this.productRepository.save(newProduct);

      this.logger.info({
        message: 'Product created successfully',
        data: {
          id: newProduct.id,
          ...newProduct,
          jeweltypeId: newProduct.jeweltype.id,
        },
      });

      return {
        message: 'Product created successfully',
        data: {
          id: newProduct?.id,
          ...newProduct,
          jeweltypeId: newProduct.jeweltype.id,
        },
      };
    } catch (error: any) {
      this.logger.error('Failed to create product', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to create product',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // find all product
  async findAllProduct(): Promise<any> {
    try {
      const findProduct = await this.productRepository.find({
        relations: ['jeweltype'],
      });
      if (!findProduct) {
        this.logger.error('Product not found');
        throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
      }
      this.logger.info({
        message: 'Product found successfully',
        data: findProduct,
      });
      return {
        message: 'Product found successfully',
        data: findProduct,
      };
    } catch (error: any) {
      this.logger.error('Failed to remove jeweltype', error.message);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to remove jeweltype',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // find product by id
  async findProduct(productId: string): Promise<any> {
    try {
      const findProduct = await this.productRepository.findOne({
        where: {
          id: productId,
        },
        relations: ['jeweltype'],
      });
      if (!findProduct) {
        this.logger.error('Product not found');
        throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
      }
      this.logger.info({
        message: 'Product found successfully',
        data: findProduct,
      });
      return {
        message: 'Product found successfully',
        data: findProduct,
      };
    } catch (error: any) {
      this.logger.error('Failed to find product', error.message);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to find product',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // update product
  async updateProduct(
    userId: string,
    productId: string,
    product: UpdateProductRequest,
  ): Promise<any> {
    try {
      // validation update product
      let updateReq: UpdateProductRequest;
      try {
        updateReq = await this.validationService.validate(
          ProductValidation.UPDATEPRODUCT,
          product,
        )
      } catch (error: any) {
        this.logger.error('Invalid update product request');
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }
      // find user author and product
      const [findAuthor, findProduct] = await Promise.all([
        this.userRepository.findOne({
          where: {
            id: userId,
            role: { name: In(['admin', 'owner', 'developer']) },
          },
          relations: ['role'],
        }),
        this.productRepository.findOne({
          where: {
            id: productId,
          },
          relations: ['jeweltype'],
        }),
      ]);
      // check user authorization and product
      if (!findAuthor) {
        this.logger.error('User is not authorized to update products');
        throw new HttpException('User is not authorized to update products', HttpStatus.FORBIDDEN);
      }
      if (!findProduct) {
        this.logger.error('Product not found');
        throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
      }
      // update product
      const updateProduct = await this.productRepository.save({
        ...findProduct,
        ...updateReq,
        slug: updateReq.name_product ? await this.generatedSlug(updateReq.name_product) : findProduct.slug,
        video: Array.isArray(updateReq.video)
         ? updateReq.video
          : [updateReq.video],
        images: Array.isArray(updateReq.images)
         ? updateReq.images
          : [updateReq.images],
      })

      this.logger.info({
        message: 'Product updated successfully',
        data: updateProduct,
      });
      return {
        message: 'Product updated successfully',
        data: updateProduct,
      };
    } catch (error: any) {
      this.logger.error('Failed to update product', error.message);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to update product',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // delete product
  async removeProduct(userId: string, productId: string): Promise<any> {
    try {
      // find user author and product
      const [findAuthor, findProduct] = await Promise.all([
        this.userRepository.findOne({
          where: {
            id: userId,
            role: { name: In(['admin', 'owner', 'developer']) },
          },
          relations: ['role'],
        }),
        this.productRepository.findOne({
          where: {
            id: productId,
          }, 
          relations: ['carts'],  
        }),
      ]);
      if (!findAuthor || !findProduct) {
        this.logger.error('User not authorized or Product not found');
        throw new HttpException('User not authorized or Product not found', HttpStatus.FORBIDDEN);
      }
      // check product has cart
      if (findProduct.carts && findProduct.carts.length > 0) {
        this.logger.error(`Product ${productId} is currently in a cart and cannot be deleted`);
        throw new HttpException(
          'This product is currently in a customer cart and cannot be deleted',
          HttpStatus.BAD_REQUEST
        );
      }
      // delete product
      await this.productRepository.remove(findProduct);
      this.logger.info({
        message: `Product ${productId} deleted successfully`,
      });
      return {
        message: `Product ${productId} deleted successfully`,
      }
    } catch (error: any) {
      this.logger.error('Failed to delete product', error.message);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to delete product',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
