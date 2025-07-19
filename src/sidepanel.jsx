import './index.css';
import React, { useState, useEffect } from 'react';
import ReactDOM from "react-dom/client";

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function DataLeakPanel() {
  const [requests, setRequests] = useState([]);
  const [cookies, setCookies] = useState([]);
  const [activeTab, setActiveTab] = useState('requests');

  useEffect(() => {
    const port = chrome.runtime.connect({ name: "side-panel" });
    
    // Request initial data
    port.postMessage({ type: "get-data" });
    
    // Listen for data updates
    port.onMessage.addListener((msg) => {
      if (msg.type === "data-update") {
        setRequests(msg.requests);
        setCookies(msg.cookies);
      }
    });
    
    // Set up periodic updates
    const interval = setInterval(() => {
      port.postMessage({ type: "get-data" });
    }, 1000);
    
    return () => {
      port.disconnect();
      clearInterval(interval);
    };
  }, []);

  // Calculate statistics
  const trackerRequests = requests.filter(r => r.isTracker);
  const totalData = requests.reduce((sum, req) => sum + req.size, 0);
  const trackerData = trackerRequests.reduce((sum, req) => sum + req.size, 0);
  const trackerCookies = cookies.filter(c => c.isTracker);

  return (
    <div className="data-leak-container">
      <h1>Data Leak Tracker</h1>
      
      <div className="stats-container">
        <div className="stat-card">
          <h3>Total Data</h3>
          <p>{formatBytes(totalData)}</p>
        </div>
        <div className="stat-card tracker-stat">
          <h3>Tracker Data</h3>
          <p>{formatBytes(trackerData)}</p>
          <p>{(trackerData / totalData * 100 || 0).toFixed(1)}%</p>
        </div>
        <div className="stat-card">
          <h3>Cookies</h3>
          <p>{cookies.length}</p>
        </div>
      </div>
      
      <div className="tabs">
        <button 
          className={activeTab === 'requests' ? 'active' : ''}
          onClick={() => setActiveTab('requests')}
        >
          Requests ({requests.length})
        </button>
        <button 
          className={activeTab === 'cookies' ? 'active' : ''}
          onClick={() => setActiveTab('cookies')}
        >
          Cookies ({cookies.length})
        </button>
      </div>
      
      <div className="data-container">
        {activeTab === 'requests' ? (
          <RequestList requests={requests} />
        ) : (
          <CookieList cookies={cookies} />
        )}
      </div>
    </div>
  );
}

function RequestList({ requests }) {
  return (
    <div className="request-list">
      <div className="list-header">
        <div>URL</div>
        <div>Size</div>
        <div>Type</div>
      </div>
      {requests.map((req, i) => (
        <div 
          key={i} 
          className={`request-item ${req.isTracker ? 'tracker' : ''}`}
        >
          <div className="url">{new URL(req.url).hostname}</div>
          <div>{formatBytes(req.size)}</div>
          <div>{req.isTracker ? 'Tracker' : 'Normal'}</div>
        </div>
      ))}
    </div>
  );
}

function CookieList({ cookies }) {
  return (
    <div className="cookie-list">
      <div className="list-header">
        <div>Domain</div>
        <div>Name</div>
        <div>Size</div>
      </div>
      {cookies.map((cookie, i) => (
        <div 
          key={i} 
          className={`cookie-item ${cookie.isTracker ? 'tracker' : ''}`}
        >
          <div>{cookie.domain}</div>
          <div>{cookie.name}</div>
          <div>{cookie.size} bytes</div>
        </div>
      ))}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<DataLeakPanel />);