# gridX - Split & Post App 🎨

A modern, beautifully designed web application for splitting images into grids and posting them directly to X (formerly Twitter). Perfect for creating stunning image carousels and grid layouts for social media.

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)

## ✨ Features

- **🖼️ Image Splitting**: Split any image into customizable grid layouts (1x2, 2x2, 3x3, etc.)
- **📦 ZIP Download**: Download split images as a ZIP file for manual posting
- **🐦 Direct X Integration**: Post split images directly to X/Twitter with OAuth 2.0
- **🎨 Modern UI**: Beautiful, responsive design with animations and dark mode
- **🔄 Real-time Preview**: See how your image will be split with interactive grid overlay
- **🎯 Smart Grid Presets**: Quick selection of popular grid layouts
- **🔍 Zoom & Rotate**: Preview controls for better image inspection
- **💫 Smooth Animations**: Framer Motion powered animations for delightful UX
- **📱 Fully Responsive**: Works perfectly on desktop, tablet, and mobile devices

## 🚀 What's Fixed & New in v2.0

### Backend Improvements
- ✅ **FIXED**: Image processing and ZIP download now works perfectly
- ✅ **FIXED**: "Unable to download processed files" error resolved
- ✅ Enhanced error handling with detailed error messages
- ✅ Improved CORS configuration for better security
- ✅ Added file size limits (10MB) and validation
- ✅ Fixed X/Twitter API integration with proper media upload
- ✅ Added health check endpoint for monitoring
- ✅ Better session management with secure cookies

### Frontend Complete Redesign
- ✅ **NEW**: Complete UI overhaul - no more generic design!
- ✅ Modern glassmorphism design with dark theme
- ✅ Animated gradient background effects
- ✅ Framer Motion animations throughout
- ✅ React Dropzone for drag-and-drop uploads
- ✅ Toast notifications for better feedback
- ✅ Beautiful Lucide React icons
- ✅ Interactive preview with zoom/rotate controls
- ✅ Real-time grid visualization with numbered pieces
- ✅ Tweet character counter
- ✅ User avatar display

## 🛠️ Quick Start

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Configure Backend
Create `.env` file in `backend/` folder:
```env
TWITTER_CLIENT_ID=your_x_client_id
TWITTER_CLIENT_SECRET=your_x_client_secret
SESSION_SECRET=generate-random-string-here
```

### 3. Start Development Servers
```bash
npm run dev
```

### 4. Open Application
Navigate to http://localhost:3000

## 📱 How to Use

1. **Upload Image**: Drag & drop or click to upload (PNG, JPG, GIF, WebP - max 10MB)
2. **Choose Grid**: Select preset (2×2, 3×3) or custom grid size
3. **Preview**: See live preview with grid overlay and piece numbers
4. **Action**:
   - **Download ZIP**: Get all pieces as a ZIP file
   - **Post to X**: Login and post directly (max 4 images per tweet)

## 🔧 API Endpoints

- `POST /api/split` - Split image and download ZIP
- `POST /api/post-tweet` - Post to X/Twitter
- `GET /api/health` - Server health check
- `GET /api/auth/twitter` - X OAuth login
- `GET /api/user` - Get session info
- `POST /api/logout` - End session

## 🐛 Common Issues & Solutions

### "Unable to download" - FIXED! ✅
This error has been completely resolved in v2.0. The backend now properly processes images and generates ZIP files.

### "Generic design" - FIXED! ✅
The entire frontend has been redesigned with a modern, professional look featuring animations, gradients, and glassmorphism effects.

### X Posting Limits
X only allows 4 images per tweet. Use 2×2 grid or smaller for direct posting.

### Need X Credentials?
1. Go to [developer.twitter.com](https://developer.twitter.com)
2. Create an app with OAuth 2.0
3. Add `http://localhost:5000/api/auth/twitter/callback` as redirect URL
4. Copy credentials to `.env`

## 📦 Project Structure
```
split-and-post-app/
├── backend/
│   ├── server.js       # Fixed API with error handling
│   └── .env           # Your credentials
├── frontend/
│   ├── src/
│   │   ├── App.jsx    # New modern React component
│   │   └── App.css    # Beautiful new styles
│   └── package.json
└── README.md
```

## 🎨 Tech Stack

**Frontend:**
- React 19
- Framer Motion
- React Dropzone
- React Hot Toast
- Lucide React Icons

**Backend:**
- Node.js + Express
- Sharp (image processing)
- JSZip
- X API v2 OAuth
- Express Session

## 📄 License

MIT License - Use freely!

---

**The app is now fully functional with a beautiful modern design! 🎉**

Made with ❤️ - Enjoy splitting and posting your images!
# gridX
# gridX
# project_gridX
