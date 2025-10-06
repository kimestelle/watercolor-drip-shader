'use client';
import { useEffect, useRef } from "react";
import EmojiCloud from "./components/EmojiCloud";

export default function Home() {
  const skyRef = useRef<HTMLDivElement>(null);
  const cloudsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    let mx = 0, my = 0;

    const handleMove = (e: MouseEvent) => {
      mx = e.clientX / window.innerWidth - 0.5;
      my = e.clientY / window.innerHeight - 0.5;

      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = 0;
          const sky = skyRef.current;
          const clouds = cloudsRef.current;
          if (!sky || !clouds) return;

          //smaller for sky and larger for cloud
          sky.style.transform = `translate3d(${mx * 10}px, ${my * 10}px, 0)`;
          clouds.style.transform = `translate3d(${mx * 30}px, ${my * 30}px, 0)`;
        });
      }
    };

    window.addEventListener('mousemove', handleMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="h-[100svh] w-[100svw] relative overflow-hidden">
      {/* background*/}
      <div className="absolute inset-0 -z-10">
        <div className="parallax-container">
          <div className="layer sky" ref={skyRef}></div>
          <div className="layer clouds" ref={cloudsRef}></div>
        </div>
      </div>

      <div className="flex justify-center items-center h-full w-full">
        <EmojiCloud />
      </div>
    </div>
  );
}
