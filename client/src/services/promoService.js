import apiClient from '../helpers/apiCore';

const api = new apiClient();

export const createPromoCode = async (promoData) => {
    try {
        const response = await api.post('/api/promo/create', promoData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getEventPromoCodes = async (eventId) => {
    try {
        const response = await api.get(`/api/promo/event/${eventId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const validatePromoCode = async (code, eventId) => {
    try {
        const response = await api.post('/api/promo/validate', { code, eventId });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const applyPromoCode = async (code, eventId, txId) => {
    try {
        const response = await api.post('/api/promo/apply', { code, eventId, txId });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
}; 