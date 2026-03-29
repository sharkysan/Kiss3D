import React, { useState, useEffect } from 'react';
import { Cloud, Loader2 } from 'lucide-react';

interface GoogleDrivePickerProps {
  onFileSelect: (url: string) => void;
}

declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';

export const GoogleDrivePicker: React.FC<GoogleDrivePickerProps> = ({ onFileSelect }) => {
  const [isGisLoaded, setIsGisLoaded] = useState(false);
  const [isGapiLoaded, setIsGapiLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tokenClient, setTokenClient] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    // Load GIS script
    const gisScript = document.createElement('script');
    gisScript.src = 'https://accounts.google.com/gsi/client';
    gisScript.async = true;
    gisScript.defer = true;
    gisScript.onload = () => setIsGisLoaded(true);
    document.body.appendChild(gisScript);

    // Load GAPI script
    const gapiScript = document.createElement('script');
    gapiScript.src = 'https://apis.google.com/js/api.js';
    gapiScript.async = true;
    gapiScript.defer = true;
    gapiScript.onload = () => {
      window.gapi.load('client:picker', () => {
        setIsGapiLoaded(true);
      });
    };
    document.body.appendChild(gapiScript);

    return () => {
      document.body.removeChild(gisScript);
      document.body.removeChild(gapiScript);
    };
  }, []);

  useEffect(() => {
    if (isGisLoaded && CLIENT_ID) {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (response: any) => {
          if (response.access_token) {
            setAccessToken(response.access_token);
            createPicker(response.access_token);
          }
        },
      });
      setTokenClient(client);
    }
  }, [isGisLoaded]);

  const handleOpenPicker = () => {
    if (!CLIENT_ID || !API_KEY) {
      alert('Please configure Google Client ID and API Key in the settings.');
      return;
    }

    if (accessToken) {
      createPicker(accessToken);
    } else {
      tokenClient.requestAccessToken();
    }
  };

  const createPicker = (token: string) => {
    const view = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS);
    view.setMimeTypes('application/octet-stream,model/gltf-binary,model/gltf+json');
    view.setQuery('.glb .gltf');

    const picker = new window.google.picker.PickerBuilder()
      .enableFeature(window.google.picker.Feature.NAV_HIDDEN)
      .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
      .setDeveloperKey(API_KEY)
      .setAppId(CLIENT_ID)
      .setOAuthToken(token)
      .addView(view)
      .setCallback((data: any) => {
        if (data.action === window.google.picker.Action.PICKED) {
          const file = data.docs[0];
          const fileId = file.id;
          // Google Drive direct download URL format
          const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${API_KEY}`;
          // Note: For private files, we might need to append the access token or handle it via a proxy
          // But for now, let's try the direct URL with the API key if it's public-ish or the token approach
          
          // Actually, the best way for Three.js to load it with the token is to use a data URL or a blob URL
          fetchFile(fileId, token);
        }
      })
      .build();
    picker.setVisible(true);
  };

  const fetchFile = async (fileId: string, token: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      onFileSelect(url);
    } catch (error) {
      console.error('Error fetching file from Google Drive:', error);
      alert('Failed to load file from Google Drive.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleOpenPicker}
      disabled={isLoading || !isGisLoaded || !isGapiLoaded}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 
        bg-white/5 hover:bg-white/10 transition-all text-xs font-mono uppercase tracking-widest
        ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {isLoading ? (
        <Loader2 className="animate-spin" size={14} />
      ) : (
        <Cloud size={14} />
      )}
      {isLoading ? 'Loading...' : 'Load from Drive'}
    </button>
  );
};
