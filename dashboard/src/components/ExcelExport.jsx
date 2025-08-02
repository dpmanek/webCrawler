import { useState } from 'react';
import {
	Paper,
	Typography,
	Button,
	Box,
	Divider,
	useTheme,
	CircularProgress,
	Tooltip,
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import TableViewIcon from '@mui/icons-material/TableView';

const ExcelExport = ({ files, onNotification, compact = false }) => {
	const [exporting, setExporting] = useState(false);
	const theme = useTheme();

	// Export all CSV files to Excel
	const exportToExcel = async () => {
		if (files.length === 0) {
			onNotification('No CSV files available to export', 'warning');
			return;
		}

		setExporting(true);

		try {
			const response = await fetch('http://localhost:5001/api/export-excel', {
				method: 'POST',
			});

			if (response.ok) {
				// Create a blob from the response
				const blob = await response.blob();

				// Create a download link
				const url = window.URL.createObjectURL(blob);
				const link = document.createElement('a');
				link.href = url;

				// Get filename from response headers or use default
				const contentDisposition = response.headers.get('Content-Disposition');
				const filename = contentDisposition
					? contentDisposition.split('filename=')[1].replace(/"/g, '')
					: `combined_bids_${new Date().toISOString().split('T')[0]}.xlsx`;

				link.download = filename;
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				window.URL.revokeObjectURL(url);

				onNotification('Excel file downloaded successfully!', 'success');
			} else {
				const errorData = await response.json();
				onNotification(`Failed to export Excel: ${errorData.error}`, 'error');
			}
		} catch (error) {
			console.error('Error exporting to Excel:', error);
			onNotification('Error exporting to Excel', 'error');
		} finally {
			setExporting(false);
		}
	};

	// If compact mode, return just the button
	if (compact) {
		return (
			<Tooltip title={`Export all ${files.length} CSV files to Excel`}>
				<Button
					variant="contained"
					color="success"
					onClick={exportToExcel}
					disabled={exporting || files.length === 0}
					startIcon={
						exporting ? (
							<CircularProgress size={16} sx={{ color: 'white' }} />
						) : (
							<FileDownloadIcon />
						)
					}
					sx={{
						borderRadius: 2,
						textTransform: 'none',
						px: 2,
						py: 1,
					}}
				>
					{exporting ? 'Exporting...' : 'Export Excel'}
				</Button>
			</Tooltip>
		);
	}

	// Full tile version (original)
	return (
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
				<TableViewIcon sx={{ mr: 1 }} />
				Excel Export
			</Typography>
			<Divider sx={{ mb: 2 }} />

			<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
				Combine all CSV files into a single Excel workbook with separate sheets
			</Typography>

			<Button
				variant="contained"
				color="success"
				size="large"
				onClick={exportToExcel}
				disabled={exporting || files.length === 0}
				fullWidth
				startIcon={
					exporting ? (
						<CircularProgress size={20} sx={{ color: 'white' }} />
					) : (
						<FileDownloadIcon />
					)
				}
				sx={{
					mb: 2,
					py: 1.5,
					borderRadius: 2,
					boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
					textTransform: 'none',
				}}
			>
				{exporting ? 'Creating Excel File...' : 'Download Combined Excel'}
			</Button>

			<Box
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
				}}
			>
				<Typography variant="body2" color="text.secondary">
					Available Files: <strong>{files.length}</strong>
				</Typography>
				{files.length > 0 && (
					<Typography
						variant="body2"
						color="success.main"
						sx={{ fontWeight: 'bold' }}
					>
						Ready to Export
					</Typography>
				)}
			</Box>

			{files.length === 0 && (
				<Typography
					variant="body2"
					color="text.secondary"
					sx={{ textAlign: 'center', py: 1, fontStyle: 'italic' }}
				>
					Run some crawlers first to generate CSV files
				</Typography>
			)}
		</Paper>
	);
};

export default ExcelExport;
