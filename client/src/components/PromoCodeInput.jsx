import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import apiClient from '@/helpers/apiCore';

export const PromoCodeInput = ({ eventId, onApply, onError }) => {
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [appliedCode, setAppliedCode] = useState(null);

    const validatePromoCode = async () => {
        if (!code) return;

        try {
            setIsLoading(true);
            setError(null);

            const response = await apiClient.post('/api/promo/validate', {
                code: code.toUpperCase(),
                event_id: eventId
            });

            if (response.data.valid) {
                setAppliedCode({
                    code: code.toUpperCase(),
                    discountType: response.data.discount_type,
                    discountValue: response.data.discount_value
                });
                onApply(response.data);
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to validate promo code';
            setError(errorMessage);
            onError?.(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await validatePromoCode();
    };

    const removePromoCode = () => {
        setCode('');
        setAppliedCode(null);
        onApply(null);
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="promoCode">Promo Code</Label>
                {!appliedCode ? (
                    <form onSubmit={handleSubmit} className="flex space-x-2">
                        <Input
                            id="promoCode"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="Enter promo code"
                            className="flex-1"
                            disabled={isLoading}
                        />
                        <Button type="submit" disabled={!code || isLoading}>
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                'Apply'
                            )}
                        </Button>
                    </form>
                ) : (
                    <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                        <div>
                            <p className="font-medium">{appliedCode.code}</p>
                            <p className="text-sm text-muted-foreground">
                                {appliedCode.discountType === 'PERCENT'
                                    ? `${appliedCode.discountValue}% off`
                                    : `$${appliedCode.discountValue} off`}
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={removePromoCode}
                        >
                            Remove
                        </Button>
                    </div>
                )}
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
        </div>
    );
}; 