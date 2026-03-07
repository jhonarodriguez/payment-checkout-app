import { ApiProperty } from '@nestjs/swagger';
import { Product } from '../../domain/entities/product';

export class ProductResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID único del producto (UUID)',
  })
  id: string;

  @ApiProperty({ example: 'Audífonos Bluetooth Pro' })
  name: string;

  @ApiProperty({
    example: 'Audífonos inalámbricos con cancelación de ruido activa',
  })
  description: string;

  @ApiProperty({
    example: 15000000,
    description: 'Precio en centavos. $150.000 COP = 15000000',
  })
  priceInCents: number;

  @ApiProperty({
    example: '$150.000',
    description: 'Precio formateado para mostrar al usuario',
  })
  formattedPrice: string;

  @ApiProperty({ example: 'https://example.com/image.jpg' })
  imageUrl: string;

  @ApiProperty({
    example: 8,
    description: 'Unidades disponibles en stock',
  })
  stockUnits: number;

  @ApiProperty({ example: true })
  hasStock: boolean;
}

export function toProductResponseDto(product: Product): ProductResponseDto {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    priceInCents: product.priceInCents,
    formattedPrice: product.formattedPrice(),
    imageUrl: product.imageUrl,
    stockUnits: product.stockUnits,
    hasStock: product.hasStock(),
  };
}
