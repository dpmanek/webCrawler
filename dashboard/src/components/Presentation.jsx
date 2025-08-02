import { useState, useEffect } from 'react';
import {
	Box,
	IconButton,
	Typography,
	useTheme,
	Fade,
	Grow,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import HomeIcon from '@mui/icons-material/Home';
import LastPageIcon from '@mui/icons-material/LastPage';

const Presentation = () => {
	const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
	const theme = useTheme();

	const slides = [
		// Slide 1: Title
		{
			id: 'title',
			type: 'title',
			content: (
				<Box sx={{ textAlign: 'center', color: 'white' }}>
					<Typography variant="h2" sx={{ fontWeight: 700, mb: 3 }}>
						🕷️ Web Crawler Dashboard
					</Typography>
					<Typography variant="h5" sx={{ opacity: 0.9, mb: 4 }}>
						Automated Bid Opportunity Intelligence Platform
					</Typography>
					<Typography variant="h6" sx={{ opacity: 0.8 }}>
						Comprehensive Solution for Texas Municipal Bid Monitoring
					</Typography>
				</Box>
			),
		},
		// Slide 2: Problem Statement
		{
			id: 'problem',
			type: 'content',
			title: '🎯 Problem Statement',
			content: (
				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
						gap: 3,
						maxWidth: '1200px',
					}}
				>
					{[
						{
							icon: '⏰',
							title: 'Time-Consuming Manual Process',
							desc: 'Contractors spend hours daily checking multiple city websites for new bid opportunities',
						},
						{
							icon: '❌',
							title: 'Missed Opportunities',
							desc: 'Important deadlines and high-value projects often go unnoticed due to scattered information',
						},
						{
							icon: '📊',
							title: 'Lack of Analytics',
							desc: 'No centralized way to analyze trends, compare opportunities, or make data-driven decisions',
						},
					].map((item, index) => (
						<Grow key={index} in={true} timeout={500 + index * 200}>
							<Box
								sx={{
									background: 'white',
									border: '2px solid #3498db',
									borderRadius: '15px',
									padding: '30px',
									textAlign: 'center',
									boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
									transition: 'transform 0.3s ease',
									'&:hover': { transform: 'translateY(-5px)' },
								}}
							>
								<Typography sx={{ fontSize: '3rem', mb: 2 }}>
									{item.icon}
								</Typography>
								<Typography
									variant="h6"
									sx={{ fontWeight: 600, color: '#3498db', mb: 2 }}
								>
									{item.title}
								</Typography>
								<Typography variant="body1">{item.desc}</Typography>
							</Box>
						</Grow>
					))}
				</Box>
			),
		},
		// Slide 3: Solution Overview
		{
			id: 'solution',
			type: 'content',
			title: '💡 Our Solution',
			content: (
				<Box sx={{ textAlign: 'center' }}>
					<Typography variant="h6" sx={{ mb: 4, maxWidth: '800px' }}>
						An intelligent, automated web crawler dashboard that monitors{' '}
						<Box
							component="span"
							sx={{
								background: 'linear-gradient(120deg, #a8edea 0%, #fed6e3 100%)',
								padding: '2px 8px',
								borderRadius: '4px',
								fontWeight: 600,
							}}
						>
							16+ Texas cities
						</Box>{' '}
						for bid opportunities in real-time
					</Typography>

					<Box
						sx={{
							display: 'flex',
							justifyContent: 'space-around',
							maxWidth: '1000px',
							flexWrap: 'wrap',
							gap: 2,
						}}
					>
						{[
							{ number: '16+', label: 'Cities Monitored' },
							{ number: '24/7', label: 'Automated Monitoring' },
							{ number: '100%', label: 'Coverage Accuracy' },
							{ number: 'AI', label: 'Powered Analytics' },
						].map((stat, index) => (
							<Box key={index} sx={{ textAlign: 'center', padding: '20px' }}>
								<Typography
									sx={{
										fontSize: '3rem',
										fontWeight: 700,
										color: '#e74c3c',
										display: 'block',
									}}
								>
									{stat.number}
								</Typography>
								<Typography
									sx={{
										fontSize: '1.2rem',
										color: '#7f8c8d',
										marginTop: '10px',
									}}
								>
									{stat.label}
								</Typography>
							</Box>
						))}
					</Box>
				</Box>
			),
		},
		// Slide 4: Key Features
		{
			id: 'features',
			type: 'content',
			title: '🚀 Key Features',
			content: (
				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
						gap: 3,
						maxWidth: '1200px',
					}}
				>
					{[
						{
							icon: '🗺️',
							title: 'Interactive Map',
							desc: 'Visual representation of all monitored cities with one-click crawler execution',
						},
						{
							icon: '⏰',
							title: 'Smart Scheduling',
							desc: 'Automated recurring crawls with flexible scheduling options',
						},
						{
							icon: '🤖',
							title: 'AI Chat Assistant',
							desc: 'Natural language queries for bid analysis and insights',
						},
						{
							icon: '📊',
							title: 'Excel Export',
							desc: 'Comprehensive data export for further analysis and reporting',
						},
					].map((item, index) => (
						<Grow key={index} in={true} timeout={500 + index * 200}>
							<Box
								sx={{
									background: 'white',
									border: '2px solid #3498db',
									borderRadius: '15px',
									padding: '30px',
									textAlign: 'center',
									boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
									transition: 'transform 0.3s ease',
									'&:hover': { transform: 'translateY(-5px)' },
								}}
							>
								<Typography sx={{ fontSize: '3rem', mb: 2 }}>
									{item.icon}
								</Typography>
								<Typography
									variant="h6"
									sx={{ fontWeight: 600, color: '#3498db', mb: 2 }}
								>
									{item.title}
								</Typography>
								<Typography variant="body1">{item.desc}</Typography>
							</Box>
						</Grow>
					))}
				</Box>
			),
		},
		// Slide 5: Technical Architecture
		{
			id: 'architecture',
			type: 'content',
			title: '🏗️ Technical Architecture',
			content: (
				<Box sx={{ textAlign: 'center' }}>
					<Box
						sx={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							mb: 4,
							maxWidth: '1000px',
							flexWrap: 'wrap',
							gap: 2,
						}}
					>
						{[
							'React Dashboard\nFrontend',
							'Node.js\nBackend API',
							'Puppeteer\nWeb Crawlers',
							'AI Analysis\nEngine',
						].map((component, index) => (
							<Box key={index} sx={{ display: 'flex', alignItems: 'center' }}>
								<Box
									sx={{
										background: 'linear-gradient(135deg, #3498db, #2980b9)',
										color: 'white',
										padding: '20px',
										borderRadius: '10px',
										textAlign: 'center',
										minWidth: '150px',
										fontWeight: 600,
										whiteSpace: 'pre-line',
									}}
								>
									{component}
								</Box>
								{index < 3 && (
									<Typography
										sx={{
											fontSize: '2rem',
											color: '#3498db',
											margin: '0 20px',
										}}
									>
										→
									</Typography>
								)}
							</Box>
						))}
					</Box>

					<Box
						sx={{
							display: 'grid',
							gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
							gap: 2,
							maxWidth: '1000px',
						}}
					>
						{[
							'React + Material-UI',
							'Node.js + Express',
							'Puppeteer Automation',
							'AI/ML Integration',
							'CSV Data Export',
							'Real-time Updates',
						].map((tech, index) => (
							<Box
								key={index}
								sx={{
									background:
										'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
									color: 'white',
									padding: '20px',
									borderRadius: '10px',
									textAlign: 'center',
									fontWeight: 600,
									boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
								}}
							>
								{tech}
							</Box>
						))}
					</Box>
				</Box>
			),
		},
		// Slide 6: Business Benefits
		{
			id: 'benefits',
			type: 'content',
			title: '💼 Business Benefits',
			content: (
				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
						gap: 2,
						maxWidth: '1000px',
					}}
				>
					{[
						{
							icon: '⏱️',
							title: 'Time Savings',
							desc: 'Reduce manual research from hours to minutes daily',
						},
						{
							icon: '📈',
							title: 'Increased Revenue',
							desc: 'Never miss high-value opportunities again',
						},
						{
							icon: '🎯',
							title: 'Better Targeting',
							desc: 'AI-driven insights for strategic bidding',
						},
						{
							icon: '📊',
							title: 'Data-Driven Decisions',
							desc: 'Comprehensive analytics for market intelligence',
						},
						{
							icon: '🔄',
							title: 'Automation',
							desc: 'Set-and-forget monitoring with smart alerts',
						},
						{
							icon: '📱',
							title: 'Accessibility',
							desc: 'Access from anywhere with responsive web design',
						},
					].map((benefit, index) => (
						<Grow key={index} in={true} timeout={500 + index * 100}>
							<Box
								sx={{
									background: 'linear-gradient(135deg, #2ecc71, #27ae60)',
									color: 'white',
									padding: '20px',
									borderRadius: '10px',
									textAlign: 'center',
									fontWeight: 600,
								}}
							>
								<Typography variant="h6" sx={{ mb: 1 }}>
									{benefit.icon} {benefit.title}
								</Typography>
								<Typography variant="body2">{benefit.desc}</Typography>
							</Box>
						</Grow>
					))}
				</Box>
			),
		},
		// Slide 7: ROI & Value Proposition
		{
			id: 'roi',
			type: 'content',
			title: '💰 ROI & Value Proposition',
			content: (
				<Box sx={{ textAlign: 'center' }}>
					<Box
						sx={{
							display: 'flex',
							justifyContent: 'space-around',
							mb: 4,
							maxWidth: '1000px',
							flexWrap: 'wrap',
							gap: 2,
						}}
					>
						{[
							{ number: '90%', label: 'Time Reduction' },
							{ number: '24/7', label: 'Monitoring' },
							{ number: '100%', label: 'Coverage' },
							{ number: '$0', label: 'Missed Opportunities' },
						].map((stat, index) => (
							<Box key={index} sx={{ textAlign: 'center', padding: '20px' }}>
								<Typography
									sx={{
										fontSize: '3rem',
										fontWeight: 700,
										color: '#e74c3c',
										display: 'block',
									}}
								>
									{stat.number}
								</Typography>
								<Typography
									sx={{
										fontSize: '1.2rem',
										color: '#7f8c8d',
										marginTop: '10px',
									}}
								>
									{stat.label}
								</Typography>
							</Box>
						))}
					</Box>

					<Box
						sx={{
							background: '#f8f9fa',
							borderRadius: '15px',
							padding: '30px',
							maxWidth: '1000px',
							textAlign: 'left',
						}}
					>
						<Typography
							variant="h6"
							sx={{ mb: 2, fontWeight: 600, color: '#3498db' }}
						>
							Cost-Benefit Analysis:
						</Typography>
						<Box component="ul" sx={{ fontSize: '1.2rem', lineHeight: 1.8 }}>
							<li>
								<strong>Manual Process:</strong> 2-3 hours daily × $50/hour =
								$100-150/day
							</li>
							<li>
								<strong>Automated Solution:</strong> 5 minutes daily × $50/hour
								= $4/day
							</li>
							<li>
								<strong>Daily Savings:</strong> $96-146 per day
							</li>
							<li>
								<strong>Annual Savings:</strong> $35,000-53,000 per year
							</li>
							<li>
								<strong>Plus:</strong> Zero missed opportunities, better data
								insights, competitive advantage
							</li>
						</Box>
					</Box>
				</Box>
			),
		},
		// Slide 8: Q&A
		{
			id: 'qa',
			type: 'content',
			title: '❓ Questions & Discussion',
			content: (
				<Box sx={{ textAlign: 'center' }}>
					<Box
						sx={{
							display: 'grid',
							gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
							gap: 3,
							maxWidth: '1200px',
							mb: 4,
						}}
					>
						{[
							{
								icon: '💡',
								title: 'Technical Questions',
								desc: 'Architecture, scalability, integration possibilities',
							},
							{
								icon: '💼',
								title: 'Business Applications',
								desc: 'Use cases, ROI, implementation timeline',
							},
							{
								icon: '🚀',
								title: 'Future Enhancements',
								desc: 'Roadmap, feature requests, customizations',
							},
						].map((item, index) => (
							<Grow key={index} in={true} timeout={500 + index * 200}>
								<Box
									sx={{
										background: 'white',
										border: '2px solid #3498db',
										borderRadius: '15px',
										padding: '30px',
										textAlign: 'center',
										boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
										transition: 'transform 0.3s ease',
										'&:hover': { transform: 'translateY(-5px)' },
									}}
								>
									<Typography sx={{ fontSize: '3rem', mb: 2 }}>
										{item.icon}
									</Typography>
									<Typography
										variant="h6"
										sx={{ fontWeight: 600, color: '#3498db', mb: 2 }}
									>
										{item.title}
									</Typography>
									<Typography variant="body1">{item.desc}</Typography>
								</Box>
							</Grow>
						))}
					</Box>

					<Box>
						<Typography
							variant="h5"
							sx={{ color: '#3498db', fontWeight: 600, mb: 2 }}
						>
							Thank you for your attention!
						</Typography>
						<Typography variant="h6">
							Ready to revolutionize your bid monitoring process?
						</Typography>
					</Box>
				</Box>
			),
		},
	];

	const showSlide = (index) => {
		if (index >= 0 && index < slides.length) {
			setCurrentSlideIndex(index);
		}
	};

	const changeSlide = (direction) => {
		const newIndex = currentSlideIndex + direction;
		showSlide(newIndex);
	};

	// Keyboard navigation
	useEffect(() => {
		const handleKeyDown = (event) => {
			if (event.key === 'ArrowRight' || event.key === ' ') {
				event.preventDefault();
				changeSlide(1);
			} else if (event.key === 'ArrowLeft') {
				event.preventDefault();
				changeSlide(-1);
			} else if (event.key === 'Home') {
				event.preventDefault();
				showSlide(0);
			} else if (event.key === 'End') {
				event.preventDefault();
				showSlide(slides.length - 1);
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [currentSlideIndex, slides.length]);

	const currentSlide = slides[currentSlideIndex];

	return (
		<Box
			sx={{
				height: '100vh',
				display: 'flex',
				flexDirection: 'column',
				background:
					currentSlide.type === 'title'
						? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
						: 'white',
				position: 'relative',
				overflow: 'hidden',
			}}
		>
			{/* Slide Content */}
			<Box
				sx={{
					flex: 1,
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
					alignItems: 'center',
					padding: '60px',
					textAlign: 'center',
				}}
			>
				<Fade key={currentSlideIndex} in={true} timeout={500}>
					<Box
						sx={{
							width: '100%',
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
						}}
					>
						{currentSlide.title && (
							<Typography
								variant="h3"
								sx={{
									fontWeight: 600,
									color: '#34495e',
									mb: 4,
									textAlign: 'center',
								}}
							>
								{currentSlide.title}
							</Typography>
						)}
						{currentSlide.content}
					</Box>
				</Fade>
			</Box>

			{/* Navigation Controls */}
			<Box
				sx={{
					position: 'absolute',
					bottom: 30,
					right: 30,
					display: 'flex',
					gap: 2,
					zIndex: 1000,
				}}
			>
				<IconButton
					onClick={() => showSlide(0)}
					disabled={currentSlideIndex === 0}
					sx={{
						background: '#3498db',
						color: 'white',
						'&:hover': { background: '#2980b9' },
						'&.Mui-disabled': { background: '#bdc3c7', color: '#ecf0f1' },
					}}
				>
					<HomeIcon />
				</IconButton>
				<IconButton
					onClick={() => changeSlide(-1)}
					disabled={currentSlideIndex === 0}
					sx={{
						background: '#3498db',
						color: 'white',
						'&:hover': { background: '#2980b9' },
						'&.Mui-disabled': { background: '#bdc3c7', color: '#ecf0f1' },
					}}
				>
					<ArrowBackIcon />
				</IconButton>
				<IconButton
					onClick={() => changeSlide(1)}
					disabled={currentSlideIndex === slides.length - 1}
					sx={{
						background: '#3498db',
						color: 'white',
						'&:hover': { background: '#2980b9' },
						'&.Mui-disabled': { background: '#bdc3c7', color: '#ecf0f1' },
					}}
				>
					<ArrowForwardIcon />
				</IconButton>
				<IconButton
					onClick={() => showSlide(slides.length - 1)}
					disabled={currentSlideIndex === slides.length - 1}
					sx={{
						background: '#3498db',
						color: 'white',
						'&:hover': { background: '#2980b9' },
						'&.Mui-disabled': { background: '#bdc3c7', color: '#ecf0f1' },
					}}
				>
					<LastPageIcon />
				</IconButton>
			</Box>

			{/* Slide Counter */}
			<Box
				sx={{
					position: 'absolute',
					bottom: 30,
					left: 30,
					background: 'rgba(0,0,0,0.7)',
					color: 'white',
					padding: '10px 20px',
					borderRadius: '20px',
					fontWeight: 600,
				}}
			>
				{currentSlideIndex + 1} / {slides.length}
			</Box>
		</Box>
	);
};

export default Presentation;
