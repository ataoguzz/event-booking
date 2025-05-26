import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import AttendeeHomepage from './AttendeeHomepage.jsx';
import AdminHomepage from './AdminHomepage.jsx';

export default function Home() {
    const { user, isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p className="text-xl">Loading user data...</p>
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }

    switch (user.role) {
        case 'attendee':
            return <AttendeeHomepage />;
        case 'organizer':
            return <OrganizerHomepage />;
        case 'admin':
            return <AdminHomepage />;
        default:
            console.warn("HomePage: Unknown or unhandled user role:", user.role);
            return (
                <div className="flex flex-col justify-center items-center min-h-screen text-center p-4">
                    <h1 className="text-2xl font-semibold">Welcome, {user.full_name}!</h1>
                    <p className="mt-2">Your role in the system is not specifically configured for a custom homepage.</p>
                    <p className="mt-4">Please contact support if you believe this is an error.</p>
                </div>
            );
    }
}