import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  Box, Card, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Select, FormControl, InputLabel, Skeleton,
  Tooltip, FormHelperText, Checkbox, ListItemText, Chip, OutlinedInput,
  ToggleButton, ToggleButtonGroup, ListSubheader, InputAdornment, TablePagination,
} from '@mui/material';
import { Add, Edit, Delete, Search } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSnackbar } from 'notistack';
import { GET_DELIVERIES, GET_CUSTOMERS } from '../../graphql/queries';
import { ADD_DELIVERY, UPDATE_DELIVERY, DELETE_DELIVERY } from '../../graphql/mutations';
import { MilkDelivery, Customer } from '../../types';
import { formatCurrency, formatDate, today, startOfMonth, endOfMonth } from '../../utils/formatters';
import { useAuth } from '../../contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { Role } from '../../types';

const PAGE_SIZE = 20;

type DatePreset = 'today' | 'yesterday' | 'thisMonth' | 'custom';

const yesterday = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
};

const resolveDateRange = (preset: DatePreset, customStart: string, customEnd: string) => {
  switch (preset) {
    case 'today': return { startDate: today(), endDate: today() };
    case 'yesterday': { const y = yesterday(); return { startDate: y, endDate: y }; }
    case 'thisMonth': return { startDate: startOfMonth(), endDate: endOfMonth() };
    case 'custom': return { startDate: customStart, endDate: customEnd };
  }
};

