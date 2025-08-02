import {
	List,
	ListItem,
	ListItemText,
	ListItemSecondaryAction,
	Button,
	CircularProgress,
	Divider,
	Typography,
	Box,
	Card,
	CardContent,
	Grid,
	Chip,
	useTheme,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import WebIcon from '@mui/icons-material/Web';
import DescriptionIcon from '@mui/icons-material/Description';
import LaunchIcon from '@mui/icons-material/Launch';

const CrawlerList = ({ crawlers, onRunCrawler, loading, runningCrawler }) => {
	const theme = useTheme();

	if (!crawlers || crawlers.length === 0) {
		return (
			<Box sx={{ py: 2 }}>
				<Typography variant="body1" color="text.secondary">
					No crawlers available.
				</Typography>
			</Box>
		);
	}

	return (
		<Grid container spacing={2}>
			{crawlers.map((crawler) => (
				<Grid item xs={12} sm={6} md={4} key={crawler.id}>
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
							<Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
								<WebIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
								<Typography
									variant="h6"
									component="h3"
									sx={{ fontWeight: 'bold' }}
								>
									{crawler.name}
								</Typography>
							</Box>

							<Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
								<DescriptionIcon
									sx={{
										color: theme.palette.text.secondary,
										fontSize: '0.9rem',
										mr: 0.5,
									}}
								/>
								<Typography variant="body2" color="text.secondary">
									{crawler.filename}
								</Typography>
							</Box>

							<Chip
								label="Web Crawler"
								size="small"
								color="primary"
								variant="outlined"
								sx={{ mb: 2 }}
							/>
						</CardContent>

						<Box
							sx={{
								p: 2,
								pt: 0,
								display: 'flex',
								gap: 1,
								flexDirection: 'column',
							}}
						>
							<Button
								variant="contained"
								color="primary"
								fullWidth
								startIcon={
									loading && runningCrawler === crawler.id ? (
										<CircularProgress size={20} color="inherit" />
									) : (
										<PlayArrowIcon />
									)
								}
								onClick={() => onRunCrawler(crawler.id)}
								disabled={loading}
								sx={{
									borderRadius: 2,
									py: 1,
								}}
							>
								{loading && runningCrawler === crawler.id
									? 'Running...'
									: 'Run Crawler'}
							</Button>

							{crawler.url && (
								<Button
									variant="outlined"
									color="primary"
									fullWidth
									size="small"
									startIcon={<LaunchIcon />}
									onClick={() => window.open(crawler.url, '_blank')}
									sx={{
										borderRadius: 2,
										py: 0.5,
										textTransform: 'none',
									}}
								>
									Visit Bid Page
								</Button>
							)}
						</Box>
					</Card>
				</Grid>
			))}
		</Grid>
	);
};

export default CrawlerList;
