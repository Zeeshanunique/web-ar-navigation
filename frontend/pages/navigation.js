import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import CameraFeed from '../components/CameraFeed';
import AROverlay from '../components/AROverlay';
import RouteInfoCard from '../components/RouteInfoCard';
import QRScanner from '../components/QRScanner';
import { useARNavigator } from '../hooks/useARNavigator';
import { fetchRoute } from '../utils/routeUtils';

export default function Navigation() {
  const router = useRouter();
  const { source, destination } = router.query;

  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [showRouteInfo, setShowRouteInfo] = useState(true);
  const [scanningDestination, setScanningDestination] = useState(false);
  const [destinationReached, setDestinationReached] = useState(false);

  // Initialize route
  useEffect(() => {
    if (source && destination) {
      loadRoute(source, destination);
    }
  }, [source, destination]);

  const loadRoute = async (sourceId, destinationId) => {
    try {
      setLoading(true);
      setError(null);
      const routeData = await fetchRoute(sourceId, destinationId);
      setRoute(routeData);
      
      // Set initial position to source
      if (routeData.path && routeData.path.length > 0) {
        setCurrentPosition(routeData.path[0].coordinates);
      }
    } catch (err) {
      console.error('Error loading route:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDestinationQRScan = (locationId) => {
    if (locationId === destination) {
      setDestinationReached(true);
      setScanningDestination(false);
    }
  };

  const arNavigator = useARNavigator(route, currentPosition);

  // Simulate position updates (in real app, this would come from device sensors/GPS)
  useEffect(() => {
    if (!route || !route.path || route.path.length === 0) return;

    // For demo: simulate movement along the path
    // In production, this would use device sensors, GPS, or indoor positioning
    const interval = setInterval(() => {
      if (arNavigator.currentStep < route.path.length - 1 && !destinationReached) {
        const nextPoint = route.path[arNavigator.currentStep + 1];
        // Gradually move towards next point
        if (currentPosition) {
          const dx = nextPoint.coordinates.x - currentPosition.x;
          const dy = nextPoint.coordinates.y - currentPosition.y;
          const stepSize = 0.1; // Adjust for movement speed

          setCurrentPosition({
            x: currentPosition.x + dx * stepSize,
            y: currentPosition.y + dy * stepSize,
            z: currentPosition.z || 0,
          });
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [route, arNavigator.currentStep, currentPosition, destinationReached]);

  if (loading) {
    return (
      <div className="navigation-loading">
        <div className="navigation-spinner" />
        <p>Loading route...</p>
        <style jsx>{`
          .navigation-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background: #000;
            color: white;
          }

          .navigation-spinner {
            width: 50px;
            height: 50px;
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="navigation-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => router.push('/')} className="navigation-button">
          Go Back
        </button>
        <style jsx>{`
          .navigation-error {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            padding: 20px;
            background: #000;
            color: white;
            text-align: center;
          }

          .navigation-button {
            margin-top: 20px;
            padding: 12px 24px;
            background: #0070f3;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="navigation-container">
      <CameraFeed>
        {!destinationReached && (
          <AROverlay
            arrowAngle={arNavigator.arrowAngle}
            distance={arNavigator.distanceToNext}
            isDestinationReached={arNavigator.isDestinationReached || destinationReached}
            currentStep={arNavigator.currentStep}
            totalSteps={route?.path?.length || 0}
          />
        )}

        {scanningDestination && (
          <div className="navigation-qr-scanner-overlay">
            <QRScanner
              onScan={handleDestinationQRScan}
              scanning={scanningDestination}
            />
            <button
              onClick={() => setScanningDestination(false)}
              className="navigation-button navigation-button-secondary"
              style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 200 }}
            >
              Cancel
            </button>
          </div>
        )}
      </CameraFeed>

      <div className="navigation-controls">
        <button
          onClick={() => setShowRouteInfo(!showRouteInfo)}
          className="navigation-button navigation-button-secondary"
        >
          {showRouteInfo ? 'Hide' : 'Show'} Route Info
        </button>

        {!destinationReached && (
          <button
            onClick={() => setScanningDestination(true)}
            className="navigation-button navigation-button-primary"
          >
            Scan Destination QR
          </button>
        )}

        <button
          onClick={() => router.push('/')}
          className="navigation-button navigation-button-secondary"
        >
          End Navigation
        </button>
      </div>

      {showRouteInfo && route && (
        <RouteInfoCard
          route={route}
          onClose={() => setShowRouteInfo(false)}
        />
      )}

      <style jsx>{`
        .navigation-container {
          position: relative;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          background: #000;
        }

        .navigation-controls {
          position: absolute;
          top: 20px;
          left: 20px;
          right: 20px;
          z-index: 150;
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-width: 300px;
        }

        .navigation-button {
          padding: 12px 24px;
          font-size: 16px;
          font-weight: 600;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .navigation-button-primary {
          background: #0070f3;
          color: white;
        }

        .navigation-button-primary:hover {
          background: #0051cc;
        }

        .navigation-button-secondary {
          background: white;
          color: #333;
        }

        .navigation-button-secondary:hover {
          background: #f0f0f0;
        }

        .navigation-qr-scanner-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 180;
          background: rgba(0, 0, 0, 0.8);
        }
      `}</style>
    </div>
  );
}

