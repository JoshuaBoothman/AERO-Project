const { app } = require('@azure/functions');
const { BlobServiceClient } = require('@azure/storage-blob');
const crypto = require('crypto');
const path = require('path');

const connectionString = process.env.BLOB_STORAGE_CONNECTION_STRING;
const containerName = 'uploads';

app.http('uploadImage', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'upload',
    handler: async (request, context) => {
        try {
            if (!connectionString) {
                return { status: 500, body: JSON.stringify({ error: "Azure Storage connection string not configured." }) };
            }

            const formData = await request.formData();
            const file = formData.get('file');

            if (!file) {
                return { status: 400, body: JSON.stringify({ error: "No file uploaded" }) };
            }

            // Generate a unique filename
            const ext = path.extname(file.name) || '.png';
            const filename = `${crypto.randomUUID()}${ext}`;

            // Initialize Azure Blob Service
            const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
            const containerClient = blobServiceClient.getContainerClient(containerName);

            // Ensure container exists (idempotent)
            await containerClient.createIfNotExists({
                access: 'blob' // Public read access for blobs
            });

            const blockBlobClient = containerClient.getBlockBlobClient(filename);

            // Convert Web Stream/Blob to Buffer
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Upload to Azure
            // undefined content-type usually defaults to application/octet-stream, 
            // but for images we might want to try to detect or pass it if available.
            // request.formData() 'file' object often has 'type' property.
            const contentType = file.type || 'application/octet-stream';

            await blockBlobClient.upload(buffer, buffer.length, {
                blobHTTPHeaders: { blobContentType: contentType }
            });

            return {
                status: 200,
                jsonBody: { url: blockBlobClient.url }
            };

        } catch (error) {
            context.log.error('Upload error:', error);
            return { status: 500, body: JSON.stringify({ error: "Upload failed: " + error.message }) };
        }
    }
});
