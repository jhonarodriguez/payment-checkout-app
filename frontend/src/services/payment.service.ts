import api from './api';

const PAYMENT_API_URL =
    import.meta.env.VITE_PAYMENT_API_URL;

const PAYMENT_PUBLIC_KEY =
    import.meta.env.VITE_PAYMENT_PUBLIC_KEY;

export const paymentService = {

    async getAcceptanceToken(): Promise<string> {
        const response = await api.get('/payments/acceptance-token');
        return response.data.data.acceptanceToken;
    },

    async tokenizeCard(cardData: {
        number: string;
        holder: string;
        expiryMonth: string;
        expiryYear: string;
        cvv: string;
    }): Promise<string> {
        const response = await fetch(`${PAYMENT_API_URL}/tokens/cards`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${PAYMENT_PUBLIC_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                number: cardData.number.replace(/\s/g, ''),
                cvc: cardData.cvv,
                exp_month: cardData.expiryMonth,
                exp_year: cardData.expiryYear,
                card_holder: cardData.holder,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage =
                errorData?.error?.messages?.join(', ') ||
                errorData?.error?.type ||
                'Error al procesar la tarjeta';
            throw new Error(errorMessage);
        }

        const data = await response.json();

        if (!data?.data?.id) {
            throw new Error('No se pudo tokenizar la tarjeta');
        }

        return data.data.id;
    },

    async processPayment(data: {
        productId: string;
        customerName: string;
        customerEmail: string;
        deliveryAddress: string;
        deliveryCity: string;
        deliveryDepartment: string;
        cardToken: string;
        acceptanceToken: string;
        cardLastFour: string;
    }) {
        const response = await api.post('/transactions', data);
        return response.data.data;
    },

    async pollTransactionStatus(
        transactionId: string,
        onStatusChange?: (status: string) => void,
    ): Promise<string> {
        const MAX_ATTEMPTS = 12;
        const DELAY_MS = 2500;

        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            await new Promise((resolve) => setTimeout(resolve, DELAY_MS));

            try {
                const response = await api.get(`/transactions/${transactionId}/status`);
                const { status } = response.data.data;

                if (onStatusChange) onStatusChange(status);
                
                if (['APPROVED', 'DECLINED', 'ERROR', 'VOIDED'].includes(status)) {
                    return status;
                }
                
            } catch {
                // Error de red — continuar intentando
            }
        }
        return 'ERROR';
    },

};