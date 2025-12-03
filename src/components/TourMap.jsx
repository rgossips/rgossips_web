export default function TourMap() {
  return (
    <div className="mb-5">
      <h2 className="text-2xl font-semibold mb-4">Tour Map</h2>

      <iframe
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3434.089773347385!2d79.4610619754685!3d29.37825517525303!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390a0d9b7e8f0b9f%3A0x6bf944393d46939a!2sThe%20Naini%20Retreat%2C%20Nainital!5e0!3m2!1sen!2sin!4v1705920000000!5m2!1sen!2sin"
        className="w-full h-[350px] rounded-lg border"
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      ></iframe>
    </div>
  );
}
