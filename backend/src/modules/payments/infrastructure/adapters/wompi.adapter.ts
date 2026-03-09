import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';
import * as crypto from 'crypto';
import {
  PaymentGatewayPort,
  ProcessPaymentInput,
  ProcessPaymentOutput,
} from '../../domain/ports/payment-gateway.port';
import { Result } from '../../../../shared/result';

@Injectable()
export class WompiAdapter implements PaymentGatewayPort {
  private readonly apiUrl: string;
  private readonly publicKey: string;
  private readonly privateKey: string;
  private readonly integrityKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiUrl = this.configService.get<string>('PAYMENT_API_URL')!;
    this.publicKey = this.configService.get<string>('PAYMENT_PUBLIC_KEY')!;
    this.privateKey = this.configService.get<string>('PAYMENT_PRIVATE_KEY')!;
    this.integrityKey = this.configService.get<string>(
      'PAYMENT_INTEGRITY_KEY',
    )!;
  }

  /**
   * getAcceptanceToken — Obtiene el token de aceptación de términos
   *
   * Wompi requiere que el usuario acepte sus términos antes de pagar.
   * Este token certifica esa aceptación.
   * Se debe obtener ANTES de crear la transacción.
   */
  async getAcceptanceToken(): Promise<Result<string>> {
    try {
      const response = await axios.get(
        `${this.apiUrl}/merchants/${this.publicKey}`,
      );

      const token = response.data?.data?.presigned_acceptance?.acceptance_token;

      if (!token) {
        return Result.fail(new Error('No se pudo obtener el acceptance_token'));
      }

      return Result.ok(token);
    } catch (error) {
      return Result.fail(
        error instanceof Error
          ? error
          : new Error('Error al conectar con la pasarela de pago'),
      );
    }
  }

  /**
   * generateIntegrityHash — Genera la firma de seguridad
   *
   * Esta firma verifica que el monto no fue manipulado entre
   * el frontend y la API de pagos.
   *
   * Fórmula: SHA256(reference + amountInCents + currency + integrityKey)
   */
  generateIntegrityHash(reference: string, amountInCents: number): string {
    const currency = 'COP';
    const toHash = `${reference}${amountInCents}${currency}${this.integrityKey}`;
    return crypto.createHash('sha256').update(toHash).digest('hex');
  }

  async processPayment(
    input: ProcessPaymentInput,
  ): Promise<Result<ProcessPaymentOutput>> {
    try {
      const signature = this.generateIntegrityHash(
        input.reference,
        input.amountInCents,
      );

      const response = await axios.post(
        `${this.apiUrl}/transactions`,
        {
          acceptance_token: input.acceptanceToken,
          amount_in_cents: input.amountInCents,
          currency: 'COP',
          signature: signature,
          customer_email: input.customerEmail,
          reference: input.reference,
          payment_method: {
            type: 'CARD',
            token: input.cardToken,
            installments: 1,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.privateKey}`,
            'Content-Type': 'application/json',
          },
        },
      );
      console.log('🚀 ~ WompiAdapter ~ processPayment ~ response:', response);

      const transaction = response.data?.data;
      console.log(
        '🚀 ~ WompiAdapter ~ processPayment ~ transaction:',
        transaction,
      );

      if (!transaction) {
        return Result.fail(
          new Error('Respuesta inválida de la pasarela de pago'),
        );
      }

      return Result.ok({
        gatewayId: transaction.id,
        status: transaction.status,
        statusMessage: transaction.status_message || transaction.status,
      });
    } catch (error) {
      if (error instanceof AxiosError) {
        const wompiError = error.response?.data?.error;
        const messages = wompiError?.messages;

        let errorMessage = 'Error al procesar el pago';

        if (messages) {
          errorMessage =
            typeof messages === 'string'
              ? messages
              : Array.isArray(messages)
                ? messages.join(', ')
                : Object.values(messages).flat().join(', ');
        } else if (wompiError?.type) {
          errorMessage = wompiError.type;
        }

        return Result.fail(new Error(errorMessage));
      }

      return Result.fail(
        error instanceof Error
          ? error
          : new Error('Error desconocido en el pago'),
      );
    }
  }
}
