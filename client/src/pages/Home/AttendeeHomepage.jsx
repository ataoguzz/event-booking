import React from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function AttendeeHomepage() {
  const { user } = useAuth();
  return (
    <div className="flex flex-col justify-center items-center min-h-screen px-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Attendee Homepage</h1>
        {user && <p className="text-xl mt-4">Welcome, {user.full_name}!</p>}
        <p className="mt-2">This is the homepage for attendees.</p>
      </div>
    </div>
  );
}