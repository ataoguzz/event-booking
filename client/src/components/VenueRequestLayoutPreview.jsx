// src/components/VenueRequestLayoutPreview.jsx (New or Modified)
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const VenueRequestLayoutPreview = ({ rows, cols }) => {
    // Basic validation for preview
    const numRows = parseInt(rows, 10);
    const numCols = parseInt(cols, 10);

    if (isNaN(numRows) || isNaN(numCols) || numRows <= 0 || numCols <= 0 || numRows > 50 || numCols > 50) { // Max preview size
        return (
            <div className="p-4 mt-2 text-center text-sm text-muted-foreground border rounded-md bg-slate-50">
                Enter valid row (1-50) and column (1-50) numbers to see a layout preview.
            </div>
        );
    }

    const generatedSeatLayout = {};
    const generatedSeatRanges = { 'SECTION A': {} }; // Assuming a single section for simplicity
    let totalVirtualSeats = 0;

    // Generate a simple "SECTION A" with specified rows and cols
    generatedSeatLayout['SECTION A'] = {};
    for (let r = 0; r < numRows; r++) {
        const rowLabel = String.fromCharCode(65 + r); // A, B, C...
        const rowSeats = [];
        for (let c = 1; c <= numCols; c++) {
            // For preview, we don't need real seat_ids, just identifiers for rendering
            rowSeats.push({ seat_id: `virtual-${rowLabel}-${c}`, seat_number: c.toString(), section: 'SECTION A', row_label: rowLabel });
            totalVirtualSeats++;
        }
        generatedSeatLayout['SECTION A'][rowLabel] = rowSeats;
        generatedSeatRanges['SECTION A'][rowLabel] = { min_seat: 1, max_seat: numCols };
    }

    const virtualSeatData = {
        seat_layout: generatedSeatLayout,
        seat_ranges: generatedSeatRanges,
        total_seats: totalVirtualSeats
    };

    return (
        <Card className="mt-4">
            <CardHeader className="pb-2">
                <CardTitle className="text-base">Layout Preview</CardTitle>
                <CardDescription>
                    {numRows} rows × {numCols} seats/row = {totalVirtualSeats.toLocaleString()} virtual seats in "SECTION A"
                </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto p-2">
                <div className="border rounded-lg p-2 inline-block">
                    <div className="bg-gray-200 text-center py-1 mb-3 rounded-sm">
                        <span className="text-xs font-semibold text-gray-700">STAGE (FRONT)</span>
                    </div>
                    <div className="space-y-2">
                        {Object.entries(virtualSeatData.seat_layout).map(([section, sectionRows]) => (
                            <div key={section} className="space-y-1.5">
                                {/* Optional: Show section name if more than one section is possible later */}
                                {/* <h3 className="text-xs font-semibold text-center bg-gray-100 py-0.5 rounded">{section}</h3> */}
                                <div className="space-y-0.5">
                                    {Object.entries(sectionRows)
                                        // Simple sort for preview if needed, or rely on generation order
                                        .sort(([a], [b]) => a.localeCompare(b))
                                        .map(([rowLabel, seatsInRow]) => {
                                            const rowRange = virtualSeatData.seat_ranges?.[section]?.[rowLabel];
                                            if (!rowRange) return null;

                                            // Create a full grid for display, including empty spots if needed by more complex logic
                                            const seatGridDisplay = [];
                                            for (let i = rowRange.min_seat; i <= rowRange.max_seat; i++) {
                                                const seat = seatsInRow.find(s => parseInt(s.seat_number) === i);
                                                seatGridDisplay.push(seat || null); // Push null for gaps if any
                                            }

                                            return (
                                                <div key={rowLabel} className="flex items-center gap-0.5">
                                                    <div className="w-5 text-xxs font-medium text-center text-gray-500 flex-shrink-0">
                                                        {rowLabel}
                                                    </div>
                                                    <div className="flex gap-0.5">
                                                        {seatGridDisplay.map((seat, index) => {
                                                            const seatNumber = rowRange.min_seat + index;
                                                            if (!seat) { // For empty spots in a non-rectangular row (not applicable for simple AxB)
                                                                return (<div key={`empty-${section}-${rowLabel}-${seatNumber}`} className="w-4 h-4" />);
                                                            }
                                                            return (
                                                                <div
                                                                    key={seat.seat_id}
                                                                    className="w-4 h-4 text-xxxs border rounded bg-slate-200 border-slate-400 flex items-center justify-center text-slate-600"
                                                                    title={`Row ${rowLabel}, Seat ${seat.seat_number}`}
                                                                >
                                                                    {/* {seat.seat_number}  Usually too small to display number */}
                                                                </div>
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
            </CardContent>
        </Card>
    );
};

export default VenueRequestLayoutPreview;