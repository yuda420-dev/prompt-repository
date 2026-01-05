// AI Vision Service for generating artwork descriptions
const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

export const isAIConfigured = () => {
  return !!ANTHROPIC_API_KEY && ANTHROPIC_API_KEY.startsWith('sk-ant-');
};

/**
 * Generate an artwork description by analyzing the image with Claude Vision
 * @param {string} imageUrl - The URL of the artwork image
 * @param {object} context - Optional context about the artwork (title, category, etc.)
 * @returns {Promise<string>} - The generated description
 */
export const generateAIDescription = async (imageUrl, context = {}) => {
  if (!isAIConfigured()) {
    throw new Error('AI service not configured. Please add VITE_ANTHROPIC_API_KEY to your environment.');
  }

  if (!imageUrl) {
    throw new Error('No image URL provided');
  }

  // Build context string if available
  const contextParts = [];
  if (context.title) contextParts.push(`Title: "${context.title}"`);
  if (context.category) contextParts.push(`Category: ${context.category}`);
  if (context.artist) contextParts.push(`Artist: ${context.artist}`);

  const contextString = contextParts.length > 0
    ? `\n\nContext about this artwork:\n${contextParts.join('\n')}`
    : '';

  const prompt = `You are an art curator writing descriptions for a contemporary art gallery.

Analyze this artwork image and write a compelling 2-3 sentence description suitable for a gallery listing.

Focus on:
- The visual elements (colors, composition, textures, shapes)
- The mood and emotional impact
- The artistic style or technique
- What the artwork might represent or evoke

Write in an engaging, accessible style that helps viewers connect with the piece. Avoid overly academic language.${contextString}

Respond with ONLY the description text, no preamble or formatting.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'url',
                  url: imageUrl
                }
              },
              {
                type: 'text',
                text: prompt
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Anthropic API error:', errorData);
      throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
    }

    const data = await response.json();

    if (data.content && data.content[0] && data.content[0].text) {
      return data.content[0].text.trim();
    }

    throw new Error('Unexpected response format from AI service');
  } catch (error) {
    console.error('AI description generation failed:', error);
    throw error;
  }
};
