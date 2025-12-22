import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { MapPin, CornerDownLeft } from 'lucide-react'

// Fix leaflet default icon URLs
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
      if (typeof onMapClick === 'function') onMapClick([lng, lat]) 
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
          setTimeout(() => mapInstance.invalidateSize(), 150)
        } catch (err) {}
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coordinates])

  useEffect(() => {
    if (mapInstance && typeof mapInstance.invalidateSize === 'function') {
      setTimeout(() => {
        try {
          mapInstance.invalidateSize()
          if (coordinates && coordinates.coordinates && coordinates.coordinates.length === 2 && typeof mapInstance.setView === 'function') {
            const [cLng, cLat] = coordinates.coordinates
            mapInstance.setView([cLat, cLng])
          }
        } catch (err) {}
      }, 150)
    }
  }, [mapInstance, coordinates])

  const handleMapClick = (newCoordinates) => {
    const [cLng, cLat] = newCoordinates
    setLng(cLng)
    setLat(cLat)
    setHasMarker(true)
    if (typeof onCoordinatesChange === 'function') {
      onCoordinatesChange({ type: 'Point', coordinates: [cLng, cLat] })
    }
    // Reverse geocoding attempt
    if (typeof onLocationChange === 'function') {
      try {
        fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(cLat)}&lon=${encodeURIComponent(cLng)}`)
          .then(res => res.json())
          .then(data => {
            if (data && data.display_name) onLocationChange({ target: { value: data.display_name } })
          })
          .catch(() => {})
      } catch (err) {}
    }
  }

  const handleManualInput = () => {
    const parts = manualInput.trim().split(',')
    if (parts.length !== 2) {
      alert('Formato incorrecto. Usa: latitud,longitud')
      return
    }
    const inputLat = parseFloat(parts[0].trim())
    const inputLng = parseFloat(parts[1].trim())
    if (isNaN(inputLat) || isNaN(inputLng)) {
      alert('Coordenadas inválidas')
      return
    }
    setLat(inputLat)
    setLng(inputLng)
    setHasMarker(true)
    if (typeof onCoordinatesChange === 'function') {
      onCoordinatesChange({ type: 'Point', coordinates: [inputLng, inputLat] })
    }
    setManualInput('')
  }

  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2">
        <MapPin size={16} /> Coordenadas (Opcional)
      </h4>
      <p className="text-xs text-slate-500 mb-2">
        Haz clic en el mapa para marcar la ubicación exacta.
      </p>

      <div className="mb-3 border border-slate-200 rounded-xl overflow-hidden h-[300px] shadow-sm relative z-0">
        <MapContainer
          center={[lat, lng]}
          zoom={13}
          style={{ width: '100%', height: '100%' }}
          ref={setMapInstance}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
          {hasMarker && (
            <Marker position={[lat, lng]}>
              <Popup>Lat: {lat.toFixed(4)}, Lng: {lng.toFixed(4)}</Popup>
            </Marker>
          )}
          <MapClickHandler onMapClick={handleMapClick} />
        </MapContainer>
      </div>

      <div className="flex gap-2 mb-3">
        <Input
          placeholder="Manual: 40.4168,-3.1836"
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleManualInput()}
          className="flex-1"
        />
        <Button variant="secondary" onClick={handleManualInput} className="px-3">
          <CornerDownLeft size={16} />
        </Button>
      </div>

      {hasMarker && (
        <div className="flex items-center justify-between p-2 bg-blue-50 border border-blue-100 rounded-lg">
          <span className="text-xs font-medium text-blue-700">
            📍 {lat.toFixed(4)}, {lng.toFixed(4)}
          </span>
        </div>
      )}
    </div>
  )
}

export default CoordinateMap