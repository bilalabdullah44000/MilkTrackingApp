import { useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Button, Skeleton,
  Alert, Chip, CircularProgress, Paper, Divider,
} from '@mui/material';
import { CheckCircle, LocalShipping } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { GET_PENDING_CUSTOMERS } from '../../graphql/queries';
import { ADD_BULK_DELIVERIES } from '../../graphql/mutations';
import { today } from '../../utils/formatters';
import { Customer } from '../../types';

const rowSchema = z.object({
  customerId: z.string(),
  customerName: z.string(),
  defaultRate: z.number(),
  quantityLiters: z.string().optional(),
  ratePerLiter: z.string(),
  notes: z.string().optional(),
});

const formSchema = z.object({
  date: z.string(),
  rows: z.array(rowSchema),
});

type FormData = z.infer<typeof formSchema>;

export default function BulkDeliveryPage() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const todayStr = today();
  const qtyRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { data, loading } = useQuery(GET_PENDING_CUSTOMERS, {
    variables: { date: todayStr },
    fetchPolicy: 'network-only',
  });

  const [addBulkDeliveries, { loading: submitting }] = useMutation(ADD_BULK_DELIVERIES, {
    refetchQueries: ['GetDeliveries', 'GetPendingCustomersForDelivery', 'GetDashboardStats'],
  });

  const { control, handleSubmit, setValue, getValues, reset } = useForm<FormData>({
    defaultValues: { date: todayStr, rows: [] },
  });

  const { fields } = useFieldArray({ control, name: 'rows' });

  useEffect(() => {
    if (data?.getPendingCustomersForDelivery) {
      const customers: Customer[] = data.getPendingCustomersForDelivery;
      reset({
        date: todayStr,
        rows: customers.map((c) => ({
          customerId: c.id,
          customerName: c.name,
          defaultRate: c.defaultRate,
          quantityLiters: '',
          ratePerLiter: String(c.defaultRate),
          notes: '',
        })),
      });
      setTimeout(() => qtyRefs.current[0]?.focus(), 100);
    }
  }, [data, reset, todayStr]);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      const next = qtyRefs.current[index + 1];
      if (next) next.focus();
    }
  };

  const onSubmit = async (formData: FormData) => {
    const validRows = formData.rows.filter(
      (r) => r.quantityLiters && parseFloat(r.quantityLiters) > 0 && parseFloat(r.ratePerLiter) > 0,
    );

    if (validRows.length === 0) {
      enqueueSnackbar('Please enter quantities for at least one customer', { variant: 'warning' });
      return;
    }

    const input = validRows.map((r) => ({
      customerId: r.customerId,
      deliveryDate: formData.date,
      quantityLiters: parseFloat(r.quantityLiters!),
      ratePerLiter: parseFloat(r.ratePerLiter),
      notes: r.notes || undefined,
    }));

    try {
      const { data: result } = await addBulkDeliveries({ variables: { input } });
      const response = result?.addBulkMilkDeliveries;

      if (response?.successCount > 0) {
        enqueueSnackbar(`${response.successCount} deliveries saved successfully!`, { variant: 'success' });
      }
      if (response?.failedCount > 0) {
        enqueueSnackbar(`${response.failedCount} deliveries failed`, { variant: 'warning' });
      }
      navigate('/deliveries');
    } catch (err: any) {
      enqueueSnackbar(err.graphQLErrors?.[0]?.message || 'Error saving deliveries', { variant: 'error' });
    }
  };

  const filledCount = fields.filter((f) => {
    const row = getValues(`rows.${fields.indexOf(f as any)}`);
    return row?.quantityLiters && parseFloat(row.quantityLiters) > 0;
  }).length;

  if (loading) {
    return (
      <Box>
        <Typography variant="h5" fontWeight={700} mb={3}>Bulk Delivery Entry</Typography>
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={52} sx={{ mb: 1 }} />)}
      </Box>
    );
  }

  const pendingCustomers: Customer[] = data?.getPendingCustomersForDelivery ?? [];

  if (!loading && pendingCustomers.length === 0) {
    return (
      <Box>
        <Typography variant="h5" fontWeight={700} mb={3}>Bulk Delivery Entry</Typography>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <CheckCircle sx={{ fontSize: 72, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" fontWeight={700} color="success.main">
              All deliveries completed for today!
            </Typography>
            <Typography color="text.secondary" mt={1}>
              Every customer has received their milk delivery.
            </Typography>
            <Button variant="contained" sx={{ mt: 3 }} onClick={() => navigate('/deliveries')}>
              View Deliveries
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Bulk Delivery Entry</Typography>
          <Typography variant="body2" color="text.secondary">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </Typography>
        </Box>
        <Chip
          label={`${pendingCustomers.length} Pending`}
          color="warning"
          icon={<LocalShipping />}
        />
      </Box>

      <Alert severity="info" sx={{ mb: 2 }}>
        Enter quantities for the customers below. Leave blank to skip. Press <strong>Enter</strong> or <strong>Tab</strong> to move to the next row.
      </Alert>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Customer</TableCell>
                  <TableCell width={130}>Rate (PKR/L)</TableCell>
                  <TableCell width={130}>Quantity (L)</TableCell>
                  <TableCell>Notes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fields.map((field, index) => (
                  <TableRow key={field.id} hover>
                    <TableCell>
                      <Typography fontWeight={500} variant="body2">
                        {field.customerName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Controller
                        name={`rows.${index}.ratePerLiter`}
                        control={control}
                        render={({ field: f }) => (
                          <TextField
                            {...f}
                            type="number"
                            inputProps={{ step: '0.01', min: '0.01' }}
                            size="small"
                            sx={{ width: 110 }}
                          />
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <Controller
                        name={`rows.${index}.quantityLiters`}
                        control={control}
                        render={({ field: f }) => (
                          <TextField
                            {...f}
                            type="number"
                            inputProps={{ step: '0.1', min: '0' }}
                            size="small"
                            sx={{ width: 110 }}
                            inputRef={(el) => { qtyRefs.current[index] = el; }}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            autoFocus={index === 0}
                          />
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <Controller
                        name={`rows.${index}.notes`}
                        control={control}
                        render={({ field: f }) => (
                          <TextField {...f} size="small" placeholder="Optional..." sx={{ width: 160 }} />
                        )}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        <Paper
          elevation={8}
          sx={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            zIndex: 1200, p: 2, display: 'flex',
            alignItems: 'center', justifyContent: 'space-between',
            gap: 2, borderRadius: 0,
          }}
        >
          <Typography variant="body1" fontWeight={600}>
            {fields.length - filledCount} Customers Remaining
          </Typography>
          <Box display="flex" gap={2}>
            <Button variant="outlined" onClick={() => navigate('/deliveries')} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : undefined}
            >
              Save All Transactions
            </Button>
          </Box>
        </Paper>
      </form>
    </Box>
  );
}
