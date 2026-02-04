export default function TourMap({ location = "" }) {
  // Encode location for Google Maps search
  const encodedLocation = encodeURIComponent(location || "India");
  const mapsUrl = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3.0!2d0!3d0!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0:0x0!2z&iwloc=&output=embed&q=${encodedLocation}`;

  return (
    <div className="mb-5">
      <h2 className="text-2xl font-semibold mb-4">Tour Map</h2>

      <iframe
        src={mapsUrl}
        className="w-full h-[350px] rounded-lg border"
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      ></iframe>
    </div>
  );
}
