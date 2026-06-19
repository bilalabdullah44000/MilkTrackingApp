import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  Box, Card, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField,
  Select, MenuItem, FormControl, InputLabel, Tooltip,
  Skeleton, FormHelperText,
} from '@mui/material';
import { Add, Edit, ToggleOn, ToggleOff } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSnackbar } from 'notistack';
import { GET_USERS } from '../../graphql/queries';
import { CREATE_USER, UPDATE_USER } from '../../graphql/mutations';
import { Role } from '../../types';

const createSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(200),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.nativeEnum(Role),
});
type CreateFormData = z.infer<typeof createSchema>;

const editSchema = z.object({
  role: z.nativeEnum(Role),
});
type EditFormData = z.infer<typeof editSchema>;

interface UserRow {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt: string;
}

export default function UsersPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);

  const { data, loading } = useQuery(GET_USERS);
  const [createUser, { loading: creating }] = useMutation(CREATE_USER, {
    refetchQueries: [{ query: GET_USERS }],
  });
  const [updateUser, { loading: updating }] = useMutation(UPDATE_USER, {
    refetchQueries: [{ query: GET_USERS }],
  });

  const createForm = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: { role: Role.WORKER },
  });

  const editForm = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
  });

  const onCreateSubmit = async (data: CreateFormData) => {
    try {
      await createUser({ variables: { input: data } });
      enqueueSnackbar('User created successfully', { variant: 'success' });
      setCreateOpen(false);
      createForm.reset();
    } catch (err: any) {
      enqueueSnackbar(err.graphQLErrors?.[0]?.message || 'Error creating user', { variant: 'error' });
    }
  };

  const openEdit = (u: UserRow) => {
    setEditingUser(u);
    editForm.reset({ role: u.role });
  };

  const onEditSubmit = async (data: EditFormData) => {
    if (!editingUser) return;
    try {
      await updateUser({ variables: { id: editingUser.id, input: data } });
      enqueueSnackbar('Role updated', { variant: 'success' });
      setEditingUser(null);
    } catch (err: any) {
      enqueueSnackbar(err.graphQLErrors?.[0]?.message || 'Error updating role', { variant: 'error' });
    }
  };

  const toggleStatus = async (u: UserRow) => {
    try {
      await updateUser({ variables: { id: u.id, input: { active: !u.active } } });
      enqueueSnackbar(`User ${!u.active ? 'activated' : 'deactivated'}`, { variant: 'success' });
    } catch (err: any) {
      enqueueSnackbar('Error updating user status', { variant: 'error' });
    }
  };

  const users: UserRow[] = data?.getUsers ?? [];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>Team / Users</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}>
          Add User
        </Button>
      </Box>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>{Array.from({ length: 5 }).map((_, j) => <TableCell key={j}><Skeleton /></TableCell>)}</TableRow>
                  ))
                : users.map((u) => (
                    <TableRow key={u.id} hover>
                      <TableCell><Typography fontWeight={500}>{u.fullName}</Typography></TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Chip label={u.role} size="small" color={u.role === Role.OWNER ? 'primary' : 'default'} />
                      </TableCell>
                      <TableCell>
                        <Chip label={u.active ? 'Active' : 'Inactive'} size="small" color={u.active ? 'success' : 'default'} />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Change Role">
                          <IconButton size="small" onClick={() => openEdit(u)}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={u.active ? 'Deactivate' : 'Activate'}>
                          <IconButton size="small" onClick={() => toggleStatus(u)} color={u.active ? 'error' : 'success'}>
                            {u.active ? <ToggleOff /> : <ToggleOn />}
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Create user dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={createForm.handleSubmit(onCreateSubmit)}>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField {...createForm.register('fullName')} label="Full Name" fullWidth error={!!createForm.formState.errors.fullName} helperText={createForm.formState.errors.fullName?.message} />
            <TextField {...createForm.register('email')} label="Email Address" type="email" fullWidth error={!!createForm.formState.errors.email} helperText={createForm.formState.errors.email?.message} />
            <TextField {...createForm.register('password')} label="Password" type="password" fullWidth error={!!createForm.formState.errors.password} helperText={createForm.formState.errors.password?.message} />
            <Controller
              name="role"
              control={createForm.control}
              render={({ field }) => (
                <FormControl fullWidth error={!!createForm.formState.errors.role}>
                  <InputLabel>Role</InputLabel>
                  <Select {...field} label="Role">
                    <MenuItem value={Role.OWNER}>Owner (Admin)</MenuItem>
                    <MenuItem value={Role.WORKER}>Worker</MenuItem>
                  </Select>
                  {createForm.formState.errors.role && <FormHelperText>{createForm.formState.errors.role.message}</FormHelperText>}
                </FormControl>
              )}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={creating}>Create User</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit role dialog */}
      <Dialog open={!!editingUser} onClose={() => setEditingUser(null)} maxWidth="xs" fullWidth>
        <form onSubmit={editForm.handleSubmit(onEditSubmit)}>
          <DialogTitle>Change Role — {editingUser?.fullName}</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Controller
              name="role"
              control={editForm.control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select {...field} label="Role">
                    <MenuItem value={Role.OWNER}>Owner (Admin)</MenuItem>
                    <MenuItem value={Role.WORKER}>Worker</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setEditingUser(null)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={updating}>Save</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
