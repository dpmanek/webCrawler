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
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	FormGroup,
	FormControlLabel,
	Checkbox,
	IconButton,
} from '@mui/material';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MapIcon from '@mui/icons-material/Map';
import SettingsIcon from '@mui/icons-material/Settings';
import SlideshowIcon from '@mui/icons-material/Slideshow';
import CrawlerList from './CrawlerList';
import FileList from './FileList';
import CrawlerMap from './CrawlerMap';
import CrawlerSchedule from './CrawlerSchedule';
import ScheduleManager from './ScheduleManager';
import ExcelExport from './ExcelExport';
import AIChat from './AIChat';

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
	const [favoriteCrawlers, setFavoriteCrawlers] = useState([]);
	const [settingsOpen, setSettingsOpen] = useState(false);
	const [tempFavorites, setTempFavorites] = useState([]);

	// Load favorite crawlers from localStorage on mount
	useEffect(() => {
		const savedFavorites = localStorage.getItem('favoriteCrawlers');
		if (savedFavorites) {
			setFavoriteCrawlers(JSON.parse(savedFavorites));
		} else {
			// Default favorites if none saved
			const defaultFavorites = [
				'texas-city',
				'san-antonio',
				'league-city',
				'waller-county',
			];
			setFavoriteCrawlers(defaultFavorites);
		}
	}, []);

	// Save favorite crawlers to localStorage whenever they change
	useEffect(() => {
		if (favoriteCrawlers.length > 0) {
			localStorage.setItem(
				'favoriteCrawlers',
				JSON.stringify(favoriteCrawlers)
			);
		}
	}, [favoriteCrawlers]);

	// Fetch crawlers and files on component mount
	useEffect(() => {
		fetchCrawlers();
		fetchFiles();
	}, []);

	// Fetch available crawlers
	const fetchCrawlers = async () => {
		try {
			const response = await fetch('http://localhost:5001/api/crawlers');
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
			const response = await fetch('http://localhost:5001/api/csv-files');
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
				`http://localhost:5001/api/run-crawler/${crawlerId}`,
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
				'http://localhost:5001/api/run-all-crawlers',
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

	// Settings functions
	const openSettings = () => {
		setTempFavorites([...favoriteCrawlers]);
		setSettingsOpen(true);
	};

	const closeSettings = () => {
		setSettingsOpen(false);
		setTempFavorites([]);
	};

	const handleFavoriteToggle = (crawlerId) => {
		setTempFavorites((prev) => {
			if (prev.includes(crawlerId)) {
				return prev.filter((id) => id !== crawlerId);
			} else {
				return [...prev, crawlerId];
			}
		});
	};

	const saveFavorites = () => {
		setFavoriteCrawlers(tempFavorites);
		closeSettings();
		showNotification('Quick Run preferences saved!', 'success');
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
						sx={{ mr: 1 }}
					>
						Refresh
					</Button>
					<IconButton
						color="inherit"
						onClick={() => window.open('/presentation.html', '_blank')}
						sx={{
							'&:hover': {
								bgcolor: 'rgba(255, 255, 255, 0.1)',
							},
						}}
					>
						<SlideshowIcon />
					</IconButton>
				</Toolbar>
			</AppBar>

			<Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
				{/* Top Row - Three Equal Columns */}
				<Grid container spacing={3} sx={{ mb: 4 }}>
					{/* Left Column - Interactive Map */}
					<Grid size={{ xs: 12, lg: 4 }}>
						<Paper
							sx={{
								p: 3,
								borderRadius: 2,
								boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
								height: 'fit-content',
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
								<MapIcon sx={{ mr: 1 }} />
								Interactive Crawler Map
							</Typography>
							<Divider sx={{ mb: 2 }} />
							<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
								Click on any location pin to run that specific crawler
							</Typography>

							<CrawlerMap
								crawlers={crawlers}
								onRunCrawler={runCrawler}
								loading={loading}
								runningCrawler={runningCrawler}
							/>
						</Paper>
					</Grid>

					{/* Middle Column - Quick Actions, Quick Run, Crawler Schedule */}
					<Grid size={{ xs: 12, lg: 4 }}>
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
							{/* Quick Actions */}
							<Paper
								sx={{
									p: 3,
									borderRadius: 2,
									boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
								}}
							>
								<Typography
									variant="h6"
									component="h3"
									gutterBottom
									sx={{
										fontWeight: 'bold',
										display: 'flex',
										alignItems: 'center',
										color: theme.palette.primary.main,
									}}
								>
									<DashboardIcon sx={{ mr: 1 }} />
									Quick Actions
								</Typography>
								<Divider sx={{ mb: 2 }} />

								<Button
									variant="contained"
									color="primary"
									size="large"
									onClick={runAllCrawlers}
									disabled={loading}
									fullWidth
									sx={{
										mb: 2,
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
											Running All...
										</>
									) : (
										'Run All Crawlers'
									)}
								</Button>

								<Box
									sx={{
										display: 'flex',
										justifyContent: 'space-between',
										mb: 1,
									}}
								>
									<Typography variant="body2" color="text.secondary">
										Total: <strong>{crawlers.length}</strong>
									</Typography>
									<Typography variant="body2" color="text.secondary">
										Active: <strong>{runningCrawler ? 1 : 0}</strong>
									</Typography>
								</Box>
							</Paper>

							{/* Quick Crawler Controls */}
							<Paper
								sx={{
									p: 3,
									borderRadius: 2,
									boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
								}}
							>
								<Box
									sx={{
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'space-between',
									}}
								>
									<Typography
										variant="h6"
										component="h3"
										sx={{
											fontWeight: 'bold',
											display: 'flex',
											alignItems: 'center',
											color: theme.palette.primary.main,
										}}
									>
										<MapIcon sx={{ mr: 1 }} />
										Quick Run
									</Typography>
									<IconButton
										size="small"
										onClick={openSettings}
										sx={{ color: theme.palette.primary.main }}
									>
										<SettingsIcon fontSize="small" />
									</IconButton>
								</Box>
								<Divider sx={{ mb: 2 }} />

								<Typography
									variant="body2"
									color="text.secondary"
									sx={{ mb: 2 }}
								>
									Your favorite crawlers
								</Typography>

								{/* User's favorite crawlers */}
								{favoriteCrawlers.length === 0 ? (
									<Typography
										variant="body2"
										color="text.secondary"
										sx={{ textAlign: 'center', py: 2 }}
									>
										No favorites selected. Click the settings icon to choose
										your favorites.
									</Typography>
								) : (
									favoriteCrawlers.map((crawlerId) => {
										const crawler = crawlers.find((c) => c.id === crawlerId);
										if (!crawler) return null;

										return (
											<Button
												key={crawlerId}
												variant="outlined"
												size="small"
												onClick={() => runCrawler(crawlerId)}
												disabled={loading}
												fullWidth
												sx={{
													mb: 1,
													justifyContent: 'flex-start',
													textTransform: 'none',
												}}
												startIcon={
													runningCrawler === crawlerId ? (
														<CircularProgress size={16} />
													) : null
												}
											>
												{runningCrawler === crawlerId
													? 'Running...'
													: crawler.name}
											</Button>
										);
									})
								)}

								<Divider sx={{ my: 2 }} />

								<Typography
									variant="body2"
									color="text.secondary"
									sx={{ textAlign: 'center' }}
								>
									Reports: <strong>{files.length}</strong> files generated
								</Typography>
							</Paper>

							{/* Crawler Schedule */}
							<Paper
								sx={{
									p: 3,
									borderRadius: 2,
									boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
								}}
							>
								<CrawlerSchedule
									crawlers={crawlers}
									onRunCrawler={runCrawler}
									loading={loading}
									runningCrawler={runningCrawler}
								/>
							</Paper>
						</Box>
					</Grid>

					{/* Right Column - All Scheduled Jobs */}
					<Grid size={{ xs: 12, lg: 4 }}>
						<ScheduleManager
							crawlers={crawlers}
							onRunCrawler={runCrawler}
							loading={loading}
							runningCrawler={runningCrawler}
						/>
					</Grid>
				</Grid>

				{/* Full Width Sections Below */}
				<Grid container spacing={3}>
					<Grid size={12}>
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
								All Crawlers
							</Typography>
							<Divider sx={{ mb: 2 }} />

							<CrawlerList
								crawlers={crawlers}
								onRunCrawler={runCrawler}
								loading={loading}
								runningCrawler={runningCrawler}
							/>
						</Paper>
					</Grid>

					<Grid size={12}>
						<Paper
							sx={{
								p: 3,
								borderRadius: 2,
								boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
							}}
						>
							<Box
								sx={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									mb: 2,
								}}
							>
								<Typography
									variant="h5"
									component="h2"
									sx={{
										fontWeight: 'bold',
										display: 'flex',
										alignItems: 'center',
										color: theme.palette.primary.main,
									}}
								>
									<CloudDownloadIcon sx={{ mr: 1 }} />
									All Available Reports
								</Typography>
								<ExcelExport
									files={files}
									onNotification={showNotification}
									compact={true}
								/>
							</Box>
							<Divider sx={{ mb: 2 }} />

							<FileList files={files} />
						</Paper>
					</Grid>

					<Grid size={12}>
						<AIChat files={files} onNotification={showNotification} />
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

				{/* Settings Dialog */}
				<Dialog
					open={settingsOpen}
					onClose={closeSettings}
					maxWidth="sm"
					fullWidth
				>
					<DialogTitle>
						<Box sx={{ display: 'flex', alignItems: 'center' }}>
							<SettingsIcon sx={{ mr: 1 }} />
							Quick Run Settings
						</Box>
					</DialogTitle>
					<DialogContent>
						<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
							Select which crawlers you want to appear in the Quick Run section
							for easy access.
						</Typography>
						<FormGroup>
							{crawlers.map((crawler) => (
								<FormControlLabel
									key={crawler.id}
									control={
										<Checkbox
											checked={tempFavorites.includes(crawler.id)}
											onChange={() => handleFavoriteToggle(crawler.id)}
										/>
									}
									label={crawler.name}
								/>
							))}
						</FormGroup>
					</DialogContent>
					<DialogActions>
						<Button onClick={closeSettings}>Cancel</Button>
						<Button onClick={saveFavorites} variant="contained">
							Save Preferences
						</Button>
					</DialogActions>
				</Dialog>
			</Container>
		</Box>
	);
};

export default Dashboard;
