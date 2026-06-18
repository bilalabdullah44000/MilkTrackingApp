import { useState } from 'react';
import { useQuery, useLazyQuery } from '@apollo/client';
import {
  Box, Card, CardContent, Typography, Grid, Button, Tab, Tabs,
  FormControl, InputLabel, Select, MenuItem, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Divider,
  Skeleton, Alert,
} from '@mui/material';
import { Download, Receipt } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { GET_VENDORS, GET_CUSTOMERS, GET_MONTHLY_VENDOR_BILL, GET_MONTHLY_CUSTOMER_INVOICE } from '../../graphql/queries';
import { Vendor, Customer, MonthlyStatement } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { generateStatementPDF } from '../../utils/pdfGenerator';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 3 }, (_, i) => currentYear - i);

export default function BillingPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [tab, setTab] = useState<'vendor' | 'customer'>('vendor');
  const [vendorId, setVendorId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(currentYear);
  const [statement, setStatement] = useState<MonthlyStatement | null>(null);

  const { data: vendorsData } = useQuery(GET_VENDORS, { variables: { activeOnly: true } });
  const { data: customersData } = useQuery(GET_CUSTOMERS, { variables: { activeOnly: true } });

  const [fetchVendorBill, { loading: vendorLoading }] = useLazyQuery(GET_MONTHLY_VENDOR_BILL, {
    onCompleted: (data) => setStatement(data.getMonthlyVendorBill),
    onError: (err) => enqueueSnackbar(err.message, { variant: 'error' }),
  });

  const [fetchCustomerInvoice, { loading: customerLoading }] = useLazyQuery(GET_MONTHLY_CUSTOMER_INVOICE, {
    onCompleted: (data) => setStatement(data.getMonthlyCustomerInvoice),
    onError: (err) => enqueueSnackbar(err.message, { variant: 'error' }),
  });

  const vendors: Vendor[] = vendorsData?.getVendors ?? [];
  const customers: Customer[] = customersData?.getCustomers ?? [];
  const loading = vendorLoading || customerLoading;

  const handleGenerate = () => {
    setStatement(null);
    if (tab === 'vendor' && vendorId) {
      fetchVendorBill({ variables: { vendorId, month, year } });
    } else if (tab === 'customer' && customerId) {
      fetchCustomerInvoice({ variables: { customerId, month, year } });
    } else {
      enqueueSnackbar('Please select an entity', { variant: 'warning' });
    }
  };

  const handleDownload = () => {
    if (statement) generateStatementPDF(statement, tab);
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>
        Billing & Invoices
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Tabs value={tab} onChange={(_, v) => { setTab(v); setStatement(null); }} sx={{ mb: 3 }}>
            <Tab label="Vendor Bill" value="vendor" />
            <Tab label="Customer Invoice" value="customer" />
          </Tabs>

          <Grid container spacing={2} alignItems="flex-end">
            <Grid item xs={12} sm={4}>
              {tab === 'vendor' ? (
                <FormControl fullWidth>
                  <InputLabel>Vendor</InputLabel>
                  <Select value={vendorId} onChange={(e) => setVendorId(e.target.value)} label="Vendor">
                    {vendors.map((v) => <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>)}
                  </Select>
                </FormControl>
              ) : (
                <FormControl fullWidth>
                  <InputLabel>Customer</InputLabel>
                  <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)} label="Customer">
                    {customers.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                  </Select>
                </FormControl>
              )}
            </Grid>
            <Grid item xs={6} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Month</InputLabel>
                <Select value={month} onChange={(e) => setMonth(Number(e.target.value))} label="Month">
                  {MONTHS.map((m, i) => <MenuItem key={i + 1} value={i + 1}>{m}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={2}>
              <FormControl fullWidth>
                <InputLabel>Year</InputLabel>
                <Select value={year} onChange={(e) => setYear(Number(e.target.value))} label="Year">
                  {YEARS.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Button variant="contained" onClick={handleGenerate} fullWidth size="large" startIcon={<Receipt />} disabled={loading}>
                Generate
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardContent>
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={48} sx={{ mb: 1 }} />)}
          </CardContent>
        </Card>
      )}

      {!loading && statement && (
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  {tab === 'vendor' ? 'Vendor Bill' : 'Customer Invoice'}
                </Typography>
                <Typography color="text.secondary">
                  {statement.entityName} — {statement.month} {statement.year}
                </Typography>
              </Box>
              <Button variant="outlined" startIcon={<Download />} onClick={handleDownload}>
                Download PDF
              </Button>
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Quantity (L)</TableCell>
                    <TableCell align="right">Rate (PKR/L)</TableCell>
                    <TableCell align="right">Amount (PKR)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {statement.transactions.map((t, i) => (
                    <TableRow key={i} hover>
                      <TableCell>{formatDate(t.date)}</TableCell>
                      <TableCell align="right">{t.quantityLiters.toFixed(1)}</TableCell>
                      <TableCell align="right">{formatCurrency(t.ratePerLiter)}</TableCell>
                      <TableCell align="right"><Typography fontWeight={500}>{formatCurrency(t.amount)}</Typography></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Divider sx={{ my: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">Total Days</Typography>
                <Typography fontWeight={700}>{statement.totalDays}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">Total Liters</Typography>
                <Typography fontWeight={700}>{statement.totalLiters.toFixed(1)} L</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">Average Rate</Typography>
                <Typography fontWeight={700}>{formatCurrency(statement.averageRate)}/L</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">Total Amount</Typography>
                <Typography variant="h6" fontWeight={700} color="primary">
                  {formatCurrency(statement.totalAmount)}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {!loading && !statement && (
        <Alert severity="info" icon={<Receipt />}>
          Select a {tab === 'vendor' ? 'vendor' : 'customer'}, month, and year, then click Generate to view the statement.
        </Alert>
      )}
    </Box>
  );
}
