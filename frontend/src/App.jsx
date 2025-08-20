import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import toast, { Toaster } from 'react-hot-toast';
import { 
    Grid3x3, 
    Download, 
    Twitter, 
    Upload, 
    Image as ImageIcon,
    Loader2,
    CheckCircle,
    XCircle,
    LogOut,
    Sparkles,
    ZoomIn,
    ZoomOut,
    RotateCw,
    Hash
} from 'lucide-react';
import './App.css';

function App() {
    // Authentication State
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Image & Form State
    const [image, setImage] = useState(null);
    const [imageURL, setImageURL] = useState('');
    const [rows, setRows] = useState(2);
    const [cols, setCols] = useState(2);
    const [tweetText, setTweetText] = "Check out this amazing image grid! ✨🎨";
    const [isProcessing, setIsProcessing] = useState(false);
    const [previewZoom, setPreviewZoom] = useState(1);
    const [previewRotation, setPreviewRotation] = useState(0);
    const canvasRef = useRef(null);

    // Check for an active user session when the app loads
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/user', { credentials: 'include' });
                if (response.ok) {
                    const data = await response.json();
                    setUser(data.user);
                    toast.success(`Welcome back, @${data.user.username}!`);
                }
            } catch (error) {
                console.error("Could not fetch user session.", error);
            } finally {
                setIsLoading(false);
            }
        };
        
        // Check for auth errors or success in URL params
        const urlParams = new URLSearchParams(window.location.search);
        const authError = urlParams.get('auth_error');
        const authSuccess = urlParams.get('auth_success');
        
        if (authError) {
            let errorMessage = 'Authentication failed';
            if (authError === 'no_code') {
                errorMessage = 'No authorization code received. Please try again.';
            } else if (authError === 'session_expired') {
                errorMessage = 'Session expired. Please login again.';
            } else if (authError.includes('access_denied')) {
                errorMessage = 'Access denied. Please authorize the app to continue.';
            } else {
                errorMessage = `Authentication error: ${decodeURIComponent(authError)}`;
            }
            toast.error(errorMessage);
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (authSuccess) {
            toast.success('Successfully logged in!');
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
        
        fetchUser();
    }, []);

    // Draw the grid preview on the canvas
    useEffect(() => {
        if (imageURL && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            // Add crossOrigin to avoid CORS issues with local images
            img.crossOrigin = 'anonymous';
            
            const drawImageOnCanvas = () => {
                // Make canvas visible
                canvas.style.display = 'block';
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // Save the un-rotated context state
                ctx.save();

                // Translate to the center of the canvas and rotate
                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.rotate(previewRotation * Math.PI / 180);
                ctx.translate(-canvas.width / 2, -canvas.height / 2);

                // Draw the rotated image
                ctx.drawImage(img, 0, 0);

                // Restore the un-rotated context state
                ctx.restore();
                
                // Draw grid lines with gradient effect
                const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
                gradient.addColorStop(0, 'rgba(99, 102, 241, 0.8)');
                gradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.8)');
                gradient.addColorStop(1, 'rgba(236, 72, 153, 0.8)');
                
                ctx.strokeStyle = gradient;
                ctx.lineWidth = 3;
                ctx.shadowBlur = 10;
                ctx.shadowColor = 'rgba(168, 85, 247, 0.5)';
                
                // Draw vertical lines
                for (let i = 1; i < cols; i++) {
                    ctx.beginPath();
                    ctx.moveTo((canvas.width / cols) * i, 0);
                    ctx.lineTo((canvas.width / cols) * i, canvas.height);
                    ctx.stroke();
                }
                
                // Draw horizontal lines
                for (let i = 1; i < rows; i++) {
                    ctx.beginPath();
                    ctx.moveTo(0, (canvas.height / rows) * i);
                    ctx.lineTo(canvas.width, (canvas.height / rows) * i);
                    ctx.stroke();
                }
                
                // Add grid numbers
                const baseFontSize = Math.max(20, Math.min(img.width / cols / 4, img.height / rows / 4));
                ctx.font = `bold ${baseFontSize}px Inter, sans-serif`;
                ctx.fillStyle = 'white';
                ctx.shadowBlur = 5;
                ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
                
                let pieceNum = 1;
                for (let i = 0; i < rows; i++) {
                    for (let j = 0; j < cols; j++) {
                        const x = (canvas.width / cols) * j + (canvas.width / cols) / 2;
                        const y = (canvas.height / rows) * i + (canvas.height / rows) / 2;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(pieceNum.toString(), x, y);
                        pieceNum++;
                    }
                }
            };

            img.onload = drawImageOnCanvas;
            img.src = imageURL;

            if (img.complete) {
                drawImageOnCanvas();
            }
        }
    }, [imageURL, rows, cols, previewRotation, previewZoom]);

    // Dropzone configuration
    const onDrop = (acceptedFiles) => {
        if (acceptedFiles && acceptedFiles[0]) {
            const file = acceptedFiles[0];
            if (file.size > 10 * 1024 * 1024) {
                toast.error('File too large! Maximum size is 10MB.');
                return;
            }
            setImage(file);
            const newImageURL = URL.createObjectURL(file);
            setImageURL(newImageURL);
            toast.success('Image uploaded successfully!');

            // Workaround to force a re-render of the canvas
            setTimeout(() => {
                setRows(rows => rows + 0); // This will trigger a re-render
            }, 0);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
        },
        maxFiles: 1
    });

    // Handler to download ZIP file
    const handleDownload = async (e) => {
        e.preventDefault();
        if (!image) {
            toast.error('Please upload an image first.');
            return;
        }
        setIsProcessing(true);
        const loadingToast = toast.loading('Processing your image...');

        const formData = new FormData();
        formData.append('image', image);
        formData.append('rows', rows);
        formData.append('cols', cols);

        try {
            const response = await fetch('http://localhost:5000/api/split', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to process image.');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'image-pieces.zip';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            toast.success('Download started!', { id: loadingToast });
        } catch (error) {
            console.error('Download error:', error);
            toast.error(error.message || 'Failed to download image.', { id: loadingToast });
        } finally {
            setIsProcessing(false);
        }
    };

    // Handler to post the tweet
    const handlePostTweet = async (e) => {
        e.preventDefault();
        if (!image) {
            toast.error('Please upload an image first.');
            return;
        }
        
        if (rows * cols > 4) {
            toast.error('X only allows up to 4 images per tweet. Please use a 2x2 grid or smaller.');
            return;
        }

        setIsProcessing(true);
        const loadingToast = toast.loading('Posting to X...');

        const formData = new FormData();
        formData.append('image', image);
        formData.append('rows', rows);
        formData.append('cols', cols);
        formData.append('tweetText', tweetText);

        try {
            const response = await fetch('http://localhost:5000/api/post-tweet', {
                method: 'POST',
                body: formData,
                credentials: 'include',
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to post tweet.');
            }

            toast.success('Posted to X successfully! 🎉', { id: loadingToast });
            
            // Reset form
            setImage(null);
            setImageURL('');
            setTweetText("Check out this amazing image grid! ✨🎨");
        } catch (error) {
            console.error('Post error:', error);
            toast.error(error.message || 'Failed to post tweet.', { id: loadingToast });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleLogout = async () => {
        try {
            await fetch('http://localhost:5000/api/logout', { 
                method: 'POST',
                credentials: 'include' 
            });
            setUser(null);
            toast.success('Logged out successfully');
        } catch (error) {
            toast.error('Failed to logout');
        }
    };

    const GridPresetButton = ({ r, c, label }) => (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`grid-preset-btn ${rows === r && cols === c ? 'active' : ''}`}
            onClick={() => {
                setRows(r);
                setCols(c);
            }}
        >
            <Grid3x3 size={20} />
            <span>{label}</span>
        </motion.button>
    );

    if (isLoading) {
        return (
            <div className="loading-container">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                    <Loader2 size={48} />
                </motion.div>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="app min-h-screen w-full bg-[#f8fafc] relative">
            <Toaster 
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: '#ffffff',
                        color: '#1e293b',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    },
                }}
            />
            
            {/* Top Fade Grid Background */}
            <div
                className="absolute inset-0 z-0"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, #cbd5e1 1px, transparent 1px),
                        linear-gradient(to bottom, #cbd5e1 1px, transparent 1px)
                    `,
                    backgroundSize: "24px 24px",
                    WebkitMaskImage:
                        "radial-gradient(ellipse 80% 50% at 50% 0%, #000 70%, transparent 100%)",
                    maskImage:
                        "radial-gradient(ellipse 80% 50% at 50% 0%, #000 70%, transparent 100%)",
                }}
            />

            {/* Header */}
            <motion.header 
                className="app-header"
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <div className="header-content">
                    <div className="logo-section">
                        <motion.div
                            animate={{ rotate: [0, 360] }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        >
                            <Hash className="logo-icon" />
                        </motion.div>
                        <h1>gridX</h1>
                    </div>
                    
                    {user && (
                        <div className="user-section">
                            <div className="user-info">
                                <img 
                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} 
                                    alt="Avatar"
                                    className="user-avatar"
                                />
                                <span>@{user.username}</span>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="logout-btn"
                                onClick={handleLogout}
                            >
                                <LogOut size={18} />
                                Logout
                            </motion.button>
                        </div>
                    )}
                </div>
            </motion.header>

            {/* Main Content */}
            <main className="main-container">
                <div className="content-wrapper">
                    <div className="column">
                        {/* Upload Section */}
                        <motion.div 
                            className="upload-section card"
                            whileHover={{ scale: 1.01 }}
                        >
                            <h2 className="section-title">
                                <Upload size={20} />
                                Upload Image
                            </h2>
                            
                            <div 
                                {...getRootProps()} 
                                className={`dropzone ${isDragActive ? 'active' : ''} ${imageURL ? 'has-image' : ''}`}
                            >
                                <input {...getInputProps()} />
                                {imageURL ? (
                                    <div className="upload-preview">
                                        <img src={imageURL} alt="Preview" />
                                        <div className="upload-overlay">
                                            <Upload size={32} />
                                            <p>Click or drag to replace</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="upload-placeholder">
                                        <motion.div
                                            animate={{ y: [0, -10, 0] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        >
                                            <ImageIcon size={48} />
                                        </motion.div>
                                        <p className="upload-text">
                                            {isDragActive ? 'Drop your image here' : 'Drag & drop or click to upload'}
                                        </p>
                                        <p className="upload-hint">PNG, JPG, GIF up to 10MB</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Grid Settings */}
                        <div className="grid-settings card">
                            <h2 className="section-title">
                                <Grid3x3 size={20} />
                                Grid Settings
                            </h2>
                            
                            <div className="grid-presets">
                                <GridPresetButton r={2} c={2} label="2×2" />
                                <GridPresetButton r={3} c={3} label="3×3" />
                                <GridPresetButton r={2} c={3} label="2×3" />
                                <GridPresetButton r={1} c={3} label="1×3" />
                            </div>

                            <div className="grid-custom">
                                <div className="input-group">
                                    <label>Rows</label>
                                    <input 
                                        type="number" 
                                        value={rows} 
                                        onChange={(e) => setRows(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                                        min="1" 
                                        max="10"
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Columns</label>
                                    <input 
                                        type="number" 
                                        value={cols} 
                                        onChange={(e) => setCols(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                                        min="1" 
                                        max="10"
                                    />
                                </div>
                            </div>
                            
                            {rows * cols > 4 && (
                                <motion.div 
                                    className="warning-message"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <XCircle size={16} />
                                    <span>X only allows up to 4 images per tweet</span>
                                </motion.div>
                            )}
                        </div>
                    </div>
                    <div className="column">
                        {/* Right Panel - Preview */}
                        <div className="preview-panel">
                            <div className="preview-card card">
                                <div className="preview-header">
                                    <h2 className="section-title">
                                        <ImageIcon size={20} />
                                        Preview
                                    </h2>
                                    
                                    {imageURL && (
                                        <div className="preview-controls">
                                            <button 
                                                onClick={() => setPreviewZoom(Math.max(0.5, previewZoom - 0.1))}
                                                className="preview-control-btn"
                                            >
                                                <ZoomOut size={18} />
                                            </button>
                                            <button 
                                                onClick={() => setPreviewZoom(Math.min(2, previewZoom + 0.1))}
                                                className="preview-control-btn"
                                            >
                                                <ZoomIn size={18} />
                                            </button>
                                            <button 
                                                onClick={() => setPreviewRotation((r) => r + 90)}
                                                className="preview-control-btn"
                                            >
                                                <RotateCw size={18} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="preview-container">
                                    <AnimatePresence mode="wait">
                                        {imageURL ? (
                                            <motion.div
                                                key="preview"
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ 
                                                    opacity: 1, 
                                                    scale: previewZoom
                                                }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                                className="preview-wrapper"
                                            >
                                                <canvas ref={canvasRef} className="preview-canvas" />
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="placeholder"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="preview-placeholder"
                                            >
                                                <motion.div
                                                    animate={{ 
                                                        scale: [1, 1.1, 1],
                                                        rotate: [0, 5, -5, 0]
                                                    }}
                                                    transition={{ 
                                                        duration: 4,
                                                        repeat: Infinity,
                                                        ease: "easeInOut"
                                                    }}
                                                >
                                                    <ImageIcon size={64} />
                                                </motion.div>
                                                <p>No image uploaded</p>
                                                <p className="preview-hint">Upload an image to see the grid preview</p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                
                                {imageURL && (
                                    <div className="preview-info">
                                        <div className="info-item">
                                            <CheckCircle size={16} className="success-icon" />
                                            <span>{rows * cols} pieces will be created</span>
                                        </div>
                                        <div className="info-item">
                                            <Grid3x3 size={16} />
                                            <span>{rows} × {cols} grid</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Actions */}
                        <div className="actions-section card">
                            <h2 className="section-title">
                                <Sparkles size={20} />
                                Actions
                            </h2>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="action-btn download-btn"
                                onClick={handleDownload}
                                disabled={isProcessing || !image}
                            >
                                {isProcessing ? (
                                    <Loader2 className="spin" size={20} />
                                ) : (
                                    <Download size={20} />
                                )}
                                Download ZIP
                            </motion.button>

                            {user ? (
                                <>
                                    <div className="tweet-composer">
                                        <textarea
                                            value={tweetText}
                                            onChange={(e) => setTweetText(e.target.value)}
                                            placeholder="What's happening?"
                                            maxLength={280}
                                            rows={3}
                                        />
                                        <div className="char-count">
                                            {tweetText.length}/280
                                        </div>
                                    </div>
                                    
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="action-btn twitter-btn"
                                        onClick={handlePostTweet}
                                        disabled={isProcessing || !image || rows * cols > 4}
                                    >
                                        {isProcessing ? (
                                            <Loader2 className="spin" size={20} />
                                        ) : (
                                            <Twitter size={20} />
                                        )}
                                        Post to X
                                    </motion.button>
                                </>
                            ) : (
                                <motion.a
                                    href="http://localhost:5000/api/auth/twitter"
                                    className="action-btn twitter-login-btn"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <Twitter size={20} />
                                    Login with X to Post
                                </motion.a>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            
        </div>
    );
}

export default App;