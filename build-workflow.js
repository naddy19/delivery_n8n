#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const WORKFLOW_SOURCE = path.join(__dirname, 'workflows', 'image-ocr-workflow-source.json');
const WORKFLOW_OUTPUT = path.join(__dirname, 'workflows', 'dist', 'image-ocr-workflow-final.json');
const NODES_DIR = path.join(__dirname, 'nodes');

// Mapping of node IDs to their JavaScript files
const NODE_CODE_MAP = {
  'format-base64-node': 'format-base64.js',
  'parse-claude-node': 'parse-claude-response.js',
  'expand-addresses-node': 'generate-candidates.js',
  'parse-geocode-node': 'parse-geocode-result.js',
  'aggregate-results-node': 'aggregate-results.js',
  'generate-html-node': 'generate-html.js'
};

console.log('🔧 Building workflow from source files...\n');

// Ensure output directory exists
const outputDir = path.dirname(WORKFLOW_OUTPUT);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Read the workflow source template
const workflow = JSON.parse(fs.readFileSync(WORKFLOW_SOURCE, 'utf8'));

// Inject JavaScript code from files into workflow nodes
let updatedCount = 0;
workflow.nodes.forEach(node => {
  if (NODE_CODE_MAP[node.id]) {
    const codeFile = path.join(NODES_DIR, NODE_CODE_MAP[node.id]);
    
    if (fs.existsSync(codeFile)) {
      const code = fs.readFileSync(codeFile, 'utf8');
      
      // Update the jsCode parameter
      if (node.parameters && 'jsCode' in node.parameters) {
        node.parameters.jsCode = code;
        console.log(`✓ Updated ${node.name} from ${NODE_CODE_MAP[node.id]}`);
        updatedCount++;
      }
    } else {
      console.warn(`⚠ Warning: ${codeFile} not found`);
    }
  }
});

// Write the built workflow to dist directory
fs.writeFileSync(WORKFLOW_OUTPUT, JSON.stringify(workflow, null, 2), 'utf8');

console.log(`\n✅ Build complete! Updated ${updatedCount} nodes.`);
console.log(`📄 Output: ${path.relative(__dirname, WORKFLOW_OUTPUT)}`);
console.log(`\n💡 Import this file into n8n: ${path.relative(__dirname, WORKFLOW_OUTPUT)}`);

