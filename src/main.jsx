import { Amplify } from 'aws-amplify';
import outputs from '../amplify_outputs.json';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import '@aws-amplify/ui-react/styles.css';

Amplify.configure(outputs);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);