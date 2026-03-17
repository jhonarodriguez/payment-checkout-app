import type { Product } from '../../types';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  product: Product;
  onBuy: (productId: string) => void;
}

const FALLBACK_IMAGE_URL =
  'https://www.shutterstock.com/image-vector/default-ui-image-placeholder-wireframes-600nw-1037719192.jpg';

export function ProductCard({ product, onBuy }: ProductCardProps) {
  return (
    <article className={styles.productCard}>
      <div className={styles.imageWrapper}>
        <img
          src={product.imageUrl}
          alt={product.name}
          className={styles.productImage}
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = FALLBACK_IMAGE_URL;
          }}
        />
        <span
          className={`${styles.stockBadge} ${
            product.hasStock ? styles.badgeInStock : styles.badgeOutOfStock
          }`}
        >
          {product.hasStock ? `${product.stockUnits} en stock` : 'Agotado'}
        </span>
      </div>

      <div className={styles.productBody}>
        <h2 className={styles.productName}>{product.name}</h2>
        <p className={styles.productDescription}>{product.description}</p>

        <div className={styles.productFooter}>
          <p className={styles.productPrice}>{product.formattedPrice}</p>

          <button
            className={styles.buyButton}
            onClick={() => onBuy(product.id)}
            disabled={!product.hasStock}
            aria-label={`Comprar ${product.name}`}
          >
            {product.hasStock ? '💳 Pagar con tarjeta' : 'Sin stock'}
          </button>
        </div>
      </div>
    </article>
  );
}
