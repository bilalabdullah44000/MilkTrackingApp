import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  Box, Card, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Switch,
  FormControlLabel, Tooltip, Skeleton, TablePagination,
  FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import { Add, Edit, PriceChange } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSnackbar } from 'notistack';
import { GET_CUSTOMERS, GET_CUSTOMERS_PAGE } from '../../graphql/queries';
import { CREATE_CUSTOMER, UPDATE_CUSTOMER, UPDATE_ALL_CUSTOMERS_RATE } from '../../graphql/mutations';
import { Customer, BillStatus } from '../../types';
import { formatCurrency } from '../../utils/formatters';

const PAGE_SIZE = 20;

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  defaultRate: z.number({ invalid_type_error: 'Rate must be a number' }).positive('Rate must be > 0'),
  notes: z.string().optional(),
  active: z.boolean().optional(),
  billStatus: z.nativeEnum(BillStatus).optional(),
});
type FormData = z.infer<typeof schema>;

const bulkRateSchema = z.object({
  defaultRate: z.number({ invalid_type_error: 'Rate must be a number' }).positive('Rate must be > 0'),
});
type BulkRateForm = z.infer<typeof bulkRateSchema>;

export default function CustomersPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [open, setOpen] = useState(false);
  const [bulkRateOpen, setBulkRateOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const customerPageVariables = {
    activeOnly: !showInactive,
    search: search.trim() || undefined,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  };

  const { data, loading } = useQuery(GET_CUSTOMERS_PAGE, {
    variables: customerPageVariables,
  });

  const [createCustomer, { loading: creating }] = useMutation(CREATE_CUSTOMER, {
    refetchQueries: [
      { query: GET_CUSTOMERS_PAGE, variables: customerPageVariables },
      { query: GET_CUSTOMERS, variables: { activeOnly: !showInactive } },
    ],
  });
  const [updateCustomer, { loading: updating }] = useMutation(UPDATE_CUSTOMER, {
    refetchQueries: [
      { query: GET_CUSTOMERS_PAGE, variables: customerPageVariables },
      { query: GET_CUSTOMERS, variables: { activeOnly: !showInactive } },
    ],
  });
  const [updateAllRate, { loading: updatingAll }] = useMutation(UPDATE_ALL_CUSTOMERS_RATE, {
    refetchQueries: [
      { query: GET_CUSTOMERS_PAGE, variables: customerPageVariables },
      { query: GET_CUSTOMERS, variables: { activeOnly: !showInactive } },
    ],
  });

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const bulkForm = useForm<BulkRateForm>({ resolver: zodResolver(bulkRateSchema) });

  const openCreate = () => {
    setEditing(null);
    reset({ name: '', defaultRate: undefined as any, notes: '', billStatus: BillStatus.UNPAID });
    setOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    reset({ name: c.name, defaultRate: c.defaultRate, notes: c.notes ?? '', active: c.active, billStatus: c.billStatus });
    setOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (editing) {
        await updateCustomer({ variables: { id: editing.id, input: data } });
        enqueueSnackbar('Customer updated', { variant: 'success' });
      } else {
        await createCustomer({ variables: { input: data } });
        enqueueSnackbar('Customer created', { variant: 'success' });
      }
      setOpen(false);
    } catch (err: any) {
      enqueueSnackbar(err.graphQLErrors?.[0]?.message || 'Error saving customer', { variant: 'error' });
    }
  };

  const onBulkRateSubmit = async (data: BulkRateForm) => {
    if (!window.confirm(`Update default rate to ${formatCurrency(data.defaultRate)}/L for ALL customers?`)) return;
    try {
      const res = await updateAllRate({ variables: { defaultRate: data.defaultRate } });
      enqueueSnackbar(`Updated ${res.data.updateAllCustomersRate} customers`, { variant: 'success' });
      setBulkRateOpen(false);
      bulkForm.reset();
    } catch (err: any) {
      enqueueSnackbar(err.graphQLErrors?.[0]?.message || 'Error updating rates', { variant: 'error' });
    }
  };

  const customers: Customer[] = data?.getCustomersPage?.items ?? [];
  const totalCustomers = data?.getCustomersPage?.total ?? 0;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>Customers</Typography>
        <Box display="flex" gap={1} alignItems="center">
          <FormControlLabel
            control={<Switch checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} size="small" />}
            label={<Typography variant="body2">Show Inactive</Typography>}
          />
          <Button variant="outlined" startIcon={<PriceChange />} onClick={() => setBulkRateOpen(true)}>
            Update All Rates
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add Customer</Button>
        </Box>
      </Box>

      <TextField
        size="small"
        placeholder="Search customers…"
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(0); }}
        sx={{ mb: 2, width: 280 }}
      />

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Default Rate</TableCell>
                <TableCell>Bill Status</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>{Array.from({ length: 6 }).map((_, j) => <TableCell key={j}><Skeleton /></TableCell>)}</TableRow>
                  ))
                : customers.map((c) => (
                    <TableRow key={c.id} hover>
                      <TableCell><Typography fontWeight={500}>{c.name}</Typography></TableCell>
                      <TableCell>{formatCurrency(c.defaultRate)}/L</TableCell>
                      <TableCell>
                        <Chip
                          label={c.billStatus === BillStatus.PAID ? 'Paid' : 'Unpaid'}
                          color={c.billStatus === BillStatus.PAID ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
                          {c.notes || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={c.active ? 'Active' : 'Inactive'} color={c.active ? 'success' : 'default'} size="small" />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEdit(c)}><Edit fontSize="small" /></IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={totalCustomers}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={PAGE_SIZE}
          rowsPerPageOptions={[PAGE_SIZE]}
        />
      </Card>

      {/* Add/Edit dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{editing ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
          <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField {...register('name')} label="Customer Name" fullWidth error={!!errors.name} helperText={errors.name?.message} />
            <TextField
              {...register('defaultRate', { valueAsNumber: true })}
              label="Default Rate (per Liter)"
              type="number"
              inputProps={{ step: '0.01', min: '0' }}
              InputLabelProps={{ shrink: true }}
              fullWidth
              error={!!errors.defaultRate}
              helperText={errors.defaultRate?.message}
            />
            <TextField {...register('notes')} label="Notes (optional)" fullWidth multiline rows={2} />
            <Controller
              name="billStatus"
              control={control}
              defaultValue={BillStatus.UNPAID}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Bill Status</InputLabel>
                  <Select {...field} label="Bill Status">
                    <MenuItem value={BillStatus.PAID}>Paid</MenuItem>
                    <MenuItem value={BillStatus.UNPAID}>Unpaid</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
            {editing && (
              <Controller
                name="active"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch checked={!!field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                    label="Active"
                  />
                )}
              />
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={creating || updating}>
              {editing ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Bulk rate update dialog */}
      <Dialog open={bulkRateOpen} onClose={() => setBulkRateOpen(false)} maxWidth="xs" fullWidth>
        <form onSubmit={bulkForm.handleSubmit(onBulkRateSubmit)}>
          <DialogTitle>Update All Customers Rate</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary" mb={2}>
              This will update the default rate for ALL customers.
            </Typography>
            <TextField
              {...bulkForm.register('defaultRate', { valueAsNumber: true })}
              label="New Default Rate (per Liter)"
              type="number"
              inputProps={{ step: '0.01', min: '0' }}
              InputLabelProps={{ shrink: true }}
              fullWidth
              error={!!bulkForm.formState.errors.defaultRate}
              helperText={bulkForm.formState.errors.defaultRate?.message}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setBulkRateOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={updatingAll}>Update All</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
