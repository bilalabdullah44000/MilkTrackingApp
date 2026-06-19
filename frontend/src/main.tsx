import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client';
import { SnackbarProvider } from 'notistack';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { ThemeProvider, CssBaseline } from '@mui/material';
import App from './App';
import { apolloClient } from './apollo/client';
import { AuthProvider } from './contexts/AuthContext';
import { theme } from './theme';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ApolloProvider client={apolloClient}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <SnackbarProvider maxSnack={3} autoHideDuration={1500} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
              <AuthProvider>
                <App />
              </AuthProvider>
            </SnackbarProvider>
          </LocalizationProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ApolloProvider>
  </React.StrictMode>,
);
