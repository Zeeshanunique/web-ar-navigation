import { useEffect, useRef, useState } from 'react';

const CameraFeed = ({ onFrame, children }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    startCamera();

    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsActive(true);

        // Call onFrame callback if provided
        if (onFrame) {
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');

          const captureFrame = () => {
            if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
              canvas.width = videoRef.current.videoWidth;
              canvas.height = videoRef.current.videoHeight;
              context.drawImage(videoRef.current, 0, 0);
              onFrame(canvas);
            }
            if (isActive) {
              requestAnimationFrame(captureFrame);
            }
          };

          captureFrame();
        }
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setIsActive(false);
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
    setIsActive(false);
  };

  return (
    <div className="camera-feed">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="camera-feed-video"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
      {children}
      <style jsx>{`
        .camera-feed {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: #000;
        }

        .camera-feed-video {
          transform: scaleX(-1); /* Mirror for better UX */
        }
      `}</style>
    </div>
  );
};

export default CameraFeed;

