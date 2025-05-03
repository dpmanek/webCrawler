import { useState, useEffect } from 'react';
import {
	Container,
	Typography,
	Box,
	Paper,
	Grid,
	Button,
	CircularProgress,
	Snackbar,
	Alert,
	AppBar,
	Toolbar,
	useTheme,
	useMediaQuery,
	Divider,
} from '@mui/material';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CrawlerList from './CrawlerList';
import FileList from './FileList';

const Dashboard = () => {
	const [crawlers, setCrawlers] = useState([]);
	const [files, setFiles] = useState([]);
	const [loading, setLoading] = useState(false);
	const [runningCrawler, setRunningCrawler] = useState(null);
	const [notification, setNotification] = useState({
		open: false,
		message: '',
		severity: 'info',
	});

	// Fetch crawlers and files on component mount
	useEffect(() => {
		fetchCrawlers();
		fetchFiles();
	}, []);

	// Fetch available crawlers
	const fetchCrawlers = async () => {
		try {
			const response = await fetch('http://localhost:5000/api/crawlers');
			const data = await response.json();
			setCrawlers(data);
		} catch (error) {
			console.error('Error fetching crawlers:', error);
			showNotification('Failed to fetch crawlers', 'error');
		}
	};

	// Fetch available CSV files
	const fetchFiles = async () => {
		try {
			const response = await fetch('http://localhost:5000/api/csv-files');
			const data = await response.json();
			setFiles(data);
		} catch (error) {
			console.error('Error fetching files:', error);
			showNotification('Failed to fetch files', 'error');
		}
	};

	// Run a specific crawler
	const runCrawler = async (crawlerId) => {
		setLoading(true);
		setRunningCrawler(crawlerId);

		try {
			const response = await fetch(
				`http://localhost:5000/api/run-crawler/${crawlerId}`,
				{
					method: 'POST',
				}
			);

			const data = await response.json();

			if (response.ok) {
				showNotification(
					`${getCrawlerName(crawlerId)} crawler completed successfully`,
					'success'
				);
				fetchFiles(); // Refresh file list after crawler completes
			} else {
				showNotification(
					`Failed to run ${getCrawlerName(crawlerId)} crawler: ${data.error}`,
					'error'
				);
			}
		} catch (error) {
			console.error(`Error running ${crawlerId} crawler:`, error);
			showNotification(
				`Error running ${getCrawlerName(crawlerId)} crawler`,
				'error'
			);
		} finally {
			setLoading(false);
			setRunningCrawler(null);
		}
	};

	// Run all crawlers
	const runAllCrawlers = async () => {
		setLoading(true);
		setRunningCrawler('all');

		try {
			const response = await fetch(
				'http://localhost:5000/api/run-all-crawlers',
				{
					method: 'POST',
				}
			);

			const data = await response.json();

			if (response.ok) {
				showNotification('All crawlers completed successfully', 'success');
				fetchFiles(); // Refresh file list after crawlers complete
			} else {
				showNotification(`Failed to run all crawlers: ${data.error}`, 'error');
			}
		} catch (error) {
			console.error('Error running all crawlers:', error);
			showNotification('Error running all crawlers', 'error');
		} finally {
			setLoading(false);
			setRunningCrawler(null);
		}
	};

	// Helper function to get crawler name by ID
	const getCrawlerName = (crawlerId) => {
		const crawler = crawlers.find((c) => c.id === crawlerId);
		return crawler ? crawler.name : crawlerId;
	};

	// Show notification
	const showNotification = (message, severity = 'info') => {
		setNotification({ open: true, message, severity });
	};

	// Close notification
	const closeNotification = () => {
		setNotification({ ...notification, open: false });
	};

	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

	return (
		<Box sx={{ flexGrow: 1 }}>
			<AppBar position="static" color="primary" elevation={4}>
				<Toolbar>
					<DashboardIcon sx={{ mr: 2 }} />
					<Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
						Web Crawler Dashboard
					</Typography>
					<Button
						color="inherit"
						startIcon={<CloudDownloadIcon />}
						onClick={() => fetchFiles()}
					>
						Refresh
					</Button>
				</Toolbar>
			</AppBar>

			<Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
				<Grid container spacing={3}>
					<Grid item xs={12}>
						<Paper
							sx={{
								p: 3,
								borderRadius: 2,
								boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
							}}
						>
							<Typography
								variant="h5"
								component="h2"
								gutterBottom
								sx={{
									fontWeight: 'bold',
									display: 'flex',
									alignItems: 'center',
									color: theme.palette.primary.main,
								}}
							>
								<DashboardIcon sx={{ mr: 1 }} />
								Run Crawlers
							</Typography>
							<Divider sx={{ mb: 2 }} />

							<Button
								variant="contained"
								color="primary"
								size="large"
								onClick={runAllCrawlers}
								disabled={loading}
								sx={{
									mb: 3,
									px: 4,
									py: 1.5,
									borderRadius: 2,
									boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
								}}
							>
								{loading && runningCrawler === 'all' ? (
									<>
										<CircularProgress
											size={24}
											sx={{ mr: 1, color: 'white' }}
										/>
										Running All Crawlers...
									</>
								) : (
									'Run All Crawlers'
								)}
							</Button>

							<CrawlerList
								crawlers={crawlers}
								onRunCrawler={runCrawler}
								loading={loading}
								runningCrawler={runningCrawler}
							/>
						</Paper>
					</Grid>

					<Grid item xs={12}>
						<Paper
							sx={{
								p: 3,
								borderRadius: 2,
								boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
							}}
						>
							<Typography
								variant="h5"
								component="h2"
								gutterBottom
								sx={{
									fontWeight: 'bold',
									display: 'flex',
									alignItems: 'center',
									color: theme.palette.primary.main,
								}}
							>
								<CloudDownloadIcon sx={{ mr: 1 }} />
								Available Reports
							</Typography>
							<Divider sx={{ mb: 2 }} />

							<FileList files={files} />
						</Paper>
					</Grid>
				</Grid>

				<Snackbar
					open={notification.open}
					autoHideDuration={6000}
					onClose={closeNotification}
					anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
				>
					<Alert
						onClose={closeNotification}
						severity={notification.severity}
						sx={{ width: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
						variant="filled"
					>
						{notification.message}
					</Alert>
				</Snackbar>
			</Container>
		</Box>
	);
};

export default Dashboard;
