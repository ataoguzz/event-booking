// src/components/VenueRequestSeatPreview.jsx (New File)
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const VenueRequestSeatPreview = ({ rows, cols }) => {
    if (isNaN(rows) || isNaN(cols) || rows <= 0 || cols <= 0 || rows > 50 || cols > 50) { // Added sanity check for large grids
        return (
            <div className="p-4 text-center text-sm text-muted-foreground border rounded-md">
                Enter valid row and column numbers (e.g., 1-50) to see a layout preview.
            </div>
        );
    }

    const seatGrid = [];
    for (let r = 0; r < rows; r++) {
        const rowSeats = [];
        const rowLabel = String.fromCharCode(65 + r); // A, B, C...
        for (let c = 1; c <= cols; c++) {
            rowSeats.push({ id: `${rowLabel}${c}`, label: c.toString() });
        }
        seatGrid.push({ rowLabel, seats: rowSeats });
    }

    return (
        <Card className="mt-4">
            <CardHeader>
                <CardTitle className="text-lg">Seating Layout Preview</CardTitle>
                <CardDescription>
                    {rows} rows × {cols} seats per row = {(rows * cols).toLocaleString()} total virtual seats.
                </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
                {/* Stage indicator */}
                <div className="bg-gray-200 text-center py-1 mb-3 rounded-sm w-fit px-4 mx-auto">
                    <span className="text-xs font-semibold text-gray-700">STAGE (FRONT)</span>
                </div>
                <div className="space-y-1 inline-block p-2 border rounded-md">
                    {seatGrid.map(rowItem => (
                        <div key={rowItem.rowLabel} className="flex items-center gap-1">
                            <div className="w-6 text-xs font-medium text-center text-muted-foreground">
                                {rowItem.rowLabel}
                            </div>
                            <div className="flex gap-0.5">
                                {rowItem.seats.map(seat => (
                                    <div
                                        key={seat.id}
                                        className="w-5 h-5 text-xxs border rounded bg-blue-100 border-blue-300 flex items-center justify-center text-blue-700"
                                        title={`Row ${rowItem.rowLabel}, Seat ${seat.label}`}
                                    >
                                        {/* You can show seat.label if seats are not too small, or just keep it a box */}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                { (cols > 20 || rows > 20) &&
                    <p className="text-xs text-muted-foreground mt-2 text-center">Preview might be truncated for very large layouts.</p>
                }
            </CardContent>
        </Card>
    );
};

export default VenueRequestSeatPreview;