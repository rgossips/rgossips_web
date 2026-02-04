export default function TourMap({ location = "" }) {
  // Build a reliable Google Maps embed URL.
  // Accepts:
  // - plain place/address string (e.g. "Jim Corbett National Park")
  // - coordinates array [lat, lng]
  // - object { lat: number, lng: number }

  let mapsUrl = "https://www.google.com/maps?q=India&output=embed";

  if (location) {
    if (typeof location === "string") {
      const encoded = encodeURIComponent(location);
      mapsUrl = `https://www.google.com/maps?q=${encoded}&output=embed`;
    } else if (Array.isArray(location) && location.length >= 2) {
      const [lat, lng] = location;
      mapsUrl = `https://www.google.com/maps?q=${lat},${lng}&output=embed`;
    } else if (typeof location === "object" && location.lat && location.lng) {
      mapsUrl = `https://www.google.com/maps?q=${location.lat},${location.lng}&output=embed`;
    }
  }

  return (
    <div className="mb-5">
      <h2 className="text-2xl font-semibold mb-4">Tour Map</h2>

      <iframe
        title="location-map"
        src={mapsUrl}
        className="w-full h-[350px] rounded-lg border"
        allowFullScreen={true}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
