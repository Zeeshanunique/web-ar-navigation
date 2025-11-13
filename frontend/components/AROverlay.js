import { useEffect, useRef } from 'react';

const AROverlay = ({ arrowAngle, distance, isDestinationReached, currentStep, totalSteps }) => {
  const arrowRef = useRef(null);

  useEffect(() => {
    if (arrowRef.current && arrowAngle !== null) {
      arrowRef.current.style.transform = `rotate(${arrowAngle}deg)`;
    }
  }, [arrowAngle]);

  if (isDestinationReached) {
    return (
      <div className="ar-overlay">
        <div className="ar-destination-reached">
          <div className="ar-checkmark">✓</div>
          <h2>Destination Reached!</h2>
        </div>
        <style jsx>{`
          .ar-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: none;
            z-index: 100;
          }

          .ar-destination-reached {
            background: rgba(0, 255, 0, 0.9);
            color: white;
            padding: 30px 40px;
            border-radius: 16px;
            text-align: center;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          }

          .ar-checkmark {
            font-size: 64px;
            margin-bottom: 16px;
          }

          .ar-destination-reached h2 {
            margin: 0;
            font-size: 24px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="ar-overlay">
      <div className="ar-arrow-container">
        <div ref={arrowRef} className="ar-arrow">
          ↑
        </div>
      </div>

      <div className="ar-info">
        <div className="ar-distance">
          {distance !== null ? `${Math.round(distance)}m` : '--'}
        </div>
        <div className="ar-progress">
          Step {currentStep + 1} of {totalSteps}
        </div>
      </div>

      <style jsx>{`
        .ar-overlay {
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
          z-index: 100;
        }

        .ar-arrow-container {
          position: relative;
          width: 200px;
          height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ar-arrow {
          font-size: 120px;
          color: #00ff00;
          text-shadow: 0 0 20px rgba(0, 255, 0, 0.8), 0 0 40px rgba(0, 255, 0, 0.6);
          transition: transform 0.1s ease-out;
          filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5));
        }

        .ar-info {
          margin-top: 40px;
          text-align: center;
        }

        .ar-distance {
          font-size: 32px;
          font-weight: bold;
          color: white;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
          background: rgba(0, 0, 0, 0.6);
          padding: 12px 24px;
          border-radius: 12px;
          margin-bottom: 8px;
        }

        .ar-progress {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.9);
          background: rgba(0, 0, 0, 0.5);
          padding: 8px 16px;
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
};

export default AROverlay;

