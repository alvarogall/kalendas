import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Box, Typography, TextField, Button } from '@mui/material';

// Fix leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Componente interno para detectar clics en el mapa
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onMapClick([lng, lat]); // GeoJSON: [longitud, latitud]
    },
  });
  return null;
}

const CoordinateMap = ({ coordinates, onCoordinatesChange }) => {
  const [lat, setLat] = useState(40.4168); // Madrid por defecto
  const [lng, setLng] = useState(-3.1836);
  const [manualInput, setManualInput] = useState('');
  const [mapInstance, setMapInstance] = useState(null)
  const [hasMarker, setHasMarker] = useState(false)

  // Si ya hay coordenadas, inicializar el mapa en esa ubicación
  useEffect(() => {
    if (coordinates && coordinates.coordinates && coordinates.coordinates.length === 2) {
      setLng(coordinates.coordinates[0]);
      setLat(coordinates.coordinates[1]);
      setHasMarker(true)
      if (mapInstance) {
        try {
          mapInstance.setView([coordinates.coordinates[1], coordinates.coordinates[0]])
          setTimeout(() => mapInstance.invalidateSize(), 100)
        } catch (err) { /* ignore */ }
      }
    }
  }, [coordinates]);

  const handleMapClick = (newCoordinates) => {
    setLng(newCoordinates[0]);
    setLat(newCoordinates[1]);
    setHasMarker(true)
    if (typeof onCoordinatesChange === 'function') {
      onCoordinatesChange({
        type: 'Point',
        coordinates: newCoordinates, // [longitud, latitud]
      });
    }
  };

  const handleManualInput = () => {
    // Esperar formato: "latitud,longitud" o "lat,lng"
    const parts = manualInput.trim().split(',');
    if (parts.length === 2) {
      const inputLat = parseFloat(parts[0].trim());
      const inputLng = parseFloat(parts[1].trim());

      if (
        !isNaN(inputLat) &&
        !isNaN(inputLng) &&
        inputLat >= -90 &&
        inputLat <= 90 &&
        inputLng >= -180 &&
        inputLng <= 180
      ) {
        setLat(inputLat);
        setLng(inputLng);
        setHasMarker(true)
        if (typeof onCoordinatesChange === 'function') {
          onCoordinatesChange({
            type: 'Point',
            coordinates: [inputLng, inputLat],
          });
        }
        setManualInput('');
      } else {
        alert('Coordenadas inválidas. Rango: latitud [-90, 90], longitud [-180, 180]');
      }
    } else {
      alert('Formato incorrecto. Usa: latitud,longitud (ej: 40.4168,-3.1836)');
    }
  };

  const handleClear = () => {
    if (typeof onCoordinatesChange === 'function') onCoordinatesChange(null);
    setManualInput('');
    setHasMarker(false)
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle1">Coordenadas del Evento (Opcional)</Typography>
      <Typography variant="caption" display="block" sx={{ mb: 1, color: 'text.secondary' }}>
        Haz clic en el mapa para seleccionar una ubicación, o ingresa las coordenadas manualmente.
      </Typography>

      {/* Mapa interactivo */}
      <Box
        sx={{
          mb: 2,
          border: '1px solid #ccc',
          borderRadius: 1,
          overflow: 'hidden',
          height: 300,
        }}
      >
        <MapContainer
          center={[lat, lng]}
          zoom={13}
          style={{ width: '100%', height: '100%' }}
          whenCreated={(map) => { setMapInstance(map); setTimeout(() => map.invalidateSize(), 150) }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          {hasMarker && (
            <Marker position={[lat, lng]}>
              <Popup>
                Lat: {lat.toFixed(4)}, Lng: {lng.toFixed(4)}
              </Popup>
            </Marker>
          )}
          <MapClickHandler onMapClick={handleMapClick} />
        </MapContainer>
      </Box>

      {/* Entrada manual de coordenadas */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField
          label="Coordenadas (lat,lng)"
          placeholder="40.4168,-3.1836"
          variant="outlined"
          size="small"
          fullWidth
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleManualInput()}
        />
        <Button
          variant="outlined"
          size="small"
          onClick={handleManualInput}
          sx={{ minWidth: 80 }}
        >
          Ingresar
        </Button>
      </Box>

      {/* Mostrar coordenadas actuales */}
      {hasMarker && (
        <Box
          sx={{
            p: 1,
            bgcolor: 'background.paper',
            border: '1px solid #ddd',
            borderRadius: 1,
            mb: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="body2">
            📍 Lat: {lat.toFixed(4)}, Lng: {lng.toFixed(4)}
          </Typography>
          <Button
            variant="text"
            size="small"
            color="error"
            onClick={handleClear}
          >
            Limpiar
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default CoordinateMap;
