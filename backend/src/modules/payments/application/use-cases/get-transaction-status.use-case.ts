import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Result } from '../../../../shared/result';

@Injectable()
export class GetTransactionStatusUseCase {
  private readonly apiUrl: string;
  private readonly privateKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiUrl = this.configService.get<string>('PAYMENT_API_URL')!;
    this.privateKey = this.configService.get<string>('PAYMENT_PRIVATE_KEY')!;
  }

  async execute(gatewayTransactionId: string): Promise<
    Result<{
      status: string;
      statusMessage: string;
    }>
  > {
    try {
      const response = await axios.get(
        `${this.apiUrl}/transactions/${gatewayTransactionId}`,
        {
          headers: {
            Authorization: `Bearer ${this.privateKey}`,
          },
        },
      );

      const tx = response.data?.data;

      if (!tx) {
        return Result.fail(new Error('Transacción no encontrada en Wompi'));
      }

      return Result.ok({
        status: tx.status,
        statusMessage: tx.status_message || tx.status,
      });
    } catch (error: any) {
      return Result.fail(
        new Error(
          error.response?.data?.error?.type || 'Error al consultar el estado',
        ),
      );
    }
  }
}
