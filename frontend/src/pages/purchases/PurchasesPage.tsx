import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  Box, Card, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Select, FormControl, InputLabel, Skeleton,
  Tooltip, FormHelperText, Checkbox, ListItemText, Chip, OutlinedInput,
  ToggleButton, ToggleButtonGroup, ListSubheader, InputAdornment,
} from '@mui/material';
import { Add, Edit, Delete, Search } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSnackbar } from 'notistack';
import { useSearchParams } from 'react-router-dom';
import { GET_PURCHASES, GET_VENDORS } from '../../graphql/queries';
import { ADD_PURCHASE, UPDATE_PURCHASE, DELETE_PURCHASE } from '../../graphql/mutations';
import { MilkPurchase, Vendor } from '../../types';
import { formatCurrency, formatDate, today, startOfMonth, endOfMonth } from '../../utils/formatters';

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
  vendorId: z.string().uuid('Select a vendor'),
  purchaseDate: z.string().min(1, 'Date is required'),
  quantityLiters: z.number({ invalid_type_error: 'Enter a number' }).positive('Must be > 0'),
  ratePerLiter: z.number({ invalid_type_error: 'Enter a number' }).positive('Must be > 0'),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function PurchasesPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [searchParams, setSearchParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MilkPurchase | null>(null);
  const [datePreset, setDatePreset] = useState<DatePreset>('today');
  const [customStart, setCustomStart] = useState(startOfMonth());
  const [customEnd, setCustomEnd] = useState(today());
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([]);
  const [vendorFilterSearch, setVendorFilterSearch] = useState('');
  const [vendorFormSearch, setVendorFormSearch] = useState('');

  const { startDate, endDate } = resolveDateRange(datePreset, customStart, customEnd);

  const { data: vendorsData } = useQuery(GET_VENDORS, { variables: { activeOnly: true } });
  const vendors: Vendor[] = vendorsData?.getVendors ?? [];

  const { data, loading } = useQuery(GET_PURCHASES, {
    variables: {
      startDate,
      endDate,
      vendorIds: selectedVendorIds.length > 0 ? selectedVendorIds : undefined,
    },
  });

  const [addPurchase, { loading: adding }] = useMutation(ADD_PURCHASE, {
    refetchQueries: ['GetPurchases', 'GetDashboardStats'],
  });
  const [updatePurchase, { loading: updating }] = useMutation(UPDATE_PURCHASE, {
    refetchQueries: ['GetPurchases', 'GetDashboardStats'],
  });
  const [deletePurchase] = useMutation(DELETE_PURCHASE, {
    refetchQueries: ['GetPurchases', 'GetDashboardStats'],
  });

  const { register, handleSubmit, reset, control, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const purchases: MilkPurchase[] = data?.getPurchases ?? [];
  const totalLiters = purchases.reduce((s, p) => s + p.quantityLiters, 0);
  const totalAmount = purchases.reduce((s, p) => s + p.totalAmount, 0);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this purchase? This cannot be undone.')) return;
    try {
      await deletePurchase({ variables: { id } });
      enqueueSnackbar('Purchase deleted', { variant: 'success' });
    } catch (err: any) {
      enqueueSnackbar(err.graphQLErrors?.[0]?.message || 'Error deleting purchase', { variant: 'error' });
    }
  };

  const onVendorChange = (id: string) => {
    const vendor = vendors.find((v) => v.id === id);
    if (vendor) setValue('ratePerLiter', vendor.defaultRate);
  };

  useEffect(() => {
    if (searchParams.get('add') === '1') {
      setEditing(null);
      reset({ vendorId: '', purchaseDate: today(), quantityLiters: undefined as any, ratePerLiter: undefined as any, notes: '' });
      setOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  const openCreate = () => {
    setEditing(null);
    reset({ vendorId: '', purchaseDate: today(), quantityLiters: undefined as any, ratePerLiter: undefined as any, notes: '' });
    setOpen(true);
  };

  const openEdit = (p: MilkPurchase) => {
    setEditing(p);
    reset({ vendorId: p.vendor.id, purchaseDate: p.purchaseDate, quantityLiters: p.quantityLiters, ratePerLiter: p.ratePerLiter, notes: p.notes ?? '' });
    setOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (editing) {
        await updatePurchase({ variables: { id: editing.id, input: data } });
        enqueueSnackbar('Purchase updated', { variant: 'success' });
      } else {
        await addPurchase({ variables: { input: data } });
        enqueueSnackbar('Purchase added', { variant: 'success' });
      }
      setOpen(false);
    } catch (err: any) {
      enqueueSnackbar(err.graphQLErrors?.[0]?.message || 'Error saving purchase', { variant: 'error' });
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>Purchases</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add Purchase</Button>
      </Box>

      <Card sx={{ mb: 2, p: 2 }}>
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          <ToggleButtonGroup
            value={datePreset}
            exclusive
            size="small"
            onChange={(_, v) => { if (v) setDatePreset(v); }}
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
                onChange={(e) => setCustomStart(e.target.value)}
                InputLabelProps={{ shrink: true }} size="small"
              />
              <TextField
                type="date" label="To" value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                InputLabelProps={{ shrink: true }} size="small"
              />
            </>
          )}

          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Vendors</InputLabel>
            <Select
              multiple
              value={selectedVendorIds}
              onChange={(e) => setSelectedVendorIds(e.target.value as string[])}
              onClose={() => setVendorFilterSearch('')}
              input={<OutlinedInput label="Vendors" />}
              renderValue={(selected) =>
                selected.length === 1
                  ? vendors.find((v) => v.id === selected[0])?.name ?? ''
                  : (
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {selected.map((id) => (
                        <Chip key={id} label={vendors.find((v) => v.id === id)?.name} size="small" />
                      ))}
                    </Box>
                  )
              }
              displayEmpty
            >
              <ListSubheader sx={{ pb: 1 }}>
                <TextField
                  size="small" fullWidth autoFocus placeholder="Search vendors…"
                  value={vendorFilterSearch}
                  onChange={(e) => setVendorFilterSearch(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
                  sx={{ mt: 1 }}
                />
              </ListSubheader>
              {vendors
                .filter((v) => v.name.toLowerCase().includes(vendorFilterSearch.toLowerCase()))
                .map((v) => (
                  <MenuItem key={v.id} value={v.id}>
                    <Checkbox checked={selectedVendorIds.includes(v.id)} />
                    <ListItemText primary={v.name} />
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          <Box ml="auto" display="flex" gap={3}>
            <Box textAlign="right">
              <Typography variant="caption" color="text.secondary">Total Liters</Typography>
              <Typography fontWeight={700}>{totalLiters.toFixed(1)} L</Typography>
            </Box>
            <Box textAlign="right">
              <Typography variant="caption" color="text.secondary">Total Cost</Typography>
              <Typography fontWeight={700} color="error.main">{formatCurrency(totalAmount)}</Typography>
            </Box>
          </Box>
        </Box>
      </Card>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Vendor</TableCell>
                <TableCell align="right">Quantity (L)</TableCell>
                <TableCell align="right">Rate/L</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>{Array.from({ length: 6 }).map((_, j) => <TableCell key={j}><Skeleton /></TableCell>)}</TableRow>
                  ))
                : purchases.map((p) => (
                    <TableRow key={p.id} hover>
                      <TableCell>{formatDate(p.purchaseDate)}</TableCell>
                      <TableCell><Typography fontWeight={500}>{p.vendor.name}</Typography></TableCell>
                      <TableCell align="right">{p.quantityLiters.toFixed(1)}</TableCell>
                      <TableCell align="right">{formatCurrency(p.ratePerLiter)}</TableCell>
                      <TableCell align="right"><Typography fontWeight={600}>{formatCurrency(p.totalAmount)}</Typography></TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(p)}><Edit fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDelete(p.id)}><Delete fontSize="small" /></IconButton></Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{editing ? 'Edit Purchase' : 'Add Purchase'}</DialogTitle>
          <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Controller
              name="vendorId"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.vendorId}>
                  <InputLabel>Vendor</InputLabel>
                  <Select
                    {...field}
                    label="Vendor"
                    onChange={(e) => { field.onChange(e); onVendorChange(e.target.value as string); }}
                    onClose={() => setVendorFormSearch('')}
                  >
                    <ListSubheader sx={{ pb: 1 }}>
                      <TextField
                        size="small" fullWidth autoFocus placeholder="Search vendors…"
                        value={vendorFormSearch}
                        onChange={(e) => setVendorFormSearch(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                        InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
                        sx={{ mt: 1 }}
                      />
                    </ListSubheader>
                    {vendors
                      .filter((v) => v.name.toLowerCase().includes(vendorFormSearch.toLowerCase()))
                      .map((v) => <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>)}
                  </Select>
                  {errors.vendorId && <FormHelperText>{errors.vendorId.message}</FormHelperText>}
                </FormControl>
              )}
            />
            <TextField {...register('purchaseDate')} label="Date" type="date" fullWidth InputLabelProps={{ shrink: true }} error={!!errors.purchaseDate} helperText={errors.purchaseDate?.message} inputProps={{ max: today() }} />
            <TextField {...register('quantityLiters', { valueAsNumber: true })} label="Quantity (Liters)" type="number" inputProps={{ step: '0.1', min: '0.1' }} fullWidth error={!!errors.quantityLiters} helperText={errors.quantityLiters?.message} />
            <TextField {...register('ratePerLiter', { valueAsNumber: true })} label="Rate per Liter" type="number" inputProps={{ step: '0.01', min: '0' }} fullWidth error={!!errors.ratePerLiter} helperText={errors.ratePerLiter?.message} />
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
