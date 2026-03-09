import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchProducts } from '../../store/slices/productSlice';
import { selectProduct } from '../../store/slices/checkoutSlice';
import styles from './ProductPage.module.css';

export function ProductPage() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((state) => state.products);
  
  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  const handleBuyClick = (productId: string) => {
    dispatch(selectProduct(productId));
  };
  
  if (loading) {
    return (
      <div className={styles.stateContainer}>
        <div className={styles.spinner} />
        <p>Cargando productos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.stateContainer}>
        <span className={styles.errorIcon}>⚠️</span>
        <p className={styles.errorText}>{error}</p>
        <button
          className={styles.retryButton}
          onClick={() => dispatch(fetchProducts())}
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <span className={styles.storeLogo}>🛍️</span>
          <div>
            <h1 className={styles.storeName}>Mi Tienda</h1>
            <p className={styles.storeTagline}>Productos de calidad</p>
          </div>
        </div>
      </header>
      
      <main className={styles.main}>
        {items.length === 0 ? (
          <div className={styles.stateContainer}>
            <p>No hay productos disponibles</p>
          </div>
        ) : (
          items.map((product) => (
            <article key={product.id} className={styles.productCard}>
              <div className={styles.imageWrapper}>
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className={styles.productImage}
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      `https://www.shutterstock.com/image-vector/default-ui-image-placeholder-wireframes-600nw-1037719192.jpg`;
                  }}
                />
                <span
                  className={`${styles.stockBadge} ${
                    product.hasStock ? styles.badgeInStock : styles.badgeOutOfStock
                  }`}
                >
                  {product.hasStock
                    ? `${product.stockUnits} en stock`
                    : 'Agotado'}
                </span>
              </div>
              
              <div className={styles.productBody}>
                <h2 className={styles.productName}>{product.name}</h2>
                <p className={styles.productDescription}>{product.description}</p>

                <div className={styles.productFooter}>
                  <p className={styles.productPrice}>{product.formattedPrice}</p>

                  <button
                    className={styles.buyButton}
                    onClick={() => handleBuyClick(product.id)}
                    disabled={!product.hasStock}
                    aria-label={`Comprar ${product.name}`}
                  >
                    {product.hasStock ? '💳 Pagar con tarjeta' : 'Sin stock'}
                  </button>
                </div>
              </div>

            </article>
          ))
        )}
      </main>
    </div>
  );
}