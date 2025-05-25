import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Separator } from '@/components/ui/separator.jsx';
import { Alert, AlertDescription } from '@/components/ui/alert.jsx';
import { 
  ChevronLeft, 
  Wallet,
  User,
  Mail,
  Ticket,
  MapPin,
  CheckCircle,
  AlertCircle,
  Tag,
  X
} from 'lucide-react';
import apiClient from '../../helpers/apiCore.js';

const Checkout = () => {
  const { eventId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [walletBalance, setWalletBalance] = useState(0);
  const [checkoutData, setCheckoutData] = useState(null);
  const [guestInfo, setGuestInfo] = useState([]);

  const [promoCode, setPromoCode] = useState('');
  const [promoValidating, setPromoValidating] = useState(false);
  const [promoError, setPromoError] = useState(null);
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  useEffect(() => {
    const initializeCheckout = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if we have data from router state
        const routerState = location.state;
        console.log('Router state received:', routerState);

        if (!routerState || (!routerState.selectedSeats && !routerState.selectedQuantities)) {
          setError('No selection data found. Please go back and make a selection.');
          setLoading(false);
          return;
        }

        // Fetch wallet balance
        const walletResponse = await apiClient.get('/users/wallet');
        setWalletBalance(walletResponse.data.balance);

        // Use data from router state
        setCheckoutData(routerState);

        // Initialize guest info array (excluding the first ticket for the purchaser)
        const guestCount = Math.max(0, routerState.totalTickets - 1);
        console.log('Initializing guest info for count:', guestCount);
        setGuestInfo(Array(guestCount).fill().map(() => ({ name: '', email: '' })));

      } catch (err) {
        console.error('Error initializing checkout:', err);
        setError(err.response?.data?.error || 'Failed to load checkout information');
      } finally {
        setLoading(false);
      }
    };

    initializeCheckout();
  }, [location.state]);

  const updateGuestInfo = (index, field, value) => {
    setGuestInfo(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const isGuestInfoComplete = () => {
    return guestInfo.every(guest => guest.name.trim() && guest.email.trim());
  };

  const validatePromoCode = async () => {
    if (!promoCode.trim()) return;

    try {
      setPromoValidating(true);
      setPromoError(null);

      const response = await apiClient.post('/promo/validate', {
        code: promoCode.trim(),
        eventId: eventId
      });

      const promo = response.data;
      setAppliedPromo(promo);

      // Calculate discount amount
      let discount = 0;
      if (promo.discount_type === 'PERCENT') {
        discount = checkoutData.totalAmount * (promo.discount_value / 100);
      } else if (promo.discount_type === 'FIXED') {
        discount = Math.min(promo.discount_value, checkoutData.totalAmount);
      }
      setDiscountAmount(discount);

    } catch (err) {
      console.error('Error validating promo code:', err);
      setPromoError(err.response?.data?.error || 'Invalid promo code');
      setAppliedPromo(null);
      setDiscountAmount(0);
    } finally {
      setPromoValidating(false);
    }
  };

  const removePromoCode = () => {
    setPromoCode('');
    setAppliedPromo(null);
    setDiscountAmount(0);
    setPromoError(null);
  };

  const handlePurchase = async () => {
    try {
      setProcessing(true);
      setError(null);

      // Validate guest information if there are multiple tickets
      if (checkoutData.totalTickets > 1 && !isGuestInfoComplete()) {
        setError('Please fill in all guest information');
        return;
      }

      // Prepare purchase data
      const purchaseData = {
        guest_info: guestInfo
      };

      // Add promo code if applied
      if (appliedPromo) {
        purchaseData.promo_code = appliedPromo.code;
      }

      if (checkoutData.selectedSeats) {
        // Seated event - pass seat IDs
        const seatIds = checkoutData.selectedSeats.map(seat => seat.seat_id).join(',');
        purchaseData.seats = seatIds;
      } else if (checkoutData.selectedQuantities) {
        // Non-seated event - pass tier quantities
        const quantities = checkoutData.selectedQuantities
          .map(item => `${item.tier.tier_id}:${item.quantity}`)
          .join(',');
        purchaseData.quantities = quantities;
      }

      // Make purchase request
      const response = await apiClient.post(`/event/${eventId}/purchase`, purchaseData);

      setSuccess(response.data);
      
      // Redirect to success page after a short delay
      setTimeout(() => {
        navigate(`/my-tickets`);
      }, 2000);

    } catch (err) {
      console.error('Error processing purchase:', err);
      setError(err.response?.data?.error || 'Failed to process purchase');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading checkout...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (success) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto py-8 px-4">
          <Card className="text-center">
            <CardContent className="p-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Purchase Successful!</h2>
              <p className="text-muted-foreground mb-4">
                Your tickets have been purchased successfully. You will receive a confirmation email shortly.
              </p>
              <div className="bg-green-50 p-4 rounded-lg mb-4">
                <p className="text-sm">
                  <strong>Transaction ID:</strong> {success.transaction_id}
                </p>
                {success.original_amount && success.discount_amount > 0 && (
                  <>
                    <p className="text-sm">
                      <strong>Original Amount:</strong> ${success.original_amount.toFixed(2)}
                    </p>
                    <p className="text-sm text-green-600">
                      <strong>Discount Applied:</strong> -${success.discount_amount.toFixed(2)}
                    </p>
                  </>
                )}
                <p className="text-sm">
                  <strong>Total Paid:</strong> ${success.total_amount.toFixed(2)}
                </p>
                <p className="text-sm">
                  <strong>Tickets:</strong> {success.tickets_purchased}
                </p>
                {success.promo_code_applied && (
                  <p className="text-sm text-green-600">
                    <strong>Promo Code:</strong> {success.promo_code_applied}
                  </p>
                )}
              </div>
              <p className="text-sm text-muted-foreground">Redirecting to your tickets...</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!checkoutData) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Selection Found</h2>
            <p className="text-muted-foreground mb-4">
              Please go back to the seat selection page and make your selection.
            </p>
            <Button onClick={() => navigate(`/event/${eventId}/choose-seat`)}>
              Back to Seat Selection
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const finalTotal = checkoutData.totalAmount - discountAmount;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="p-2"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Checkout</h1>
              <p className="text-muted-foreground">
                {checkoutData.eventInfo.title} at {checkoutData.eventInfo.venue_name}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <Alert className="mb-6" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Selected Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  Your Selection
                </CardTitle>
              </CardHeader>
              <CardContent>
                {checkoutData.selectedSeats ? (
                  // Seated event display
                  <div className="space-y-3">
                    {checkoutData.selectedSeats.map((seat, index) => (
                      <div key={seat.seat_id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">
                            <MapPin className="h-4 w-4 inline mr-1" />
                            Seat {seat.seat_number}
                          </div>
                          <div className="text-sm text-gray-600">{seat.tier}</div>
                        </div>
                        <Badge variant="secondary" className="text-lg">
                          ${seat.price?.toFixed(2)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Non-seated event display
                  <div className="space-y-3">
                    {checkoutData.selectedQuantities.map((item, index) => (
                      <div key={item.tier.tier_id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">{item.tier.tier_name}</div>
                          <div className="text-sm text-gray-600">
                            {item.quantity} × ${item.tier.price.toFixed(2)}
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-lg">
                          ${item.subtotal.toFixed(2)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Promo Code Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Promo Code
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!appliedPromo ? (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter promo code"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        className="flex-1"
                      />
                      <Button 
                        onClick={validatePromoCode} 
                        disabled={!promoCode.trim() || promoValidating}
                        variant="outline"
                      >
                        {promoValidating ? 'Validating...' : 'Apply'}
                      </Button>
                    </div>
                    {promoError && (
                      <p className="text-sm text-red-600">{promoError}</p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                    <div>
                      <div className="font-medium text-green-800">
                        {appliedPromo.code} Applied!
                      </div>
                      <div className="text-sm text-green-600">
                        {appliedPromo.description}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={removePromoCode}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Guest Information */}
            {checkoutData.totalTickets > 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Guest Information
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    The first ticket is assigned to you. Please provide information for additional guests.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {guestInfo.map((guest, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-3">
                      <h4 className="font-medium">Guest {index + 1}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Full Name</label>
                          <Input
                            placeholder="Enter guest name"
                            value={guest.name}
                            onChange={(e) => updateGuestInfo(index, 'name', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Email</label>
                          <Input
                            type="email"
                            placeholder="Enter guest email"
                            value={guest.email}
                            onChange={(e) => updateGuestInfo(index, 'email', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Payment Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Wallet Balance */}
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Wallet Balance</span>
                    <span className="text-lg font-bold text-blue-600">
                      ${walletBalance.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Tickets ({checkoutData.totalTickets})</span>
                    <span>${checkoutData.totalAmount.toFixed(2)}</span>
                  </div>
                  
                  {appliedPromo && discountAmount > 0 && (
                    <>
                      <div className="flex justify-between text-green-600">
                        <span>Discount ({appliedPromo.code})</span>
                        <span>-${discountAmount.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>${finalTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Balance Check */}
                {walletBalance < finalTotal && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Insufficient wallet balance. Please add ${(finalTotal - walletBalance).toFixed(2)} to your wallet.
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handlePurchase}
                  disabled={
                    processing || 
                    walletBalance < finalTotal || 
                    (checkoutData.totalTickets > 1 && !isGuestInfoComplete())
                  }
                  className="w-full"
                  size="lg"
                >
                  {processing ? 'Processing...' : `Pay $${finalTotal.toFixed(2)}`}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Payment will be deducted from your wallet balance
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Checkout;
