import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  Box, Card, Typography, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Switch, FormControlLabel, Tooltip, Skeleton,
} from '@mui/material';
import { Add, Edit } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSnackbar } from 'notistack';
import { GET_VENDORS } from '../../graphql/queries';
import { CREATE_VENDOR, UPDATE_VENDOR } from '../../graphql/mutations';
import { Vendor } from '../../types';
import { formatCurrency } from '../../utils/formatters';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  defaultRate: z.number({ invalid_type_error: 'Rate must be a number' }).positive('Rate must be > 0'),
  notes: z.string().optional(),
  active: z.boolean().optional(),
});
type FormData = z.infer<typeof schema>;

export default function VendorsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [search, setSearch] = useState('');

  const { data, loading } = useQuery(GET_VENDORS, {
    variables: { activeOnly: !showInactive },
  });

  const [createVendor, { loading: creating }] = useMutation(CREATE_VENDOR, {
    refetchQueries: [{ query: GET_VENDORS, variables: { activeOnly: !showInactive } }],
  });
  const [updateVendor, { loading: updating }] = useMutation(UPDATE_VENDOR, {
    refetchQueries: [{ query: GET_VENDORS, variables: { activeOnly: !showInactive } }],
  });

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const openCreate = () => {
    setEditing(null);
    reset({ name: '', defaultRate: undefined as any, notes: '' });
    setOpen(true);
  };

  const openEdit = (vendor: Vendor) => {
    setEditing(vendor);
    reset({ name: vendor.name, defaultRate: vendor.defaultRate, notes: vendor.notes ?? '', active: vendor.active });
    setOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (editing) {
        await updateVendor({ variables: { id: editing.id, input: data } });
        enqueueSnackbar('Vendor updated', { variant: 'success' });
      } else {
        await createVendor({ variables: { input: data } });
        enqueueSnackbar('Vendor created', { variant: 'success' });
      }
      setOpen(false);
    } catch (err: any) {
      enqueueSnackbar(err.graphQLErrors?.[0]?.message || 'Error saving vendor', { variant: 'error' });
    }
  };

  const vendors: Vendor[] = (data?.getVendors ?? []).filter((v: Vendor) =>
    v.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>Vendors</Typography>
        <Box display="flex" gap={1} alignItems="center">
          <FormControlLabel
            control={<Switch checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} size="small" />}
            label={<Typography variant="body2">Show Inactive</Typography>}
          />
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add Vendor</Button>
        </Box>
      </Box>

      <TextField
        size="small"
        placeholder="Search vendors…"
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
                : vendors.map((vendor) => (
                    <TableRow key={vendor.id} hover>
                      <TableCell><Typography fontWeight={500}>{vendor.name}</Typography></TableCell>
                      <TableCell>{formatCurrency(vendor.defaultRate)}/L</TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
                          {vendor.notes || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={vendor.active ? 'Active' : 'Inactive'} color={vendor.active ? 'success' : 'default'} size="small" />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEdit(vendor)}><Edit fontSize="small" /></IconButton>
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
          <DialogTitle>{editing ? 'Edit Vendor' : 'Add Vendor'}</DialogTitle>
          <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField {...register('name')} label="Vendor Name" fullWidth error={!!errors.name} helperText={errors.name?.message} />
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
