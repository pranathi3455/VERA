import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingState from './LoadingState';

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <LoadingState message="Verifying authentication session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login while preserving target route in state
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
