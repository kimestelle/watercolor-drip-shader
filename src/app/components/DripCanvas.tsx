"use client";
import React, { useEffect, useRef } from "react";

import { VS, SIM_FS, DISPLAY_FS } from "./canvasShaders";

export default function DripCanvas({
  source,
  onReady,
}: {
  source: React.RefObject<HTMLCanvasElement | null>;
  onReady?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const firstFrame = useRef(true);

  //store refs to be able to reset watercolor drip
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const texARef = useRef<WebGLTexture | null>(null);
  const texBRef = useRef<WebGLTexture | null>(null);
  const fbARef = useRef<WebGLFramebuffer | null>(null);
  const fbBRef = useRef<WebGLFramebuffer | null>(null);

  const resetDrip = () => {
    const gl = glRef.current;
    if (!gl) return;

    const clearFramebuffer = (fb: WebGLFramebuffer | null) => {
      if (!fb) return;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    };

    const clearTexture = (tex: WebGLTexture | null) => {
      if (!tex) return;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      const width = canvasRef.current?.width || 1;
      const height = canvasRef.current?.height || 1;
      const empty = new Uint8Array(width * height * 4); // RGBA
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, empty);
    }

    clearFramebuffer(fbARef.current);
    clearFramebuffer(fbBRef.current);

    clearTexture(texARef.current);
    clearTexture(texBRef.current);

    // restore default framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  };


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !source.current) return;
    const gl = canvas.getContext("webgl", { alpha: true });
    if (!gl) return;
    glRef.current = gl;

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    // helpers
    const compile = (src: string, type: number) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(s));
      }
      return s;
    };
    const makeProgram = (vsSrc: string, fsSrc: string) => {
      const vs = compile(vsSrc, gl.VERTEX_SHADER);
      const fs = compile(fsSrc, gl.FRAGMENT_SHADER);
      const p = gl.createProgram()!;
      gl.attachShader(p, vs);
      gl.attachShader(p, fs);
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(p));
      }
      return p;
    };

    const quadVerts = new Float32Array([
      -1, -1, 0, 0,
      1, -1, 1, 0,
      -1,  1, 0, 1,
      1,  1, 1, 1,
    ]);
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.STATIC_DRAW);

    // programs
    const simProg = makeProgram(VS, SIM_FS);
    const dispProg = makeProgram(VS, DISPLAY_FS);

    const setupAttributes = (prog: WebGLProgram) => {
      const a_pos = gl.getAttribLocation(prog, "a_pos");
      const a_uv = gl.getAttribLocation(prog, "a_uv");
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      gl.vertexAttribPointer(a_pos, 2, gl.FLOAT, false, 16, 0);
      gl.vertexAttribPointer(a_uv, 2, gl.FLOAT, false, 16, 8);
      gl.enableVertexAttribArray(a_pos);
      gl.enableVertexAttribArray(a_uv);
    };

    // dynamically sized textures & framebuffers
    let W = 0, H = 0;
    const createFramebufferTex = (w: number, h: number) => {
      const tex = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

      const fb = gl.createFramebuffer()!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      return { tex, fb };
    };

    const resizeSim = () => {
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = W;
      canvas.height = H;
      gl.viewport(0, 0, W, H);

      ({ tex: texARef.current, fb: fbARef.current } = createFramebufferTex(W, H));
      ({ tex: texBRef.current, fb: fbBRef.current } = createFramebufferTex(W, H));

      fbARef.current = fbARef.current;
      fbBRef.current = fbBRef.current;
      texARef.current = texARef.current;
      texBRef.current = texBRef.current;

      helper.width = W;
      helper.height = 1;
    };

    const canvasTex = gl.createTexture();
    const img = new Image();
    img.src = "/paper.jpg";
    img.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, canvasTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    };


    const helper = document.createElement("canvas");
    helper.height = 1;

    resizeSim();

    const frame = () => {
      if (W === 0 || H === 0) {
        requestAnimationFrame(frame);
        return;
      }

      // inject top row
      if (source.current && source.current.width > 0 && source.current.height > 0) {
        const hctx = helper.getContext("2d")!;
        hctx.clearRect(0, 0, W, 1);
        hctx.drawImage(source.current, 0, 0, source.current.width, 20, 0, 0, W, 1);
        const row = hctx.getImageData(0, 0, W, 1);

        for (let i = 0; i < row.data.length; i += 4) {
          if (row.data[i + 3] > 0) {
            row.data[i + 3] = 255;
          } else {
            row.data[i + 0] = 0;
            row.data[i + 1] = 0;
            row.data[i + 2] = 0;
          }
        }

        gl.bindTexture(gl.TEXTURE_2D, texARef.current);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, W, 1, gl.RGBA, gl.UNSIGNED_BYTE, row.data
        );
      }

      // SIM pass
      gl.useProgram(simProg);
      setupAttributes(simProg);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbBRef.current);
      gl.bindTexture(gl.TEXTURE_2D, texARef.current);
      gl.uniform1i(gl.getUniformLocation(simProg, "u_tex"), 0);
      gl.uniform2f(gl.getUniformLocation(simProg, "u_px"), 1.0 / W, 1.0 / H);
      gl.uniform1f(gl.getUniformLocation(simProg, "u_gravityPx"), 0.002 * H);
      gl.uniform1f(gl.getUniformLocation(simProg, "u_diff"), 0.1);
      gl.uniform1f(gl.getUniformLocation(simProg, "u_decay"), 0.0009);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // DISPLAY pass
      gl.useProgram(dispProg);
      setupAttributes(dispProg);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);

      //drip texture - 0
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texBRef.current);
      gl.uniform1i(gl.getUniformLocation(dispProg, "u_tex"), 0);

      //canvas texture - 1
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, canvasTex);
      gl.uniform1i(gl.getUniformLocation(dispProg, "u_canvas"), 1);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);


      // swap
      [texARef.current, texBRef.current] = [texBRef.current, texARef.current];
      [fbARef.current, fbBRef.current] = [fbBRef.current, fbARef.current];

      if (firstFrame.current) {
        onReady?.();
        firstFrame.current = false;
      }


      requestAnimationFrame(frame);
    };
    frame();
  });

  return <canvas
    ref={canvasRef}
    onClick={() => {resetDrip()}}
    className="w-full h-full relative block bg-transparent"
    style={{ clipPath: "inset(1px 0 0 0)" }}
  />;
}
