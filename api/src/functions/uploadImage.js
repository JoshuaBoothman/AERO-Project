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
        context.log(`[UPLOAD] Starting upload request. URL: ${request.url}`);

        try {
            stage = 'CHECK_ENV';
            const hasConnString = !!connectionString;
            context.log(`[UPLOAD] Stage: ${stage}. Has Connection String: ${hasConnString}`);

            if (!connectionString) {
                context.log.error('[UPLOAD] Missing BLOB_STORAGE_CONNECTION_STRING');
                return { status: 500, body: JSON.stringify({ error: "Configuration Error", details: "BLOB_STORAGE_CONNECTION_STRING is missing" }) };
            }

            stage = 'PARSE_FORM_DATA';
            context.log(`[UPLOAD] Stage: ${stage}. Content-Type: ${request.headers.get('content-type')}`);

            let formData;
            try {
                formData = await request.formData();
                context.log(`[UPLOAD] FormData parsed successfully.`);
            } catch (formError) {
                context.log.error('[UPLOAD] FormData Parse Error:', formError);
                return { status: 400, body: JSON.stringify({ error: "Invalid Form Data", details: formError.message, stage }) };
            }

            stage = 'GET_FILE';
            const file = formData.get('file');
            if (!file) {
                context.log.warn('[UPLOAD] No file found in parsing formData.');
                return { status: 400, body: JSON.stringify({ error: "No file uploaded", stage }) };
            }
            context.log(`[UPLOAD] File received: ${file.name}, Size: ${file.size}, Type: ${file.type}`);

            stage = 'INIT_BLOB_SERVICE';
            // Generate a unique filename
            const ext = path.extname(file.name) || '.png';
            const filename = `${crypto.randomUUID()}${ext}`;
            context.log(`[UPLOAD] Generated filename: ${filename}`);

            const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
            const containerClient = blobServiceClient.getContainerClient(containerName);

            stage = 'CREATE_CONTAINER';
            // optimization: createIfNotExists can be slow, maybe check if it exists first or assume it exists after first run? 
            // monitoring for now.
            await containerClient.createIfNotExists({
                access: 'blob'
            });
            context.log(`[UPLOAD] Container '${containerName}' checked/created.`);

            stage = 'PREPARE_BUFFER';
            const blockBlobClient = containerClient.getBlockBlobClient(filename);
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const contentType = file.type || 'application/octet-stream';
            context.log(`[UPLOAD] Buffer prepared. Length: ${buffer.length}`);

            stage = 'UPLOAD_BLOB';
            await blockBlobClient.upload(buffer, buffer.length, {
                blobHTTPHeaders: { blobContentType: contentType }
            });
            context.log(`[UPLOAD] Upload to info: ${blockBlobClient.url}`);

            stage = 'SUCCESS';
            return {
                status: 200,
                jsonBody: { url: blockBlobClient.url }
            };

        } catch (error) {
            context.log.error(`[UPLOAD] Critical Error at stage ${stage}:`, error);
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
