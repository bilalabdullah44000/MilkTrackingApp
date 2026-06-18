import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SpeedDial, SpeedDialAction, SpeedDialIcon,
} from '@mui/material';
import { LocalShipping, ShoppingCart, PeopleAlt } from '@mui/icons-material';

interface FABProps {
  role: 'OWNER' | 'WORKER';
}

export function FAB({ role }: FABProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const ownerActions = [
    { icon: <PeopleAlt />, name: 'Bulk Deliveries', path: '/deliveries/bulk-add' },
    { icon: <ShoppingCart />, name: 'Add Purchase', path: '/purchases?add=1' },
    { icon: <LocalShipping />, name: 'Add Delivery', path: '/deliveries?add=1' },
  ];

  const workerActions = [
    { icon: <PeopleAlt />, name: 'Bulk Deliveries', path: '/deliveries/bulk-add' },
    { icon: <LocalShipping />, name: 'Add Delivery', path: '/deliveries?add=1' },
  ];

  const actions = role === 'OWNER' ? ownerActions : workerActions;

  return (
    <SpeedDial
      ariaLabel="Quick Actions"
      sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1400 }}
      icon={<SpeedDialIcon />}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
    >
      {actions.map((action) => (
        <SpeedDialAction
          key={action.name}
          icon={action.icon}
          tooltipTitle={action.name}
          tooltipOpen
          onClick={() => { navigate(action.path); setOpen(false); }}
        />
      ))}
    </SpeedDial>
  );
}
