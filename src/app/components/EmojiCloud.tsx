"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { loadEmojis } from "./emojiLoader";
import DripCanvas from "./DripCanvas";

const cloudGrid: number[][] = [
  [0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0],
  [0,0,0,0,1,1,1,1,1,1,1,1,1,0,1,1,0,0,0,0],
  [0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [0,0,0,0,1,1,1,1,1,1,0,0,0,0,1,1,1,1,0,0]
];

type FallingEmoji = {
  char: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
};

function EmojiCloudCanvas({ emojiRef }: { emojiRef: React.RefObject<string[]> }) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const stripCanvasRef = useRef<HTMLCanvasElement | null>(null);

    const mouseRef = useRef({ x: 0, y: 0 });
    const mouseColorRef = useRef(false);

    const fallingEmojisRef = useRef<FallingEmoji[]>([]);
    const cloudEmojisRef = useRef<string[][]>([]);

    const [dripReady, setDripReady] = useState(false);
    const [emojiReady, setEmojiReady] = useState(false);

    //adapt dpr to device and cap
    function adaptiveDpr(multiplier = 0.9) {
        const rawDpr = window.devicePixelRatio || 1;
        const isMobile = /Mobi|Android/i.test(navigator.userAgent);
        const maxDpr = isMobile ? 1.5 : 2.5;
        return Math.min(rawDpr * multiplier, maxDpr);
    }

    useEffect(() => {
        const init = async () => {
        const emojis = await loadEmojis();
        cloudEmojisRef.current = cloudGrid.map(row =>
            row.map(cell => (cell ? emojis[Math.floor(Math.random() * emojis.length)].unicode : ""))
        );
        };
        init();
    }, []);

    useEffect(() => {
        const interval = setInterval(async () => {
        const emojis = await loadEmojis();

        const cloud = cloudEmojisRef.current;
        if (!cloud.length) return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const gridRows = cloud.length;
        const gridCols = cloud[0].length;
        const cellSize = canvas.width / gridCols * 0.4;
        const offsetX = (canvas.width - gridCols * cellSize) / 2;
        const offsetY = (canvas.height - gridRows * cellSize) / 4;

        for (let i = 0; i < gridRows; i++) {
        for (let j = 0; j < gridCols; j++) {
            const cx = offsetX + j * cellSize;
            const cy = offsetY + i * cellSize;

            const inside = mouseRef.current.x >= cx &&
                mouseRef.current.x <= cx + cellSize &&
                mouseRef.current.y >= cy &&
                mouseRef.current.y <= cy + cellSize;
          
            if (cloudGrid[i][j] === 1 && (Math.random() < 0.006 || inside)) {
                const oldEmoji = cloud[i][j];

                let newEmoji = "";
                if (emojiRef.current.length === 0) {
                    newEmoji = emojis[Math.floor(Math.random() * emojis.length)].unicode;
                } else {
                    newEmoji = emojiRef.current[Math.floor(Math.random() * emojiRef.current.length)];
                }

                if ((oldEmoji) || inside) {
                fallingEmojisRef.current.push({
                    char: oldEmoji,
                    x: cx + cellSize / 2,
                    y: cy + cellSize / 2,
                    vx: (Math.random() - 0.5),
                    vy: 2 + Math.random() * 2
                });}
                cloud[i][j] = newEmoji;
            }}
        }}, 500);
        return () => clearInterval(interval);
    }, [emojiRef]);

    useEffect(() => {
        const handle = (e: MouseEvent) => {
        if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const dpr = adaptiveDpr();

            mouseRef.current = {
            x: (e.clientX - rect.left) * dpr,
            y: (e.clientY - rect.top) * dpr
            };
        };
        window.addEventListener("mousemove", handle);
        return () => window.removeEventListener("mousemove", handle);
    }, []);

    //same thing with touch drag
    useEffect(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dpr = adaptiveDpr();

    let dragging = false;

    const handleStart = (e: TouchEvent) => {
        if (e.touches.length > 0) {
        dragging = true;
        mouseRef.current = {
            x: (e.touches[0].clientX - rect.left) * dpr,
            y: (e.touches[0].clientY - rect.top) * dpr,
        };
        }
    };

    const handleMove = (e: TouchEvent) => {
        if (!dragging) return;
        if (e.touches.length > 0) {
        e.preventDefault();
        mouseRef.current = {
            x: (e.touches[0].clientX - rect.left) * dpr,
            y: (e.touches[0].clientY - rect.top) * dpr,
        };
        }
    };

    const handleEnd = () => {
        dragging = false;
    };

    window.addEventListener("touchstart", handleStart, { passive: false });
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleEnd, { passive: true });

    return () => {
        window.removeEventListener("touchstart", handleStart);
        window.removeEventListener("touchmove", handleMove);
        window.removeEventListener("touchend", handleEnd);
    };
    }, []);


    useEffect(() => {
        const handleClick = () => {
            mouseColorRef.current = !mouseColorRef.current;
        };
        window.addEventListener("click", handleClick);
        return () => window.removeEventListener("click", handleClick);
    }, []);

  // animation loop
    useEffect(() => {
        const canvas = canvasRef.current!;
        const container = containerRef.current!;
        const strip = stripCanvasRef.current!;
        const ctx = canvas.getContext("2d")!;
        const stripCtx = strip.getContext("2d")!;
        const dpr = adaptiveDpr();

        // resize with debounce
        const resize = () => {
            const w = container.clientWidth * dpr;
            const h = container.clientHeight * dpr;
            canvas.width = w;
            canvas.height = h;

            strip.width = w;
            strip.height = 1; // buffer = 1px tall
            strip.style.width = `${w}px`;
            strip.style.height = "4px";
        };

        let frame = 0;
        const observer = new ResizeObserver(() => {
        if (frame) cancelAnimationFrame(frame);
        frame = requestAnimationFrame(resize);
        });
        observer.observe(container);
        resize();

        const animate = () => {
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        const cloud = cloudEmojisRef.current;
        if (cloud.length) {
            const gridRows = cloud.length;
            const gridCols = cloud[0].length;
            const cellSize = w / gridCols * 0.4;
            const offsetX = (w - gridCols * cellSize) / 2;
            const offsetY = (h - gridRows * cellSize) / 4;

            //draw mouse color if enabled
            if (mouseColorRef.current) {
                const hue = (Date.now() / 20) % 360;
                ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
                ctx.beginPath();

                const edgeMargin = 50 * dpr;
                const baseRadius = cellSize * 0.8 * dpr;
                const distToEdge = Math.min(mouseRef.current.x, w - mouseRef.current.x);
                const ratio = Math.max(0, Math.min(1, distToEdge / edgeMargin));
                const radius = baseRadius * ratio;

                if (radius > 0) {
                    ctx.beginPath();
                    ctx.arc(mouseRef.current.x, mouseRef.current.y, radius, 0, Math.PI * 2);
                    ctx.fill();
                }

                ctx.fill();
            }

            ctx.font = `${cellSize}px serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            // draw cloud
            for (let i = 0; i < gridRows; i++) {
            for (let j = 0; j < gridCols; j++) {
                const c = cloud[i][j];
                if (c) {
                    const backgroundAlpha = 0.2 + Math.sin(Date.now()/500 + (i+j) *0.5) * 0.2;
                    ctx.fillStyle = `rgba(255,255,255,${backgroundAlpha})`;
                    ctx.fillRect(offsetX + j * cellSize, offsetY + i * cellSize, cellSize, cellSize);
                    ctx.fillStyle = `rgba(0,0,0,1)`;
                    ctx.fillText(c, offsetX + j * cellSize + cellSize/2, offsetY + i * cellSize + cellSize/2);
                };
            }}

            // falling emojis
            fallingEmojisRef.current.forEach(e => {
                const dx = e.x - mouseRef.current.x;
                const dy = e.y - mouseRef.current.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 70 && dist > 0) {
                    const force = (70 - dist)/70 * 0.2;
                    e.vx += (dx/dist) * force;
                    e.vy += (dy/dist) * force + 0.1;
                }
                e.x += e.vx;
                e.y += e.vy;
                ctx.fillText(e.char, e.x, e.y);
            });

            fallingEmojisRef.current = fallingEmojisRef.current.filter(e => e.y < h + cellSize);

            if (w > 0 && h > 1) {
            stripCtx.clearRect(0, 0, strip.width, 1);
            stripCtx.drawImage(canvas, 0, h-1, w, 1, 0, 0, strip.width, 1);
            }
        }

        if (cloudEmojisRef.current.length) setEmojiReady(true);

        requestAnimationFrame(animate);
        };


        animate();
        return () => observer.disconnect();
    }, []);

    const handleReady = useCallback(() => {
        setDripReady(true);
    }, []);

    return (
        <div className="w-full h-full max-w-[100svh] px-5 flex flex-col justify-center items-center">
            {/* loader */}
            <div
            className={`
                absolute flex flex-col justify-center items-center 
                w-screen h-screen top-0 
                text-center px-5 z-[30] 
                bg-black/50 backdrop-blur-xl transition-opacity duration-1000
                ${(!dripReady || !emojiReady) ? "opacity-100" : "opacity-0 pointer-events-none"}
            `}
            >
            <h1>cloudy with a chance of...</h1>
            {/* loading bar */}
            <div className="w-full max-w-sm h-1 border border-[#adff2f] rounded-full overflow-hidden mt-5">
                <div className={`
                    h-full bg-gradient-to-r from-transparent to-[#adff2f]
                    animate-gradient-x
                    ${(!dripReady || !emojiReady) ? "w-2/3" : "w-full"}
                    transition-all duration-1000
                `}/>
            </div>
            <p className="mt-3">
                { !emojiReady ? "Loading emojis..." : !dripReady ? "Preparing canvas..." : "Ready!" }
            </p>
            </div>


            <div ref={containerRef} className={`w-full h-[60svh] flex-shrink-0 transition-opacity duration-1000 ${dripReady && emojiReady ? "opacity-100" : "opacity-0"}`}>
                <canvas ref={canvasRef} className="w-full h-full block" />
            </div>

            <canvas ref={stripCanvasRef} className="w-full h-0 block hidden"/>

            <div className={`w-full flex-1 transition-opacity duration-1000 ${dripReady && emojiReady ? "opacity-100" : "opacity-0"}`}>
                <DripCanvas source={stripCanvasRef} onReady={handleReady}/>
            </div>
        </div>
    );
}

export default React.memo(EmojiCloudCanvas);