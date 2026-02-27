import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  if (loading) {
    return <Loader size="large" text="Loading..." />;
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default AdminRoute;