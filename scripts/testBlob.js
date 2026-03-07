/* eslint-disable @typescript-eslint/no-require-imports */
// Test script for Vercel Blob upload
// Run with: node scripts/testBlob.js

const { put } = require('@vercel/blob');

async function testBlob() {
  console.log("Testing Vercel Blob upload with public access...");

  try {
    // Create a simple test file
    const testContent = Buffer.from('test image content');
    const file = new File([testContent], 'test-image.jpg', { type: 'image/jpeg' });

    const blob = await put('test-image.jpg', file, { access: 'public' });
    console.log("Upload successful:", blob.url);
    console.log("URL starts with public:", blob.url.includes('public.blob.vercel-storage.com'));
  } catch (error) {
    console.error("Upload failed:", error.message);
  }
}

testBlob();
