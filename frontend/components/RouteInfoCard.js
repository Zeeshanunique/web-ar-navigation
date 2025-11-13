const RouteInfoCard = ({ route, onClose }) => {
  if (!route || !route.path) {
    return null;
  }

  return (
    <div className="route-info-card">
      <div className="route-info-header">
        <h3>Route Information</h3>
        {onClose && (
          <button onClick={onClose} className="route-info-close">
            ×
          </button>
        )}
      </div>

      <div className="route-info-content">
        <div className="route-info-item">
          <span className="route-info-label">Distance:</span>
          <span className="route-info-value">{route.distance}m</span>
        </div>

        <div className="route-info-item">
          <span className="route-info-label">Steps:</span>
          <span className="route-info-value">{route.steps}</span>
        </div>

        <div className="route-info-path">
          <h4>Path:</h4>
          <ol className="route-info-steps">
            {route.path.map((point, index) => (
              <li key={index} className="route-info-step">
                <span className="route-info-step-name">{point.name}</span>
                {point.direction && (
                  <span className="route-info-step-direction">
                    → {point.direction}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>

      <style jsx>{`
        .route-info-card {
          position: fixed;
          bottom: 20px;
          left: 20px;
          right: 20px;
          max-width: 400px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
          z-index: 200;
          max-height: 60vh;
          overflow-y: auto;
        }

        .route-info-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid #eee;
        }

        .route-info-header h3 {
          margin: 0;
          font-size: 18px;
          color: #333;
        }

        .route-info-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .route-info-close:hover {
          background: #f0f0f0;
        }

        .route-info-content {
          padding: 16px;
        }

        .route-info-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .route-info-label {
          font-weight: 600;
          color: #666;
        }

        .route-info-value {
          color: #333;
          font-weight: 500;
        }

        .route-info-path {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #eee;
        }

        .route-info-path h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .route-info-steps {
          margin: 0;
          padding-left: 20px;
        }

        .route-info-step {
          margin-bottom: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .route-info-step-name {
          font-weight: 500;
          color: #333;
        }

        .route-info-step-direction {
          font-size: 12px;
          color: #666;
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default RouteInfoCard;

