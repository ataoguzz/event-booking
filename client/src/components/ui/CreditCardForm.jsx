import { useState } from 'react';
import { Input } from '@/components/ui/input.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { CreditCard, Lock } from 'lucide-react';

export default function CreditCardForm({ onSubmit, isLoading, amount }) {
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  });

  const formatCardNumber = (value) => {    
    const numeric = value.replace(/\D/g, '');
    const formatted = numeric.replace(/(\d{4})(?=\d)/g, '$1 ');
    return formatted.slice(0, 19); 
  };

  const formatExpiry = (value) => {
    const numeric = value.replace(/\D/g, '');
    if (numeric.length >= 2) {
      return numeric.slice(0, 2) + '/' + numeric.slice(2, 4);
    }
    return numeric;
  };

  const handleInputChange = (field, value) => {
    switch (field) {
      case 'number':
        setCardData(prev => ({ ...prev, number: formatCardNumber(value) }));
        break;
      case 'expiry':
        setCardData(prev => ({ ...prev, expiry: formatExpiry(value) }));
        break;
      case 'cvv':
        const cvv = value.replace(/\D/g, '').slice(0, 4);
        setCardData(prev => ({ ...prev, cvv }));
        break;
      default:
        setCardData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const numericCardNumber = cardData.number.replace(/\s/g, '');
    onSubmit({
      ...cardData,
      number: numericCardNumber
    });
  };

  const isFormValid = cardData.number.replace(/\s/g, '').length === 16 &&
                     cardData.name.trim().length > 0 &&
                     cardData.expiry.length === 5 &&
                     cardData.cvv.length >= 3;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Details
        </CardTitle>
        <CardDescription>
          Enter your credit card information to add ${amount} to your wallet
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Card Number</label>
            <Input
              type="text"
              placeholder="1234 5678 9012 3456"
              value={cardData.number}
              onChange={(e) => handleInputChange('number', e.target.value)}
              className="font-mono"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Cardholder Name</label>
            <Input
              type="text"
              placeholder="John Doe"
              value={cardData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Expiry Date</label>
              <Input
                type="text"
                placeholder="MM/YY"
                value={cardData.expiry}
                onChange={(e) => handleInputChange('expiry', e.target.value)}
                className="font-mono"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">CVV</label>
              <Input
                type="text"
                placeholder="123"
                value={cardData.cvv}
                onChange={(e) => handleInputChange('cvv', e.target.value)}
                className="font-mono"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            Your payment information is secure and encrypted
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? 'Processing...' : `Add $${amount} to Wallet`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 