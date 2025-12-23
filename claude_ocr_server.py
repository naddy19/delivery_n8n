#!/usr/bin/env python3
"""
Claude Vision API OCR Server
Uses Claude's vision capabilities to extract table data from delivery route images
"""

from flask import Flask, request, jsonify
from PIL import Image
import base64
import io
import os
import json
import anthropic

app = Flask(__name__)

# Initialize Claude client
CLAUDE_API_KEY = os.environ.get('CLAUDE_API_KEY', '')
if not CLAUDE_API_KEY:
    print("WARNING: CLAUDE_API_KEY environment variable not set!")
    client = None
else:
    client = anthropic.Anthropic(api_key=CLAUDE_API_KEY)
    print("Claude API client initialized successfully!")

# Prompt for Claude to extract table data
EXTRACTION_PROMPT = """You are analyzing a delivery route table image. Extract all the route information in a structured format.

The table typically contains:
- Group numbers (columns of numbers like 1, 2, 3... up to 30)
- Street names (e.g., "123 ST NW", "456 AVE SE")
- House number ranges (from and to addresses)

Please extract this data and return it as a JSON object with this structure:
{
  "groups": [
    {
      "groupNumber": 1,
      "streets": [
        {
          "streetName": "123 ST NW",
          "fromHouse": "10123",
          "toHouse": "10145"
        }
      ]
    }
  ]
}

Important:
- Extract ALL group numbers you see in the table
- For each group, extract all associated streets
- Include house number ranges when visible (from and to)
- CRITICAL: Be extremely careful when reading house numbers - they are typically 3-5 digits
- House number ranges are usually small (e.g., 503-512, not 503-7204)
- If you see a range spanning more than 50 house numbers, double-check the digits
- Common digit confusion: 1↔7, 2↔7, 5↔8, 0↔8 - verify carefully
- If house numbers aren't clear or seem unreasonably large, use empty strings
- Preserve the exact street names as shown
- Skip headers, totals, and metadata rows
- Only include actual delivery route data

Return ONLY the JSON object, no additional text or explanation."""

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    status = "healthy" if client else "unhealthy - no API key"
    return jsonify({
        "status": status,
        "service": "claude-ocr",
        "api_key_set": bool(CLAUDE_API_KEY)
    }), 200

