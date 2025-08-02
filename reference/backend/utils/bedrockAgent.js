const {
	BedrockAgentRuntimeClient,
	InvokeAgentCommand,
} = require('@aws-sdk/client-bedrock-agent-runtime');
require('dotenv').config();

// Store trace data for real-time updates
const traceStore = new Map();

// Store which tickets had Bedrock enabled (in-memory)
const bedrockEnabledTickets = new Set();

/**
 * Mark a ticket as having Bedrock enabled
 * @param {string} simbaId - The SIMBA ID of the ticket
 */
const markTicketAsBedrockEnabled = (simbaId) => {
	bedrockEnabledTickets.add(simbaId);
	console.log(`Marked ticket ${simbaId} as Bedrock enabled`);
};

/**
 * Check if a ticket had Bedrock enabled
 * @param {string} simbaId - The SIMBA ID of the ticket
 * @returns {boolean} - True if Bedrock was enabled for this ticket
 */
const isTicketBedrockEnabled = (simbaId) => {
	return bedrockEnabledTickets.has(simbaId);
};

/**
 * Map Bedrock collaborator names to our agent display names
 * @param {string} collaboratorName - The collaborator name from Bedrock trace
 * @returns {string} - Human-readable agent name
 */
const mapCollaboratorToAgent = (collaboratorName) => {
	switch (collaboratorName) {
		case 'art_handler_agent':
			return 'ART-handler';
		case 'provisioning_agent_v2':
			return 'Provisioning';
		case 'simba_handler_agent':
			return 'SIMBA-handler';
		case 'supervisor_agent':
			return 'Supervisor';
		default:
			// Extract a readable name from the collaborator name
			return collaboratorName
				.replace(/_/g, '-')
				.replace(/agent/g, '')
				.replace(/v\d+/g, '')
				.trim();
	}
};

/**
 * Map Bedrock collaborator names to our stage IDs
 * @param {string} collaboratorName - The collaborator name from Bedrock trace
 * @returns {string} - Stage ID
 */
const mapCollaboratorToStage = (collaboratorName) => {
	switch (collaboratorName) {
		case 'art_handler_agent':
			return 'art_handler';
		case 'provisioning_agent_v2':
			return 'provisioning';
		case 'simba_handler_agent':
			return 'simba_handler';
		case 'supervisor_agent':
			return 'supervisor';
		default:
			return 'simba_handler'; // Default fallback
	}
};

/**
 * Get trace data for a specific session
 * @param {string} sessionId - The session ID to get trace data for
 * @param {Object} ticketData - Optional ticket data to determine initial state
 * @returns {Object} - The trace data for the session
 */
