import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Plus, Trash2, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import apiClient from '@/helpers/apiCore';

export const PromoCodeManager = ({ eventId, isCreating = false, onPromoCodesChange }) => {
    const [promoCodes, setPromoCodes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState({
        code: '',
        discount_type: 'PERCENT',
        discount_value: '',
        usage_limit: '',
        start_date: null,
        end_date: null
    });

    const fetchPromoCodes = async () => {
        if (!eventId || isCreating) return;
        
        try {
            setIsLoading(true);
            const response = await apiClient.get(`/api/promo/event/${eventId}`);
            setPromoCodes(response.data);
        } catch (err) {
            setError('Failed to fetch promo codes');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPromoCodes();
    }, [eventId]);

    const handleSubmit = (e) => {
        e.preventDefault();
        try {
            setIsLoading(true);
            setError(null);

            const newPromoCode = {
                ...formData,
                code: formData.code.toUpperCase()
            };

            if (isCreating) {
                // Add to temporary list for event creation
                setPromoCodes(prev => [...prev, { ...newPromoCode, id: Date.now() }]);
                onPromoCodesChange?.(promoCodes);
            } else {
                // Normal API flow for existing event
                if (editingId) {
                    apiClient.put(`/api/promo/${editingId}`, { ...newPromoCode, event_id: eventId });
                } else {
                    apiClient.post('/api/promo/create', { ...newPromoCode, event_id: eventId });
                }
                fetchPromoCodes();
            }

            setFormData({
                code: '',
                discount_type: 'PERCENT',
                discount_value: '',
                usage_limit: '',
                start_date: null,
                end_date: null
            });
            setEditingId(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save promo code');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (promoCode) => {
        setFormData({
            code: promoCode.code,
            discount_type: promoCode.discount_type,
            discount_value: promoCode.discount_value,
            usage_limit: promoCode.usage_limit,
            start_date: promoCode.start_date ? new Date(promoCode.start_date) : null,
            end_date: promoCode.end_date ? new Date(promoCode.end_date) : null
        });
        setEditingId(promoCode.id || promoCode.promo_code_id);
    };

    const handleDelete = async (promoCodeId) => {
        if (!window.confirm('Are you sure you want to delete this promo code?')) {
            return;
        }

        try {
            setIsLoading(true);
            if (isCreating) {
                setPromoCodes(prev => prev.filter(code => code.id !== promoCodeId));
                onPromoCodesChange?.(promoCodes);
            } else {
                await apiClient.delete(`/api/promo/${promoCodeId}`);
                fetchPromoCodes();
            }
        } catch (err) {
            setError('Failed to delete promo code');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="code">Code</Label>
                    <div className="flex space-x-2">
                        <Input
                            id="code"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            placeholder="SUMMER2024"
                            className="flex-1"
                        />
                        <Select
                            value={formData.discount_type}
                            onValueChange={(value) => setFormData({ ...formData, discount_type: value })}
                        >
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PERCENT">Percentage</SelectItem>
                                <SelectItem value="FIXED">Fixed Amount</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="discount_value">
                            {formData.discount_type === 'PERCENT' ? 'Percentage' : 'Amount'}
                        </Label>
                        <Input
                            id="discount_value"
                            type="number"
                            value={formData.discount_value}
                            onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                            placeholder={formData.discount_type === 'PERCENT' ? '10' : '5.00'}
                            min={0}
                            max={formData.discount_type === 'PERCENT' ? 100 : undefined}
                            step={formData.discount_type === 'PERCENT' ? 1 : 0.01}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="usage_limit">Usage Limit</Label>
                        <Input
                            id="usage_limit"
                            type="number"
                            value={formData.usage_limit}
                            onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                            placeholder="100"
                            min={1}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !formData.start_date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {formData.start_date ? format(formData.start_date, "PPP") : "Optional"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={formData.start_date}
                                    onSelect={(date) => setFormData({ ...formData, start_date: date })}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="space-y-2">
                        <Label>End Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !formData.end_date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {formData.end_date ? format(formData.end_date, "PPP") : "Optional"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={formData.end_date}
                                    onSelect={(date) => setFormData({ ...formData, end_date: date })}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                <Button 
                    onClick={handleSubmit} 
                    disabled={isLoading} 
                    className="w-full"
                >
                    {isLoading ? 'Saving...' : (editingId ? 'Update Promo Code' : 'Add Promo Code')}
                </Button>

                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
            </div>

            {promoCodes.length > 0 && (
                <div className="space-y-4">
                    <h3 className="font-medium">Added Promo Codes</h3>
                    {promoCodes.map((promoCode) => (
                        <div
                            key={promoCode.id || promoCode.promo_code_id}
                            className="flex items-center justify-between p-4 border rounded-lg"
                        >
                            <div>
                                <h4 className="font-semibold">{promoCode.code}</h4>
                                <p className="text-sm text-muted-foreground">
                                    {promoCode.discount_type === 'PERCENT'
                                        ? `${promoCode.discount_value}% off`
                                        : `$${promoCode.discount_value} off`}
                                </p>
                                {!isCreating && (
                                    <p className="text-sm text-muted-foreground">
                                        Used: {promoCode.usage_count} / {promoCode.usage_limit}
                                    </p>
                                )}
                            </div>
                            <div className="flex space-x-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleEdit(promoCode)}
                                >
                                    <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleDelete(promoCode.id || promoCode.promo_code_id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}; 