@app.route('/ocr/table', methods=['POST'])
def ocr_table():
    """
    Extract table structure from image using Claude Vision API
    
    Accepts:
    - JSON with base64Image field
    - multipart/form-data with 'image' file
    
    Returns:
    - Structured table data extracted by Claude
    """
    try:
        print(f"DEBUG: Request received - Content-Type: {request.content_type}")
        print(f"DEBUG: request.is_json: {request.is_json}")
        print(f"DEBUG: Has 'image' in files: {'image' in request.files}")
        
        if not client:
            return jsonify({
                "error": "Claude API client not initialized. Set CLAUDE_API_KEY environment variable."
            }), 500
        
        image = None
        base64_data = None
        media_type = "image/jpeg"
        
        # Handle base64 encoded image
        if request.is_json:
            data = request.get_json()
            base64_image = data.get('base64Image', '')
            
            print(f"DEBUG: Received base64_image length: {len(base64_image)}")
            print(f"DEBUG: First 100 chars: {base64_image[:100]}")
            
            # Extract media type if present in data URL
            if base64_image.startswith('data:'):
                header, base64_data = base64_image.split(',', 1)
                # Extract media type from header like "data:image/png;base64"
                if 'image/' in header:
                    media_type = header.split(';')[0].replace('data:', '')
                print(f"DEBUG: Extracted media_type: {media_type}")
                print(f"DEBUG: Base64 data length after split: {len(base64_data)}")
            else:
                base64_data = base64_image
                print(f"DEBUG: No data URL prefix, using raw base64")
            
            # Clean the base64 data (remove whitespace)
            base64_data = base64_data.strip().replace('\n', '').replace('\r', '').replace(' ', '')
            print(f"DEBUG: Base64 data length after cleaning: {len(base64_data)}")
            
            # Decode to verify it's valid
            try:
                image_bytes = base64.b64decode(base64_data)
                print(f"DEBUG: Decoded image_bytes length: {len(image_bytes)}")
                print(f"DEBUG: First 20 bytes (hex): {image_bytes[:20].hex()}")
                image = Image.open(io.BytesIO(image_bytes))
                print(f"DEBUG: Successfully opened image: {image.format}, {image.size}")
            except Exception as e:
                print(f"ERROR: Failed to decode/open image: {str(e)}")
                raise
        
        # Handle file upload
        elif 'image' in request.files:
            file = request.files['image']
            image = Image.open(file.stream)
            
            # Convert to base64
            buffered = io.BytesIO()
            image.save(buffered, format="JPEG")
            base64_data = base64.b64encode(buffered.getvalue()).decode('utf-8')
            media_type = "image/jpeg"
        
        if image is None or base64_data is None:
            return jsonify({"error": "No image provided"}), 400
        
        print(f"Processing image with Claude: {image.size}, format: {image.format}")
        
        # Call Claude API with vision
        message = client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=4096,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": media_type,
                                "data": base64_data,
                            },
                        },
                        {
                            "type": "text",
                            "text": EXTRACTION_PROMPT
                        }
                    ],
                }
            ],
        )
        
        # Extract the response text
        response_text = message.content[0].text
        
        print(f"Claude response length: {len(response_text)} chars")
        print(f"Response preview: {response_text[:200]}...")
        
        # Parse the JSON response from Claude
        try:
            # Claude might wrap the JSON in markdown code blocks
            if '```json' in response_text:
                json_start = response_text.find('```json') + 7
                json_end = response_text.find('```', json_start)
                response_text = response_text[json_start:json_end].strip()
            elif '```' in response_text:
                json_start = response_text.find('```') + 3
                json_end = response_text.find('```', json_start)
                response_text = response_text[json_start:json_end].strip()
            
            extracted_data = json.loads(response_text)
        except json.JSONDecodeError as e:
            print(f"JSON parse error: {e}")
            print(f"Response text: {response_text}")
            # Return the raw response if we can't parse it
            return jsonify({
                "error": "Failed to parse Claude response as JSON",
                "raw_response": response_text,
                "groups": []
            }), 200
        
        # Transform to match n8n workflow expected format
        groups = extracted_data.get('groups', [])
        
        # Build full text representation
        full_text_lines = []
        for group in groups:
            full_text_lines.append(f"\nGroup {group['groupNumber']}:")
            for street in group.get('streets', []):
                street_line = f"  {street['streetName']}"
                if street.get('fromHouse') or street.get('toHouse'):
                    street_line += f" ({street.get('fromHouse', '')} - {street.get('toHouse', '')})"
                full_text_lines.append(street_line)
        
        full_text = '\n'.join(full_text_lines)
        
        # Format response in a structure compatible with existing workflow
        result = {
            "success": True,
            "source": "claude-vision",
            "model": "claude-3-5-sonnet-20241022",
            "groups": groups,
            "fullText": full_text,
            "totalGroups": len(groups),
            "totalStreets": sum(len(g.get('streets', [])) for g in groups),
            "rawResponse": response_text
        }
        
        print(f"Extracted {result['totalGroups']} groups, {result['totalStreets']} streets")
        
        return jsonify(result), 200
        
    except anthropic.APIError as e:
        print(f"Claude API error: {e}")
        return jsonify({
            "error": f"Claude API error: {str(e)}",
            "groups": []
        }), 500
    except Exception as e:
        print(f"Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "error": f"Server error: {str(e)}",
            "groups": []
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8869))
    print(f"Starting Claude OCR server on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=True)
