import { Navigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

export default function ProtectedRoute({ children, roles }) {
  const { currentUser } = useAppContext();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(currentUser.role.toLowerCase())) {
    // Wrong role — redirect to their correct dashboard
    const redirectMap = { admin: '/dashboard/admin', owner: '/dashboard/studio', client: '/dashboard/client' };
    return <Navigate to={redirectMap[currentUser.role.toLowerCase()] || '/'} replace />;
  }

  return children;
}
