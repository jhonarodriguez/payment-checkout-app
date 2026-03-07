import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsString,
  IsNotEmpty,
  IsEmail,
  MinLength,
} from 'class-validator';

export class CreateTransactionDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID('4', { message: 'El productId debe ser un UUID válido' })
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  customerName: string;

  @ApiProperty({ example: 'juan@example.com' })
  @IsEmail()
  @IsNotEmpty()
  customerEmail: string;

  @ApiProperty({ example: 'Calle 123 # 45-67, Apto 201' })
  @IsString()
  @IsNotEmpty()
  deliveryAddress: string;

  @ApiProperty({ example: 'Bogotá' })
  @IsString()
  @IsNotEmpty()
  deliveryCity: string;

  @ApiProperty({ example: 'Cundinamarca' })
  @IsString()
  @IsNotEmpty()
  deliveryDepartment: string;

  @ApiProperty({
    example: 'tok_stagtest_5e92...',
    description: 'Token de tarjeta generado por la API de pagos',
  })
  @IsString()
  @IsNotEmpty()
  cardToken: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  acceptanceToken: string;

  @ApiProperty({ example: '4242' })
  @IsString()
  cardLastFour: string;
}
