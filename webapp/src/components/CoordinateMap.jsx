import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Box, Typography, TextField, Button } from '@mui/material'

// Fix leaflet default icon URLs when using CDN or bundlers
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

function MapClickHandler ({ onMapClick }) {
  useMapEvents({
    click (e) {
      const { lat, lng } = e.latlng
      if (typeof onMapClick === 'function') onMapClick([lng, lat]) // GeoJSON order
    }
  })
  return null
}

const DEFAULT_LAT = 40.4168
const DEFAULT_LNG = -3.70379

const CoordinateMap = ({ coordinates, onCoordinatesChange, onLocationChange }) => {
  const [lat, setLat] = useState(DEFAULT_LAT)
  const [lng, setLng] = useState(DEFAULT_LNG)
  const [manualInput, setManualInput] = useState('')
  const [mapInstance, setMapInstance] = useState(null)
  const [hasMarker, setHasMarker] = useState(false)

  // Initialize from props
  useEffect(() => {
    if (coordinates && coordinates.coordinates && coordinates.coordinates.length === 2) {
      const [cLng, cLat] = coordinates.coordinates
      setLng(cLng)
      setLat(cLat)
      setHasMarker(true)
      if (mapInstance && typeof mapInstance.setView === 'function') {
        try {
          mapInstance.setView([cLat, cLng])
          // invalidateSize to ensure proper rendering when inside dialogs
          setTimeout(() => mapInstance.invalidateSize(), 150)
        } catch (err) {
          // ignore
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coordinates])

  // Ensure map resizes when instance becomes available
  useEffect(() => {
    if (mapInstance && typeof mapInstance.invalidateSize === 'function') {
      setTimeout(() => mapInstance.invalidateSize(), 150)
    }
  }, [mapInstance])

  const handleMapClick = (newCoordinates) => {
    const [cLng, cLat] = newCoordinates
    setLng(cLng)
    setLat(cLat)
    setHasMarker(true)
    if (typeof onCoordinatesChange === 'function') {
      onCoordinatesChange({ type: 'Point', coordinates: [cLng, cLat] })
    }
    // Try reverse geocoding to populate the textual location field
    if (typeof onLocationChange === 'function') {
      try {
        fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(cLat)}&lon=${encodeURIComponent(cLng)}`)
          .then(res => res.json())
          .then(data => {
            if (data && data.display_name) onLocationChange({ target: { value: data.display_name } })
          })
          .catch(() => {
            // ignore reverse geocode failures
          })
      } catch (err) {
        // ignore
      }
    }
  }

  const handleManualInput = () => {
    const parts = manualInput.trim().split(',')
    if (parts.length !== 2) {
      alert('Formato incorrecto. Usa: latitud,longitud (ej: 40.4168,-3.1836)')
      return
    }
    const inputLat = parseFloat(parts[0].trim())
    const inputLng = parseFloat(parts[1].trim())
    if (
      isNaN(inputLat) || isNaN(inputLng) ||
      inputLat < -90 || inputLat > 90 ||
      inputLng < -180 || inputLng > 180
    ) {
      alert('Coordenadas inválidas. Rango: latitud [-90, 90], longitud [-180, 180]')
      return
    }
    setLat(inputLat)
    setLng(inputLng)
    setHasMarker(true)
    if (typeof onCoordinatesChange === 'function') {
      onCoordinatesChange({ type: 'Point', coordinates: [inputLng, inputLat] })
    }
    // Reverse geocode manual coordinates to fill location
    if (typeof onLocationChange === 'function') {
      try {
        fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(inputLat)}&lon=${encodeURIComponent(inputLng)}`)
          .then(res => res.json())
          .then(data => {
            if (data && data.display_name) onLocationChange({ target: { value: data.display_name } })
          })
          .catch(() => {})
      } catch (err) {}
    }
    setManualInput('')
  }

  const handleClear = () => {
    setHasMarker(false)
    if (typeof onCoordinatesChange === 'function') onCoordinatesChange(null)
    setManualInput('')
    if (typeof onLocationChange === 'function') onLocationChange({ target: { value: '' } })
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle1">Coordenadas del Evento (Opcional)</Typography>
      <Typography variant="caption" display="block" sx={{ mb: 1, color: 'text.secondary' }}>
        Haz clic en el mapa para seleccionar una ubicación, o ingresa las coordenadas manualmente.
      </Typography>

      <Box sx={{ mb: 2, border: '1px solid #ccc', borderRadius: 1, overflow: 'hidden', height: 300 }}>
        <MapContainer
          center={[lat, lng]}
          zoom={13}
          style={{ width: '100%', height: '100%' }}
          whenCreated={(map) => { setMapInstance(map); setTimeout(() => map.invalidateSize(), 150) }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
          {hasMarker && (
            <Marker position={[lat, lng]}>
              <Popup>Lat: {lat.toFixed(4)}, Lng: {lng.toFixed(4)}</Popup>
            </Marker>
          )}
          <MapClickHandler onMapClick={handleMapClick} />
        </MapContainer>
      </Box>

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
        <Button variant="outlined" size="small" onClick={handleManualInput} sx={{ minWidth: 80 }}>
          Ingresar
        </Button>
      </Box>

      {hasMarker && (
        <Box sx={{ p: 1, bgcolor: 'background.paper', border: '1px solid #ddd', borderRadius: 1, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2">📍 Lat: {lat.toFixed(4)}, Lng: {lng.toFixed(4)}</Typography>
          <Button variant="text" size="small" color="error" onClick={handleClear}>Limpiar</Button>
        </Box>
      )}
    </Box>
  )
}

export default CoordinateMap
