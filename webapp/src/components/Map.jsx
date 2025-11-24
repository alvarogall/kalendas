import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Component to update map center when position changes
function ChangeView({ center }) {
  const map = useMap();
  map.setView(center);
  return null;
}

const Map = ({ location }) => {
  const [position, setPosition] = useState([40.416775, -3.703790]) // Default to Madrid
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (location) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(true)
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`)
        .then(response => response.json())
        .then(data => {
          if (data && data.length > 0) {
            setPosition([parseFloat(data[0].lat), parseFloat(data[0].lon)])
          }
          setLoading(false)
        })
        .catch(err => {
          console.error("Geocoding error:", err)
          setLoading(false)
        })
    }
  }, [location])

  if (loading) return <div>Loading map...</div>

  return (
    <MapContainer center={position} zoom={13} scrollWheelZoom={false} style={{ height: '300px', width: '100%' }}>
      <ChangeView center={position} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position}>
        <Popup>
          {location}
        </Popup>
      </Marker>
    </MapContainer>
  )
}

export default Map