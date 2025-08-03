import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
	Box,
	Paper,
	Typography,
	Button,
	Chip,
	CircularProgress,
	Divider,
	useTheme,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LaunchIcon from '@mui/icons-material/Launch';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
	iconRetinaUrl:
		'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
	iconUrl:
		'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
	shadowUrl:
		'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icon for crawler locations
const createCustomIcon = (color = '#1976d2') => {
	return L.divIcon({
		className: 'custom-marker',
		html: `
			<div style="
				background-color: ${color};
				width: 25px;
				height: 25px;
				border-radius: 50%;
				border: 3px solid white;
				box-shadow: 0 2px 8px rgba(0,0,0,0.3);
				display: flex;
				align-items: center;
				justify-content: center;
			">
				<div style="
					color: white;
					font-size: 12px;
					font-weight: bold;
				">📍</div>
			</div>
		`,
		iconSize: [25, 25],
		iconAnchor: [12.5, 12.5],
	});
};

// Texas city/county coordinates
const crawlerLocations = {
	'texas-city': { lat: 29.3838, lng: -94.9027, name: 'Texas City' },
	'san-antonio': { lat: 29.4241, lng: -98.4936, name: 'San Antonio' },
	'tomball-isd': { lat: 30.0972, lng: -95.616, name: 'Tomball ISD' },
	'league-city': { lat: 29.5074, lng: -95.0949, name: 'League City' },
	'alvin-texas': { lat: 29.4238, lng: -95.2441, name: 'Alvin' },
	'port-arthur': { lat: 29.8849, lng: -93.9396, name: 'Port Arthur' },
	'san-marcos': { lat: 29.8833, lng: -97.9414, name: 'San Marcos' },
	'dayton-texas': { lat: 30.0469, lng: -94.8852, name: 'Dayton' },
	'mont-belvieu': { lat: 29.8455, lng: -94.8852, name: 'Mont Belvieu' },
	'lake-jackson': { lat: 29.0338, lng: -95.4344, name: 'Lake Jackson' },
	'galveston-texas': { lat: 29.3013, lng: -94.7977, name: 'Galveston' },
	'huntsville-texas': { lat: 30.7235, lng: -95.5508, name: 'Huntsville' },
	'brazos-valley': { lat: 30.628, lng: -96.3344, name: 'Brazos Valley' },
	anderson: { lat: 30.491, lng: -95.9944, name: 'Anderson' },
	cleveland: { lat: 30.3416, lng: -95.0855, name: 'Cleveland' },
	'waller-county': { lat: 30.0666, lng: -95.9277, name: 'Waller County' },
	'belton-texas': { lat: 31.056, lng: -97.4642, name: 'Belton' },
	'pasadena-texas': { lat: 29.6911, lng: -95.2091, name: 'Pasadena' },
	'wharton-county': { lat: 29.3119, lng: -96.1027, name: 'Wharton County' },
	'caldwell-county': { lat: 29.8688, lng: -97.6689, name: 'Caldwell County' },
};