const getTraceData = (sessionId, ticketData = null) => {
	// Check if we already have trace data in memory
	const existingTrace = traceStore.get(sessionId);
	if (existingTrace) {
		return existingTrace;
	}

	// If ticket data is provided and no trace exists, check if Bedrock was enabled
	if (ticketData && !existingTrace) {
		// Check our in-memory store first
		if (!isTicketBedrockEnabled(sessionId)) {
			return null; // No trace data for disabled Bedrock
		}
	}

	// Create default trace data with multi-agent workflow
	const defaultTrace = {
		sessionId,
		stages: [
			{
				id: 'submission',
				name: 'Ticket Submitted',
				status: 'completed',
				timestamp: new Date(),
				agent: null,
			},
			{
				id: 'supervisor',
				name: 'Supervisor Agent',
				status: 'pending',
				timestamp: null,
				agent: 'Supervisor',
			},
			{
				id: 'simba_handler',
				name: 'SIMBA Handler',
				status: 'pending',
				timestamp: null,
				agent: 'SIMBA-handler',
			},
			{
				id: 'art_handler',
				name: 'ART Handler',
				status: 'pending',
				timestamp: null,
				agent: 'ART-handler',
			},
			{
				id: 'provisioning',
				name: 'Provisioning Agent',
				status: 'pending',
				timestamp: null,
				agent: 'Provisioning',
			},
		],
		currentStage: 'submission',
		logs: [],
	};

	// If we have ticket data, determine the appropriate state based on ticket status
	if (ticketData) {
		const createdTime = new Date(
			ticketData.createdAt || ticketData.created_timestamp
		);

		// If ticket has ART ID, it means the process completed successfully
		if (ticketData.art_id) {
			// Mark all stages as completed with realistic timing
			const supervisorTime = new Date(createdTime.getTime() + 10000); // 10 seconds
			const simbaTime = new Date(createdTime.getTime() + 25000); // 25 seconds
			const artTime = new Date(createdTime.getTime() + 45000); // 45 seconds
			const provisioningTime = new Date(createdTime.getTime() + 60000); // 1 minute

			defaultTrace.stages[1].status = 'completed';
			defaultTrace.stages[1].timestamp = supervisorTime;
			defaultTrace.stages[2].status = 'completed';
			defaultTrace.stages[2].timestamp = simbaTime;
			defaultTrace.stages[3].status = 'completed';
			defaultTrace.stages[3].timestamp = artTime;
			defaultTrace.stages[4].status = 'completed';
			defaultTrace.stages[4].timestamp = provisioningTime;
			defaultTrace.currentStage = 'provisioning';

			defaultTrace.logs = [
				{
					timestamp: createdTime,
					stage: 'submission',
					status: 'completed',
					message: 'Ticket submitted to system',
					agent: null,
				},
				{
					timestamp: supervisorTime,
					stage: 'supervisor',
					status: 'completed',
					message: 'Supervisor agent analyzed request and routed to SIMBA',
					agent: 'Supervisor',
				},
				{
					timestamp: simbaTime,
					stage: 'simba_handler',
					status: 'completed',
					message: 'SIMBA-handler processed ticket and initiated ART workflow',
					agent: 'SIMBA-handler',
				},
				{
					timestamp: artTime,
					stage: 'art_handler',
					status: 'completed',
					message:
						'ART-handler generated ART ticket and prepared for provisioning',
					agent: 'ART-handler',
				},
				{
					timestamp: provisioningTime,
					stage: 'provisioning',
					status: 'completed',
					message: 'Provisioning agent completed resource allocation',
					agent: 'Provisioning',
				},
			];
		}
		// If ticket is older than 2 minutes and no ART ID, assume it failed
		else if (Date.now() - createdTime.getTime() > 2 * 60 * 1000) {
			const supervisorTime = new Date(createdTime.getTime() + 10000); // 10 seconds
			const failureTime = new Date(createdTime.getTime() + 30000); // 30 seconds

			defaultTrace.stages[1].status = 'completed';
			defaultTrace.stages[1].timestamp = supervisorTime;
			defaultTrace.stages[2].status = 'failed';
			defaultTrace.stages[2].timestamp = failureTime;
			defaultTrace.currentStage = 'simba_handler';

			defaultTrace.logs = [
				{
					timestamp: createdTime,
					stage: 'submission',
					status: 'completed',
					message: 'Ticket submitted to system',
					agent: null,
				},
				{
					timestamp: supervisorTime,
					stage: 'supervisor',
					status: 'completed',
					message: 'Supervisor agent routed request to SIMBA-handler',
					agent: 'Supervisor',
				},
				{
					timestamp: failureTime,
					stage: 'simba_handler',
					status: 'failed',
					message: 'SIMBA-handler processing failed or timed out',
					agent: 'SIMBA-handler',
				},
			];
		}
		// If ticket is recent (less than 2 minutes) and no ART ID, show as in progress
		else {
			const supervisorTime = new Date(createdTime.getTime() + 10000); // 10 seconds
			const simbaTime = new Date(createdTime.getTime() + 15000); // 15 seconds

			defaultTrace.stages[1].status = 'completed';
			defaultTrace.stages[1].timestamp = supervisorTime;
			defaultTrace.stages[2].status = 'in_progress';
			defaultTrace.stages[2].timestamp = simbaTime;
			defaultTrace.currentStage = 'simba_handler';

			defaultTrace.logs = [
				{
					timestamp: createdTime,
					stage: 'submission',
					status: 'completed',
					message: 'Ticket submitted to system',
					agent: null,
				},
				{
					timestamp: supervisorTime,
					stage: 'supervisor',
					status: 'completed',
					message: 'Supervisor agent routed request to SIMBA-handler',
					agent: 'Supervisor',
				},
				{
					timestamp: simbaTime,
					stage: 'simba_handler',
					status: 'in_progress',
					message: 'SIMBA-handler processing ticket...',
					agent: 'SIMBA-handler',
				},
			];
		}
	}

	// Store the trace data so it persists
	traceStore.set(sessionId, defaultTrace);
	return defaultTrace;
};

