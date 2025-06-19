import React from 'react';

export default function DebugEnv() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  
  // Chỉ hiện trong development hoặc khi có query param ?debug=true
  const shouldShow = import.meta.env.DEV || new URLSearchParams(window.location.search).get('debug') === 'true';
  
  if (!shouldShow) return null;
  
  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: '#f0f0f0',
      padding: '10px',
      border: '1px solid #ccc',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999
    }}>
      <div><strong>Debug Environment Variables:</strong></div>
      <div>VITE_GOOGLE_CLIENT_ID: {clientId ? '✅ Set' : '❌ Missing'}</div>
      <div>Environment: {import.meta.env.MODE}</div>
      <div>Value: {clientId ? `${clientId.substring(0, 10)}...` : 'undefined'}</div>
    </div>
  );
} 