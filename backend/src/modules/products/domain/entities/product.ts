export class Product {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly priceInCents: number,
    public readonly imageUrl: string,
    public readonly stockUnits: number,
    public readonly createdAt: Date,
  ) {}

  hasStock(): boolean {
    return this.stockUnits > 0;
  }

  formattedPrice(): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(this.priceInCents / 100);
  }
}
