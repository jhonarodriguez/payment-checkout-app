import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchProducts } from '../../store/slices/productSlice';
import { selectProduct } from '../../store/slices/checkoutSlice';
import { ProductCard } from '../../components/ProductCard/ProductCard';
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
            <ProductCard
              key={product.id}
              product={product}
              onBuy={handleBuyClick}
            />
          ))
        )}
      </main>
    </div>
  );
}