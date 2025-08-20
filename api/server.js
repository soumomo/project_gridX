// backend/server.js

require('dotenv').config();
const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const JSZip = require('jszip');
const cors = require('cors');
const axios = require('axios');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const FormData = require('form-data');
const { createClient } = require("redis");
const RedisStore = require("connect-redis").default;

// Initialize Redis Client
let redisClient;
if (process.env.REDIS_URL) {
    redisClient = createClient({ url: process.env.REDIS_URL });
    redisClient.connect().catch(console.error);
    redisClient.on('error', err => console.error('Redis error:', err));
}

// Initialize session store
let sessionStore;
if (redisClient) {
    sessionStore = new RedisStore({
        client: redisClient,
        prefix: "gridx:",
    });
}

const app = express();
const port = process.env.PORT || 5000;

// --- App Configuration ---
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept images only
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    store: sessionStore, // Use Redis store in production
    secret: process.env.SESSION_SECRET || 'default-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
}));

// --- PKCE Helper Functions ---
const base64URLEncode = (str) => str.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
const sha256 = (buffer) => crypto.createHash('sha256').update(buffer).digest();

// --- X API Constants ---
const X_CLIENT_ID = process.env.X_CLIENT_ID;
const X_CLIENT_SECRET = process.env.X_CLIENT_SECRET;
const CALLBACK_URL = process.env.CALLBACK_URL || 'http://localhost:5000/api/auth/callback';

// --- Authentication Routes ---

// 1. Redirects user to X for authorization
app.get('/api/auth/login', (req, res) => {
    const codeVerifier = base64URLEncode(crypto.randomBytes(32));
    req.session.codeVerifier = codeVerifier;

    const codeChallenge = base64URLEncode(sha256(codeVerifier));
    const scope = ['tweet.read', 'tweet.write', 'users.read', 'offline.access'].join(' ');
    
    const authUrl = new URL('https://twitter.com/i/oauth2/authorize');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', X_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', CALLBACK_URL);
    authUrl.searchParams.set('scope', scope);
    authUrl.searchParams.set('state', 'state'); // Simple CSRF token
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');

    res.redirect(authUrl.toString());
});

