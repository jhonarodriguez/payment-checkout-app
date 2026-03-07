import { Controller, Get, Res, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { GetAcceptanceTokenUseCase } from '../application/use-cases/get-acceptance-token.use-case';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly getAcceptanceToken: GetAcceptanceTokenUseCase) {}

  /**
   * GET /api/payments/acceptance-token
   *
   * El frontend llama a este endpoint ANTES de tokenizar la tarjeta.
   * Obtiene el token de aceptación de términos de Wompi.
   */
  @Get('acceptance-token')
  @ApiOperation({ summary: 'Obtener token de aceptación de términos de pago' })
  async getToken(@Res() res: Response) {
    const result = await this.getAcceptanceToken.execute();

    if (result.isFailure) {
      return res.status(HttpStatus.BAD_GATEWAY).json({
        success: false,
        message: 'No se pudo obtener el token de la pasarela de pago',
      });
    }

    return res.status(HttpStatus.OK).json({
      success: true,
      data: { acceptanceToken: result.value },
    });
  }
}
