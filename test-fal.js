// Quick Fal.AI test script
// Run with: node test-fal.js

const fal = require("@fal-ai/serverless-client");

// Load environment variables
require('dotenv').config({ path: '.env.local' });

if (!process.env.FAL_KEY) {
  console.error('❌ FAL_KEY not found in .env.local');
  console.log('Please add: FAL_KEY=your_api_key_here');
  process.exit(1);
}

fal.config({
  credentials: process.env.FAL_KEY,
});

console.log('🧪 Testing Fal.AI connection...');

(async () => {
  try {
    const result = await fal.subscribe("fal-ai/flux/schnell", {
    input: {
      prompt: "a simple test image of a cat",
      num_inference_steps: 4,
      guidance_scale: 7.5,
      num_images: 1,
    },
  });

  console.log('✅ Fal.AI test successful!');
  console.log('Response:', JSON.stringify(result, null, 2));
  
  if (result.images && result.images[0]) {
    console.log('🖼️ Generated image URL:', result.images[0].url);
  }
  } catch (error) {
    console.error('❌ Fal.AI test failed:', error);
    
    if (error.status === 403) {
      console.log('💡 This is likely an API key issue. Check your FAL_KEY.');
    } else if (error.status === 402) {
      console.log('💡 You may have run out of free credits. Check your Fal.AI account.');
    }
  }
})();
