import Image from "next/image";

const galleryImages = [
  {
    id: 1,
    src: "https://images.pexels.com/photos/6758778/pexels-photo-6758778.jpeg",
    alt: "Uttarakhand hotel bedroom",
  },
  {
    id: 2,
    src: "https://images.pexels.com/photos/112811/pexels-photo-112811.jpeg",
    alt: "Himalayan mountain view",
  },
  {
    id: 3,
    src: "https://images.pexels.com/photos/271639/pexels-photo-271639.jpeg",
    alt: "Hotel balcony view in Uttarakhand",
  },
  {
    id: 4,
    src: "https://images.pexels.com/photos/20035462/pexels-photo-20035462.jpeg",
    alt: "Luxury hotel room",
  },
  {
    id: 5,
    src: "https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg",
    alt: "Rocky trail in Uttarakhand",
  },
  {
    id: 6,
    src: "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg",
    alt: "Hotel dining area",
  },
  {
    id: 7,
    src: "https://images.pexels.com/photos/417173/pexels-photo-417173.jpeg",
    alt: "Foggy Uttarakhand forest",
  },
  {
    id: 8,
    src: "https://images.pexels.com/photos/1671325/pexels-photo-1671325.jpeg",
    alt: "Mountain road",
  },
];

export default function GalleryCollage() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Gallery</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {galleryImages.map((img) => (
          <div
            key={img.id}
            className="relative w-full aspect-square rounded-lg overflow-hidden group cursor-pointer"
          >
            {/* Image */}
            <Image
              src={img.src}
              alt={img.alt}
              fill
              className="object-cover transition-all duration-300 group-hover:scale-110"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
