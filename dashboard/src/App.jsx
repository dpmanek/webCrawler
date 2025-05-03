import { useState, useMemo } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, IconButton, Tooltip, useMediaQuery } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
	// Check system preference for dark mode
	const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
	const [darkMode, setDarkMode] = useState(prefersDarkMode);

	// Create a theme instance
	const theme = useMemo(
		() =>
			createTheme({
				palette: {
					mode: darkMode ? 'dark' : 'light',
					primary: {
						main: darkMode ? '#90caf9' : '#1976d2',
					},
					secondary: {
						main: darkMode ? '#f48fb1' : '#dc004e',
					},
					background: {
						default: darkMode ? '#121212' : '#f5f5f5',
						paper: darkMode ? '#1e1e1e' : '#ffffff',
					},
				},
				typography: {
					fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
					h4: {
						fontWeight: 600,
					},
					h5: {
						fontWeight: 600,
					},
					h6: {
						fontWeight: 600,
					},
				},
				shape: {
					borderRadius: 8,
				},
				components: {
					MuiButton: {
						styleOverrides: {
							root: {
								textTransform: 'none',
								fontWeight: 500,
							},
						},
					},
					MuiCard: {
						styleOverrides: {
							root: {
								borderRadius: 12,
							},
						},
					},
					MuiPaper: {
						styleOverrides: {
							root: {
								borderRadius: 12,
							},
						},
					},
				},
			}),
		[darkMode]
	);

	const toggleDarkMode = () => {
		setDarkMode(!darkMode);
	};

	return (
		<ThemeProvider theme={theme}>
			<CssBaseline />
			<Box sx={{ position: 'relative' }}>
				<Tooltip
					title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
				>
					<IconButton
						onClick={toggleDarkMode}
						color="inherit"
						sx={{
							position: 'fixed',
							top: 16,
							right: 16,
							zIndex: 1100,
							bgcolor: 'background.paper',
							boxShadow: 2,
							'&:hover': {
								bgcolor: 'action.hover',
							},
						}}
					>
						{darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
					</IconButton>
				</Tooltip>
				<Dashboard />
			</Box>
		</ThemeProvider>
	);
}

export default App;
