// Simple Fal.AI test script
const fal = require("@fal-ai/serverless-client");

// Manually set the API key from your .env.local
const FAL_KEY = "0c4d91ef-ca86-49c5-889e-62d52a16cc89:df44e6a4130f4087f6b571b09ea0dd76";

if (!FAL_KEY) {
  console.error('❌ FAL_KEY not set');
  process.exit(1);
}

fal.config({
  credentials: FAL_KEY,
});

console.log('🧪 Testing Fal.AI connection...');
console.log('🔑 Using API key:', FAL_KEY.substring(0, 20) + '...');

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
    console.error('Error details:', error.body || error.message);
    
    if (error.status === 403) {
      console.log('💡 API key is invalid or expired');
      console.log('💡 Try generating a new API key at https://fal.ai');
    } else if (error.status === 402) {
      console.log('💡 You may have run out of free credits');
    } else if (error.status === 429) {
      console.log('💡 Rate limit exceeded, try again later');
    }
  }
})();
