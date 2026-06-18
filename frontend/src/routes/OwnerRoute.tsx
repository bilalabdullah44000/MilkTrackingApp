import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from 'notistack';
import { useEffect } from 'react';
import { Role } from '../types';

export function OwnerRoute() {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const isWorker = user?.role === Role.WORKER;

  useEffect(() => {
    if (isWorker) {
      enqueueSnackbar('Permission Denied: You do not have access to this page.', {
        variant: 'error',
        preventDuplicate: true,
      });
    }
  }, [isWorker, enqueueSnackbar]);

  if (isWorker) return <Navigate to="/" replace />;
  return <Outlet />;
}