const schema = z.object({
  customerId: z.string().uuid('Select a customer'),
  deliveryDate: z.string().min(1, 'Date is required'),
  quantityLiters: z.number({ invalid_type_error: 'Enter a number' }).positive('Must be > 0'),
  ratePerLiter: z.number({ invalid_type_error: 'Enter a number' }).positive('Must be > 0'),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function DeliveriesPage() {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [searchParams, setSearchParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MilkDelivery | null>(null);
  const [datePreset, setDatePreset] = useState<DatePreset>('today');
  const [customStart, setCustomStart] = useState(startOfMonth());
  const [customEnd, setCustomEnd] = useState(today());
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [customerFilterSearch, setCustomerFilterSearch] = useState('');
  const [customerFormSearch, setCustomerFormSearch] = useState('');
  const [page, setPage] = useState(0);

  const { startDate, endDate } = resolveDateRange(datePreset, customStart, customEnd);

  const { data: customersData } = useQuery(GET_CUSTOMERS, { variables: { activeOnly: true } });
  const customers: Customer[] = customersData?.getCustomers ?? [];

  const { data, loading } = useQuery(GET_DELIVERIES, {
    variables: {
      startDate,
      endDate,
      customerIds: selectedCustomerIds.length > 0 ? selectedCustomerIds : undefined,
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    },
  });

  const [addDelivery, { loading: adding }] = useMutation(ADD_DELIVERY, {
    refetchQueries: ['GetDeliveries', 'GetDashboardStats'],
  });
  const [updateDelivery, { loading: updating }] = useMutation(UPDATE_DELIVERY, {
    refetchQueries: ['GetDeliveries', 'GetDashboardStats'],
  });
  const [deleteDelivery] = useMutation(DELETE_DELIVERY, {
    refetchQueries: ['GetDeliveries', 'GetDashboardStats'],
  });

  const { register, handleSubmit, reset, control, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const deliveries: MilkDelivery[] = data?.getDeliveries?.items ?? [];
  const total: number = data?.getDeliveries?.total ?? 0;
  const totalLiters: number = data?.getDeliveries?.totalLiters ?? 0;
  const totalRevenue: number = data?.getDeliveries?.totalRevenue ?? 0;
  const isOwner = user?.role === Role.OWNER;

  useEffect(() => {
    if (searchParams.get('add') === '1') {
      setEditing(null);
      reset({ customerId: '', deliveryDate: today(), quantityLiters: undefined as any, ratePerLiter: undefined as any, notes: '' });
      setOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  const openCreate = () => {
    setEditing(null);
    reset({ customerId: '', deliveryDate: today(), quantityLiters: undefined as any, ratePerLiter: undefined as any, notes: '' });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this delivery? This cannot be undone.')) return;
    try {
      await deleteDelivery({ variables: { id } });
      enqueueSnackbar('Delivery deleted', { variant: 'success' });
    } catch (err: any) {
      enqueueSnackbar(err.graphQLErrors?.[0]?.message || 'Error deleting delivery', { variant: 'error' });
    }
  };

  const onCustomerChange = (id: string) => {
    const customer = customers.find((c) => c.id === id);
    if (customer) setValue('ratePerLiter', customer.defaultRate);
  };

  const openEdit = (d: MilkDelivery) => {
    setEditing(d);
    reset({ customerId: d.customer.id, deliveryDate: d.deliveryDate, quantityLiters: d.quantityLiters, ratePerLiter: d.ratePerLiter, notes: d.notes ?? '' });
    setOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (editing) {
        await updateDelivery({ variables: { id: editing.id, input: data } });
        enqueueSnackbar('Delivery updated', { variant: 'success' });
      } else {
        await addDelivery({ variables: { input: data } });
        enqueueSnackbar('Delivery added', { variant: 'success' });
      }
      setOpen(false);
    } catch (err: any) {
      enqueueSnackbar(err.graphQLErrors?.[0]?.message || 'Error saving delivery', { variant: 'error' });
    }
  };

  const handleFilterChange = (fn: () => void) => { fn(); setPage(0); };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>Deliveries</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add Delivery</Button>
      </Box>

      <Card sx={{ mb: 2, p: 2 }}>
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          <ToggleButtonGroup
            value={datePreset}
            exclusive
            size="small"
            onChange={(_, v) => { if (v) handleFilterChange(() => setDatePreset(v)); }}
          >
            <ToggleButton value="today">Today</ToggleButton>
            <ToggleButton value="yesterday">Yesterday</ToggleButton>
            <ToggleButton value="thisMonth">This Month</ToggleButton>
            <ToggleButton value="custom">Custom</ToggleButton>
          </ToggleButtonGroup>

          {datePreset === 'custom' && (
            <>
              <TextField
                type="date" label="From" value={customStart}
                onChange={(e) => handleFilterChange(() => setCustomStart(e.target.value))}
                InputLabelProps={{ shrink: true }} size="small"
              />
              <TextField
                type="date" label="To" value={customEnd}
                onChange={(e) => handleFilterChange(() => setCustomEnd(e.target.value))}
                InputLabelProps={{ shrink: true }} size="small"
              />
            </>
          )}

          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Customers</InputLabel>
            <Select
              multiple
              value={selectedCustomerIds}
              onChange={(e) => handleFilterChange(() => setSelectedCustomerIds(e.target.value as string[]))}
              onClose={() => setCustomerFilterSearch('')}
              input={<OutlinedInput label="Customers" />}
              renderValue={(selected) =>
                selected.length === 1
                  ? customers.find((c) => c.id === selected[0])?.name ?? ''
                  : (
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {selected.map((id) => (
                        <Chip key={id} label={customers.find((c) => c.id === id)?.name} size="small" />
                      ))}
                    </Box>
                  )
              }
              displayEmpty
            >
              <ListSubheader sx={{ pb: 1 }}>
                <TextField
                  size="small" fullWidth autoFocus placeholder="Search customers…"
                  value={customerFilterSearch}
                  onChange={(e) => setCustomerFilterSearch(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
                  sx={{ mt: 1 }}
                />
              </ListSubheader>
              {customers
                .filter((c) => c.name.toLowerCase().includes(customerFilterSearch.toLowerCase()))
                .map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    <Checkbox checked={selectedCustomerIds.includes(c.id)} />
                    <ListItemText primary={c.name} />
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          <Box ml="auto" display="flex" gap={3}>
            <Box textAlign="right">
              <Typography variant="caption" color="text.secondary">Total Liters</Typography>
              <Typography fontWeight={700}>{totalLiters.toFixed(1)} L</Typography>
            </Box>
            {isOwner && (
              <Box textAlign="right">
                <Typography variant="caption" color="text.secondary">Total Revenue</Typography>
                <Typography fontWeight={700} color="success.main">{formatCurrency(totalRevenue)}</Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Card>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell align="right">Quantity (L)</TableCell>
                {isOwner && <TableCell align="right">Rate/L</TableCell>}
                {isOwner && <TableCell align="right">Total</TableCell>}
                {isOwner && <TableCell align="right">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>{Array.from({ length: isOwner ? 6 : 3 }).map((_, j) => <TableCell key={j}><Skeleton /></TableCell>)}</TableRow>
                  ))
                : deliveries.map((d) => (
                    <TableRow key={d.id} hover>
                      <TableCell>{formatDate(d.deliveryDate)}</TableCell>
                      <TableCell><Typography fontWeight={500}>{d.customer.name}</Typography></TableCell>
                      <TableCell align="right">{d.quantityLiters.toFixed(1)}</TableCell>
                      {isOwner && <TableCell align="right">{formatCurrency(d.ratePerLiter)}</TableCell>}
                      {isOwner && <TableCell align="right"><Typography fontWeight={600}>{formatCurrency(d.totalAmount)}</Typography></TableCell>}
                      {isOwner && (
                        <TableCell align="right">
                          <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(d)}><Edit fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDelete(d.id)}><Delete fontSize="small" /></IconButton></Tooltip>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={PAGE_SIZE}
          rowsPerPageOptions={[PAGE_SIZE]}
        />
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{editing ? 'Edit Delivery' : 'Add Delivery'}</DialogTitle>
          <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Controller
              name="customerId"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.customerId}>
                  <InputLabel>Customer</InputLabel>
                  <Select
                    {...field}
                    label="Customer"
                    onChange={(e) => { field.onChange(e); onCustomerChange(e.target.value as string); }}
                    onClose={() => setCustomerFormSearch('')}
                  >
                    <ListSubheader sx={{ pb: 1 }}>
                      <TextField
                        size="small" fullWidth autoFocus placeholder="Search customers…"
                        value={customerFormSearch}
                        onChange={(e) => setCustomerFormSearch(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                        InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
                        sx={{ mt: 1 }}
                      />
                    </ListSubheader>
                    {customers
                      .filter((c) => c.name.toLowerCase().includes(customerFormSearch.toLowerCase()))
                      .map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                  </Select>
                  {errors.customerId && <FormHelperText>{errors.customerId.message}</FormHelperText>}
                </FormControl>
              )}
            />
            <TextField {...register('deliveryDate')} label="Date" type="date" fullWidth InputLabelProps={{ shrink: true }} error={!!errors.deliveryDate} helperText={errors.deliveryDate?.message} inputProps={{ max: today() }} />
            <TextField {...register('quantityLiters', { valueAsNumber: true })} label="Quantity (Liters)" type="number" inputProps={{ step: '0.1', min: '0.1' }} fullWidth error={!!errors.quantityLiters} helperText={errors.quantityLiters?.message} autoFocus />
            <TextField {...register('ratePerLiter', { valueAsNumber: true })} label="Rate per Liter" type="number" inputProps={{ step: '0.01', min: '0' }} InputLabelProps={{ shrink: true }} fullWidth error={!!errors.ratePerLiter} helperText={errors.ratePerLiter?.message} />
            <TextField {...register('notes')} label="Notes (optional)" fullWidth multiline rows={2} />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={adding || updating}>{editing ? 'Update' : 'Add'}</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
