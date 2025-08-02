import { useState, useEffect, useRef } from 'react';
import {
	Box,
	TextField,
	IconButton,
	Typography,
	CircularProgress,
	Chip,
	Tooltip,
	useTheme,
	Fade,
	Grow,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

const AIChat = ({ files, onNotification }) => {
	const [messages, setMessages] = useState([]);
	const [inputMessage, setInputMessage] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [typingMessage, setTypingMessage] = useState('');
	const [isTyping, setIsTyping] = useState(false);
	const [hasUserInteracted, setHasUserInteracted] = useState(false);
	const messagesEndRef = useRef(null);
	const chatContainerRef = useRef(null);
	const theme = useTheme();

	// Sample questions to help users get started
	const sampleQuestions = [
		'What are the highest value bids currently available?',
		'Which cities have the most construction-related opportunities?',
		'Show me all bids with deadlines in the next 30 days',
		'What types of projects are most common across all cities?',
		'Which opportunities might be best for a small contractor?',
	];

	useEffect(() => {
		// Add welcome message when component mounts
		if (messages.length === 0) {
			const welcomeContent = `Hello! I'm your AI assistant for analyzing bid opportunities. I have access to ${
				files.length
			} bid reports from various Texas cities.

I can help you:
• Find specific types of opportunities
• Analyze bid values and deadlines
• Compare opportunities across cities
• Identify trends and patterns
• Make informed bidding decisions

${
	files.length > 0
		? 'Ask me anything about the bid data!'
		: 'Please run some crawlers first to generate bid data for analysis.'
}`;

			// Simulate typing for welcome message
			simulateTyping(welcomeContent, (content) => {
				setMessages([
					{
						id: 1,
						type: 'ai',
						content: content,
						timestamp: new Date(),
					},
				]);
			});
		}
	}, [files.length]);

	const scrollToBottom = () => {
		// Only scroll if user has interacted with the chat or if they're near the bottom
		if (hasUserInteracted && messagesEndRef.current) {
			messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
		}
	};

	useEffect(() => {
		// Only auto-scroll if user has interacted with the chat
		if (hasUserInteracted) {
			scrollToBottom();
		}
	}, [messages, typingMessage, hasUserInteracted]);

	// Simulate typing effect
	const simulateTyping = (text, onComplete) => {
		setIsTyping(true);
		setTypingMessage('');

		let index = 0;
		const typingSpeed = 15; // faster typing speed

		const typeInterval = setInterval(() => {
			if (index < text.length) {
				// Type multiple characters at once for faster effect
				const charsToAdd = Math.min(2, text.length - index);
				setTypingMessage(text.slice(0, index + charsToAdd));
				index += charsToAdd;
			} else {
				clearInterval(typeInterval);
				setIsTyping(false);
				setTypingMessage('');
				onComplete(text);
			}
		}, typingSpeed);

		// Cleanup function
		return () => clearInterval(typeInterval);
	};

	const sendMessage = async () => {
		if (!inputMessage.trim()) return;

		// Mark that user has interacted with the chat
		setHasUserInteracted(true);

		const userMessage = {
			id: Date.now(),
			type: 'user',
			content: inputMessage,
			timestamp: new Date(),
		};

		setMessages((prev) => [...prev, userMessage]);
		const currentMessage = inputMessage;
		setInputMessage('');
		setIsLoading(true);

		try {
			const response = await fetch('http://localhost:5001/api/ai-chat', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ message: currentMessage }),
			});

			const data = await response.json();

			if (response.ok && data.success) {
				setIsLoading(false);

				// Simulate typing effect for AI response
				simulateTyping(data.response, (content) => {
					const aiMessage = {
						id: Date.now() + 1,
						type: 'ai',
						content: content,
						timestamp: new Date(),
					};
					setMessages((prev) => [...prev, aiMessage]);
				});
			} else {
				setIsLoading(false);
				onNotification(data.error || 'Failed to get AI response', 'error');
			}
		} catch (error) {
			console.error('Error sending message to AI:', error);
			setIsLoading(false);
			onNotification('Failed to connect to AI service', 'error');
		}
	};

	const clearChat = () => {
		const clearMessage = `Chat cleared! I'm ready to help you analyze the ${files.length} bid reports. What would you like to know?`;

		simulateTyping(clearMessage, (content) => {
			setMessages([
				{
					id: 1,
					type: 'ai',
					content: content,
					timestamp: new Date(),
				},
			]);
		});
	};

	const handleKeyPress = (event) => {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		}
	};

	// Enhanced message formatting with better markdown support
	const formatMessage = (content) => {
		// Split content into lines for processing
		const lines = content.split('\n');
		const formattedLines = [];
		let inCodeBlock = false;
		let inList = false;

		lines.forEach((line, index) => {
			let formattedLine = line;

			// Handle code blocks
			if (line.trim().startsWith('```')) {
				inCodeBlock = !inCodeBlock;
				if (inCodeBlock) {
					formattedLines.push(
						<Box
							key={index}
							sx={{
								bgcolor: 'action.hover',
								p: 2,
								borderRadius: 1,
								fontFamily: 'monospace',
								fontSize: '0.9em',
								mt: 1,
								mb: 1,
								border: `1px solid ${theme.palette.divider}`,
							}}
						>
							<Typography variant="body2" component="pre">
								{line.replace('```', '')}
							</Typography>
						</Box>
					);
				}
				return;
			}

			if (inCodeBlock) {
				formattedLines.push(
					<Typography
						key={index}
						variant="body2"
						component="pre"
						sx={{ fontFamily: 'monospace', m: 0 }}
					>
						{line}
					</Typography>
				);
				return;
			}

			// Handle headers
			if (line.startsWith('###')) {
				formattedLines.push(
					<Typography
						key={index}
						variant="h6"
						sx={{ fontWeight: 'bold', mt: 2, mb: 1, color: 'primary.main' }}
					>
						{line.replace('###', '').trim()}
					</Typography>
				);
				return;
			}

			if (line.startsWith('##')) {
				formattedLines.push(
					<Typography
						key={index}
						variant="h5"
						sx={{ fontWeight: 'bold', mt: 2, mb: 1, color: 'primary.main' }}
					>
						{line.replace('##', '').trim()}
					</Typography>
				);
				return;
			}

			// Handle bullet points
			if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
				if (!inList) {
					inList = true;
				}
				formattedLines.push(
					<Box
						key={index}
						sx={{ display: 'flex', alignItems: 'flex-start', mb: 0.5 }}
					>
						<Typography
							sx={{ mr: 1, color: 'primary.main', fontWeight: 'bold' }}
						>
							•
						</Typography>
						<Typography variant="body1">
							{formatInlineText(line.replace(/^[•-]\s*/, ''))}
						</Typography>
					</Box>
				);
				return;
			} else {
				inList = false;
			}

			// Handle numbered lists
			const numberedMatch = line.match(/^\s*(\d+)\.\s*(.+)/);
			if (numberedMatch) {
				formattedLines.push(
					<Box
						key={index}
						sx={{ display: 'flex', alignItems: 'flex-start', mb: 0.5 }}
					>
						<Typography
							sx={{
								mr: 1,
								color: 'primary.main',
								fontWeight: 'bold',
								minWidth: '20px',
							}}
						>
							{numberedMatch[1]}.
						</Typography>
						<Typography variant="body1">
							{formatInlineText(numberedMatch[2])}
						</Typography>
					</Box>
				);
				return;
			}

			// Handle regular paragraphs
			if (line.trim()) {
				formattedLines.push(
					<Typography key={index} variant="body1" sx={{ mb: 1 }}>
						{formatInlineText(line)}
					</Typography>
				);
			} else {
				formattedLines.push(<Box key={index} sx={{ height: '8px' }} />);
			}
		});

		return formattedLines;
	};

	// Format inline text (bold, italic, inline code)
	const formatInlineText = (text) => {
		// Handle inline code
		text = text.replace(/`([^`]+)`/g, (match, code) => {
			return `<code style="background-color: ${theme.palette.action.hover}; padding: 2px 4px; border-radius: 4px; font-family: monospace; font-size: 0.9em;">${code}</code>`;
		});

		// Handle bold text
		text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

		// Handle italic text
		text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');

		return <span dangerouslySetInnerHTML={{ __html: text }} />;
	};

	return (
		<Box
			sx={{
				height: '100vh',
				display: 'flex',
				flexDirection: 'column',
				bgcolor: 'background.default',
				position: 'relative',
			}}
		>
			{/* Header */}
			<Box
				sx={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					p: 2,
					borderBottom: `1px solid ${theme.palette.divider}`,
					bgcolor: 'background.paper',
					position: 'sticky',
					top: 0,
					zIndex: 10,
				}}
			>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
					<TrendingUpIcon
						sx={{ color: theme.palette.primary.main, fontSize: 24 }}
					/>
					<Typography
						variant="h6"
						sx={{
							fontWeight: 600,
							color: 'text.primary',
							fontSize: '18px',
						}}
					>
						AI Bid Analyzer
					</Typography>
					<Chip
						label={`${files.length} Reports`}
						size="small"
						sx={{
							bgcolor:
								files.length > 0
									? theme.palette.primary.main
									: theme.palette.text.disabled,
							color: 'white',
							fontSize: '12px',
							height: '24px',
						}}
					/>
				</Box>
				<Box sx={{ display: 'flex', gap: 1 }}>
					<Tooltip title="Clear Chat">
						<IconButton
							size="small"
							onClick={clearChat}
							sx={{
								color: 'text.secondary',
								'&:hover': { bgcolor: 'action.hover' },
							}}
						>
							<DeleteIcon fontSize="small" />
						</IconButton>
					</Tooltip>
				</Box>
			</Box>

			{/* Messages Container */}
			<Box
				sx={{
					flex: 1,
					overflowY: 'auto',
					display: 'flex',
					flexDirection: 'column',
					bgcolor: 'background.default',
				}}
			>
				{/* Sample Questions (only show when no conversation) */}
				{messages.length <= 1 && !isTyping && (
					<Fade in={true} timeout={1000}>
						<Box
							sx={{
								p: 3,
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								gap: 2,
								maxWidth: '800px',
								mx: 'auto',
								width: '100%',
							}}
						>
							<Typography
								variant="body2"
								sx={{ color: 'text.secondary', mb: 1 }}
							>
								Try asking about your bid data:
							</Typography>
							<Box
								sx={{
									display: 'grid',
									gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
									gap: 2,
									width: '100%',
								}}
							>
								{sampleQuestions.slice(0, 4).map((question, index) => (
									<Grow key={index} in={true} timeout={500 + index * 200}>
										<Box
											onClick={() => {
												setInputMessage(question);
												setHasUserInteracted(true);
											}}
											sx={{
												p: 2,
												border: `1px solid ${theme.palette.divider}`,
												borderRadius: '12px',
												cursor: 'pointer',
												transition: 'all 0.2s ease',
												bgcolor: 'background.paper',
												'&:hover': {
													borderColor: theme.palette.primary.main,
													bgcolor: 'action.hover',
													transform: 'translateY(-2px)',
													boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
												},
											}}
										>
											<Typography
												variant="body2"
												sx={{
													color: 'text.primary',
													fontSize: '14px',
													lineHeight: 1.4,
												}}
											>
												{question}
											</Typography>
										</Box>
									</Grow>
								))}
							</Box>
						</Box>
					</Fade>
				)}

				{/* Messages */}
				<Box sx={{ flex: 1 }}>
					{messages.map((message, index) => (
						<Fade key={message.id} in={true} timeout={500}>
							<Box
								sx={{
									py: 3,
									px: 3,
									borderBottom:
										message.type === 'ai'
											? `1px solid ${theme.palette.divider}`
											: 'none',
									bgcolor:
										message.type === 'ai'
											? 'action.hover'
											: 'background.default',
								}}
							>
								<Box
									sx={{
										maxWidth: '800px',
										mx: 'auto',
										display: 'flex',
										gap: 3,
										alignItems: 'flex-start',
									}}
								>
									{/* Avatar */}
									<Box
										sx={{
											width: 32,
											height: 32,
											borderRadius: '50%',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											bgcolor:
												message.type === 'ai'
													? theme.palette.primary.main
													: theme.palette.text.primary,
											color: 'white',
											flexShrink: 0,
										}}
									>
										{message.type === 'ai' ? (
											<SmartToyIcon sx={{ fontSize: 18 }} />
										) : (
											<PersonIcon sx={{ fontSize: 18 }} />
										)}
									</Box>

									{/* Message Content */}
									<Box sx={{ flex: 1, minWidth: 0 }}>
										<Box
											sx={{
												color: 'text.primary',
												fontSize: '16px',
												lineHeight: 1.6,
												'& strong': { fontWeight: 600 },
												'& em': { fontStyle: 'italic' },
											}}
										>
											{formatMessage(message.content)}
										</Box>
									</Box>
								</Box>
							</Box>
						</Fade>
					))}

					{/* Typing Message */}
					{isTyping && (
						<Box
							sx={{
								py: 3,
								px: 3,
								bgcolor: 'action.hover',
								borderBottom: `1px solid ${theme.palette.divider}`,
							}}
						>
							<Box
								sx={{
									maxWidth: '800px',
									mx: 'auto',
									display: 'flex',
									gap: 3,
									alignItems: 'flex-start',
								}}
							>
								<Box
									sx={{
										width: 32,
										height: 32,
										borderRadius: '50%',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										bgcolor: theme.palette.primary.main,
										color: 'white',
									}}
								>
									<SmartToyIcon sx={{ fontSize: 18 }} />
								</Box>
								<Box sx={{ flex: 1, minWidth: 0 }}>
									<Box
										sx={{
											color: 'text.primary',
											fontSize: '16px',
											lineHeight: 1.6,
											'& strong': { fontWeight: 600 },
											'& em': { fontStyle: 'italic' },
										}}
									>
										{formatMessage(typingMessage)}
										<Box
											component="span"
											sx={{
												display: 'inline-block',
												width: '2px',
												height: '20px',
												bgcolor: 'primary.main',
												ml: 0.5,
												animation: 'blink 1s infinite',
												'@keyframes blink': {
													'0%, 50%': { opacity: 1 },
													'51%, 100%': { opacity: 0 },
												},
											}}
										/>
									</Box>
								</Box>
							</Box>
						</Box>
					)}

					{/* Loading Message */}
					{isLoading && (
						<Box
							sx={{
								py: 3,
								px: 3,
								bgcolor: 'action.hover',
								borderBottom: `1px solid ${theme.palette.divider}`,
							}}
						>
							<Box
								sx={{
									maxWidth: '800px',
									mx: 'auto',
									display: 'flex',
									gap: 3,
									alignItems: 'flex-start',
								}}
							>
								<Box
									sx={{
										width: 32,
										height: 32,
										borderRadius: '50%',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										bgcolor: theme.palette.primary.main,
										color: 'white',
									}}
								>
									<SmartToyIcon sx={{ fontSize: 18 }} />
								</Box>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
									<CircularProgress
										size={16}
										sx={{ color: theme.palette.primary.main }}
									/>
									<Typography
										sx={{ color: 'text.secondary', fontSize: '14px' }}
									>
										Analyzing bid data...
									</Typography>
								</Box>
							</Box>
						</Box>
					)}

					<div ref={messagesEndRef} />
				</Box>
			</Box>

			{/* Input Area */}
			<Box
				sx={{
					p: 3,
					borderTop: `1px solid ${theme.palette.divider}`,
					bgcolor: 'background.paper',
					position: 'sticky',
					bottom: 0,
				}}
			>
				<Box
					sx={{
						maxWidth: '800px',
						mx: 'auto',
						display: 'flex',
						gap: 2,
						alignItems: 'flex-end',
					}}
				>
					<TextField
						fullWidth
						multiline
						maxRows={4}
						placeholder="Ask me about bid opportunities, deadlines, project values, or trends..."
						value={inputMessage}
						onChange={(e) => setInputMessage(e.target.value)}
						onKeyPress={handleKeyPress}
						disabled={isLoading || isTyping}
						variant="outlined"
						sx={{
							'& .MuiOutlinedInput-root': {
								borderRadius: '12px',
								bgcolor: 'background.default',
								'& fieldset': {
									borderColor: theme.palette.divider,
								},
								'&:hover fieldset': {
									borderColor: theme.palette.primary.main,
								},
								'&.Mui-focused fieldset': {
									borderColor: theme.palette.primary.main,
									borderWidth: '2px',
								},
							},
							'& .MuiInputBase-input': {
								fontSize: '16px',
								lineHeight: 1.5,
								py: 1.5,
								color: 'text.primary',
							},
						}}
					/>
					<IconButton
						onClick={sendMessage}
						disabled={!inputMessage.trim() || isLoading || isTyping}
						sx={{
							bgcolor:
								inputMessage.trim() && !isLoading && !isTyping
									? theme.palette.primary.main
									: theme.palette.action.disabled,
							color: 'white',
							width: 40,
							height: 40,
							borderRadius: '8px',
							'&:hover': {
								bgcolor:
									inputMessage.trim() && !isLoading && !isTyping
										? theme.palette.primary.dark
										: theme.palette.action.disabled,
							},
							'&.Mui-disabled': {
								bgcolor: theme.palette.action.disabled,
								color: theme.palette.action.disabledBackground,
							},
						}}
					>
						<SendIcon sx={{ fontSize: 20 }} />
					</IconButton>
				</Box>
			</Box>
		</Box>
	);
};

export default AIChat;
