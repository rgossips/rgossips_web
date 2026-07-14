"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useTranslations } from "next-intl";

export default function HeroImage({ userData }) {
  const t = useTranslations("HeroImg");
  const [imgWidth, setImgWidth] = useState(400);
  const [imgHeight, setImgHeight] = useState(550);
  const [openMenu, setOpenMenu] = useState(false);

  const [imgTop, setImgTop] = useState(400);
  const [imgLeft, setImgLeft] = useState("50%");
  const [imgTransform, setImgTransform] = useState("translateX(-50%)");
  const [borderStyle, setBorderStyle] = useState("partial");

  useLayoutEffect(() => {
    const initialTop = window.innerHeight * 0.25;
    const finalTop = 20;

    const THRESHOLD_START = 100; // animation starts
    const THRESHOLD_END = 350; // animation ends & locks here

    const applyScroll = () => {
      const y = window.scrollY;

      /** -----------------------------------------
       * STATE 0 — BEFORE ANIMATION
       * ----------------------------------------- **/
      if (y < THRESHOLD_START) {
        setImgWidth(400);
        setImgHeight(550);
        setImgTop(initialTop);
        setImgLeft("50%");
        setImgTransform("translateX(-50%)");
        setBorderStyle("partial");
        return;
      }

      /** -----------------------------------------
       * STATE 2 — FINAL LOCKED POSITION
       * ----------------------------------------- **/
      if (y >= THRESHOLD_END) {
        setImgWidth(60);
        setImgHeight(60);
        setImgTop(finalTop);
        setImgLeft("calc(50% + 650px)");
        setImgTransform("translateX(0%)");
        setBorderStyle("full");
        return;
      }

      /** -----------------------------------------
       * STATE 1 — ANIMATING BETWEEN STATES
       * ----------------------------------------- **/
      const progress =
        (y - THRESHOLD_START) / (THRESHOLD_END - THRESHOLD_START);
      const easeOut = 1 - Math.pow(1 - progress, 3);

      const startWidth = 400;
      const startHeight = 550;
      const endSize = 60;

      setImgWidth(startWidth - (startWidth - endSize) * easeOut);
      setImgHeight(startHeight - (startHeight - endSize) * easeOut);

      setImgTop(initialTop - (initialTop - finalTop) * easeOut);

      const xShift = 650 * easeOut;
      setImgLeft(`calc(50% + ${xShift}px)`);

      setImgTransform("translateX(0%)");
      setBorderStyle(progress > 0.25 ? "full" : "partial");
    };

    // Run BEFORE paint — fixes refresh flash
    applyScroll();

    window.addEventListener("scroll", applyScroll);
    return () => window.removeEventListener("scroll", applyScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <>
      <Image
        src={userData?.profilePic}
        alt="dummy"
        width={imgWidth}
        height={imgHeight}
        onClick={() => setOpenMenu(!openMenu)}
        className={`hidden max-h-[500px] md:flex fixed z-50 object-cover transition-all duration-200 ease-out border-4 border-white ${
          borderStyle === "full"
            ? "rounded-full cursor-pointer aspect-square"
            : "rounded-t-full rounded-b-full pointer-events-none"
        }`}
        style={{
          top: imgTop,
          left: imgLeft,
          transform: imgTransform,
        }}
      />

      {openMenu && (
        <div
          className="fixed inset-0 z-40 mt-5"
          onClick={() => setOpenMenu(false)}
        >
          <div
            className="absolute z-50 top-[70px] right-6 bg-white rounded-xl shadow-lg border p-4 w-48"
            onClick={(e) => e.stopPropagation()}
          >
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="cursor-pointer hover:bg-gray-100 p-2 rounded">
                <Link href={"/profile"}>{t("viewProfile")}</Link>
              </li>
              {/* <li className="cursor-pointer hover:bg-gray-100 p-2 rounded">
                Settings
              </li> */}
              <li
                onClick={handleLogout}
                className="cursor-pointer hover:bg-gray-100 p-2 rounded text-red-600"
              >
                {t("logout")}
              </li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
