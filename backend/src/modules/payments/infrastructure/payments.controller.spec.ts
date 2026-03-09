import { PaymentsController } from './payments.controller';
import { GetAcceptanceTokenUseCase } from '../application/use-cases/get-acceptance-token.use-case';
import { Result } from '../../../shared/result';
import { HttpStatus } from '@nestjs/common';

const makeResponse = () => {
  const json = jest.fn().mockReturnThis();
  const status = jest.fn().mockReturnValue({ json });
  return { status, json } as any;
};

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let getAcceptanceTokenUseCase: jest.Mocked<GetAcceptanceTokenUseCase>;

  beforeEach(() => {
    getAcceptanceTokenUseCase = { execute: jest.fn() } as any;
    controller = new PaymentsController(getAcceptanceTokenUseCase);
  });

  describe('getToken', () => {
    it('returns 200 with acceptance token on success', async () => {
      getAcceptanceTokenUseCase.execute.mockResolvedValue(
        Result.ok('tok_acceptance_abc'),
      );
      const res = makeResponse();

      await controller.getToken(res);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.status(HttpStatus.OK).json).toHaveBeenCalledWith({
        success: true,
        data: { acceptanceToken: 'tok_acceptance_abc' },
      });
    });

    it('returns 502 when use case fails', async () => {
      getAcceptanceTokenUseCase.execute.mockResolvedValue(
        Result.fail(new Error('Gateway down')),
      );
      const res = makeResponse();

      await controller.getToken(res);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_GATEWAY);
      expect(res.status(HttpStatus.BAD_GATEWAY).json).toHaveBeenCalledWith({
        success: false,
        message: 'No se pudo obtener el token de la pasarela de pago',
      });
    });
  });
});
