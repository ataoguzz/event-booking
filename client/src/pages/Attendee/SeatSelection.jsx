import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import Layout from '@/components/Layout.jsx';
import { Button } from '@/components/ui/button.jsx';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Separator } from '@/components/ui/separator.jsx';
import { 
  ChevronLeft, 
  Users, 
  MapPin,
  Check,
  X
} from 'lucide-react';
import apiClient from '../../helpers/apiCore.js';

const SeatSelection = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [seatData, setSeatData] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [ticketQuantities, setTicketQuantities] = useState({}); // For non-seated events

  useEffect(() => {
    const fetchSeats = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/event/${eventId}/seats`);
        setSeatData(response.data);
        
        // Initialize ticket quantities for non-seated events
        if (response.data?.tiers) {
          const initialQuantities = {};
          response.data.tiers.forEach(tier => {
            initialQuantities[tier.tier_id] = 0;
          });
          setTicketQuantities(initialQuantities);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching seats:', err);
        setError(err.response?.data?.error || 'Failed to fetch seat information');
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchSeats();
    }
  }, [eventId]);

  const handleSeatClick = (seat) => {
    // Only allow selection if seat is available
    if (seat.status !== 'AVAILABLE') return;

    const isSelected = selectedSeats.some(s => s.seat_id === seat.seat_id);

    if (isSelected) {
      setSelectedSeats(selectedSeats.filter(s => s.seat_id !== seat.seat_id));
    } else {
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const calculateTotal = () => {
    return selectedSeats.reduce((total, seat) => total + (seat.price || 0), 0);
  };

  // Functions for non-seated events
  const updateQuantity = (tierId, change) => {
    setTicketQuantities(prev => {
      const newQuantity = Math.max(0, (prev[tierId] || 0) + change);
      return { ...prev, [tierId]: newQuantity };
    });
  };

  const calculateTotalQuantity = () => {
    return Object.values(ticketQuantities).reduce((sum, qty) => sum + qty, 0);
  };

  const calculateTotalPrice = () => {
    if (!seatData?.tiers) return 0;
    
    return seatData.tiers.reduce((total, tier) => {
      const quantity = ticketQuantities[tier.tier_id] || 0;
      return total + (quantity * tier.price);
    }, 0);
  };

  // Dynamic tier color system - supports up to 7+ tiers
  const getTierColorClasses = (tierIndex, isHover = false) => {
    const colorPalette = [
      {
        bg: 'bg-purple-100',
        hover: 'bg-purple-200', 
        border: 'border-purple-300',
        text: 'text-purple-800'
      },
      {
        bg: 'bg-amber-100',
        hover: 'bg-amber-200',
        border: 'border-amber-300', 
        text: 'text-amber-800'
      },
      {
        bg: 'bg-green-100',
        hover: 'bg-green-200',
        border: 'border-green-300',
        text: 'text-green-800'
      },
      {
        bg: 'bg-blue-100',
        hover: 'bg-blue-200',
        border: 'border-blue-300',
        text: 'text-blue-800'
      },
      {
        bg: 'bg-pink-100',
        hover: 'bg-pink-200',
        border: 'border-pink-300',
        text: 'text-pink-800'
      },
      {
        bg: 'bg-indigo-100',
        hover: 'bg-indigo-200',
        border: 'border-indigo-300',
        text: 'text-indigo-800'
      },
      {
        bg: 'bg-teal-100',
        hover: 'bg-teal-200',
        border: 'border-teal-300',
        text: 'text-teal-800'
      }
    ];
    
    const colors = colorPalette[tierIndex % colorPalette.length];
    const bgClass = isHover ? `hover:${colors.hover}` : colors.bg;
    return `${colors.bg} ${bgClass} ${colors.border} ${colors.text}`;
  };

  // Create tier mapping from API data
  const getTierInfo = (tierName) => {
    if (!seatData?.tiers || !tierName) return { index: -1, tier: null };
    
    const tierIndex = seatData.tiers.findIndex(tier => tier.tier_name === tierName);
    return {
      index: tierIndex,
      tier: tierIndex >= 0 ? seatData.tiers[tierIndex] : null
    };
  };

  const getSeatStatusColor = (seat) => {
    const isSelected = selectedSeats.some(s => s.seat_id === seat.seat_id);
    
    if (isSelected) return 'bg-blue-500 hover:bg-blue-600 border-blue-600 text-white';
    
    switch (seat.status) {
      case 'AVAILABLE':
        // Use dynamic tier coloring
        const tierInfo = getTierInfo(seat.tier);
        if (tierInfo.index >= 0) {
          return getTierColorClasses(tierInfo.index, true);
        }
        return 'bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-800';
      case 'PURCHASED':
        return 'bg-red-100 border-red-300 text-red-800 cursor-not-allowed';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed';
    }
  };

  const handleProceedToCheckout = () => {
    if (seatData?.venue?.is_seated) {
      if (selectedSeats.length === 0) return;
      
      const checkoutData = {
        eventInfo: {
          event_id: seatData.event.event_id,
          title: seatData.event.title,
          venue_name: seatData.event.venue_name,
          is_seated: seatData.venue.is_seated
        },
        selectedSeats: selectedSeats,
        totalAmount: calculateTotal(),
        totalTickets: selectedSeats.length
      };
      
      navigate(`/event/${eventId}/checkout`, { state: checkoutData });
    } else {
      // Non-seated event - use ticket quantities
      if (calculateTotalQuantity() === 0) return;
      
      // Build selected quantities data
      const selectedQuantitiesData = Object.entries(ticketQuantities)
        .filter(([tierId, qty]) => qty > 0)
        .map(([tierId, qty]) => {
          const tier = seatData.tiers.find(t => t.tier_id === parseInt(tierId));
          return {
            tier: tier,
            quantity: qty,
            subtotal: tier.price * qty
          };
        });
      
      // Pass actual ticket data through router state
      const checkoutData = {
        eventInfo: {
          event_id: seatData.event.event_id,
          title: seatData.event.title,
          venue_name: seatData.event.venue_name,
          is_seated: seatData.venue.is_seated
        },
        selectedQuantities: selectedQuantitiesData,
        totalAmount: calculateTotalPrice(),
        totalTickets: calculateTotalQuantity()
      };
      
      navigate(`/event/${eventId}/checkout`, { state: checkoutData });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto py-8 px-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading seat map...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto py-8 px-4">
          <div className="text-center">
            <X className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Unable to Load Seats</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => navigate(-1)} variant="outline">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-8 px-4">
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
              <h1 className="text-3xl font-bold text-foreground">
                {seatData?.venue?.is_seated ? 'Select Your Seats' : 'Select Your Tickets'}
              </h1>
              <p className="text-muted-foreground">
                {seatData?.event?.title} at {seatData?.event?.venue_name}
              </p>
            </div>
          </div>

          {/* Legend - only show for seated events */}
          {seatData?.venue?.is_seated && (
            <div className="flex items-center gap-4 text-sm flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 border border-blue-600 rounded"></div>
                <span>Selected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                <span>Sold</span>
              </div>
              {/* Dynamic tier legend */}
              {seatData?.tiers?.map((tier, index) => (
                <div key={tier.tier_id} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded ${getTierColorClasses(index)}`}></div>
                  <span>{tier.tier_name} (${tier.price})</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Render different content based on venue type */}
        {seatData?.venue?.is_seated ? (
          // SEATED EVENT - Show seat grid
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Seat Map */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Venue Layout
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Stage indicator */}
                  <div className="bg-gray-200 text-center py-3 mb-8 rounded-lg">
                    <span className="text-lg font-semibold text-gray-700">STAGE</span>
                  </div>

                  {/* Seat sections */}
                  {seatData?.seat_layout && Object.keys(seatData.seat_layout).length > 0 ? (
                    <div className="space-y-8">
                      {Object.entries(seatData.seat_layout).map(([section, rows]) => (
                        <div key={section} className="space-y-4">
                          <h3 className="text-lg font-semibold text-center bg-gray-50 py-2 rounded">
                            {section}
                          </h3>
                          <div className="space-y-2">
                            {Object.entries(rows)
                              .sort(([a], [b]) => a.localeCompare(b))
                              .map(([row, seats]) => {
                                // Get the full seat range for this row from the API data
                                let rowRange = seatData?.seat_ranges?.[section]?.[row];
                                if (!rowRange) {
                                  // Fallback to existing logic if range data is not available
                                  const seatNumbers = seats.map(seat => parseInt(seat.seat_number)).sort((a, b) => a - b);
                                  rowRange = {
                                    min_seat: Math.min(...seatNumbers),
                                    max_seat: Math.max(...seatNumbers)
                                  };
                                }
                                
                                // Create an array to hold all possible seat positions
                                const seatGrid = [];
                                for (let i = rowRange.min_seat; i <= rowRange.max_seat; i++) {
                                  const seatData = seats.find(seat => parseInt(seat.seat_number) === i);
                                  seatGrid.push(seatData || null); // null for empty positions
                                }
                                
                                return (
                                  <div key={row} className="flex items-center gap-2">
                                    <div className="w-8 text-sm font-medium text-gray-600">
                                      {row}
                                    </div>
                                    <div className="flex gap-1 flex-wrap">
                                      {seatGrid.map((seat, index) => {
                                        const seatNumber = rowRange.min_seat + index;
                                        
                                        if (!seat) {
                                          // Empty space for non-existent seats
                                          return (
                                            <div
                                              key={`empty-${seatNumber}`}
                                              className="w-8 h-8 text-xs"
                                              title={`Seat ${seatNumber} - Not available`}
                                            >
                                              {/* Empty space to maintain positioning */}
                                            </div>
                                          );
                                        }
                                        
                                        // Determine if seat should be clickable
                                        const isClickable = seat.status === 'AVAILABLE';
                                        
                                        return (
                                          <button
                                            key={seat.seat_id}
                                            onClick={() => handleSeatClick(seat)}
                                            disabled={!isClickable}
                                            className={`
                                              w-8 h-8 text-xs border rounded transition-colors relative
                                              ${getSeatStatusColor(seat)}
                                            `}
                                            title={`Seat ${seat.seat_number} - ${seat.tier} - $${seat.price} - ${seat.status}`}
                                          >
                                            {seat.seat_number}
                                            {selectedSeats.some(s => s.seat_id === seat.seat_id) && (
                                              <Check className="h-3 w-3 absolute inset-0 m-auto text-white" />
                                            )}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No seats available for the selected criteria</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Selection Summary for Seated Events */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Your Selection</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Selected seats */}
                  {selectedSeats.length > 0 ? (
                    <div className="space-y-3">
                      {selectedSeats.map((seat) => (
                        <div key={seat.seat_id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div className="text-sm">
                            <div className="font-medium">Seat {seat.seat_number}</div>
                            <div className="text-gray-600">{seat.tier}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">${seat.price}</div>
                            <button
                              onClick={() => handleSeatClick(seat)}
                              className="text-red-500 hover:text-red-700 text-xs"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No seats selected</p>
                    </div>
                  )}

                  <Separator />

                  {/* Total */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total ({selectedSeats.length} seats)</span>
                      <span className="text-lg font-bold">${calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Statistics */}
                  {seatData?.statistics && (
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>Available: {seatData.statistics.available_seats}</div>
                      <div>Sold: {seatData.statistics.sold_seats}</div>
                      <div>Total: {seatData.statistics.total_seats}</div>
                    </div>
                  )}

                  <Button
                    onClick={handleProceedToCheckout}
                    disabled={selectedSeats.length === 0}
                    className="w-full"
                    size="lg"
                  >
                    Proceed to Checkout
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          // NON-SEATED EVENT - Show ticket quantity selector
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  General Admission Tickets
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Ticket types */}
                {seatData?.tiers?.map((tier, index) => (
                  <div key={tier.tier_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded ${getTierColorClasses(index)}`}></div>
                        <div>
                          <h3 className="font-semibold">{tier.tier_name}</h3>
                          <p className="text-2xl font-bold text-green-600">${tier.price}</p>
                          {tier.description && (
                            <p className="text-sm text-gray-600 mt-1">{tier.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(tier.tier_id, -1)}
                        disabled={!ticketQuantities[tier.tier_id]}
                      >
                        -
                      </Button>
                      <span className="text-lg font-medium min-w-[2rem] text-center">
                        {ticketQuantities[tier.tier_id] || 0}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(tier.tier_id, 1)}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                ))}

                <Separator />

                {/* Summary */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Tickets</span>
                    <span className="text-lg">{calculateTotalQuantity()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Price</span>
                    <span className="text-2xl font-bold">${calculateTotalPrice().toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  onClick={handleProceedToCheckout}
                  disabled={calculateTotalQuantity() === 0}
                  className="w-full"
                  size="lg"
                >
                  Proceed to Checkout ({calculateTotalQuantity()} tickets)
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SeatSelection;