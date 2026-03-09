import { ProductController } from './product.controller';
import { GetProductsUseCase } from '../application/use-cases/get-products.use-case';
import { GetProductByIdUseCase } from '../application/use-cases/get-product-by-id.use-case';
import { Product } from '../domain/entities/product';
import { Result } from '../../../shared/result';
import { NotFoundError, ValidationError } from '../../../shared/errors/domain-errors';
import { HttpStatus } from '@nestjs/common';

const makeProduct = (id = 'uuid-1', stock = 3) =>
  new Product(id, 'Producto', 'Desc', 10000, 'img.jpg', stock, new Date());

const makeResponse = () => {
  const json = jest.fn().mockReturnThis();
  const status = jest.fn().mockReturnValue({ json });
  return { status, json } as any;
};

describe('ProductController', () => {
  let controller: ProductController;
  let getProductsUseCase: jest.Mocked<GetProductsUseCase>;
  let getProductByIdUseCase: jest.Mocked<GetProductByIdUseCase>;

  beforeEach(() => {
    getProductsUseCase = { execute: jest.fn() } as any;
    getProductByIdUseCase = { execute: jest.fn() } as any;
    controller = new ProductController(getProductsUseCase, getProductByIdUseCase);
  });

  describe('findAll', () => {
    it('returns 200 with products list on success', async () => {
      const products = [makeProduct('1'), makeProduct('2')];
      getProductsUseCase.execute.mockResolvedValue(Result.ok(products));
      const res = makeResponse();

      await controller.findAll(res);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.status(HttpStatus.OK).json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true }),
      );
    });

    it('returns 500 when use case fails', async () => {
      getProductsUseCase.execute.mockResolvedValue(
        Result.fail(new Error('DB error')),
      );
      const res = makeResponse();

      await controller.findAll(res);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('findOne', () => {
    it('returns 200 with product on success', async () => {
      const product = makeProduct();
      getProductByIdUseCase.execute.mockResolvedValue(Result.ok(product));
      const res = makeResponse();

      await controller.findOne('uuid-1', res);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.status(HttpStatus.OK).json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true }),
      );
    });

    it('returns 404 when NotFoundError', async () => {
      getProductByIdUseCase.execute.mockResolvedValue(
        Result.fail(new NotFoundError('Producto', 'uuid-1')),
      );
      const res = makeResponse();

      await controller.findOne('uuid-1', res);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    });

    it('returns 400 when ValidationError', async () => {
      getProductByIdUseCase.execute.mockResolvedValue(
        Result.fail(new ValidationError('ID inválido')),
      );
      const res = makeResponse();

      await controller.findOne('', res);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    });

    it('returns 500 for generic errors', async () => {
      getProductByIdUseCase.execute.mockResolvedValue(
        Result.fail(new Error('Unexpected')),
      );
      const res = makeResponse();

      await controller.findOne('uuid-1', res);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });
});
