import React from 'react';
import { Navigate } from 'react-router-dom';
import { getToken } from '../utils/auth';

interface Props {
  children: React.ReactElement;
}

const RequireAuth: React.FC<Props> = ({ children }) => {
  const token = getToken();

  if (!token) {
    // Not logged in, redirect to sign-in
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default RequireAuth; 