import { useState, useEffect } from 'react';
import {
	Box,
	Paper,
	Typography,
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
	Button,
	TextField,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	FormGroup,
	FormControlLabel,
	Checkbox,
	Switch,
	Divider,
	useTheme,
	Tooltip,
} from '@mui/material';
import ListIcon from '@mui/icons-material/List';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RepeatIcon from '@mui/icons-material/Repeat';
import ScheduleIcon from '@mui/icons-material/Schedule';

const ScheduleManager = ({
	crawlers,
	onRunCrawler,
	loading,
	runningCrawler,
}) => {
	const [scheduledCrawlers, setScheduledCrawlers] = useState([]);
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [editingItem, setEditingItem] = useState(null);
	const [editScheduleTime, setEditScheduleTime] = useState('');
	const [editScheduleDate, setEditScheduleDate] = useState('');
	const [editIsRecurring, setEditIsRecurring] = useState(false);
	const [editSelectedDays, setEditSelectedDays] = useState([]);
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

	// Listen for changes in localStorage (from other components)
	useEffect(() => {
		const handleStorageChange = (event) => {
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
		window.addEventListener('storage', handleStorageChange);
		// Listen for updates from same window
		window.addEventListener('scheduledCrawlersUpdated', handleCustomUpdate);

		return () => {
			window.removeEventListener('storage', handleStorageChange);
			window.removeEventListener(
				'scheduledCrawlersUpdated',
				handleCustomUpdate
			);
		};
	}, []);

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
				<Chip size="small" label="Running" color="info" variant="filled" />
			);
		} else if (item.executed) {
			return (
				<Chip size="small" label="Done" color="success" variant="outlined" />
			);
		} else if (scheduledTime <= now) {
			return (
				<Chip size="small" label="Ready" color="warning" variant="outlined" />
			);
		} else {
			return (
				<Chip size="small" label="Pending" color="primary" variant="outlined" />
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

	const removeFromSchedule = (id) => {
		const updated = scheduledCrawlers.filter((item) => item.id !== id);
		setScheduledCrawlers(updated);
		try {
			localStorage.setItem('scheduledCrawlers', JSON.stringify(updated));
			// Dispatch custom event to notify other components
			window.dispatchEvent(
				new CustomEvent('scheduledCrawlersUpdated', {
					detail: updated,
				})
			);
		} catch (error) {
			console.error('Error saving scheduled crawlers:', error);
		}
	};

	const runNow = (crawlerId) => {
		onRunCrawler(crawlerId);
		// Mark as running
		const updated = scheduledCrawlers.map((item) =>
			item.crawlerId === crawlerId && !item.executed
				? { ...item, running: true, startedAt: new Date().toISOString() }
				: item
		);
		setScheduledCrawlers(updated);
		try {
			localStorage.setItem('scheduledCrawlers', JSON.stringify(updated));
			// Dispatch custom event to notify other components
			window.dispatchEvent(
				new CustomEvent('scheduledCrawlersUpdated', {
					detail: updated,
				})
			);
		} catch (error) {
			console.error('Error saving scheduled crawlers:', error);
		}
	};

	const openEditDialog = (item) => {
		setEditingItem(item);
		const scheduleDate = new Date(item.scheduledFor);
		setEditScheduleDate(scheduleDate.toISOString().split('T')[0]);
		setEditScheduleTime(scheduleDate.toTimeString().slice(0, 5));
		setEditIsRecurring(item.isRecurring || false);
		setEditSelectedDays(item.recurringDays || []);
		setEditDialogOpen(true);
	};

	const closeEditDialog = () => {
		setEditDialogOpen(false);
		setEditingItem(null);
		setEditScheduleTime('');
		setEditScheduleDate('');
		setEditIsRecurring(false);
		setEditSelectedDays([]);
	};

	const saveEdit = () => {
		if (!editingItem || !editScheduleTime) return;
		if (!editIsRecurring && !editScheduleDate) return;
		if (editIsRecurring && editSelectedDays.length === 0) return;

		const baseDate = new Date(`${editScheduleDate}T${editScheduleTime}`);

		const updatedItem = {
			...editingItem,
			scheduledFor: baseDate.toISOString(),
			isRecurring: editIsRecurring,
			recurringDays: editIsRecurring ? editSelectedDays : undefined,
			scheduleTime: editIsRecurring ? editScheduleTime : undefined,
		};

		const updated = scheduledCrawlers
			.map((item) => (item.id === editingItem.id ? updatedItem : item))
			.sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor));

		setScheduledCrawlers(updated);
		localStorage.setItem('scheduledCrawlers', JSON.stringify(updated));
		closeEditDialog();
	};

	const allSchedules = scheduledCrawlers.sort(
		(a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor)
	);

	const pendingSchedules = allSchedules.filter((item) => !item.executed);
	const completedSchedules = allSchedules.filter((item) => item.executed);

	return (
		<Paper
			sx={{
				p: 3,
				borderRadius: 2,
				boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
				height: 'fit-content',
				maxHeight: '600px', // Limit height to match map area
				display: 'flex',
				flexDirection: 'column',
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
					mb: 2,
				}}
			>
				<ListIcon sx={{ mr: 1 }} />
				All Scheduled Jobs
			</Typography>

			<Divider sx={{ mb: 2 }} />

			{/* Scrollable content area */}
			<Box
				sx={{
					flex: 1,
					overflowY: 'auto',
					overflowX: 'hidden',
					'&::-webkit-scrollbar': {
						width: '6px',
					},
					'&::-webkit-scrollbar-track': {
						background:
							theme.palette.mode === 'dark'
								? 'rgba(255,255,255,0.1)'
								: 'rgba(0,0,0,0.1)',
						borderRadius: '3px',
					},
					'&::-webkit-scrollbar-thumb': {
						background:
							theme.palette.mode === 'dark'
								? 'rgba(255,255,255,0.3)'
								: 'rgba(0,0,0,0.3)',
						borderRadius: '3px',
						'&:hover': {
							background:
								theme.palette.mode === 'dark'
									? 'rgba(255,255,255,0.5)'
									: 'rgba(0,0,0,0.5)',
						},
					},
				}}
			>
				{allSchedules.length === 0 ? (
					<Typography
						variant="body2"
						color="text.secondary"
						sx={{ textAlign: 'center', py: 3 }}
					>
						No scheduled jobs yet.
					</Typography>
				) : (
					<>
						{pendingSchedules.length > 0 && (
							<>
								<Typography
									variant="subtitle2"
									sx={{ mb: 1, fontWeight: 'bold' }}
								>
									Pending ({pendingSchedules.length})
								</Typography>
								<List dense sx={{ mb: 2 }}>
									{pendingSchedules.map((item) => (
										<ListItem
											key={item.id}
											sx={{
												bgcolor: getItemBackgroundColor(item),
												borderRadius: 1,
												mb: 1,
												border: '1px solid',
												borderColor: getItemBorderColor(item),
												px: 2,
												py: 1,
											}}
										>
											<ListItemText
												primary={
													<Box
														sx={{
															display: 'flex',
															alignItems: 'center',
															gap: 1,
														}}
													>
														<Typography
															variant="body2"
															sx={{ fontWeight: 'medium' }}
														>
															{item.crawlerName}
														</Typography>
														{item.isRecurring && (
															<RepeatIcon
																sx={{ fontSize: 14, color: 'primary.main' }}
															/>
														)}
													</Box>
												}
												secondary={
													<Box
														sx={{
															display: 'flex',
															alignItems: 'center',
															gap: 1,
															mt: 0.5,
														}}
													>
														<AccessTimeIcon sx={{ fontSize: 12 }} />
														<Typography variant="caption">
															{formatScheduleTime(item.scheduledFor)}
														</Typography>
														{getStatusChip(item)}
													</Box>
												}
											/>
											<ListItemSecondaryAction>
												<Box sx={{ display: 'flex', gap: 0.5 }}>
													{new Date(item.scheduledFor) <= new Date() &&
														!item.running && (
															<Tooltip title="Run Now">
																<IconButton
																	size="small"
																	onClick={() => runNow(item.crawlerId)}
																	disabled={loading}
																	color="primary"
																>
																	<PlayArrowIcon fontSize="small" />
																</IconButton>
															</Tooltip>
														)}
													{!item.running && (
														<>
															<Tooltip title="Edit">
																<IconButton
																	size="small"
																	onClick={() => openEditDialog(item)}
																	color="default"
																>
																	<EditIcon fontSize="small" />
																</IconButton>
															</Tooltip>
															<Tooltip title="Delete">
																<IconButton
																	size="small"
																	onClick={() => removeFromSchedule(item.id)}
																	color="error"
																>
																	<DeleteIcon fontSize="small" />
																</IconButton>
															</Tooltip>
														</>
													)}
												</Box>
											</ListItemSecondaryAction>
										</ListItem>
									))}
								</List>
							</>
						)}

						{completedSchedules.length > 0 && (
							<>
								{pendingSchedules.length > 0 && <Divider sx={{ my: 2 }} />}
								<Typography
									variant="subtitle2"
									sx={{ mb: 1, fontWeight: 'bold' }}
								>
									Completed ({completedSchedules.length})
								</Typography>
								<List dense>
									{completedSchedules.slice(-3).map((item) => (
										<ListItem
											key={item.id}
											sx={{
												bgcolor: getItemBackgroundColor(item),
												borderRadius: 1,
												mb: 1,
												border: '1px solid',
												borderColor: getItemBorderColor(item),
												px: 2,
												py: 1,
											}}
										>
											<ListItemText
												primary={
													<Typography
														variant="body2"
														sx={{ fontWeight: 'medium' }}
													>
														{item.crawlerName}
													</Typography>
												}
												secondary={
													<Box
														sx={{
															display: 'flex',
															alignItems: 'center',
															gap: 1,
															mt: 0.5,
														}}
													>
														<Typography variant="caption">
															Completed{' '}
															{new Date(item.executedAt).toLocaleTimeString()}
														</Typography>
														{getStatusChip(item)}
													</Box>
												}
											/>
										</ListItem>
									))}
								</List>
							</>
						)}
					</>
				)}
			</Box>

			{/* Edit Dialog */}
			<Dialog
				open={editDialogOpen}
				onClose={closeEditDialog}
				maxWidth="sm"
				fullWidth
			>
				<DialogTitle>
					<Box sx={{ display: 'flex', alignItems: 'center' }}>
						<EditIcon sx={{ mr: 1 }} />
						Edit Schedule
					</Box>
				</DialogTitle>
				<DialogContent>
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
						<Typography variant="body2" color="text.secondary">
							Editing: <strong>{editingItem?.crawlerName}</strong>
						</Typography>

						<FormControlLabel
							control={
								<Switch
									checked={editIsRecurring}
									onChange={(e) => setEditIsRecurring(e.target.checked)}
								/>
							}
							label="Recurring Schedule"
						/>

						{!editIsRecurring ? (
							<TextField
								label="Date"
								type="date"
								value={editScheduleDate}
								onChange={(e) => setEditScheduleDate(e.target.value)}
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
													checked={editSelectedDays.includes(day.value)}
													onChange={(e) => {
														if (e.target.checked) {
															setEditSelectedDays([
																...editSelectedDays,
																day.value,
															]);
														} else {
															setEditSelectedDays(
																editSelectedDays.filter((d) => d !== day.value)
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
							value={editScheduleTime}
							onChange={(e) => setEditScheduleTime(e.target.value)}
							InputLabelProps={{ shrink: true }}
							fullWidth
						/>
					</Box>
				</DialogContent>
				<DialogActions>
					<Button onClick={closeEditDialog}>Cancel</Button>
					<Button
						onClick={saveEdit}
						variant="contained"
						disabled={
							!editScheduleTime ||
							(!editIsRecurring && !editScheduleDate) ||
							(editIsRecurring && editSelectedDays.length === 0)
						}
					>
						Save Changes
					</Button>
				</DialogActions>
			</Dialog>
		</Paper>
	);
};

export default ScheduleManager;
