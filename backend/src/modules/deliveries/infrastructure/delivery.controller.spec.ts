import { DeliveryController } from './delivery.controller';
import { DeliveryEntity, DeliveryStatus } from './adapters/delivery.entity';
import { Repository } from 'typeorm';
import { HttpStatus } from '@nestjs/common';

const makeDelivery = (): DeliveryEntity => ({
  id: 'del-uuid-1',
  transaction: null as any,
  transactionId: 'txn-uuid-1',
  customer: null as any,
  customerId: 'cust-uuid-1',
  address: 'Calle 123 # 45-67',
  city: 'Bogotá',
  department: 'Cundinamarca',
  status: DeliveryStatus.PENDING,
  createdAt: new Date(),
});

const makeResponse = () => {
  const json = jest.fn().mockReturnThis();
  const status = jest.fn().mockReturnValue({ json });
  return { status, json } as any;
};

describe('DeliveryController', () => {
  let controller: DeliveryController;
  let mockRepo: jest.Mocked<Repository<DeliveryEntity>>;

  beforeEach(() => {
    mockRepo = {
      findOne: jest.fn(),
    } as any;
    controller = new DeliveryController(mockRepo);
  });

  describe('findByTransaction', () => {
    it('returns 200 with delivery data when found', async () => {
      const delivery = makeDelivery();
      mockRepo.findOne.mockResolvedValue(delivery);
      const res = makeResponse();

      await controller.findByTransaction('txn-uuid-1', res);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.status(HttpStatus.OK).json).toHaveBeenCalledWith({
        success: true,
        data: delivery,
      });
      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { transactionId: 'txn-uuid-1' },
      });
    });

    it('returns 404 when delivery not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      const res = makeResponse();

      await controller.findByTransaction('txn-uuid-1', res);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(res.status(HttpStatus.NOT_FOUND).json).toHaveBeenCalledWith({
        success: false,
        message: 'Entrega no encontrada para esta transacción',
      });
    });
  });
});
