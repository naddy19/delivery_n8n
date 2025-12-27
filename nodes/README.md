# Node Code Files

This directory contains the JavaScript code for n8n Code nodes.

## Files

- **format-base64.js** - Converts uploaded image to base64 format
- **parse-claude-response.js** - Parses Claude Vision API response into structured data
- **generate-candidates.js** - Expands address ranges into individual candidate addresses
- **parse-geocode-result.js** - Processes geocoding results and validates addresses
- **aggregate-results.js** - Groups and aggregates all validated addresses
- **generate-html.js** - Generates HTML visualization of delivery routes

## Development Workflow

1. Edit the JavaScript files in this directory with full IDE support
2. Run `npm run build` to inject the code into the workflow JSON
3. Import the updated workflow into n8n

### Watch Mode

Run `npm run build:watch` to automatically rebuild when any .js file changes.

## Code Standards

- Use n8n's built-in variables: `$json`, `$input`, `$itemIndex`, etc.
- Return data in the format: `{ json: { ... } }`
- For multiple items, return an array: `[{ json: {...} }, { json: {...} }]`
- Use `console.log()` for debugging - visible in n8n's execution logs
