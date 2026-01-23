import { Navigate } from 'react-router-dom';

export const Dashboard = () => {
  // Redirect to overview page
  return <Navigate to="/dashboard/overview" replace />;
};

