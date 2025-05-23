import React from 'react';
import Layout from "@/components/Layout.jsx"; // 1. Import Layout
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function OrganizerHomepage() {
    const { user } = useAuth();
    return (
        <Layout>
            <div className="container mx-auto p-10 text-center">
                <h1 className="text-3xl font-bold">Organizer Homepage</h1>
                {user && <p className="text-xl mt-4">Welcome, Organizer {user.full_name}!</p>}
                <p className="mt-2">This is the homepage for event organizers.</p>
            </div>
        </Layout>
    );
}