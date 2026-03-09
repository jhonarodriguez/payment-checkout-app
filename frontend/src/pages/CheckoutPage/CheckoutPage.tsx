import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store';
import { resetCheckout, setStep } from '../../store/slices/checkoutSlice';
import { CreditCardForm } from '../../components/CreditCardForm/CreditCardForm';
import { PaymentSummary } from '../../components/PaymentSummary/PaymentSummary';
import styles from './CheckoutPage.module.css';

export function CheckoutPage() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { currentStep } = useAppSelector((state) => state.checkout);

    const handleBack = () => {
        console.log("🚀 ~ handleBack ~ currentStep:", currentStep)
        if (currentStep === 3) {
            dispatch(setStep(2));
        } else {
            dispatch(resetCheckout())
            navigate('/');
        }
    };

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <button
                    className={styles.backButton}
                    onClick={handleBack}
                    aria-label="Volver"
                >
                    ←
                </button>

                <span className={styles.headerTitle}>
                    {currentStep === 2 ? 'Datos de pago' : 'Confirmar pago'}
                </span>

                <div className={styles.steps} aria-label="Paso actual">
                    <span className={`${styles.step} ${styles.stepActive}`}>2</span>
                    <div className={`${styles.stepLine} ${currentStep === 3 ? styles.stepLineActive : ''}`} />
                    <span className={`${styles.step} ${currentStep === 3 ? styles.stepActive : ''}`}>3</span>
                </div>
            </header>

            <main className={styles.main}>
                <CreditCardForm />
            </main>

            {currentStep === 3 && <PaymentSummary />}

        </div>
    );
}