// 2. X redirects back here; we exchange the code for an access token
app.get('/api/auth/callback', async (req, res) => {
    const { code, error } = req.query;
    const { codeVerifier } = req.session;

    if (error) {
        return res.redirect(`${process.env.FRONTEND_URL}?error=${error}`);
    }

    try {
        const response = await axios.post('https://api.twitter.com/2/oauth2/token', new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: CALLBACK_URL,
            code_verifier: codeVerifier,
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(`${X_CLIENT_ID}:${X_CLIENT_SECRET}`).toString('base64')}`,
            },
        });

        req.session.accessToken = response.data.access_token;
        req.session.refreshToken = response.data.refresh_token;

        // Fetch user info
        const userResponse = await axios.get('https://api.twitter.com/2/users/me', {
             headers: { 'Authorization': `Bearer ${req.session.accessToken}` }
        });
        req.session.user = userResponse.data.data;
        
        res.redirect(process.env.FRONTEND_URL || 'http://localhost:3000');
    } catch (err) {
        console.error("Error during X callback:", err.response ? err.response.data : err.message);
        res.status(500).send("Authentication failed");
    }
});

// 3. Endpoint for the frontend to check if a user is logged in
app.get('/api/auth/user', (req, res) => {
    if (req.session.user) {
        res.json({ user: req.session.user });
    } else {
        res.status(401).json({ message: 'Not authenticated' });
    }
});

// 4. Logout endpoint
app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Could not log out.' });
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'Logged out successfully' });
    });
});


// --- Core App Routes ---

// Endpoint for downloading split images as ZIP
app.post('/api/split', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }
    
    try {
        const rows = parseInt(req.body.rows, 10) || 3;
        const cols = parseInt(req.body.cols, 10) || 3;

        if (isNaN(rows) || isNaN(cols) || rows <= 0 || cols <= 0 || rows > 10 || cols > 10) {
            return res.status(400).json({ error: 'Invalid grid dimensions. Please use values between 1 and 10.' });
        }

        console.log(`Processing image split: ${rows}x${cols} grid`);

        const image = sharp(req.file.buffer);
        const metadata = await image.metadata();
        
        if (!metadata.width || !metadata.height) {
            return res.status(400).json({ error: 'Invalid image dimensions.' });
        }

        const pieceWidth = Math.floor(metadata.width / cols);
        const pieceHeight = Math.floor(metadata.height / rows);
        
        if (pieceWidth < 10 || pieceHeight < 10) {
            return res.status(400).json({ error: 'Image too small for the requested grid size.' });
        }

        const zip = new JSZip();
        const pieces = [];

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                try {
                    const imagePieceBuffer = await image
                        .clone()
                        .extract({ 
                            left: j * pieceWidth, 
                            top: i * pieceHeight, 
                            width: pieceWidth, 
                            height: pieceHeight 
                        })
                        .png()
                        .toBuffer();
                    
                    const filename = `piece_${String(i + 1).padStart(2, '0')}_${String(j + 1).padStart(2, '0')}.png`;
                    zip.file(filename, imagePieceBuffer);
                    pieces.push(filename);
                } catch (pieceError) {
                    console.error(`Error processing piece ${i},${j}:`, pieceError);
                    throw new Error(`Failed to process image piece at position ${i+1},${j+1}`);
                }
            }
        }
        
        const zipBuffer = await zip.generateAsync({ 
            type: 'nodebuffer',
            compression: 'DEFLATE',
            compressionOptions: { level: 9 }
        });
        
        console.log(`Successfully created ZIP with ${pieces.length} pieces`);
        
        res.set({
            'Content-Type': 'application/zip',
            'Content-Disposition': 'attachment; filename="image-pieces.zip"',
            'Content-Length': zipBuffer.length,
            'Cache-Control': 'no-cache',
        });
        
        res.send(zipBuffer);
    } catch (error) {
        console.error('Error processing image:', error);
        res.status(500).json({ 
            error: 'Failed to process image. Please try again.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Endpoint to post split images to X/Twitter
app.post('/api/post-tweet', upload.single('image'), async (req, res) => {
    if (!req.session.accessToken) {
        return res.status(401).json({ error: 'User not authenticated. Please login with X.' });
    }
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }

    try {
        const rows = parseInt(req.body.rows, 10) || 3;
        const cols = parseInt(req.body.cols, 10) || 3;
        const tweetText = req.body.tweetText || 'Check out this cool image grid! 🖼️';

        if (rows * cols > 4) {
            return res.status(400).json({ 
                error: 'X only allows up to 4 images per tweet. Please use a 2x2 grid or smaller.' 
            });
        }

        console.log(`Posting to X: ${rows}x${cols} grid`);

        const image = sharp(req.file.buffer);
        const metadata = await image.metadata();
        const pieceWidth = Math.floor(metadata.width / cols);
        const pieceHeight = Math.floor(metadata.height / rows);
        const mediaIds = [];

        // Split and upload each piece to X
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                try {
                    const imagePieceBuffer = await image
                        .clone()
                        .extract({ 
                            left: j * pieceWidth, 
                            top: i * pieceHeight, 
                            width: pieceWidth, 
                            height: pieceHeight 
                        })
                        .jpeg({ quality: 90 }) // Use JPEG for smaller file size
                        .toBuffer();
                    
                    // Create form data for media upload
                    const formData = new FormData();
                    formData.append('media', imagePieceBuffer, {
                        filename: `piece_${i}_${j}.jpg`,
                        contentType: 'image/jpeg'
                    });
                    
                    // Upload to Twitter using v1.1 API
                    const uploadResponse = await axios.post(
                        'https://upload.twitter.com/1.1/media/upload.json',
                        formData,
                        {
                            headers: {
                                ...formData.getHeaders(),
                                'Authorization': `Bearer ${req.session.accessToken}`
                            },
                            maxContentLength: Infinity,
                            maxBodyLength: Infinity
                        }
                    );
                    
                    if (uploadResponse.data.media_id_string) {
                        mediaIds.push(uploadResponse.data.media_id_string);
                        console.log(`Uploaded piece ${i+1},${j+1}: ${uploadResponse.data.media_id_string}`);
                    }
                } catch (uploadError) {
                    console.error(`Error uploading piece ${i},${j}:`, uploadError.response?.data || uploadError.message);
                    throw new Error(`Failed to upload image piece ${i+1},${j+1}`);
                }
            }
        }

        // Post the tweet with the uploaded media IDs using API v2
        const tweetResponse = await axios.post(
            'https://api.twitter.com/2/tweets',
            {
                text: tweetText,
                media: { media_ids: mediaIds }
            },
            {
                headers: {
                    'Authorization': `Bearer ${req.session.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('Tweet posted successfully:', tweetResponse.data);
        res.status(200).json({ 
            message: 'Tweet posted successfully!',
            tweetId: tweetResponse.data.data?.id
        });
    } catch (error) {
        console.error('Error posting tweet:', error.response?.data || error.message);
        
        let errorMessage = 'Failed to post tweet.';
        if (error.response?.status === 403) {
            errorMessage = 'Permission denied. Please ensure your X app has write permissions.';
        } else if (error.response?.status === 429) {
            errorMessage = 'Rate limit exceeded. Please try again later.';
        } else if (error.response?.data?.detail) {
            errorMessage = error.response.data.detail;
        }
        
        res.status(error.response?.status || 500).json({ 
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.response?.data : undefined
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        session: req.session ? 'active' : 'inactive'
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
        }
        return res.status(400).json({ error: error.message });
    }
    
    console.error('Unhandled error:', error);
    res.status(500).json({ 
        error: 'An unexpected error occurred.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
});

// For local development
if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`🚀 Server is running on http://localhost:${port}`);
        console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
        if (!process.env.X_CLIENT_ID || !process.env.X_CLIENT_SECRET) {
            console.warn('⚠️  Warning: X API credentials not configured. X integration will not work.');
        }
    });
}

// Export for Vercel serverless deployment
module.exports = app;
