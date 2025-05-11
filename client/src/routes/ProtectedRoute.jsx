import React from 'react';
import { Navigate } from 'react-router-dom';
import {useAuth} from "@/contexts/AuthContext.jsx"; // Import roles helper

const ProtectedRoute = ({ children, requiredClearance }) => {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to="/login" />;
    }

    if (!hasClearance(user.clearance, requiredClearance)) {
        return <Navigate to="/forbidden" />;
    }

    return children; // Render the protected component
};

export default ProtectedRoute;
