const { app } = require('@azure/functions');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Helper to parse multipart/form-data manually (since simple req.formData() might be stream based in some versions, but v4 is usually good)
// Actually, in Node v18+ and Azure Functions v4, request.formData() returns a standard FormData object.

app.http('uploadImage', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'upload',
    handler: async (request, context) => {
        try {
            const formData = await request.formData();
            const file = formData.get('file');

            if (!file) {
                return { status: 400, body: JSON.stringify({ error: "No file uploaded" }) };
            }

            // Generate a unique filename
            const ext = path.extname(file.name) || '.png';
            const filename = `${crypto.randomUUID()}${ext}`;

            // Define upload path (Local Dev specific: ../client/public/uploads)
            // Note: In production, this should be Blob Storage.
            const uploadDir = path.resolve(__dirname, '../../../client/public/uploads');

            // Ensure directory exists
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const filePath = path.join(uploadDir, filename);

            // Convert Web Stream/Blob to Buffer
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            fs.writeFileSync(filePath, buffer);

            return {
                status: 200,
                jsonBody: { url: `/uploads/${filename}` }
            };

        } catch (error) {
            context.log.error('Upload error:', error);
            return { status: 500, body: JSON.stringify({ error: "Upload failed " + error.message }) };
        }
    }
});
