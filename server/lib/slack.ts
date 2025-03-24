import { type ChatPostMessageArguments, WebClient } from "@slack/web-api";

// Check for required environment variables
if (!process.env.SLACK_BOT_TOKEN) {
  console.warn("SLACK_BOT_TOKEN environment variable is not set. Slack integration will not work.");
}

if (!process.env.SLACK_CHANNEL_ID) {
  console.warn("SLACK_CHANNEL_ID environment variable is not set. Slack integration will not work.");
}

// Initialize Slack web client, but handle the case where token is missing
const slack = process.env.SLACK_BOT_TOKEN ? new WebClient(process.env.SLACK_BOT_TOKEN) : null;

/**
 * Sends a structured message to a Slack channel using the Slack Web API
 * @param message - Structured message to send
 * @returns Promise resolving to the sent message's timestamp
 */
export async function sendSlackMessage(
  message: ChatPostMessageArguments
): Promise<string | undefined> {
  try {
    // Check if Slack client is initialized
    if (!slack) {
      throw new Error("Slack client is not initialized. Check SLACK_BOT_TOKEN environment variable.");
    }
    
    // Send the message
    const response = await slack.chat.postMessage(message);
    
    // Return the timestamp of the sent message
    return response.ts;
  } catch (error) {
    console.error('Error sending Slack message:', error);
    throw error;
  }
}

/**
 * Sends a camera status notification to Slack
 * @param status - Camera status message
 * @param imageUrl - Optional screenshot URL to include
 * @returns Promise resolving when message is sent
 */
export async function sendCameraStatusNotification(
  status: string,
  imageUrl?: string
): Promise<string | undefined> {
  // Get channel from environment variable
  const channel = process.env.SLACK_CHANNEL_ID;
  
  if (!channel) {
    throw new Error("SLACK_CHANNEL_ID environment variable must be set");
  }
  
  // Create blocks for message
  const blocks: any[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*V380 Pro Camera Status Update*'
      }
    },
    {
      type: 'section',
      text: {
        type: 'plain_text',
        text: status
      }
    }
  ];
  
  // Add image if provided
  if (imageUrl) {
    blocks.push({
      type: 'image',
      image_url: imageUrl,
      alt_text: 'Camera snapshot'
    });
  }
  
  // Add timestamp
  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'plain_text',
        text: `Time: ${new Date().toLocaleString()}`
      }
    ]
  });
  
  // Send notification
  return sendSlackMessage({
    channel,
    blocks
  });
}
