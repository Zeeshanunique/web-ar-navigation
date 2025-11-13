import { useState } from 'react';
import { useRouter } from 'next/router';
import QRScanner from '../components/QRScanner';
import DestinationSelector from '../components/DestinationSelector';
import { getLocationByQRId } from '../utils/routeUtils';

export default function Home() {
  const router = useRouter();
  const [sourceLocation, setSourceLocation] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState(null);

  const handleQRScan = async (locationId, qrCode) => {
    try {
      setStatus('Loading location...');
      const location = await getLocationByQRId(locationId);
      setSourceLocation(location);
      setScanning(false);
      setStatus(`Starting location: ${location.name}`);
    } catch (error) {
      console.error('Error fetching location:', error);
      setStatus(`Error: ${error.message}`);
    }
  };

  const handleDestinationSelect = (locationId) => {
    setDestinationLocation(locationId);
  };

  const handleStartNavigation = () => {
    if (sourceLocation && destinationLocation) {
      router.push({
        pathname: '/navigation',
        query: {
          source: sourceLocation.locationId,
          destination: destinationLocation,
        },
      });
    }
  };

  const handleScanAgain = () => {
    setSourceLocation(null);
    setScanning(true);
    setStatus(null);
  };

  return (
    <div className="home-container">
      <div className="home-content">
        <h1 className="home-title">🧭 AR Navigation</h1>
        <p className="home-subtitle">Scan a QR code to start navigation</p>

        {!sourceLocation ? (
          <div className="home-scanner">
            <div className="home-scanner-container">
              <QRScanner
                onScan={handleQRScan}
                onError={(error) => setStatus(`Error: ${error.message}`)}
                scanning={scanning || !sourceLocation}
              />
            </div>
            <button
              onClick={() => setScanning(!scanning)}
              className="home-button"
            >
              {scanning ? 'Stop Scanning' : 'Start Scanning'}
            </button>
          </div>
        ) : (
          <div className="home-destination">
            <div className="home-source-info">
              <h3>Starting Location:</h3>
              <p>{sourceLocation.name}</p>
            </div>

            <DestinationSelector
              onSelect={handleDestinationSelect}
              selectedLocationId={destinationLocation}
            />

            <div className="home-actions">
              <button
                onClick={handleStartNavigation}
                disabled={!destinationLocation}
                className="home-button home-button-primary"
              >
                Start Navigation
              </button>
              <button
                onClick={handleScanAgain}
                className="home-button home-button-secondary"
              >
                Scan Again
              </button>
            </div>
          </div>
        )}

        {status && (
          <div className={`home-status ${status.includes('Error') ? 'home-status-error' : ''}`}>
            {status}
          </div>
        )}
      </div>

      <style jsx>{`
        .home-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .home-content {
          width: 100%;
          max-width: 600px;
          background: white;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }

        .home-title {
          font-size: 32px;
          margin-bottom: 8px;
          text-align: center;
          color: #333;
        }

        .home-subtitle {
          text-align: center;
          color: #666;
          margin-bottom: 32px;
        }

        .home-scanner-container {
          width: 100%;
          height: 400px;
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 16px;
          border: 3px solid #ddd;
        }

        .home-button {
          width: 100%;
          padding: 14px;
          font-size: 16px;
          font-weight: 600;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .home-button-primary {
          background: #0070f3;
          color: white;
        }

        .home-button-primary:hover:not(:disabled) {
          background: #0051cc;
        }

        .home-button-secondary {
          background: #f0f0f0;
          color: #333;
          margin-top: 12px;
        }

        .home-button-secondary:hover {
          background: #e0e0e0;
        }

        .home-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .home-destination {
          margin-top: 24px;
        }

        .home-source-info {
          background: #f5f5f5;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 24px;
        }

        .home-source-info h3 {
          font-size: 14px;
          color: #666;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .home-source-info p {
          font-size: 18px;
          font-weight: 600;
          color: #333;
          margin: 0;
        }

        .home-actions {
          margin-top: 24px;
        }

        .home-status {
          margin-top: 16px;
          padding: 12px;
          border-radius: 8px;
          text-align: center;
          background: #e3f2fd;
          color: #1976d2;
        }

        .home-status-error {
          background: #ffebee;
          color: #d32f2f;
        }
      `}</style>
    </div>
  );
}

