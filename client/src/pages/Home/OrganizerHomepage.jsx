import React from 'react';
import Navbar from "@/components/navbar.jsx";
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function OrganizerHomepage() {
  const { user } = useAuth();
  return (
      <>
          <Navbar />
    <div className="container mx-auto p-10 text-center">
      <h1 className="text-3xl font-bold">Organizer Homepage</h1>
      {user && <p className="text-xl mt-4">Welcome, Organizer {user.full_name}!</p>}
      <p className="mt-2">This is the homepage for event organizers.</p>
    </div>
          </>
  );
}