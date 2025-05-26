import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { StarIcon } from "@radix-ui/react-icons";

export default function EventCard({ event }) {
    const {
        event_id,
        title,
        description,
        start_at,
        base_price,
        category,
        avg_rating,
        hero_image_url,
        venue_name,
        city
    } = event;

    return (
        <Link to={`/event/${event_id}`}>
            <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="aspect-video relative overflow-hidden">
                    <img
                        src={hero_image_url || '/placeholder-event.jpg'}
                        alt={title}
                        className="object-cover w-full h-full transform hover:scale-105 transition-transform duration-300"
                    />
                    <Badge className="absolute top-2 right-2 bg-black/75">
                        {category}
                    </Badge>
                </div>
                
                <CardHeader className="space-y-1">
                    <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-xl line-clamp-1">{title}</h3>
                        {avg_rating && (
                            <div className="flex items-center space-x-1">
                                <StarIcon className="h-4 w-4 fill-yellow-400" />
                                <span className="text-sm">{avg_rating.toFixed(1)}</span>
                            </div>
                        )}
                    </div>
                    <p className="text-sm text-gray-500">
                        {venue_name}, {city}
                    </p>
                </CardHeader>

                <CardContent>
                    <p className="text-sm text-gray-600 line-clamp-2">
                        {description}
                    </p>
                </CardContent>

                <CardFooter className="flex justify-between items-center">
                    <div className="text-sm">
                        {format(new Date(start_at), 'MMM d, yyyy • h:mm a')}
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="font-semibold">${base_price}</span>
                        <Button variant="outline" size="sm">
                            View Details
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </Link>
    );
} 