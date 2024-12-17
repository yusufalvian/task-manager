import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

// privateRoute component is a protection wrapper for routes that should only be accessible to authenticated users.  
const PrivateRoute = ({ element }) => {
    const { user } = useAuth();
    
    return user ? element : <Navigate to="/" />;
  };
  
  export default PrivateRoute;
