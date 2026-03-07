import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MaxLength,
  MinLength,
  IsOptional,
  Matches,
} from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({
    example: 'Juan Carlos Pérez',
    description: 'Nombre completo del cliente',
  })
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre no puede estar vacío' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(255, { message: 'El nombre no puede superar 255 caracteres' })
  fullName: string;

  @ApiProperty({ example: 'juan@example.com' })
  @IsEmail({}, { message: 'El email no tiene un formato válido' })
  @IsNotEmpty({ message: 'El email es obligatorio' })
  email: string;

  @ApiProperty({ example: '3001234567', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{7,10}$/, {
    message: 'El teléfono debe tener entre 7 y 10 dígitos numéricos',
  })
  phone?: string;
}
