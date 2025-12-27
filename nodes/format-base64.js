const binaryData = $input.first().binary.image;
const buffer = await this.helpers.getBinaryDataBuffer(0, 'image');
const base64Data = buffer.toString('base64');
const mimeType = binaryData.mimeType || 'image/jpeg';
const base64Image = `data:${mimeType};base64,${base64Data}`;

console.log('Image Details:');
console.log('- MIME Type:', mimeType);
console.log('- Buffer Size:', buffer.length);
console.log('- Base64 Length:', base64Data.length);
console.log('- Base64 Preview (first 50):', base64Data.substring(0, 50));

return {
  json: {
    base64Image: base64Image,
    mimeType: mimeType,
    size: buffer.length
  }
};
