import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetProductsUseCase } from '../application/use-cases/get-products.use-case';
import { GetProductByIdUseCase } from '../application/use-cases/get-product-by-id.use-case';
import {
  ProductResponseDto,
  toProductResponseDto,
} from './dto/product-response.dto';
import {
  NotFoundError,
  ValidationError,
} from '../../../shared/errors/domain-errors';

@ApiTags('Productos')
@Controller('products')
export class ProductController {
  constructor(
    private readonly gerProductsUseCase: GetProductsUseCase,
    private readonly getProductByIdUseCase: GetProductByIdUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todos los productos con stock' })
  @ApiResponse({
    status: 200,
    description: 'Lista de productos obtenida exitosamente.',
    type: [ProductResponseDto],
  })
  async findAll(@Res() res: Response) {
    const result = await this.gerProductsUseCase.execute();

    if (result.isFailure) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: result.error.message,
      });
    }

    const products = result.value.map(toProductResponseDto);

    return res.status(HttpStatus.OK).json({
      success: true,
      data: products,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un producto por ID' })
  @ApiParam({ name: 'id', description: 'UUID del producto' })
  @ApiResponse({ status: 200, description: 'Producto encontrado' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const result = await this.getProductByIdUseCase.execute(id);

    if (result.isFailure) {
      const error = result.error;

      if (error instanceof NotFoundError) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json({ success: false, message: error.message });
      }
      if (error instanceof ValidationError) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ success: false, message: error.message });
      }

      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: error.message });
    }

    return res.status(HttpStatus.OK).json({
      success: true,
      data: toProductResponseDto(result.value),
    });
  }
}