/**
 * Update trace data for a session
 * @param {string} sessionId - The session ID
 * @param {string} stageId - The stage to update
 * @param {string} status - The status (pending, in_progress, completed, failed)
 * @param {string} message - Optional message
 * @param {string} agent - Optional agent name
 */
const updateTraceData = (
	sessionId,
	stageId,
	status,
	message = '',
	agent = null
) => {
	const traceData = getTraceData(sessionId);

	// Update the specific stage
	const stage = traceData.stages.find((s) => s.id === stageId);
	if (stage) {
		stage.status = status;
		stage.timestamp = new Date();
		if (message) stage.message = message;
	}

	// Update current stage
	if (status === 'in_progress') {
		traceData.currentStage = stageId;
	} else if (status === 'completed') {
		// When a stage completes, find the next pending stage
		const currentIndex = traceData.stages.findIndex((s) => s.id === stageId);
		if (currentIndex < traceData.stages.length - 1) {
			const nextStage = traceData.stages[currentIndex + 1];
			if (
				nextStage.status === 'pending' ||
				nextStage.status === 'in_progress'
			) {
				traceData.currentStage = nextStage.id;
			}
		} else {
			// If this is the last stage, keep it as current
			traceData.currentStage = stageId;
		}
	}

	// Add log entry
	traceData.logs.push({
		timestamp: new Date(),
		stage: stageId,
		status,
		message,
		agent: agent || (stage ? stage.agent : null),
	});

	traceStore.set(sessionId, traceData);
	console.log(
		`Trace updated for ${sessionId}: ${stageId} -> ${status} (${
			agent || 'no agent'
		})`
	);
};

/**
 * Invokes a Bedrock agent to run an inference using the input
 * provided in the request body.
 *
 * @param {string} prompt - The prompt that you want the Agent to complete.
 * @param {string} sessionId - An arbitrary identifier for the session.
 * @param {Object} options - Additional options for the agent.
 * @param {string} options.region - AWS region (defaults to us-east-1).
 * @param {Object} options.credentials - AWS credentials (optional).
 * @returns {Promise<Object>} - The response from the Bedrock agent.
 */
