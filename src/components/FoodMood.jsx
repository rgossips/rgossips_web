import Image from "next/image";
import SectionTitle from "./SectionTitle";

export default function FoodMoodGrid() {
  const foodItems = [
    {
      image:
        "https://images.pexels.com/photos/5086615/pexels-photo-5086615.jpeg",
      title: "Romantic",
    },
    {
      image: "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg",
      title: "Cafe",
    },
    {
      image: "https://images.pexels.com/photos/262047/pexels-photo-262047.jpeg",
      title: "Luxury Dining",
    },
    {
      image:
        "https://images.pexels.com/photos/28321225/pexels-photo-28321225.jpeg",
      title: "Bar",
    },
    {
      image:
        "https://images.pexels.com/photos/6427704/pexels-photo-6427704.jpeg",
      title: "Rooftop",
    },
    {
      image:
        "https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg",
      title: "Multi Cuisine",
    },
  ];
  return (
    <div className="w-full my-10">
      <SectionTitle text="WHAT'S YOUR FOOD MOOD?" />

      <div
        className="grid grid-cols-3 gap-6 px-4 mt-8
                      max-md:grid-cols-2
                      max-sm:grid-cols-1"
      >
        {foodItems.map((item, index) => (
          <div
            key={index}
            className="
      relative
      rounded-xl 
      overflow-hidden 
      shadow-md 
      cursor-pointer 
      hover:scale-[1.02] 
      transition
      h-48
    "
            style={{
              backgroundImage: `url(${item.image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {/* Overlay text */}
            <div className="absolute bottom-0 w-full bg-black/60 py-3">
              <p className="text-center text-white text-lg font-medium">
                {item.title}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
