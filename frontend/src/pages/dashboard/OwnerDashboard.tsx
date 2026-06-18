import { useState } from 'react';
import { useQuery } from '@apollo/client';
import {
  Box, Grid, Card, CardContent, Typography, Tab, Tabs,
  IconButton, Chip, Skeleton, Select, MenuItem, FormControl,
} from '@mui/material';
import {
  ArrowBack, ArrowForward, TrendingUp, TrendingDown,
  LocalShipping, ShoppingCart, AttachMoney, MonetizationOn,
} from '@mui/icons-material';
import { GET_DASHBOARD_STATS } from '../../graphql/queries';
import {
  today, startOfMonth, endOfMonth, startOfYear, endOfYear, formatCurrency, formatNumber,
} from '../../utils/formatters';
import dayjs from 'dayjs';

type RangeType = 'day' | 'month' | 'year' | 'custom';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
}

function StatCard({ title, value, icon, color, loading }: StatCardProps) {
  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            {loading ? (
              <Skeleton width={100} height={36} />
            ) : (
              <Typography variant="h5" fontWeight={700}>
                {value}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              width: 48, height: 48, borderRadius: 2,
              bgcolor: `${color}.light`, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              opacity: 0.85,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

function getDateRange(type: RangeType, offset: number) {
  const now = dayjs();
  if (type === 'day') {
    const d = now.add(offset, 'day').format('YYYY-MM-DD');
    return { start: d, end: d, label: offset === 0 ? 'Today' : now.add(offset, 'day').format('DD MMM YYYY') };
  }
  if (type === 'month') {
    const m = now.add(offset, 'month');
    return { start: m.startOf('month').format('YYYY-MM-DD'), end: m.endOf('month').format('YYYY-MM-DD'), label: m.format('MMMM YYYY') };
  }
  if (type === 'year') {
    const y = now.add(offset, 'year');
    return { start: `${y.year()}-01-01`, end: `${y.year()}-12-31`, label: String(y.year()) };
  }
  return { start: startOfMonth(), end: endOfMonth(), label: 'Current Month' };
}

export default function OwnerDashboard() {
  const [rangeType, setRangeType] = useState<RangeType>('day');
  const [offset, setOffset] = useState(0);
  const [customStart, setCustomStart] = useState(startOfMonth());
  const [customEnd, setCustomEnd] = useState(endOfMonth());

  const { start, end, label } = rangeType === 'custom'
    ? { start: customStart, end: customEnd, label: `${customStart} → ${customEnd}` }
    : getDateRange(rangeType, offset);

  const { data, loading } = useQuery(GET_DASHBOARD_STATS, {
    variables: { startDate: start, endDate: end },
    skip: !start || !end,
  });

  const stats = data?.getDashboardStats;
  const profitPositive = (stats?.profit ?? 0) >= 0;

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>
        Dashboard
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
            <Tabs
              value={rangeType}
              onChange={(_, v) => { setRangeType(v); setOffset(0); }}
              sx={{ minHeight: 36, '& .MuiTab-root': { minHeight: 36, py: 0.5 } }}
            >
              <Tab label="Day" value="day" />
              <Tab label="Month" value="month" />
              <Tab label="Year" value="year" />
              <Tab label="Custom" value="custom" />
            </Tabs>

            {rangeType !== 'custom' && (
              <Box display="flex" alignItems="center" gap={1} ml="auto">
                <IconButton size="small" onClick={() => setOffset((o) => o - 1)}>
                  <ArrowBack fontSize="small" />
                </IconButton>
                <Chip label={label} size="small" color="primary" variant="outlined" />
                <IconButton size="small" onClick={() => setOffset((o) => o + 1)} disabled={offset >= 0}>
                  <ArrowForward fontSize="small" />
                </IconButton>
              </Box>
            )}

            {rangeType === 'custom' && (
              <Box display="flex" gap={1} ml="auto" alignItems="center">
                <input
                  type="date" value={customStart} max={customEnd}
                  onChange={(e) => setCustomStart(e.target.value)}
                  style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #ccc', fontSize: 13 }}
                />
                <Typography variant="body2">to</Typography>
                <input
                  type="date" value={customEnd} min={customStart}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #ccc', fontSize: 13 }}
                />
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Milk Purchased"
            value={`${formatNumber(stats?.milkPurchasedLiters ?? 0)} L`}
            icon={<ShoppingCart sx={{ color: 'info.main' }} />}
            color="info"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Milk Supplied"
            value={`${formatNumber(stats?.milkSuppliedLiters ?? 0)} L`}
            icon={<LocalShipping sx={{ color: 'secondary.main' }} />}
            color="secondary"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Revenue"
            value={formatCurrency(stats?.revenue ?? 0)}
            icon={<AttachMoney sx={{ color: 'success.main' }} />}
            color="success"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Cost"
            value={formatCurrency(stats?.cost ?? 0)}
            icon={<TrendingDown sx={{ color: 'error.main' }} />}
            color="error"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Net Profit
                  </Typography>
                  {loading ? (
                    <Skeleton width={140} height={48} />
                  ) : (
                    <Typography variant="h4" fontWeight={700} color={profitPositive ? 'success.main' : 'error.main'}>
                      {formatCurrency(stats?.profit ?? 0)}
                    </Typography>
                  )}
                </Box>
                <Box
                  sx={{
                    width: 56, height: 56, borderRadius: 2,
                    bgcolor: profitPositive ? 'success.light' : 'error.light',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.85,
                  }}
                >
                  {profitPositive
                    ? <TrendingUp sx={{ color: 'success.main', fontSize: 32 }} />
                    : <TrendingDown sx={{ color: 'error.main', fontSize: 32 }} />}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
