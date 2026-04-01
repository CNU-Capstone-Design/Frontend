import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router';
import { isAuthenticated } from '../utils/auth';

export function ProtectedRoute() {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);

  useEffect(() => {
    setIsAuth(isAuthenticated());
  }, []);

  if (isAuth === null) {
    // Loading state
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-600">로딩 중...</div>
      </div>
    );
  }

  return isAuth ? <Outlet /> : <Navigate to="/login" replace />;
}
