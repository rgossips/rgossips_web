import Image from "next/image";
import { useTranslations } from "next-intl";

export default function GalleryCollage({ images = [] }) {
  const t = useTranslations("GalleryCarousel");

  const galleryImages = images.map((src, idx) => ({
    id: idx,
    src: src,
    alt: t("imageAlt", { number: idx + 1 }),
  }));

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">{t("title")}</h2>

      {galleryImages.length === 0 ? (
        <p className="text-gray-500">{t("empty")}</p>
      ) : (
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
      )}
    </div>
  );
}
