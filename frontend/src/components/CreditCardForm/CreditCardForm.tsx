import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAppDispatch } from '../../store';
import { setCardData, setDeliveryData, goToSummary } from '../../store/slices/checkoutSlice';
import {
  detectCardBrand,
  formatCardNumber,
  formatExpiry,
  validateLuhn,
  validateExpiry,
} from '../../utils/card.utils';
import styles from './CreditCardForm.module.css';

import visaLogo from '../../assets/visa.svg';
import mastercardLogo from '../../assets/mastercard.svg';
import { CardBrand } from '../../types';

// Todos los campos del formulario en un solo tipo
interface FormValues {
  cardNumber: string;
  cardHolder: string;
  expiry: string;
  cvv: string;

  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  department: string;
}

export function CreditCardForm() {
  const dispatch = useAppDispatch();
  
  const [cardBrand, setCardBrand] = useState<CardBrand>('unknown');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormValues>({
    mode: 'onBlur',
  });
  
  // eslint-disable-next-line react-hooks/incompatible-library
  const cardNumberValue = watch('cardNumber');
  useEffect(() => {
    if (cardNumberValue) {
      setCardBrand(detectCardBrand(cardNumberValue));
    } else {
      setCardBrand('unknown');
    }
  }, [cardNumberValue]);

  const onSubmit = (data: FormValues) => {
    
    const cleanNumber = data.cardNumber.replace(/\s/g, '');
    
    if (!validateLuhn(cleanNumber)) {
      alert('El número de tarjeta no es válido. Verifica los dígitos.');
      return;
    }
    
    const [expiryMonth, expiryYear] = data.expiry.split('/');
    if (!validateExpiry(expiryMonth, expiryYear)) {
      alert('La tarjeta está vencida o la fecha es inválida.');
      return;
    }
    
    dispatch(
      setCardData({
        number: cleanNumber,
        holder: data.cardHolder.toUpperCase(),
        expiryMonth,
        expiryYear,
        cvv: data.cvv,
        lastFour: cleanNumber.slice(-4),
        brand: cardBrand,
      }),
    );
    
    dispatch(
      setDeliveryData({
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        department: data.department,
      }),
    );
    
    dispatch(goToSummary());
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>💳 Tarjeta de Crédito</h2>
          <div className={styles.brandLogos} aria-label="Marcas aceptadas">
            <img
              src={visaLogo}
              alt="VISA"
              data-testid="visa-logo"
              className={`${styles.logo} ${
                cardBrand === 'visa' ? styles.active : styles.inactive
              }`}
            />
            <img
              src={mastercardLogo}
              alt="Mastercard"
              data-testid="mastercard-logo"
              className={`${styles.logo} ${
                cardBrand === 'mastercard' ? styles.active : styles.inactive
              }`}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="cardNumber">Número de tarjeta</label>
            <input
              id="cardNumber"
              type="text"
              inputMode="numeric"
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              autoComplete="cc-number"
              {...register('cardNumber', {
                required: 'El número de tarjeta es obligatorio',
                minLength: {
                  value: 19,
                  message: 'El número debe tener 16 dígitos',
                },
                onChange: (e) => {
                  const formatted = formatCardNumber(e.target.value);
                  setValue('cardNumber', formatted, { shouldValidate: false });
                },
              })}
              aria-invalid={!!errors.cardNumber}
              aria-describedby={errors.cardNumber ? 'cardNumber-error' : undefined}
            />
            {errors.cardNumber && (
              <span id="cardNumber-error" className={styles.errorMsg} role="alert">
                {errors.cardNumber.message}
              </span>
            )}
          </div>
          <div className={styles.field}>
            <label htmlFor="cardHolder">Nombre en la tarjeta</label>
            <input
              id="cardHolder"
              type="text"
              placeholder="JUAN PÉREZ"
              autoComplete="cc-name"
              {...register('cardHolder', {
                required: 'El nombre del titular es obligatorio',
                minLength: { value: 3, message: 'Mínimo 3 caracteres' },
                onChange: (e) => {
                  setValue('cardHolder', e.target.value.toUpperCase(), {
                    shouldValidate: false,
                  });
                },
              })}
              aria-invalid={!!errors.cardHolder}
            />
            {errors.cardHolder && (
              <span className={styles.errorMsg} role="alert">
                {errors.cardHolder.message}
              </span>
            )}
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="expiry">Vencimiento</label>
              <input
                id="expiry"
                type="text"
                placeholder="MM/AA"
                maxLength={5}
                inputMode="numeric"
                autoComplete="cc-exp"
                {...register('expiry', {
                  required: 'La fecha es obligatoria',
                  pattern: {
                    value: /^\d{2}\/\d{2}$/,
                    message: 'Formato: MM/AA',
                  },
                  onChange: (e) => {
                    const formatted = formatExpiry(e.target.value);
                    setValue('expiry', formatted, { shouldValidate: false });
                  },
                })}
                aria-invalid={!!errors.expiry}
              />
              {errors.expiry && (
                <span className={styles.errorMsg} role="alert">
                  {errors.expiry.message}
                </span>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="cvv">CVV</label>
              <input
                id="cvv"
                type="password"
                placeholder="•••"
                maxLength={4}
                inputMode="numeric"
                autoComplete="cc-csc"
                {...register('cvv', {
                  required: 'El CVV es obligatorio',
                  pattern: {
                    value: /^\d{3,4}$/,
                    message: '3 o 4 dígitos',
                  },
                })}
                aria-invalid={!!errors.cvv}
              />
              {errors.cvv && (
                <span className={styles.errorMsg} role="alert">
                  {errors.cvv.message}
                </span>
              )}
            </div>
          </div>
        </section>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>📦 Datos de Entrega</h2>

          <div className={styles.field}>
            <label htmlFor="fullName">Nombre completo</label>
            <input
              id="fullName"
              type="text"
              placeholder="Juan Carlos Pérez"
              autoComplete="name"
              {...register('fullName', {
                required: 'El nombre es obligatorio',
                minLength: { value: 3, message: 'Mínimo 3 caracteres' },
              })}
              aria-invalid={!!errors.fullName}
            />
            {errors.fullName && (
              <span className={styles.errorMsg} role="alert">
                {errors.fullName.message}
              </span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              placeholder="juan@example.com"
              autoComplete="email"
              {...register('email', {
                required: 'El email es obligatorio',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Ingresa un email válido',
                },
              })}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <span className={styles.errorMsg} role="alert">
                {errors.email.message}
              </span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="phone">
              Teléfono <span className={styles.optional}>(opcional)</span>
            </label>
            <input
              id="phone"
              type="tel"
              placeholder="3001234567"
              inputMode="numeric"
              autoComplete="tel"
              {...register('phone', {
                pattern: {
                  value: /^[0-9]{7,10}$/,
                  message: 'Entre 7 y 10 dígitos',
                },
              })}
            />
            {errors.phone && (
              <span className={styles.errorMsg} role="alert">
                {errors.phone.message}
              </span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="address">Dirección de entrega</label>
            <input
              id="address"
              type="text"
              placeholder="Calle 123 # 45-67, Apto 201"
              autoComplete="street-address"
              {...register('address', {
                required: 'La dirección es obligatoria',
                minLength: { value: 5, message: 'Dirección muy corta' },
              })}
              aria-invalid={!!errors.address}
            />
            {errors.address && (
              <span className={styles.errorMsg} role="alert">
                {errors.address.message}
              </span>
            )}
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="city">Ciudad</label>
              <input
                id="city"
                type="text"
                placeholder="Bogotá"
                autoComplete="address-level2"
                {...register('city', { required: 'Obligatorio' })}
                aria-invalid={!!errors.city}
              />
              {errors.city && (
                <span className={styles.errorMsg} role="alert">
                  {errors.city.message}
                </span>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="department">Departamento</label>
              <input
                id="department"
                type="text"
                placeholder="Cundinamarca"
                {...register('department', { required: 'Obligatorio' })}
                aria-invalid={!!errors.department}
              />
              {errors.department && (
                <span className={styles.errorMsg} role="alert">
                  {errors.department.message}
                </span>
              )}
            </div>
          </div>
        </section>
        <div className={styles.submitWrapper}>
          <button type="submit" className={styles.submitButton}>
            Ver resumen →
          </button>
        </div>
      </form>
    </div>
  );
}