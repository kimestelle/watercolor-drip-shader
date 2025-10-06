'use client';
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { EmojiPicker } from "frimousse";
import EmojiCloud from "./components/EmojiCloud";
import InfoModule from "./components/InfoModule";

export default function Home() {
  const skyRef = useRef<HTMLDivElement>(null);
  const cloudsRef = useRef<HTMLDivElement>(null);

  const [selectedEmojis, setSelectedEmojis] = useState<string[]>([]);
  const selectedEmojisRef = useRef<string[]>([]);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [forecast, setForecast] = useState(generateFakeForecast());

  const [infoModuleOpen, setInfoModuleOpen] = useState(true);

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


  //emoji stuff
  const handleEmojiSelect = (emoji: string) => {
    setSelectedEmojis(prev => {
      if (prev.includes(emoji)) return prev;
      if (prev.length < 3) {
        return [...prev, emoji];
      } else {
        // replace oldest in queue if queue full
        return [...prev.slice(1), emoji];
      }
    });
  };

  const handleEmojiDelete = () => {
    setSelectedEmojis(prev => prev.slice(0, -1));
  }

  useEffect(() => {
    selectedEmojisRef.current = selectedEmojis;
  }, [selectedEmojis]);

  const toggleSelectOpen = () => {
    setIsSelectOpen(prev => !prev);
  }

  const openInfoModule = () => {
    setInfoModuleOpen(true);
  }

  const closeInfoModule = () => {
    setInfoModuleOpen(false);
  }

  //weather stuff
  function generateFakeForecast() {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayOfWeek = days[new Date().getDay()];
    const lat = (Math.random() * 180 - 90).toFixed(3);
    const lon = (Math.random() * 360 - 180).toFixed(3);
    const temperature = (Math.random() * 35 - 5).toFixed(1);
    return { dayOfWeek, lat, lon, temperature};
  }

  useEffect(() => {
    setForecast(generateFakeForecast());
  }, [selectedEmojis]);

  return (
    <div className="h-[100svh] w-[100svw] relative overflow-hidden flex flex-col">
      {/* background*/}
      <div className="absolute inset-0 -z-10">
        <div className="parallax-container">
          <div className="layer sky" ref={skyRef}></div>
          <div className="layer clouds" ref={cloudsRef}></div>
        </div>
      </div>

      {/* top status bar */}
      <div className="h-fit w-full font-mono flex flex-col shrink-0 gap-6 justify-center items-center text-xs">
        <div className="h-5 w-full relative flex flex-row p-1 px-5 gap-2 justify-between items-between">
          <p suppressHydrationWarning>{forecast.dayOfWeek} • {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
          <p suppressHydrationWarning>{forecast.temperature}°C</p>
          <p suppressHydrationWarning>lat {forecast.lat}, lon {forecast.lon}</p>
        </div>
        <div className="h-[1.4rem] w-fit sky-blend relative flex flex-row p-1 gap-2 justify-end items-center bg-black/20 backdrop-blur-lg">
          <h3 className='h-[1.4rem] flex items-end leading-none'>cloudy with a chance of</h3>
          <div className="flex gap-1 cursor-pointer select-none" onClick={toggleSelectOpen}>
            {selectedEmojis.map((e, i) => (
              <span key={i} className="text-[1.4rem] leading-none w-[1.2rem] h-[1.4rem] flex justify-center items-center font-mono">{e}</span>
            ))}
            {Array.from({ length: 3 - selectedEmojis.length }).map((_, i) => (
              <span key={i} className="w-[1.2rem] h-[1.2rem] mt-[0.1rem] font-mono border border-[0.5px] border-[#adff2f] bg-gradient-to-bl from-[#adff2f] to-transparent inline-block"/>
            ))}
            <button className='h-[1.4rem] cursor-pointer' onClick={handleEmojiDelete} title="delete last emoji">
              <Image src="/backspace.svg" alt="delete" width={12} height={12} />
            </button>
          </div>
          <button className='absolute -right-[1.6rem] w-[1.4rem] h-[1.4rem] p-1 cursor-pointer'
            onClick={openInfoModule}>
            <Image src="/info-icon.svg" className='w-full h-full' alt="info" width={12} height={12}/>
          </button>
        </div>
        {infoModuleOpen && (<div id="info-module"><InfoModule closeModule={closeInfoModule}/></div>)}
        {isSelectOpen && (
          <EmojiPicker.Root className="absolute top-18 z-[20] flex h-[368px] w-fit flex-col bg-white"
            onEmojiSelect={emoji => {handleEmojiSelect(emoji.emoji)}}
          >
          <EmojiPicker.Search className="z-10 mx-2 mt-2 appearance-none rounded-md bg-neutral-100 px-2.5 py-2 text-sm dark:bg-neutral-800" />
          <EmojiPicker.Viewport className="relative flex-1 outline-hidden">
            <EmojiPicker.Loading className="absolute inset-0 flex items-center justify-center text-neutral-400 text-sm dark:text-neutral-500">
              Loading…
            </EmojiPicker.Loading>
            <EmojiPicker.Empty className="absolute inset-0 flex items-center justify-center text-neutral-400 text-sm dark:text-neutral-500">
              No emoji found.
            </EmojiPicker.Empty>
            <EmojiPicker.List
              className="select-none pb-1.5"
              components={{
                CategoryHeader: ({ category, ...props }) => (
                  <div
                    className="bg-white px-3 pt-3 pb-1.5 font-medium text-neutral-600 text-xs dark:bg-neutral-900 dark:text-neutral-400"
                    {...props}
                  >
                    {category.label}
                  </div>
                ),
                Row: ({ children, ...props }) => (
                  <div className="scroll-my-1.5 px-1.5" {...props}>
                    {children}
                  </div>
                ),
                Emoji: ({ emoji, ...props }) => (
                  <button
                    className="flex size-8 items-center justify-center rounded-md text-lg data-[active]:bg-neutral-100 dark:data-[active]:bg-neutral-800"
                    {...props}
                  >
                    {emoji.emoji}
                  </button>
                ),
              }}
            />
          </EmojiPicker.Viewport>
        </EmojiPicker.Root>
        )}
      </div>

      <div className="flex justify-center items-center h-full w-full">
        <EmojiCloud emojiRef={selectedEmojisRef}/>
      </div>
    </div>
  );
}
