import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { MapPin, Check, Users } from 'lucide-react';
import apiClient from '@/helpers/apiCore.js';

const SeatAssignment = ({ 
    selectedVenue, 
    ticketTiers, 
    seatAssignments, 
    setSeatAssignments,
    errors 
}) => {
    const [seatData, setSeatData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedTier, setSelectedTier] = useState('');
    const [selectedSeats, setSelectedSeats] = useState([]);

    // Fetch venue seats when venue changes
    useEffect(() => {
        if (selectedVenue && selectedVenue.isSeated) {
            fetchVenueSeats();
        } else {
            setSeatData(null);
        }
    }, [selectedVenue]);

    const fetchVenueSeats = async () => {
        if (!selectedVenue?.id) return;
        
        setLoading(true);
        try {
            const response = await apiClient.get(`/venue/${selectedVenue.id}/seats`);
            setSeatData(response.data);
        } catch (error) {
            console.error('Error fetching venue seats:', error);
        } finally {
            setLoading(false);
        }
    };

    // Dynamic tier color system
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

    const getTierIndex = (tierName) => {
        return ticketTiers.findIndex(tier => tier.tierName === tierName);
    };

    const getSeatDisplayColor = (seat) => {
        const assignedTier = seatAssignments[seat.seat_id];
        const isSelected = selectedSeats.includes(seat.seat_id);
        
        if (isSelected) {
            return 'bg-blue-500 hover:bg-blue-600 border-blue-600 text-white';
        }
        
        if (assignedTier) {
            const tierIndex = getTierIndex(assignedTier);
            if (tierIndex >= 0) {
                return getTierColorClasses(tierIndex, true);
            }
        }
        
        return 'bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-800';
    };

    const handleSeatClick = (seat) => {
        const isSelected = selectedSeats.includes(seat.seat_id);
        
        if (isSelected) {
            setSelectedSeats(selectedSeats.filter(id => id !== seat.seat_id));
        } else {
            setSelectedSeats([...selectedSeats, seat.seat_id]);
        }
    };

    const assignTierToSelectedSeats = () => {
        if (!selectedTier || selectedSeats.length === 0) return;
        
        // Get the ticket quantity for the selected tier
        const tierData = ticketTiers.find(tier => tier.tierName === selectedTier);
        const tierQuantity = parseInt(tierData?.quantity, 10) || 0;
        
        // Count current assignments for this tier
        const currentAssignments = Object.values(seatAssignments).filter(tier => tier === selectedTier).length;
        
        // Check if adding selected seats would exceed tier quantity
        const newAssignments = currentAssignments + selectedSeats.length;
        if (newAssignments > tierQuantity) {
            const availableSlots = Math.max(0, tierQuantity - currentAssignments);
            alert(`Cannot assign ${selectedSeats.length} seats to ${selectedTier}. Only ${availableSlots} seats available (${tierQuantity} total tickets, ${currentAssignments} already assigned).`);
            return;
        }
        
        const newAssignmentMap = { ...seatAssignments };
        selectedSeats.forEach(seatId => {
            newAssignmentMap[seatId] = selectedTier;
        });
        
        setSeatAssignments(newAssignmentMap);
        setSelectedSeats([]);
    };

    const clearSelectedSeats = () => {
        const newAssignments = { ...seatAssignments };
        selectedSeats.forEach(seatId => {
            delete newAssignments[seatId];
        });
        
        setSeatAssignments(newAssignments);
        setSelectedSeats([]);
    };

    const assignTierToAll = (tierName) => {
        if (!seatData?.seat_layout) return;
        
        // Get the ticket quantity for this tier
        const tierData = ticketTiers.find(tier => tier.tierName === tierName);
        const tierQuantity = parseInt(tierData?.quantity, 10) || 0;
        
        // Count total available seats
        let totalSeats = 0;
        Object.values(seatData.seat_layout).forEach(sections => {
            Object.values(sections).forEach(rows => {
                totalSeats += rows.length;
            });
        });
        
        // Check if tier quantity is less than total seats
        if (tierQuantity < totalSeats) {
            const confirmMessage = `This will assign ${totalSeats} seats to ${tierName}, but you only have ${tierQuantity} tickets for this tier. This will exceed your ticket quantity. Do you want to continue?`;
            if (!confirm(confirmMessage)) {
                return;
            }
        }
        
        const newAssignments = {};
        Object.values(seatData.seat_layout).forEach(sections => {
            Object.values(sections).forEach(rows => {
                rows.forEach(seat => {
                    newAssignments[seat.seat_id] = tierName;
                });
            });
        });
        
        setSeatAssignments(newAssignments);
    };

    const clearAllAssignments = () => {
        setSeatAssignments({});
        setSelectedSeats([]);
    };

    const getAssignmentStats = () => {
        const stats = {};
        ticketTiers
            .filter(tier => tier.tierName && tier.tierName.trim() !== '')
            .forEach(tier => {
                stats[tier.tierName] = 0;
            });
        
        Object.values(seatAssignments).forEach(tierName => {
            if (stats[tierName] !== undefined) {
                stats[tierName]++;
            }
        });
        
        return stats;
    };

    // Don't render if venue is not seated
    if (!selectedVenue || !selectedVenue.isSeated) {
        return null;
    }

    // Don't render if there are no valid ticket tiers
    const validTiers = ticketTiers.filter(tier => tier.tierName && tier.tierName.trim() !== '');
    if (validTiers.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Seat Assignment</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Please create ticket tiers first to assign seats</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Seat Assignment</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        <span className="ml-2">Loading venue seats...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!seatData?.seat_layout) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Seat Assignment</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No seat layout available for this venue</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const assignmentStats = getAssignmentStats();
    const totalSeats = seatData.total_seats || 0;
    const assignedSeats = Object.keys(seatAssignments).length;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Seat Assignment - {selectedVenue.name}
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                    Assign ticket tiers to seats. Selected: {selectedSeats.length} | Assigned: {assignedSeats}/{totalSeats}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Assignment Controls */}
                <div className="space-y-4">
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex items-center gap-2">
                            <Select value={selectedTier} onValueChange={setSelectedTier}>
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="Select tier to assign" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ticketTiers
                                        .filter(tier => tier.tierName && tier.tierName.trim() !== '')
                                        .map((tier) => (
                                        <SelectItem key={tier.tierName} value={tier.tierName}>
                                            {tier.tierName} (${tier.price})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button 
                                onClick={assignTierToSelectedSeats}
                                disabled={!selectedTier || selectedSeats.length === 0}
                                size="sm"
                            >
                                Assign to Selected ({selectedSeats.length})
                            </Button>
                            <Button 
                                onClick={clearSelectedSeats}
                                disabled={selectedSeats.length === 0}
                                variant="outline"
                                size="sm"
                            >
                                Clear Selected
                            </Button>
                        </div>
                    </div>

                    {/* Quick assign buttons */}
                    <div className="flex flex-wrap gap-2">
                        {ticketTiers
                            .filter(tier => tier.tierName && tier.tierName.trim() !== '')
                            .map((tier, index) => (
                            <Button
                                key={tier.tierName}
                                onClick={() => assignTierToAll(tier.tierName)}
                                variant="outline"
                                size="sm"
                                className={getTierColorClasses(index)}
                            >
                                Assign All to {tier.tierName}
                            </Button>
                        ))}
                        <Button
                            onClick={clearAllAssignments}
                            variant="outline"
                            size="sm"
                        >
                            Clear All
                        </Button>
                    </div>

                    {/* Assignment Statistics */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium">Assignment Status:</h4>
                        <div className="flex flex-wrap gap-4 text-sm">
                            {ticketTiers
                                .filter(tier => tier.tierName && tier.tierName.trim() !== '')
                                .map((tier, index) => {
                                    const assignedCount = assignmentStats[tier.tierName] || 0;
                                    const ticketQuantity = parseInt(tier.quantity, 10) || 0;
                                    const isOverAssigned = assignedCount > ticketQuantity;
                                    const isFullyAssigned = assignedCount === ticketQuantity;
                                    
                                    return (
                                        <div key={tier.tierName} className="flex items-center gap-2">
                                            <div className={`w-4 h-4 rounded ${getTierColorClasses(index)}`}></div>
                                            <span className={`${isOverAssigned ? 'text-red-600 font-semibold' : isFullyAssigned ? 'text-green-600' : ''}`}>
                                                {tier.tierName}: {assignedCount}/{ticketQuantity} seats
                                                {isOverAssigned && ' ⚠️'}
                                                {isFullyAssigned && !isOverAssigned && ' ✅'}
                                            </span>
                                        </div>
                                    );
                                })}
                        </div>
                        {/* Warning for over-assignments */}
                        {ticketTiers.some(tier => {
                            const assignedCount = assignmentStats[tier.tierName] || 0;
                            const ticketQuantity = parseInt(tier.quantity, 10) || 0;
                            return assignedCount > ticketQuantity;
                        }) && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-700">
                                    ⚠️ <strong>Warning:</strong> Some tiers have more assigned seats than available tickets. 
                                    Please adjust your seat assignments or increase ticket quantities.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Seat Map */}
                <div className="border rounded-lg p-4">
                    {/* Stage indicator */}
                    <div className="bg-gray-200 text-center py-2 mb-6 rounded">
                        <span className="text-sm font-semibold text-gray-700">STAGE</span>
                    </div>

                    {/* Seat sections */}
                    <div className="space-y-6">
                        {Object.entries(seatData.seat_layout).map(([section, rows]) => (
                            <div key={section} className="space-y-3">
                                <h3 className="text-sm font-semibold text-center bg-gray-50 py-1 rounded">
                                    {section}
                                </h3>
                                <div className="space-y-1">
                                    {Object.entries(rows)
                                        .sort(([a], [b]) => a.localeCompare(b))
                                        .map(([row, seats]) => {
                                            const rowRange = seatData?.seat_ranges?.[section]?.[row];
                                            if (!rowRange) return null;

                                            const seatGrid = [];
                                            for (let i = rowRange.min_seat; i <= rowRange.max_seat; i++) {
                                                const seatData = seats.find(seat => parseInt(seat.seat_number) === i);
                                                seatGrid.push(seatData || null);
                                            }

                                            return (
                                                <div key={row} className="flex items-center gap-1">
                                                    <div className="w-6 text-xs font-medium text-gray-600">
                                                        {row}
                                                    </div>
                                                    <div className="flex gap-0.5">
                                                        {seatGrid.map((seat, index) => {
                                                            const seatNumber = rowRange.min_seat + index;
                                                            
                                                            if (!seat) {
                                                                return (
                                                                    <div
                                                                        key={`empty-${seatNumber}`}
                                                                        className="w-6 h-6"
                                                                    />
                                                                );
                                                            }

                                                            const assignedTier = seatAssignments[seat.seat_id];
                                                            const isSelected = selectedSeats.includes(seat.seat_id);

                                                            return (
                                                                <button
                                                                    key={seat.seat_id}
                                                                    onClick={() => handleSeatClick(seat)}
                                                                    className={`
                                                                        w-6 h-6 text-xs border rounded transition-colors relative
                                                                        ${getSeatDisplayColor(seat)}
                                                                    `}
                                                                    title={`Seat ${seat.seat_number}${assignedTier ? ` - ${assignedTier}` : ' - Unassigned'}`}
                                                                >
                                                                    {seat.seat_number}
                                                                    {isSelected && (
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
                </div>

                {errors?.seatAssignments && (
                    <p className="text-sm text-red-500">{errors.seatAssignments}</p>
                )}
            </CardContent>
        </Card>
    );
};

export default SeatAssignment; 