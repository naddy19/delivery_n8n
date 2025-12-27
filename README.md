# Delivery Route OCR & Geocoding System

An automated system that uses Claude AI to extract delivery routes from images and geocodes addresses using Google Maps API.

## Overview

This project processes delivery route images containing street names and house number ranges, extracts the data using Claude Vision AI, generates candidate addresses, validates them via Google Maps Geocoding API, and produces an interactive HTML map.

## Components

### Docker Services

- **n8n**: Workflow automation platform
- **claude-ocr**: Python Flask server running Claude Vision API
- **web**: Nginx server serving the upload interface

### Main Workflow

**File**: `workflows/image-ocr-workflow-final.json`

**Process Flow**:
1. **Set Config** - Configure API keys
2. **Webhook** - Receive image upload
3. **Format Base64** - Convert image to base64
4. **Claude Vision API** - Extract route data from image
5. **Parse Claude Response** - Structure the extracted data
6. **Generate Candidates** - Expand house number ranges into individual addresses
7. **Geocode Address** - Validate each address with Google Maps API
8. **Parse Geocode Result** - Extract coordinates and validation status
9. **Aggregate Results** - Group validated addresses
10. **Generate HTML** - Create interactive visualization
11. **Respond to Webhook** - Return HTML to user

## Setup

### Prerequisites

- Docker & Docker Compose
- Google Maps API Key (with Geocoding API enabled)
- Anthropic Claude API Key

### Configuration

1. Create `.env` file:
```bash
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
ANTHROPIC_API_KEY=your_claude_api_key
```

2. Update API key in workflow:
   - Edit `workflows/image-ocr-workflow-final.json`
   - Update the `googleMapsApiKey` in the "Set Config" node

### Running

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Access

- **n8n**: http://localhost:5678
- **Upload Interface**: http://localhost
- **Webhook URL**: http://localhost:5678/webhook/upload-image

## Files

- `docker-compose.yml` - Docker services configuration
- `claude_ocr_server.py` - Claude Vision OCR server
- `index.html` - Image upload interface
- `nginx.conf` - Web server configuration
- `workflows/image-ocr-workflow-source.json` - Workflow template (clean, no embedded code)
- `workflows/dist/image-ocr-workflow-final.json` - Built workflow (generated, not in git)
- `nodes/*.js` - JavaScript source files for workflow Code nodes
- `build-workflow.js` - Build script to inject code into workflow
- `test_geocoding.py` - Geocoding validation script
- `analyze_ranges.py` - Address range analysis utility

## Development

### Editing Workflow Code

The workflow's JavaScript code is maintained in separate files in the `nodes/` directory:

```bash
# Install dependencies (first time only)
npm install

# Build workflow (injects code from nodes/*.js into workflow JSON)
npm run build

# Auto-rebuild on file changes
npm run build:watch
```

The build process:
1. Reads `workflows/image-ocr-workflow-source.json` (clean template)
2. Injects code from `nodes/*.js` files
3. Outputs to `workflows/dist/image-ocr-workflow-final.json` (built version)

**Import the built file into n8n**: `workflows/dist/image-ocr-workflow-final.json`

**Benefits:**
- ✅ Full IDE support (syntax highlighting, IntelliSense, linting)
- ✅ Better version control (clean diffs, no code duplication)
- ✅ Easier code maintenance and testing
- ✅ Source files stay clean (no embedded code)
- ✅ Built files excluded from git

After building, import the updated `workflows/image-ocr-workflow-final.json` into n8n.

**Benefits:**
- ✅ Full IDE support (syntax highlighting, IntelliSense, linting)
- ✅ Better version control (clean diffs)
- ✅ Easier code maintenance and testing
- ✅ Proper JavaScript file formatting

## Features

- **Image Caching**: Processed images are cached to avoid redundant API calls
- **Address Validation**: Only real addresses are included (verified via Geocoding API)
- **Odd/Even Handling**: Correctly expands address ranges respecting street side parity
- **Interactive Output**: HTML visualization with coordinates for each validated address

## Notes

- The workflow filters out non-existent addresses using location_type from Google Maps API
- Only ROOFTOP and RANGE_INTERPOLATED location types are accepted as valid
- Sample data files in `sample_data/` are ignored by git