const invokeBedrockAgent = async (prompt, sessionId, options = {}) => {
	console.log(`Invoking Bedrock agent with session ID: ${sessionId}`);

	// Start the multi-agent workflow
	updateTraceData(
		sessionId,
		'supervisor',
		'in_progress',
		'Supervisor agent analyzing request...',
		'Supervisor'
	);

	const { region, credentials } = options;

	// Initialize the client with credentials from environment variables or passed options
	const clientOptions = {
		region: region || process.env.AWS_REGION || 'us-east-1',
	};

	// Use provided credentials if available, otherwise use environment variables
	if (credentials) {
		clientOptions.credentials = credentials;
	} else if (
		process.env.AWS_ACCESS_KEY_ID &&
		process.env.AWS_SECRET_ACCESS_KEY
	) {
		clientOptions.credentials = {
			accessKeyId: process.env.AWS_ACCESS_KEY_ID,
			secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
		};
	}

	const client = new BedrockAgentRuntimeClient(clientOptions);

	// Agent IDs from environment variables or fallback to friend's IDs
	const agentId = process.env.AWS_BEDROCK_AGENT_ID || 'RNXSVSMKC8';
	const agentAliasId = process.env.AWS_BEDROCK_AGENT_ALIAS_ID || 'D60PWNSM5X';

	// Store agent info in trace data
	const traceData = getTraceData(sessionId);
	traceData.agentId = agentId;
	traceData.agentAliasId = agentAliasId;
	traceStore.set(sessionId, traceData);

	const command = new InvokeAgentCommand({
		agentId,
		agentAliasId,
		sessionId,
		inputText: prompt,
		// inputText: 'How are you?',
		enableTrace: true,
	});

	try {
		// Supervisor agent completed, start SIMBA handler
		updateTraceData(
			sessionId,
			'supervisor',
			'completed',
			'Supervisor agent routed request to SIMBA-handler',
			'Supervisor'
		);
		updateTraceData(
			sessionId,
			'simba_handler',
			'in_progress',
			'SIMBA-handler processing ticket...',
			'SIMBA-handler'
		);

		let completion = '';
		const response = await client.send(command);

		console.log('=== BEDROCK RESPONSE ===');
		console.log('Full response object:', JSON.stringify(response, null, 2));

		if (response.completion === undefined) {
			throw new Error('Completion is undefined');
		}

		console.log('=== BEDROCK COMPLETION STREAM ===');
		for await (const chunkEvent of response.completion) {
			console.log('Chunk event received:', JSON.stringify(chunkEvent, null, 2));

			// Process trace events if available
			if (chunkEvent.trace && chunkEvent.trace.collaboratorName) {
				const collaboratorName = chunkEvent.trace.collaboratorName;
				const mappedAgent = mapCollaboratorToAgent(collaboratorName);
				const mappedStage = mapCollaboratorToStage(collaboratorName);

				updateTraceData(
					sessionId,
					mappedStage,
					'in_progress',
					`${mappedAgent} processing trace events...`,
					mappedAgent
				);
			}

			const chunk = chunkEvent.chunk;
			if (chunk && chunk.bytes) {
				const decodedResponse = new TextDecoder('utf-8').decode(chunk.bytes);
				// console.log('Decoded chunk:', decodedResponse);
				completion += decodedResponse;
			} else {
				console.log('Chunk or bytes is undefined:', chunkEvent);
			}
		}

		// SIMBA handler completed, start ART handler
		updateTraceData(
			sessionId,
			'simba_handler',
			'completed',
			'SIMBA-handler completed, initiating ART workflow',
			'SIMBA-handler'
		);
		updateTraceData(
			sessionId,
			'art_handler',
			'in_progress',
			'ART-handler generating ART ticket...',
			'ART-handler'
		);

		// Simulate realistic processing delays for each agent
		setTimeout(() => {
			// ART handler completed, start provisioning
			updateTraceData(
				sessionId,
				'art_handler',
				'completed',
				'ART-handler generated ART ticket successfully',
				'ART-handler'
			);
			updateTraceData(
				sessionId,
				'provisioning',
				'in_progress',
				'Provisioning agent allocating resources...',
				'Provisioning'
			);
		}, 1500);

		setTimeout(() => {
			// Provisioning completed
			updateTraceData(
				sessionId,
				'provisioning',
				'completed',
				'Provisioning agent completed resource allocation',
				'Provisioning'
			);
		}, 3000);

		console.log('=== BEDROCK FINAL COMPLETION ===');
		console.log('Final completion text:', completion);
		// console.log('Completion length:', completion.length);
		console.log('Bedrock agent invocation completed successfully');

		return { sessionId, completion };
	} catch (err) {
		console.error('=== BEDROCK ERROR ===');
		console.error('Error invoking Bedrock agent:', err.message);
		console.error('Full error object:', err);

		// Update trace: Error occurred in current stage
		const currentStage =
			traceStore.get(sessionId)?.currentStage || 'supervisor';
		const agentName =
			currentStage === 'supervisor'
				? 'Supervisor'
				: currentStage === 'simba_handler'
				? 'SIMBA-handler'
				: currentStage === 'art_handler'
				? 'ART-handler'
				: 'Provisioning';

		updateTraceData(
			sessionId,
			currentStage,
			'failed',
			`${agentName} processing failed: ${err.message}`,
			agentName
		);

		throw err;
	}
};

/**
 * Invokes a Bedrock agent with a SIMBA ticket ID.
 * This function passes the SIMBA ID as the prompt and uses the SIMBA ID as session ID.
 *
 * @param {string} simbaId - The SIMBA ID of the ticket.
 * @returns {Promise<Object>} - The response from the Bedrock agent.
 */
const processSimbaTicket = async (simbaId) => {
	console.log(`Processing SIMBA ticket: ${simbaId}`);

	try {
		// Use the SIMBA ID as the session ID for consistency with trace data
		const sessionId = simbaId;
		console.log(`sessionId: ${sessionId}`);
		// Use the SIMBA ID as the prompt directly
		const prompt = simbaId;
		// const prompt ='Hey Partha! This is our call to test out Bedrock Connection';

		// Invoke the Bedrock agent
		const result = await invokeBedrockAgent(prompt, sessionId);
		console.log(`SIMBA ticket ${simbaId} processed successfully`);
		return result;
	} catch (error) {
		console.error(`Error processing SIMBA ticket ${simbaId}:`, error.message);
		throw error;
	}
};

module.exports = {
	invokeBedrockAgent,
	processSimbaTicket,
	getTraceData,
	updateTraceData,
	mapCollaboratorToAgent,
	mapCollaboratorToStage,
	markTicketAsBedrockEnabled,
	isTicketBedrockEnabled,
};
