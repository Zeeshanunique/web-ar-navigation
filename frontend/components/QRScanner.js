import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

const QRScanner = ({ onScan, onError, scanning = true }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!scanning) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [scanning]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setHasPermission(true);
        setError(null);
        scanQR();
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Camera access denied. Please enable camera permissions.');
      if (onError) onError(err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setHasPermission(false);
  };

  const scanQR = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || !hasPermission) return;

    const context = canvas.getContext('2d');

    const scan = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          try {
            const data = JSON.parse(code.data);
            if (data.locationId && onScan) {
              onScan(data.locationId, code);
              return; // Stop scanning after successful scan
            }
          } catch (e) {
            // If not JSON, treat as plain locationId
            if (onScan) {
              onScan(code.data, code);
              return;
            }
          }
        }
      }

      if (scanning) {
        requestAnimationFrame(scan);
      }
    };

    scan();
  };

  useEffect(() => {
    if (hasPermission && scanning) {
      scanQR();
    }
  }, [hasPermission, scanning]);

  return (
    <div className="qr-scanner">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="qr-scanner-video"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      {error && (
        <div className="qr-scanner-error">
          <p>{error}</p>
        </div>
      )}

      {scanning && hasPermission && (
        <div className="qr-scanner-overlay">
          <div className="qr-scanner-frame" />
          <p className="qr-scanner-hint">Point camera at QR code</p>
        </div>
      )}

      <style jsx>{`
        .qr-scanner {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: #000;
        }

        .qr-scanner-video {
          transform: scaleX(-1); /* Mirror for better UX */
        }

        .qr-scanner-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }

        .qr-scanner-frame {
          width: 250px;
          height: 250px;
          border: 3px solid #00ff00;
          border-radius: 12px;
          box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
        }

        .qr-scanner-hint {
          margin-top: 20px;
          color: #fff;
          font-size: 16px;
          text-align: center;
          background: rgba(0, 0, 0, 0.7);
          padding: 8px 16px;
          border-radius: 8px;
        }

        .qr-scanner-error {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(255, 0, 0, 0.9);
          color: white;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
          z-index: 10;
        }
      `}</style>
    </div>
  );
};

export default QRScanner;

