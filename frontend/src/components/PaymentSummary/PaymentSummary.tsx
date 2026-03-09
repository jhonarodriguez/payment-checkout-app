import { useAppSelector, useAppDispatch } from '../../store';
import {
  startProcessing,
  paymentSuccess,
  paymentFailed,
  setStep,
} from '../../store/slices/checkoutSlice';
import { decrementProductStock } from '../../store/slices/productSlice';
import { paymentService } from '../../services/payment.service';
import { formatCurrency } from '../../utils/card.utils';
import styles from './PaymentSummary.module.css';

const BASE_FEE_IN_CENTS = 300000;
const DELIVERY_FEE_IN_CENTS = 200000;

export function PaymentSummary() {
  const dispatch = useAppDispatch();

  const { cardData, deliveryData, selectedProductId, isProcessing } =
    useAppSelector((state) => state.checkout);
  const products = useAppSelector((state) => state.products.items);
  
  const product = products.find((p) => p.id === selectedProductId);
  
  if (!product || !cardData || !deliveryData) return null;

  const totalInCents =
    product.priceInCents + BASE_FEE_IN_CENTS + DELIVERY_FEE_IN_CENTS;

  const handleConfirmPayment = async () => {
    dispatch(startProcessing());

    try {
      let cardToken: string;
      try {
        cardToken = await paymentService.tokenizeCard({
          number: cardData.number,
          holder: cardData.holder,
          expiryMonth: cardData.expiryMonth,
          expiryYear: cardData.expiryYear,
          cvv: cardData.cvv,
        });
      } catch (tokenError: unknown) {
        const errorMessage =
          tokenError instanceof Error
            ? tokenError.message
            : 'Error desconocido al procesar la tarjeta';
        dispatch(
          paymentFailed(
            `Error al procesar la tarjeta: ${errorMessage}`,
          ),
        );
        return;
      }
      
      let acceptanceToken: string;
      try {
        acceptanceToken = await paymentService.getAcceptanceToken();
      } catch {
        dispatch(
          paymentFailed(
            'No se pudo conectar con la pasarela de pago. Intenta de nuevo.',
          ),
        );
        return;
      }
      
      const result = await paymentService.processPayment({
        productId: product.id,
        customerName: deliveryData.fullName,
        customerEmail: deliveryData.email,
        deliveryAddress: deliveryData.address,
        deliveryCity: deliveryData.city,
        deliveryDepartment: deliveryData.department,
        cardToken,
        acceptanceToken,
        cardLastFour: cardData.lastFour,
      });
      
      dispatch(decrementProductStock(product.id));
      
      dispatch(paymentSuccess(result));

    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al procesar el pago';
      dispatch(
        paymentFailed(errorMessage),
      );
    }
  };

  const handleGoBack = () => {
    dispatch(setStep(2));
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Resumen del pago">
      <div className={styles.panel}>
        
        <div className={styles.handle} />

        <h2 className={styles.title}>Resumen del Pedido</h2>
        
        <div className={styles.priceBreakdown}>
          <div className={styles.priceRow}>
            <span className={styles.priceLabel}>{product.name}</span>
            <span className={styles.priceValue}>
              {formatCurrency(product.priceInCents)}
            </span>
          </div>

          <div className={styles.priceRow}>
            <span className={styles.priceLabel}>Fee de servicio</span>
            <span className={styles.priceValue}>
              {formatCurrency(BASE_FEE_IN_CENTS)}
            </span>
          </div>

          <div className={styles.priceRow}>
            <span className={styles.priceLabel}>Costo de envío</span>
            <span className={styles.priceValue}>
              {formatCurrency(DELIVERY_FEE_IN_CENTS)}
            </span>
          </div>

          <div className={`${styles.priceRow} ${styles.totalRow}`}>
            <span>Total a pagar</span>
            <span>{formatCurrency(totalInCents)}</span>
          </div>
        </div>
        
        <div className={styles.infoRow}>
          <span className={styles.infoIcon}>💳</span>
          <span>
            Tarjeta {cardData.brand !== 'unknown' ? cardData.brand.toUpperCase() : ''}
            {' '}**** {cardData.lastFour}
          </span>
        </div>
        
        <div className={styles.infoRow}>
          <span className={styles.infoIcon}>📦</span>
          <span>
            {deliveryData.address}, {deliveryData.city}
          </span>
        </div>
        
        <button
          className={styles.confirmButton}
          onClick={handleConfirmPayment}
          disabled={isProcessing}
          aria-busy={isProcessing}
        >
          {isProcessing ? (
            <>
              <span className={styles.spinner} aria-hidden="true" />
              Procesando pago...
            </>
          ) : (
            `Confirmar y Pagar ${formatCurrency(totalInCents)}`
          )}
        </button>

        <button
          className={styles.backButton}
          onClick={handleGoBack}
          disabled={isProcessing}
        >
          ← Volver y editar
        </button>

        <p className={styles.secureNote}>
          🔒 Pago seguro — Tus datos están protegidos con encriptación
        </p>
      </div>
    </div>
  );
}