const CrawlerMap = ({ crawlers, onRunCrawler, loading, runningCrawler }) => {
	const [selectedCrawler, setSelectedCrawler] = useState(null);
	const theme = useTheme();

	// Center the map on Texas
	const texasCenter = [30.2672, -97.7431]; // Austin, TX
	const zoomLevel = 7;

	const handleMarkerClick = (crawlerId) => {
		const crawler = crawlers.find((c) => c.id === crawlerId);
		setSelectedCrawler(crawler);
	};

	const handleRunCrawler = (crawlerId) => {
		onRunCrawler(crawlerId);
		setSelectedCrawler(null);
	};

	const getMarkerColor = (crawlerId) => {
		if (runningCrawler === crawlerId) return '#ff9800'; // Orange for running
		return '#1976d2'; // Blue for idle
	};

	return (
		<Box sx={{ height: '100%', position: 'relative' }}>
			<Paper
				sx={{
					height: 550,
					borderRadius: 2,
					overflow: 'hidden',
					boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
				}}
			>
				<MapContainer
					center={texasCenter}
					zoom={zoomLevel}
					style={{ height: '100%', width: '100%' }}
					scrollWheelZoom={true}
				>
					<TileLayer
						attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
						url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
					/>

					{crawlers.map((crawler) => {
						const location = crawlerLocations[crawler.id];
						if (!location) return null;

						return (
							<Marker
								key={crawler.id}
								position={[location.lat, location.lng]}
								icon={createCustomIcon(getMarkerColor(crawler.id))}
								eventHandlers={{
									click: () => handleMarkerClick(crawler.id),
								}}
							>
								<Popup>
									<Box sx={{ minWidth: 200, p: 1 }}>
										<Typography variant="h6" gutterBottom>
											{crawler.name}
										</Typography>
										<Typography
											variant="body2"
											color="text.secondary"
											gutterBottom
										>
											{location.name}, Texas
										</Typography>
										<Divider sx={{ my: 1 }} />
										<Box
											sx={{
												display: 'flex',
												alignItems: 'center',
												gap: 1,
												mb: 1,
											}}
										>
											<Chip
												size="small"
												label={
													runningCrawler === crawler.id ? 'Running' : 'Ready'
												}
												color={
													runningCrawler === crawler.id ? 'warning' : 'success'
												}
												variant="outlined"
											/>
										</Box>
										<Box
											sx={{
												display: 'flex',
												flexDirection: 'column',
												gap: 1,
												mt: 1,
											}}
										>
											<Button
												variant="contained"
												size="small"
												startIcon={
													runningCrawler === crawler.id ? (
														<CircularProgress size={16} color="inherit" />
													) : (
														<PlayArrowIcon />
													)
												}
												onClick={() => handleRunCrawler(crawler.id)}
												disabled={loading}
												fullWidth
											>
												{runningCrawler === crawler.id
													? 'Running...'
													: 'Run Crawler'}
											</Button>

											{crawler.url && (
												<Button
													variant="outlined"
													size="small"
													startIcon={<LaunchIcon />}
													onClick={() => window.open(crawler.url, '_blank')}
													fullWidth
													sx={{ textTransform: 'none' }}
												>
													Visit Bid Page
												</Button>
											)}
										</Box>
									</Box>
								</Popup>
							</Marker>
						);
					})}
				</MapContainer>
			</Paper>

			{/* Legend */}
			<Paper
				sx={{
					position: 'absolute',
					top: 16,
					right: 16,
					p: 2,
					minWidth: 200,
					backgroundColor: 'rgba(255, 255, 255, 0.95)',
					backdropFilter: 'blur(10px)',
				}}
			>
				<Typography
					variant="h6"
					gutterBottom
					sx={{ display: 'flex', alignItems: 'center' }}
				>
					<LocationOnIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
					Crawler Locations
				</Typography>
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
						<Box
							sx={{
								width: 16,
								height: 16,
								borderRadius: '50%',
								backgroundColor: '#1976d2',
								border: '2px solid white',
								boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
							}}
						/>
						<Typography variant="body2">Ready</Typography>
					</Box>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
						<Box
							sx={{
								width: 16,
								height: 16,
								borderRadius: '50%',
								backgroundColor: '#ff9800',
								border: '2px solid white',
								boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
							}}
						/>
						<Typography variant="body2">Running</Typography>
					</Box>
				</Box>
				<Divider sx={{ my: 1 }} />
				<Typography variant="body2" color="text.secondary">
					Click on any pin to run that crawler
				</Typography>
			</Paper>

			{/* Stats */}
			<Paper
				sx={{
					position: 'absolute',
					bottom: 16,
					left: 16,
					p: 2,
					backgroundColor: 'rgba(255, 255, 255, 0.95)',
					backdropFilter: 'blur(10px)',
				}}
			>
				<Typography variant="body2" color="text.secondary">
					Total Crawlers: <strong>{crawlers.length}</strong>
				</Typography>
				<Typography variant="body2" color="text.secondary">
					Active: <strong>{runningCrawler ? 1 : 0}</strong>
				</Typography>
			</Paper>
		</Box>
	);
};

export default CrawlerMap;
