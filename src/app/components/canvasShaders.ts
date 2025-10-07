    export const VS = `
      attribute vec2 a_pos;
      attribute vec2 a_uv;
      varying vec2 v_uv;
      void main() {
        v_uv = a_uv;
        gl_Position = vec4(a_pos, 0.0, 1.0);
      }
    `;

    export const SIM_FS = `
      precision mediump float;
      varying vec2 v_uv;
      uniform sampler2D u_tex;
      uniform vec2 u_px;
      uniform float u_gravityPx;
      uniform float u_diff;
      uniform float u_decay;

      void main() {
        float g = u_gravityPx * u_px.y;
        vec2 advUv = v_uv - vec2(0.0, g);
        vec4 adv = texture2D(u_tex, advUv);
        vec4 cur = texture2D(u_tex, v_uv);

        //center left right up down blur
        vec4 c = texture2D(u_tex, v_uv);
        vec4 l = texture2D(u_tex, v_uv - vec2(u_px.x, 0.0));
        vec4 r = texture2D(u_tex, v_uv + vec2(u_px.x, 0.0));
        vec4 u = texture2D(u_tex, v_uv - vec2(0.0, u_px.y));
        vec4 d = texture2D(u_tex, v_uv + vec2(0.0, u_px.y));

        vec4 avg = (c + l + r + u + d) / 5.0;


        vec4 wet = mix(cur, adv, 0.7);

        wet = mix(wet, avg, u_diff);
        wet *= (1.0 - u_decay);

        gl_FragColor = wet;
      }
    `;

    export const DISPLAY_FS = `
    precision mediump float;
    varying vec2 v_uv;

    uniform sampler2D u_tex;     // drip simulation buffer
    uniform sampler2D u_canvas;  // paper texture

    void main() {
        vec4 drip = texture2D(u_tex, vec2(v_uv.x, 1.0 - v_uv.y));
        vec4 canvas = texture2D(u_canvas, v_uv);

        // alpha as density
        float density = clamp(drip.a * 2.0, 0.0, 1.0);

        // vivid pigment adjusted with gamma
        vec3 pigment = pow(drip.rgb, vec3(0.5));

        // mix paper and pigment
        vec3 mixed = canvas.rgb * (1.0 - density) + pigment * density;

        vec3 finalColor = mixed * (0.7 + 0.3 * canvas.rgb) + 0.07;

        // dry paper: alpha = 1.0, wet paper: alpha = 0.5
        float paperAlpha = mix(0.99, 0.6, density);

        float finalAlpha = clamp(max(drip.a, paperAlpha), 0.0, 1.0);

        gl_FragColor = vec4(finalColor, finalAlpha);
    }
    `;
