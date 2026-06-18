import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  Box, Card, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Switch,
  FormControlLabel, Tooltip, Skeleton,
} from '@mui/material';
import { Add, Edit } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSnackbar } from 'notistack';
import { GET_CUSTOMERS } from '../../graphql/queries';
import { CREATE_CUSTOMER, UPDATE_CUSTOMER } from '../../graphql/mutations';
import { Customer } from '../../types';
import { formatCurrency } from '../../utils/formatters';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  defaultRate: z.number({ invalid_type_error: 'Rate must be a number' }).positive('Rate must be > 0'),
  notes: z.string().optional(),
  active: z.boolean().optional(),
});
type FormData = z.infer<typeof schema>;

export default function CustomersPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [search, setSearch] = useState('');

  const { data, loading } = useQuery(GET_CUSTOMERS, { variables: { activeOnly: !showInactive } });

  const [createCustomer, { loading: creating }] = useMutation(CREATE_CUSTOMER, {
    refetchQueries: [{ query: GET_CUSTOMERS, variables: { activeOnly: !showInactive } }],
  });
  const [updateCustomer, { loading: updating }] = useMutation(UPDATE_CUSTOMER, {
    refetchQueries: [{ query: GET_CUSTOMERS, variables: { activeOnly: !showInactive } }],
  });

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const openCreate = () => {
    setEditing(null);
    reset({ name: '', defaultRate: undefined as any, notes: '' });
    setOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    reset({ name: c.name, defaultRate: c.defaultRate, notes: c.notes ?? '', active: c.active });
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

  const customers: Customer[] = (data?.getCustomers ?? []).filter((c: Customer) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>Customers</Typography>
        <Box display="flex" gap={1} alignItems="center">
          <FormControlLabel
            control={<Switch checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} size="small" />}
            label={<Typography variant="body2">Show Inactive</Typography>}
          />
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add Customer</Button>
        </Box>
      </Box>

      <TextField
        size="small"
        placeholder="Search customers…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2, width: 280 }}
      />

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Default Rate</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>{Array.from({ length: 5 }).map((_, j) => <TableCell key={j}><Skeleton /></TableCell>)}</TableRow>
                  ))
                : customers.map((c) => (
                    <TableRow key={c.id} hover>
                      <TableCell><Typography fontWeight={500}>{c.name}</Typography></TableCell>
                      <TableCell>{formatCurrency(c.defaultRate)}/L</TableCell>
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
      </Card>

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
              fullWidth
              error={!!errors.defaultRate}
              helperText={errors.defaultRate?.message}
            />
            <TextField {...register('notes')} label="Notes (optional)" fullWidth multiline rows={2} />
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
    </Box>
  );
}
