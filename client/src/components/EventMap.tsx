import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '../context/ThemeContext';
import type { Event } from '../types';
import { Link } from 'react-router-dom';

// Fix default marker icons (known Webpack/Vite bundler issue)
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

interface EventMapProps {
  events: Event[];
  center?: [number, number];
  zoom?: number;
  onEventClick?: (eventId: string) => void;
  className?: string;
}

export default function EventMap({ events, center, zoom = 10, onEventClick, className = '' }: EventMapProps) {
  const { theme } = useTheme();

  const geoEvents = events.filter((e) => e.latitude && e.longitude);

  // Default center: first geolocated event or Lagos
  const mapCenter: [number, number] = center ||
    (geoEvents.length > 0
      ? [geoEvents[0].latitude!, geoEvents[0].longitude!]
      : [6.5244, 3.3792]);

  const lightTile = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const darkTile = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const formatPrice = (p: number) => (p > 0 ? `NGN ${p.toLocaleString()}` : 'Free');

  return (
    <div className={`rounded-xl overflow-hidden border border-[rgb(var(--border-primary))] ${className}`}>
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%', minHeight: '400px' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url={theme === 'dark' ? darkTile : lightTile}
        />
        {geoEvents.map((event) => (
          <Marker key={event.id} position={[event.latitude!, event.longitude!]}>
            <Popup>
              <div className="min-w-[200px]">
                <h3 className="font-semibold text-sm mb-1">{event.title}</h3>
                <p className="text-xs text-gray-600 mb-0.5">{formatDate(event.date)}</p>
                <p className="text-xs text-gray-600 mb-0.5">{event.location}</p>
                <p className="text-xs font-medium text-emerald-600 mb-2">{formatPrice(event.price)}</p>
                {onEventClick ? (
                  <button
                    onClick={() => onEventClick(event.id)}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    View Details
                  </button>
                ) : (
                  <Link
                    to={`/events/${event.id}`}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    View Details
                  </Link>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
