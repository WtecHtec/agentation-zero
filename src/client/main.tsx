
import React from 'react';
import ReactDOM from 'react-dom/client';
import { PageFeedbackToolbarCSS } from './components/page-toolbar-css';

// Ensure the container exists
const containerId = 'agentation-root';
let container = document.getElementById(containerId);

if (!container) {
  container = document.createElement('div');
  container.id = containerId;
  document.body.appendChild(container);

  // Use createRoot for React 18+
  const root = ReactDOM.createRoot(container);
  
  // Render the toolbar
  // We can read initial props from window if needed, but for now defaults are fine.
  // The sync util will automatically discovering the API URL.
  root.render(
    <React.StrictMode>
      <PageFeedbackToolbarCSS 
        enableDemoMode={false}
      />
    </React.StrictMode>
  );
}
