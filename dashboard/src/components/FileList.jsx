import { useState } from 'react';
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
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	CircularProgress,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import FileIcon from '@mui/icons-material/InsertDriveFile';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import { format } from 'date-fns';

const FileList = ({ files }) => {
	const theme = useTheme();
	const [previewOpen, setPreviewOpen] = useState(false);
	const [previewFile, setPreviewFile] = useState(null);
	const [previewData, setPreviewData] = useState([]);
	const [previewLoading, setPreviewLoading] = useState(false);

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

	// Handle preview click
	const handlePreviewClick = async (file) => {
		setPreviewFile(file);
		setPreviewOpen(true);
		setPreviewLoading(true);

		try {
			// Fetch the CSV file
			const response = await fetch(`http://localhost:5001${file.path}`);
			const text = await response.text();

			// Parse CSV properly handling quoted fields
			const parseCSVLine = (line) => {
				const result = [];
				let current = '';
				let inQuotes = false;

				for (let i = 0; i < line.length; i++) {
					const char = line[i];
					const nextChar = line[i + 1];

					if (char === '"') {
						if (inQuotes && nextChar === '"') {
							// Escaped quote
							current += '"';
							i++; // Skip next quote
						} else {
							// Toggle quote state
							inQuotes = !inQuotes;
						}
					} else if (char === ',' && !inQuotes) {
						// Field separator
						result.push(current.trim());
						current = '';
					} else {
						current += char;
					}
				}

				// Add the last field
				result.push(current.trim());
				return result;
			};

			const rows = text.split('\n').filter((row) => row.trim());
			const headers = parseCSVLine(rows[0]).map((header) =>
				header.replace(/^"|"$/g, '')
			);

			const data = rows.slice(1).map((row) => {
				const values = parseCSVLine(row).map((value) =>
					value.replace(/^"|"$/g, '')
				);
				return headers.reduce((obj, header, index) => {
					obj[header] = values[index] || '';
					return obj;
				}, {});
			});

			setPreviewData({ headers, data });
		} catch (error) {
			console.error('Error fetching CSV file:', error);
			setPreviewData({ headers: [], data: [] });
		} finally {
			setPreviewLoading(false);
		}
	};

	// Handle close preview
	const handleClosePreview = () => {
		setPreviewOpen(false);
		setPreviewFile(null);
		setPreviewData([]);
	};

	return (
		<>
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

							<CardActions
								sx={{ p: 2, pt: 0, justifyContent: 'space-between' }}
							>
								<Tooltip title="Preview">
									<IconButton
										color="primary"
										size="small"
										onClick={() => handlePreviewClick(file)}
									>
										<VisibilityIcon />
									</IconButton>
								</Tooltip>

								<Button
									variant="contained"
									color="primary"
									endIcon={<DownloadIcon />}
									href={`http://localhost:5001${file.path}`}
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

			{/* Preview Dialog */}
			<Dialog
				open={previewOpen}
				onClose={handleClosePreview}
				maxWidth="lg"
				fullWidth
				PaperProps={{
					sx: {
						borderRadius: 2,
						maxHeight: '80vh',
					},
				}}
			>
				<DialogTitle
					sx={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
					}}
				>
					<Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
						{previewFile?.filename}
					</Typography>
					<IconButton onClick={handleClosePreview} size="small">
						<CloseIcon />
					</IconButton>
				</DialogTitle>

				<DialogContent dividers>
					{previewLoading ? (
						<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
							<CircularProgress />
						</Box>
					) : previewData?.headers?.length > 0 ? (
						<TableContainer component={Paper} sx={{ maxHeight: '60vh' }}>
							<Table stickyHeader size="small">
								<TableHead>
									<TableRow>
										{previewData.headers.map((header, index) => (
											<TableCell key={index} sx={{ fontWeight: 'bold' }}>
												{header}
											</TableCell>
										))}
									</TableRow>
								</TableHead>
								<TableBody>
									{previewData.data.slice(0, 100).map((row, rowIndex) => (
										<TableRow key={rowIndex} hover>
											{previewData.headers.map((header, cellIndex) => (
												<TableCell
													key={cellIndex}
													sx={{
														maxWidth: '300px',
														overflow: 'hidden',
														textOverflow: 'ellipsis',
														whiteSpace: 'nowrap',
														'&:hover': {
															whiteSpace: 'normal',
															wordBreak: 'break-word',
														},
													}}
													title={row[header]} // Show full text on hover
												>
													{row[header]}
												</TableCell>
											))}
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableContainer>
					) : (
						<Typography variant="body1" color="text.secondary" align="center">
							No data available or file could not be parsed.
						</Typography>
					)}
				</DialogContent>

				<DialogActions>
					<Button
						onClick={handleClosePreview}
						variant="outlined"
						sx={{ borderRadius: 2 }}
					>
						Close
					</Button>
					<Button
						variant="contained"
						color="primary"
						endIcon={<DownloadIcon />}
						href={
							previewFile ? `http://localhost:5001${previewFile.path}` : '#'
						}
						download
						sx={{ borderRadius: 2 }}
					>
						Download
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
};

export default FileList;
