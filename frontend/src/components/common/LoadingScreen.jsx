import React, { useState, useEffect } from 'react';
import "../../styles/Chat.css";

const LoadingScreen = () => {
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState("Initializing workspace...");

    useEffect(() => {
        const timer = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 95) return prev;
                return prev + Math.random() * 15;
            });
        }, 200);

        const statusTimer = setInterval(() => {
            const statuses = [
                "Establishing secure connection...",
                "Fetching user profiles...",
                "Syncing encrypted messages...",
                "Loading premium assets...",
                "Finalizing environment..."
            ];
            setStatus(statuses[Math.floor(Math.random() * statuses.length)]);
        }, 1500);

        return () => {
            clearInterval(timer);
            clearInterval(statusTimer);
        };
    }, []);

    return (
        <div className="loading-screen-overlay">
            <div className="chat-bg"></div>
            <div className="loading-card glassmorphism">
                <div className="loading-logo">
                    <div className="logo-glow"></div>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="logo-svg">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                </div>
                
                <h2 className="loading-title">Realtime Chat</h2>
                <p className="loading-status">{status}</p>
                
                <div className="progress-container">
                    <div 
                        className="progress-bar-fill" 
                        style={{ width: `${progress}%` }}
                    >
                        <div className="progress-shimmer"></div>
                    </div>
                </div>
                
                <p className="loading-footer">Premium Communication Platform</p>
            </div>
        </div>
    );
};

export default LoadingScreen;
