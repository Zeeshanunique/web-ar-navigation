import { useState, useEffect } from 'react';
import { getAllLocations } from '../utils/routeUtils';

const DestinationSelector = ({ onSelect, selectedLocationId, disabled }) => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      setLoading(true);
      const data = await getAllLocations();
      setLocations(data);
      setError(null);
    } catch (err) {
      console.error('Error loading locations:', err);
      setError('Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const locationId = e.target.value;
    if (locationId && onSelect) {
      onSelect(locationId);
    }
  };

  return (
    <div className="destination-selector">
      <label htmlFor="destination-select" className="destination-label">
        Select Destination:
      </label>
      <select
        id="destination-select"
        value={selectedLocationId || ''}
        onChange={handleChange}
        disabled={disabled || loading}
        className="destination-select"
      >
        <option value="">-- Choose a destination --</option>
        {locations.map((location) => (
          <option key={location.locationId} value={location.locationId}>
            {location.name}
          </option>
        ))}
      </select>

      {loading && <p className="destination-loading">Loading locations...</p>}
      {error && <p className="destination-error">{error}</p>}

      <style jsx>{`
        .destination-selector {
          padding: 16px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .destination-label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #333;
        }

        .destination-select {
          width: 100%;
          padding: 12px;
          font-size: 16px;
          border: 2px solid #ddd;
          border-radius: 6px;
          background: white;
          cursor: pointer;
          transition: border-color 0.2s;
        }

        .destination-select:focus {
          outline: none;
          border-color: #0070f3;
        }

        .destination-select:disabled {
          background: #f5f5f5;
          cursor: not-allowed;
        }

        .destination-loading,
        .destination-error {
          margin-top: 8px;
          font-size: 14px;
        }

        .destination-loading {
          color: #666;
        }

        .destination-error {
          color: #d32f2f;
        }
      `}</style>
    </div>
  );
};

export default DestinationSelector;

