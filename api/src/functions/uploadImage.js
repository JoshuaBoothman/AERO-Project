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
        let stage = 'INIT';
        try {
            stage = 'CHECK_ENV';
            if (!connectionString) {
                return { status: 500, body: JSON.stringify({ error: "Configuration Error", details: "BLOB_STORAGE_CONNECTION_STRING is missing" }) };
            }

            stage = 'PARSE_FORM_DATA';
            let formData;
            try {
                formData = await request.formData();
            } catch (formError) {
                context.log.error('FormData Parse Error:', formError);
                return { status: 400, body: JSON.stringify({ error: "Invalid Form Data", details: formError.message, stage }) };
            }

            stage = 'GET_FILE';
            const file = formData.get('file');
            if (!file) {
                return { status: 400, body: JSON.stringify({ error: "No file uploaded", stage }) };
            }

            stage = 'INIT_BLOB_SERVICE';
            // Generate a unique filename
            const ext = path.extname(file.name) || '.png';
            const filename = `${crypto.randomUUID()}${ext}`;

            const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
            const containerClient = blobServiceClient.getContainerClient(containerName);

            stage = 'CREATE_CONTAINER';
            await containerClient.createIfNotExists({
                access: 'blob'
            });

            stage = 'PREPARE_BUFFER';
            const blockBlobClient = containerClient.getBlockBlobClient(filename);
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const contentType = file.type || 'application/octet-stream';

            stage = 'UPLOAD_BLOB';
            await blockBlobClient.upload(buffer, buffer.length, {
                blobHTTPHeaders: { blobContentType: contentType }
            });

            stage = 'SUCCESS';
            return {
                status: 200,
                jsonBody: { url: blockBlobClient.url }
            };

        } catch (error) {
            context.log.error(`Upload error at stage ${stage}:`, error);
            return {
                status: 500,
                body: JSON.stringify({
                    error: "Upload failed",
                    stage: stage,
                    message: error.message,
                    details: error.stack
                })
            };
        }
    }
});
