"use client";
import { useEffect, useRef, useState } from "react";
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

export default function EmojiCloudCanvas() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const stripCanvasRef = useRef<HTMLCanvasElement | null>(null);

    const mouseRef = useRef({ x: 0, y: 0 });
    const fallingEmojisRef = useRef<FallingEmoji[]>([]);
    const cloudEmojisRef = useRef<string[][]>([]);

    const [dripReady, setDripReady] = useState(false);

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
                const newEmoji = emojis[Math.floor(Math.random() * emojis.length)].unicode;


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
    }, []);

    useEffect(() => {
        const handle = (e: MouseEvent) => {
        if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const dpr = window.devicePixelRatio * 0.7 || 1;

            mouseRef.current = {
            x: (e.clientX - rect.left) * dpr,
            y: (e.clientY - rect.top) * dpr
            };
        };
        window.addEventListener("mousemove", handle);
        return () => window.removeEventListener("mousemove", handle);
    }, []);

  // animation loop
    useEffect(() => {
        const canvas = canvasRef.current!;
        const container = containerRef.current!;
        const strip = stripCanvasRef.current!;
        const ctx = canvas.getContext("2d")!;
        const stripCtx = strip.getContext("2d")!;

        // resize with debounce
        const resize = () => {
            const dpr = window.devicePixelRatio * 0.7 || 1;
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
                const dpr = window.devicePixelRatio * 0.7 || 1;
                const dx = e.x - mouseRef.current.x * dpr;
                const dy = e.y - mouseRef.current.y * dpr;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 70 && dist > 0) {
                    const force = (70 - dist)/70 * 0.2;
                    e.vx += (dx/dist) * force;
                    e.vy += (dy/dist) * force * (0.05 * dpr);
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

        requestAnimationFrame(animate);
        };

        animate();
        return () => observer.disconnect();
    }, []);

    return (
        <div className="relative w-full h-screen max-w-[100svh] px-5 flex flex-col items-center">
            {!dripReady && (
            <div className="absolute flex justify-center items-center w-full h-full bg-white/50 z-[10] top-5 text-center w-full px-5">
                <h1>Loading...</h1>
            </div>
            )}

            <div ref={containerRef} className="w-full h-[60svh] flex-shrink-0">
                <canvas ref={canvasRef} className="w-full h-full block" />
            </div>

            <canvas ref={stripCanvasRef} className="w-full h-0 block hidden"/>

            <div className="w-full flex-1">
                <DripCanvas source={stripCanvasRef} onReady={() => setDripReady(true)}/>
            </div>
        </div>
    );
}
