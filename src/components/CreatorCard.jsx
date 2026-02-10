import Image from "next/image";
import { FaCheckCircle } from "react-icons/fa";
import { IoMdLink } from "react-icons/io";

export default function CreatorCard({
  name,
  verified,
  image,
  posts,
  followers,
  following,
  bio,
  link,
}) {
  return (
    <div className="border rounded-xl p-6 w-full sm:w-72 md:w-80 flex flex-col gap-4 shadow-sm bg-white mb-10">
      {/* Name */}
      <div className="flex items-center gap-1 text-lg font-semibold justify-center">
        {name}
        {verified && <FaCheckCircle className="text-blue-500 text-sm ml-1" />}
      </div>

      {/* Gradient Border Image Container */}
      <div className="flex justify-center">
        {/* The Outer Wrapper creates the gradient effect */}
        <div className="p-2 rounded-full bg-gradient-to-tr from-[#F6339A] to-[#FDC700] shadow-sm">
          {/* The Inner Wrapper creates the white gap between image and gradient (optional) */}
          <div className="bg-white rounded-full">
            <Image
              width={700}
              height={700}
              src={image}
              className="w-52 h-52 rounded-full object-cover"
              alt={name}
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex justify-between text-center w-full text-sm mt-1 pb-2">
        <div>
          <p className="font-semibold">{posts}</p>
          <p className="text-gray-500 text-xs">posts</p>
        </div>
        <div>
          <p className="font-semibold">{followers}</p>
          <p className="text-gray-500 text-xs">followers</p>
        </div>
        <div>
          <p className="font-semibold">{following}</p>
          <p className="text-gray-500 text-xs">following</p>
        </div>
      </div>

      {/* Bio */}
      {/* <p className="text-sm text-gray-700 text-center leading-tight">{bio}</p> */}

      {/* Link Button */}
      {/* <a
        href={link}
        className="mt-2 flex items-center gap-2 justify-center text-blue-600 border rounded-full px-4 py-2 hover:bg-blue-50 text-sm overflow-hidden whitespace-nowrap text-ellipsis max-w-full"
      >
        <IoMdLink className="text-lg flex-shrink-0" />
        <span className="truncate">{link}</span>
      </a> */}
    </div>
  );
}
