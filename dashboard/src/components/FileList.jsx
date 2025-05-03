import {
	List,
	ListItem,
	ListItemText,
	ListItemSecondaryAction,
	Button,
	Divider,
	Typography,
	Box,
	Chip,
	Card,
	CardContent,
	CardActions,
	Grid,
	useTheme,
	Paper,
	IconButton,
	Tooltip,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import FileIcon from '@mui/icons-material/InsertDriveFile';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { format } from 'date-fns';

const FileList = ({ files }) => {
	const theme = useTheme();

	if (!files || files.length === 0) {
		return (
			<Box sx={{ py: 2 }}>
				<Typography variant="body1" color="text.secondary" align="center">
					No reports available. Run a crawler to generate reports.
				</Typography>
			</Box>
		);
	}

	// Format the date
	const formatDate = (dateString) => {
		try {
			const date = new Date(dateString);
			return format(date, 'MMM d, yyyy h:mm a');
		} catch (error) {
			return dateString;
		}
	};

	return (
		<Grid container spacing={2}>
			{files.map((file) => (
				<Grid item xs={12} sm={6} md={4} key={file.filename}>
					<Card
						sx={{
							height: '100%',
							display: 'flex',
							flexDirection: 'column',
							transition: 'transform 0.2s, box-shadow 0.2s',
							'&:hover': {
								transform: 'translateY(-4px)',
								boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
							},
						}}
						elevation={3}
					>
						<CardContent sx={{ flexGrow: 1, pb: 1 }}>
							<Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
								<FileIcon
									sx={{
										color: theme.palette.primary.main,
										mr: 1,
										fontSize: '2rem',
									}}
								/>
								<Box>
									<Typography
										variant="h6"
										component="h3"
										sx={{
											fontWeight: 'bold',
											mb: 0.5,
											overflow: 'hidden',
											textOverflow: 'ellipsis',
											display: '-webkit-box',
											WebkitLineClamp: 2,
											WebkitBoxOrient: 'vertical',
										}}
									>
										{file.filename}
									</Typography>

									<Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
										<CalendarTodayIcon
											sx={{
												color: theme.palette.text.secondary,
												fontSize: '0.9rem',
												mr: 0.5,
											}}
										/>
										<Typography variant="body2" color="text.secondary">
											{formatDate(file.lastModified)}
										</Typography>
									</Box>
								</Box>
							</Box>

							<Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
								<Chip
									label="CSV"
									size="small"
									color="primary"
									variant="outlined"
									sx={{ mr: 1 }}
								/>
								<Chip
									label="Report"
									size="small"
									color="secondary"
									variant="outlined"
								/>
							</Box>
						</CardContent>

						<CardActions sx={{ p: 2, pt: 0, justifyContent: 'space-between' }}>
							<Tooltip title="Preview">
								<IconButton color="primary" size="small">
									<VisibilityIcon />
								</IconButton>
							</Tooltip>

							<Button
								variant="contained"
								color="primary"
								endIcon={<DownloadIcon />}
								href={`http://localhost:5000${file.path}`}
								download
								sx={{
									borderRadius: 2,
									px: 2,
								}}
							>
								Download
							</Button>
						</CardActions>
					</Card>
				</Grid>
			))}
		</Grid>
	);
};

export default FileList;
