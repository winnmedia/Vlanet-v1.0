const axios = require('axios');

// API configuration
const API_BASE_URL = 'https://videoplanet.up.railway.app';

// Color codes
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

async function testDalleGeneration() {
  console.log(`${colors.blue}=== DALL-E Image Generation Test ===${colors.reset}\n`);

  try {
    // Test storyboard generation endpoint directly
    console.log(`${colors.yellow}1. Testing storyboard generation endpoint...${colors.reset}`);
    
    const testShotData = {
      shot_data: {
        shot_number: 1,
        shot_type: "클로즈업",
        description: "젊은 남성이 스마트워치를 보며 미소짓는 모습",
        camera_angle: "아이레벨",
        camera_movement: "고정",
        duration: 3,
        location: "공원",
        time_of_day: "아침",
        characters: ["20대 남성"],
        action: "스마트워치를 보며 만족스러운 표정을 짓는다"
      }
    };

    const response = await axios.post(
      `${API_BASE_URL}/api/video-planning/generate/storyboards/`,
      testShotData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.status === 200) {
      console.log(`${colors.green}✓ Storyboard generation successful${colors.reset}`);
      
      const data = response.data.data;
      const storyboards = data.storyboards || [];
      
      console.log(`\n${colors.cyan}Generated ${storyboards.length} storyboard frames:${colors.reset}`);
      
      storyboards.forEach((frame, index) => {
        console.log(`\n${colors.magenta}Frame ${index + 1}: ${frame.title || 'Untitled'}${colors.reset}`);
        console.log(`  Description: ${frame.visual_description || 'N/A'}`);
        
        if (frame.image_url) {
          console.log(`${colors.green}  ✓ Image URL exists${colors.reset}`);
          
          // Check image type
          if (frame.image_url.startsWith('data:image')) {
            console.log(`  → Type: Base64 encoded image`);
            const base64Size = frame.image_url.split(',')[1]?.length || 0;
            console.log(`  → Size: ${base64Size.toLocaleString()} characters`);
            
            // Check if it's likely an actual image or text
            if (base64Size > 10000) {
              console.log(`${colors.green}  → Likely an actual image (large size)${colors.reset}`);
            } else {
              console.log(`${colors.yellow}  → Possibly a small image or placeholder${colors.reset}`);
            }
          } else if (frame.image_url.startsWith('http')) {
            console.log(`  → Type: External URL`);
            console.log(`  → URL: ${frame.image_url.substring(0, 100)}...`);
          }
          
          // Model info
          if (frame.model_used) {
            console.log(`  → Model: ${frame.model_used}`);
          }
          
          // Prompt used
          if (frame.prompt_used) {
            console.log(`  → Prompt preview: ${frame.prompt_used.substring(0, 100)}...`);
          }
          
          // Check if placeholder
          if (frame.is_placeholder) {
            console.log(`${colors.yellow}  ⚠️  This is a placeholder image${colors.reset}`);
          }
        } else {
          console.log(`${colors.red}  ✗ No image URL${colors.reset}`);
          if (frame.image_error) {
            console.log(`  → Error: ${frame.image_error}`);
          }
        }
      });
      
      // Summary
      console.log(`\n${colors.blue}=== Summary ===${colors.reset}`);
      const imagesGenerated = storyboards.filter(f => f.image_url).length;
      const dalleImages = storyboards.filter(f => f.model_used === 'dall-e-3').length;
      const placeholders = storyboards.filter(f => f.is_placeholder).length;
      
      console.log(`Total frames: ${storyboards.length}`);
      console.log(`Frames with images: ${imagesGenerated}`);
      console.log(`DALL-E 3 images: ${dalleImages}`);
      console.log(`Placeholder images: ${placeholders}`);
      
      if (dalleImages > 0) {
        console.log(`\n${colors.green}✅ DALL-E is generating actual illustrated images!${colors.reset}`);
      } else if (placeholders > 0) {
        console.log(`\n${colors.yellow}⚠️  Only placeholder images are being generated${colors.reset}`);
      } else {
        console.log(`\n${colors.red}❌ No images are being generated${colors.reset}`);
      }
      
    } else {
      console.log(`${colors.red}✗ Request failed with status: ${response.status}${colors.reset}`);
    }
    
  } catch (error) {
    console.log(`${colors.red}✗ Test failed: ${error.message}${colors.reset}`);
    if (error.response) {
      console.log(`Response status: ${error.response.status}`);
      console.log(`Response data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
  
  // Test regenerate endpoint
  console.log(`\n${colors.yellow}2. Testing image regeneration endpoint...${colors.reset}`);
  try {
    const regenData = {
      frame_data: {
        frame_number: 1,
        title: "Test Regeneration",
        visual_description: "Young man jogging in park with smartwatch",
        composition: "Medium shot",
        lighting: "Natural morning light"
      }
    };
    
    const regenResponse = await axios.post(
      `${API_BASE_URL}/api/video-planning/regenerate-storyboard-image/`,
      regenData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (regenResponse.status === 200) {
      console.log(`${colors.green}✓ Image regeneration endpoint works${colors.reset}`);
      const imageUrl = regenResponse.data.data?.image_url;
      if (imageUrl) {
        console.log(`  → Image generated successfully`);
        if (imageUrl.startsWith('data:image')) {
          console.log(`  → Type: Base64 encoded`);
        }
      }
    }
  } catch (error) {
    console.log(`${colors.red}✗ Regeneration failed: ${error.message}${colors.reset}`);
    if (error.response?.data?.message) {
      console.log(`  → Error: ${error.response.data.message}`);
    }
  }
}

// Run the test
testDalleGeneration();