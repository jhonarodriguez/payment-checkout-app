import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { resetCheckout } from '../../store/slices/checkoutSlice';
import { fetchProducts } from '../../store/slices/productSlice';
import { formatCurrency } from '../../utils/card.utils';
import styles from './ResultPage.module.css';

export function ResultPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { transactionResult } = useAppSelector((state) => state.checkout);

  const isApproved = transactionResult?.status === 'APPROVED';

  const handleGoBack = () => {
    dispatch(resetCheckout());
    dispatch(fetchProducts());
    navigate('/');
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        
        <div
          className={`${styles.iconCircle} ${
            isApproved ? styles.iconSuccess : styles.iconFailure
          }`}
        >
          <span className={styles.icon}>{isApproved ? '✓' : '✕'}</span>
        </div>
        
        <h1 className={styles.title}>
          {isApproved ? '¡Pago exitoso!' : 'Pago no procesado'}
        </h1>
        
        <p className={styles.subtitle}>
          {isApproved
            ? 'Tu pedido ha sido confirmado. Recibirás tu producto pronto.'
            : transactionResult?.errorMessage ||
              'La transacción no pudo completarse. Intenta de nuevo.'}
        </p>
        
        {isApproved && transactionResult && (
          <div className={styles.details}>
            {transactionResult.reference && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Referencia</span>
                <span className={styles.detailValue}>
                  {transactionResult.reference}
                </span>
              </div>
            )}

            {transactionResult.product?.name && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Producto</span>
                <span className={styles.detailValue}>
                  {transactionResult.product.name}
                </span>
              </div>
            )}

            {transactionResult.totalInCents > 0 && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Total pagado</span>
                <span className={`${styles.detailValue} ${styles.totalValue}`}>
                  {formatCurrency(transactionResult.totalInCents)}
                </span>
              </div>
            )}

            {transactionResult.delivery && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Entrega en</span>
                <span className={styles.detailValue}>
                  {transactionResult.delivery.address},{' '}
                  {transactionResult.delivery.city}
                </span>
              </div>
            )}
          </div>
        )}
        
        <button className={styles.actionButton} onClick={handleGoBack}>
          {isApproved ? '← Volver a la tienda' : 'Intentar de nuevo'}
        </button>

      </div>
    </div>
  );
}