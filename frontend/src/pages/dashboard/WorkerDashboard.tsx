import { useQuery } from '@apollo/client';
import {
  Box, Card, CardContent, Typography, List, ListItem,
  ListItemText, ListItemIcon, Divider, Skeleton, Chip,
} from '@mui/material';
import { CheckCircle, LocalShipping } from '@mui/icons-material';
import { GET_DELIVERIES } from '../../graphql/queries';
import { today, formatNumber } from '../../utils/formatters';
import { useAuth } from '../../contexts/AuthContext';
import { MilkDelivery } from '../../types';

export default function WorkerDashboard() {
  const { user } = useAuth();
  const todayStr = today();

  const { data, loading } = useQuery(GET_DELIVERIES, {
    variables: { startDate: todayStr, endDate: todayStr },
  });

  const deliveries: MilkDelivery[] = data?.getDeliveries ?? [];

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h5" fontWeight={700}>
          Good morning, {user?.fullName?.split(' ')[0]}!
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
        </Typography>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <CheckCircle color="success" />
            <Typography variant="h6" fontWeight={600}>
              Completed Today
            </Typography>
            <Chip label={deliveries.length} color="success" size="small" sx={{ ml: 'auto' }} />
          </Box>

          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} height={56} sx={{ mb: 1 }} />
            ))
          ) : deliveries.length === 0 ? (
            <Box textAlign="center" py={4}>
              <LocalShipping sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography color="text.secondary">No deliveries logged yet today</Typography>
            </Box>
          ) : (
            <List disablePadding>
              {deliveries.map((d, idx) => (
                <Box key={d.id}>
                  <ListItem disablePadding sx={{ py: 1 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <CheckCircle color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={d.customer.name}
                      secondary={`${formatNumber(d.quantityLiters)} L`}
                    />
                    <Typography variant="body2" fontWeight={600}>
                      {formatNumber(d.quantityLiters)} L
                    </Typography>
                  </ListItem>
                  {idx < deliveries.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
