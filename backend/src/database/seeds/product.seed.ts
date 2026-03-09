import { DataSource } from 'typeorm';
import { ProductEntity } from '../../modules/products/infrastructure/adapters/product.entity';

export async function seedProducts(dataSource: DataSource): Promise<void> {
  const productRepo = dataSource.getRepository(ProductEntity);

  const count = await productRepo.count();
  if (count > 0) {
    console.log('Productos ya existen en la BD. Omitiendo seed.');
    return;
  }

  console.log('Insertando productos de prueba...');

  const products = [
    {
      name: 'Audífonos Bluetooth Pro',
      description:
        'Audífonos inalámbricos con cancelación de ruido activa, ' +
        '30 horas de batería y conexión multidevice. ' +
        'Perfectos para trabajo remoto y viajes.',
      priceInCents: 15000000,
      imageUrl:
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
      stock: 10,
    },
    {
      name: 'Teclado Mecánico RGB',
      description:
        'Teclado mecánico TKL con switches Red (lineales), ' +
        'retroiluminación RGB por tecla, conexión USB-C. ' +
        'Ideal para programadores y gamers.',
      priceInCents: 25000000,
      imageUrl:
        'https://jyrtechnology.com.co/wp-content/uploads/2020/07/MKF30S-3.jpg',
      stock: 5,
    },
    {
      name: 'Mouse Inalámbrico Ergonómico',
      description:
        'Mouse vertical ergonómico que reduce el dolor de muñeca. ' +
        'Sensor óptico de 4000 DPI, batería recargable de 60 días. ' +
        'Compatible con Windows y Mac.',
      priceInCents: 8000000,
      imageUrl:
        'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400',
      stock: 15,
    },
  ];

  for (const productData of products) {
    const product = productRepo.create(productData);
    await productRepo.save(product);
    console.log(`Creado: ${productData.name}`);
  }

  console.log('Seed completado.');
}
