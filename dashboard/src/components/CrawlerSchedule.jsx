import { useState, useEffect } from 'react';
import {
	Box,
	Paper,
	Typography,
	Button,
	List,
	ListItem,
	ListItemText,
	ListItemSecondaryAction,
	IconButton,
	Chip,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	TextField,
	Divider,
	useTheme,
	FormControlLabel,
	Checkbox,
	FormGroup,
	Switch,
	Menu,
} from '@mui/material';
import ScheduleIcon from '@mui/icons-material/Schedule';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RepeatIcon from '@mui/icons-material/Repeat';
import MoreVertIcon from '@mui/icons-material/MoreVert';

const CrawlerSchedule = ({
	crawlers,
	onRunCrawler,
	loading,
	runningCrawler,
}) => {
	const [scheduledCrawlers, setScheduledCrawlers] = useState([]);
	const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
	const [selectedCrawlers, setSelectedCrawlers] = useState([]);
	const [scheduleTime, setScheduleTime] = useState('');
	const [scheduleDate, setScheduleDate] = useState('');
	const [isRecurring, setIsRecurring] = useState(false);
	const [selectedDays, setSelectedDays] = useState([]);
	const [menuAnchor, setMenuAnchor] = useState(null);
	const [scheduleMode, setScheduleMode] = useState('single'); // 'single', 'multiple', 'all'
	const theme = useTheme();

	const daysOfWeek = [
		{ value: 0, label: 'Sunday' },
		{ value: 1, label: 'Monday' },
		{ value: 2, label: 'Tuesday' },
		{ value: 3, label: 'Wednesday' },
		{ value: 4, label: 'Thursday' },
		{ value: 5, label: 'Friday' },
		{ value: 6, label: 'Saturday' },
	];

	// Load scheduled crawlers from localStorage
	useEffect(() => {
		const saved = localStorage.getItem('scheduledCrawlers');
		if (saved) {
			try {
				setScheduledCrawlers(JSON.parse(saved));
			} catch (error) {
				console.error('Error parsing scheduled crawlers:', error);
				setScheduledCrawlers([]);
			}
		}
	}, []);

	// Save scheduled crawlers to localStorage with error handling
	useEffect(() => {
		try {
			localStorage.setItem(
				'scheduledCrawlers',
				JSON.stringify(scheduledCrawlers)
			);
			// Dispatch custom event to notify other components
			window.dispatchEvent(
				new CustomEvent('scheduledCrawlersUpdated', {
					detail: scheduledCrawlers,
				})
			);
		} catch (error) {
			console.error('Error saving scheduled crawlers:', error);
		}
	}, [scheduledCrawlers]);

	// Listen for updates from other components
	useEffect(() => {
		const handleStorageUpdate = (event) => {
			if (event.key === 'scheduledCrawlers' && event.newValue) {
				try {
					setScheduledCrawlers(JSON.parse(event.newValue));
				} catch (error) {
					console.error('Error parsing updated scheduled crawlers:', error);
				}
			}
		};

		const handleCustomUpdate = (event) => {
			setScheduledCrawlers(event.detail);
		};

		// Listen for storage changes from other tabs/windows
		window.addEventListener('storage', handleStorageUpdate);
		// Listen for updates from same window
		window.addEventListener('scheduledCrawlersUpdated', handleCustomUpdate);

		return () => {
			window.removeEventListener('storage', handleStorageUpdate);
			window.removeEventListener(
				'scheduledCrawlersUpdated',
				handleCustomUpdate
			);
		};
	}, []);

	// Check for scheduled crawlers that should run
	useEffect(() => {
		const interval = setInterval(() => {
			const now = new Date();
			const toRun = scheduledCrawlers.filter((item) => {
				const scheduledTime = new Date(item.scheduledFor);
				return scheduledTime <= now && !item.executed && !item.running;
			});

			if (toRun.length > 0 && !loading) {
				// Run the first scheduled crawler
				const crawler = toRun[0];
				onRunCrawler(crawler.crawlerId);

				// Mark as running
				setScheduledCrawlers((prev) =>
					prev.map((item) =>
						item.id === crawler.id
							? { ...item, running: true, startedAt: now.toISOString() }
							: item
					)
				);
			}
		}, 10000); // Check every 10 seconds

		return () => clearInterval(interval);
	}, [scheduledCrawlers, loading, onRunCrawler]);

	// Update running status when crawler completes
	useEffect(() => {
		setScheduledCrawlers((prev) =>
			prev.map((item) => {
				if (item.running && item.crawlerId !== runningCrawler) {
					// Crawler has completed
					const completedItem = {
						...item,
						running: false,
						executed: true,
						executedAt: new Date().toISOString(),
					};

					// If it's recurring, create next occurrence
					if (item.isRecurring && item.recurringDays) {
						const nextOccurrence = getNextRecurringDate(item);
						if (nextOccurrence) {
							// Create new scheduled item for next occurrence
							const newItem = {
								...item,
								id: Date.now() + Math.random(),
								scheduledFor: nextOccurrence.toISOString(),
								running: false,
								executed: false,
								startedAt: null,
								executedAt: null,
							};
							// Add the new occurrence
							setTimeout(() => {
								setScheduledCrawlers((current) =>
									[...current, newItem].sort(
										(a, b) =>
											new Date(a.scheduledFor) - new Date(b.scheduledFor)
									)
								);
							}, 100);
						}
					}

					return completedItem;
				}
				return item;
			})
		);
	}, [runningCrawler]);

	const getNextRecurringDate = (item) => {
		const now = new Date();
		const [hours, minutes] = item.scheduleTime.split(':').map(Number);

		// Find the next occurrence
		for (let i = 1; i <= 7; i++) {
			const nextDate = new Date(now);
			nextDate.setDate(now.getDate() + i);

			if (item.recurringDays.includes(nextDate.getDay())) {
				nextDate.setHours(hours, minutes, 0, 0);
				return nextDate;
			}
		}
		return null;
	};

	const openScheduleDialog = () => {
		const now = new Date();
		const tomorrow = new Date(now);
		tomorrow.setDate(tomorrow.getDate() + 1);

		setScheduleDate(tomorrow.toISOString().split('T')[0]);
		setScheduleTime('09:00');
		setSelectedCrawlers([]);
		setScheduleMode('single');
		setIsRecurring(false);
		setSelectedDays([]);
		setScheduleDialogOpen(true);
	};

	const closeScheduleDialog = () => {
		setScheduleDialogOpen(false);
		setSelectedCrawlers([]);
		setScheduleTime('');
		setScheduleDate('');
		setScheduleMode('single');
		setIsRecurring(false);
		setSelectedDays([]);
	};

	const addToSchedule = () => {
		if (!scheduleTime) return;
		if (!isRecurring && !scheduleDate) return;
		if (isRecurring && selectedDays.length === 0) return;

		// Determine which crawlers to schedule
		let crawlersToSchedule = [];
		if (scheduleMode === 'all') {
			crawlersToSchedule = crawlers;
		} else if (scheduleMode === 'multiple') {
			crawlersToSchedule = crawlers.filter((c) =>
				selectedCrawlers.includes(c.id)
			);
		} else {
			// Single mode
			if (selectedCrawlers.length === 0) return;
			crawlersToSchedule = crawlers.filter((c) =>
				selectedCrawlers.includes(c.id)
			);
		}

		if (crawlersToSchedule.length === 0) return;

		const schedules = [];
		const now = new Date();
		const [hours, minutes] = scheduleTime.split(':').map(Number);

		if (isRecurring) {
			// Create recurring schedules for all selected crawlers
			crawlersToSchedule.forEach((crawler, crawlerIndex) => {
				for (let week = 0; week < 4; week++) {
					selectedDays.forEach((dayOfWeek) => {
						const scheduleDate = new Date(now);
						scheduleDate.setDate(
							now.getDate() + week * 7 + ((dayOfWeek - now.getDay() + 7) % 7)
						);
						scheduleDate.setHours(hours, minutes, 0, 0);

						if (scheduleDate > now) {
							schedules.push({
								id: Date.now() + Math.random(),
								crawlerId: crawler.id,
								crawlerName: crawler.name,
								scheduledFor: scheduleDate.toISOString(),
								executed: false,
								running: false,
								isRecurring: true,
								recurringDays: selectedDays,
								scheduleTime: scheduleTime,
								createdAt: new Date().toISOString(),
							});
						}
					});
				}
			});
		} else {
			// Create single schedules for all selected crawlers
			const baseDate = new Date(`${scheduleDate}T${scheduleTime}`);

			crawlersToSchedule.forEach((crawler, index) => {
				schedules.push({
					id: Date.now() + index,
					crawlerId: crawler.id,
					crawlerName: crawler.name,
					scheduledFor: baseDate.toISOString(),
					executed: false,
					running: false,
					isRecurring: false,
					createdAt: new Date().toISOString(),
				});
			});
		}

		setScheduledCrawlers((prev) =>
			[...prev, ...schedules].sort(
				(a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor)
			)
		);

		closeScheduleDialog();
	};

	const removeFromSchedule = (id) => {
		setScheduledCrawlers((prev) => prev.filter((item) => item.id !== id));
	};

	const runNow = (crawlerId) => {
		onRunCrawler(crawlerId);
		// Mark as running
		setScheduledCrawlers((prev) =>
			prev.map((item) =>
				item.crawlerId === crawlerId && !item.executed
					? { ...item, running: true, startedAt: new Date().toISOString() }
					: item
			)
		);
	};

	const scheduleAllCrawlers = () => {
		const now = new Date();
		const tomorrow = new Date(now);
		tomorrow.setDate(tomorrow.getDate() + 1);
		tomorrow.setHours(9, 0, 0, 0);

		const schedules = crawlers.map((crawler, index) => ({
			id: Date.now() + index,
			crawlerId: crawler.id,
			crawlerName: crawler.name,
			scheduledFor: tomorrow.toISOString(),
			executed: false,
			running: false,
			isRecurring: false,
			createdAt: new Date().toISOString(),
		}));

		setScheduledCrawlers((prev) =>
			[...prev, ...schedules].sort(
				(a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor)
			)
		);

		setMenuAnchor(null);
	};

	const formatScheduleTime = (isoString) => {
		const date = new Date(isoString);
		const now = new Date();
		const isToday = date.toDateString() === now.toDateString();
		const isTomorrow =
			date.toDateString() ===
			new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();

		const timeStr = date.toLocaleTimeString([], {
			hour: '2-digit',
			minute: '2-digit',
		});

		if (isToday) return `Today at ${timeStr}`;
		if (isTomorrow) return `Tomorrow at ${timeStr}`;
		return date.toLocaleDateString() + ' at ' + timeStr;
	};

	const getStatusChip = (item) => {
		const now = new Date();
		const scheduledTime = new Date(item.scheduledFor);

		if (item.running) {
			return (
				<Chip size="small" label="In Progress" color="info" variant="filled" />
			);
		} else if (item.executed) {
			return (
				<Chip
					size="small"
					label="Completed"
					color="success"
					variant="outlined"
				/>
			);
		} else if (scheduledTime <= now) {
			return (
				<Chip size="small" label="Ready" color="warning" variant="outlined" />
			);
		} else {
			return (
				<Chip
					size="small"
					label="Scheduled"
					color="primary"
					variant="outlined"
				/>
			);
		}
	};

	const getItemBackgroundColor = (item) => {
		if (item.running) {
			return theme.palette.mode === 'dark' ? 'info.dark' : 'info.light';
		} else if (item.executed) {
			return theme.palette.mode === 'dark' ? 'success.dark' : 'success.light';
		} else {
			return theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50';
		}
	};

	const getItemBorderColor = (item) => {
		if (item.running) {
			return 'info.main';
		} else if (item.executed) {
			return 'success.main';
		} else {
			return theme.palette.mode === 'dark' ? 'grey.600' : 'grey.200';
		}
	};

	const pendingCrawlers = scheduledCrawlers.filter((item) => !item.executed);
	const completedCrawlers = scheduledCrawlers.filter((item) => item.executed);

	return (
		<>
			<Box
				sx={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					mb: 2,
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
					<ScheduleIcon sx={{ mr: 1 }} />
					Crawler Schedule
				</Typography>
				<Box sx={{ display: 'flex', gap: 1 }}>
					<Button
						size="small"
						variant="outlined"
						startIcon={<PlaylistAddIcon />}
						onClick={openScheduleDialog}
						sx={{ textTransform: 'none' }}
					>
						Schedule
					</Button>
					<IconButton
						size="small"
						onClick={(e) => setMenuAnchor(e.currentTarget)}
					>
						<MoreVertIcon />
					</IconButton>
				</Box>
			</Box>

			<Menu
				anchorEl={menuAnchor}
				open={Boolean(menuAnchor)}
				onClose={() => setMenuAnchor(null)}
			>
				<MenuItem onClick={scheduleAllCrawlers}>Schedule All Crawlers</MenuItem>
			</Menu>

			<Divider sx={{ mb: 2 }} />

			<Typography
				variant="body2"
				color="text.secondary"
				sx={{ textAlign: 'center', py: 2 }}
			>
				Use the form above to create new schedules. View and manage all
				scheduled jobs in the "All Scheduled Jobs" panel.
			</Typography>

			{/* Schedule Dialog */}
			<Dialog
				open={scheduleDialogOpen}
				onClose={closeScheduleDialog}
				maxWidth="sm"
				fullWidth
			>
				<DialogTitle>
					<Box sx={{ display: 'flex', alignItems: 'center' }}>
						<ScheduleIcon sx={{ mr: 1 }} />
						Schedule Crawler
					</Box>
				</DialogTitle>
				<DialogContent>
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
						{/* Schedule Mode Selection */}
						<FormControl fullWidth>
							<InputLabel>Schedule Mode</InputLabel>
							<Select
								value={scheduleMode}
								onChange={(e) => {
									setScheduleMode(e.target.value);
									setSelectedCrawlers([]);
								}}
								label="Schedule Mode"
							>
								<MenuItem value="single">Single Crawler</MenuItem>
								<MenuItem value="multiple">Multiple Crawlers</MenuItem>
								<MenuItem value="all">All Crawlers</MenuItem>
							</Select>
						</FormControl>

						{/* Crawler Selection */}
						{scheduleMode === 'single' && (
							<FormControl fullWidth>
								<InputLabel>Select Crawler</InputLabel>
								<Select
									value={selectedCrawlers[0] || ''}
									onChange={(e) => setSelectedCrawlers([e.target.value])}
									label="Select Crawler"
								>
									{crawlers.map((crawler) => (
										<MenuItem key={crawler.id} value={crawler.id}>
											{crawler.name}
										</MenuItem>
									))}
								</Select>
							</FormControl>
						)}

						{scheduleMode === 'multiple' && (
							<Box>
								<Typography variant="subtitle2" sx={{ mb: 1 }}>
									Select Crawlers
								</Typography>
								<FormGroup>
									{crawlers.map((crawler) => (
										<FormControlLabel
											key={crawler.id}
											control={
												<Checkbox
													checked={selectedCrawlers.includes(crawler.id)}
													onChange={(e) => {
														if (e.target.checked) {
															setSelectedCrawlers([
																...selectedCrawlers,
																crawler.id,
															]);
														} else {
															setSelectedCrawlers(
																selectedCrawlers.filter(
																	(id) => id !== crawler.id
																)
															);
														}
													}}
												/>
											}
											label={crawler.name}
										/>
									))}
								</FormGroup>
							</Box>
						)}

						{scheduleMode === 'all' && (
							<Typography variant="body2" color="text.secondary">
								All {crawlers.length} crawlers will be scheduled at the same
								time.
							</Typography>
						)}

						<FormControlLabel
							control={
								<Switch
									checked={isRecurring}
									onChange={(e) => setIsRecurring(e.target.checked)}
								/>
							}
							label="Recurring Schedule"
						/>

						{!isRecurring ? (
							<TextField
								label="Date"
								type="date"
								value={scheduleDate}
								onChange={(e) => setScheduleDate(e.target.value)}
								InputLabelProps={{ shrink: true }}
								fullWidth
							/>
						) : (
							<Box>
								<Typography variant="subtitle2" sx={{ mb: 1 }}>
									Select Days
								</Typography>
								<FormGroup row>
									{daysOfWeek.map((day) => (
										<FormControlLabel
											key={day.value}
											control={
												<Checkbox
													checked={selectedDays.includes(day.value)}
													onChange={(e) => {
														if (e.target.checked) {
															setSelectedDays([...selectedDays, day.value]);
														} else {
															setSelectedDays(
																selectedDays.filter((d) => d !== day.value)
															);
														}
													}}
												/>
											}
											label={day.label.slice(0, 3)}
										/>
									))}
								</FormGroup>
							</Box>
						)}

						<TextField
							label="Time"
							type="time"
							value={scheduleTime}
							onChange={(e) => setScheduleTime(e.target.value)}
							InputLabelProps={{ shrink: true }}
							fullWidth
						/>
					</Box>
				</DialogContent>
				<DialogActions>
					<Button onClick={closeScheduleDialog}>Cancel</Button>
					<Button
						onClick={addToSchedule}
						variant="contained"
						disabled={
							!scheduleTime ||
							(!isRecurring && !scheduleDate) ||
							(isRecurring && selectedDays.length === 0) ||
							(scheduleMode === 'single' && selectedCrawlers.length === 0) ||
							(scheduleMode === 'multiple' && selectedCrawlers.length === 0)
						}
					>
						{isRecurring
							? 'Schedule Recurring'
							: `Schedule ${
									scheduleMode === 'all'
										? 'All'
										: scheduleMode === 'multiple'
										? `${selectedCrawlers.length}`
										: ''
							  } Crawler${scheduleMode !== 'single' ? 's' : ''}`}
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
};

export default CrawlerSchedule;
