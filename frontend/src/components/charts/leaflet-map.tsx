import { useEffect } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Vite doesn't rewrite Leaflet's default marker asset URLs automatically — point them at the bundled images.
const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
}

interface LeafletMapProps {
  latitude: number;
  longitude: number;
  name: string;
  location?: string | null;
}

export default function LeafletMap({ latitude, longitude, name, location }: LeafletMapProps) {
  return (
    <div className="h-64 w-full overflow-hidden rounded-md">
      <MapContainer center={[latitude, longitude]} zoom={13} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={[latitude, longitude]}>
          <Popup>
            {name}
            {location ? (
              <>
                <br />
                {location}
              </>
            ) : null}
          </Popup>
        </Marker>
        <Recenter lat={latitude} lng={longitude} />
      </MapContainer>
    </div>
  );
}
