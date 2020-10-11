export default `
    precision mediump float;
    varying vec2 vTextureCoord;
    uniform sampler2D uSampler;
    uniform float progress;
    uniform vec2 screenSize;
    uniform float gridSize;
    uniform float a;
    uniform float b;
    uniform float c;

    float rand(vec2 co) {
      return fract(sin(dot(co.xy, vec2(a, b))) * c);
    }

    void main()
    {
        float gridLocX = floor(gl_FragCoord.x/(gridSize));
        float gridLocY = floor(gl_FragCoord.y/(gridSize));
        vec2 loc = vec2(gridLocX, gridLocY);
        float r = rand(loc);
        vec4 fg = texture2D(uSampler, vTextureCoord);

        if(r >= progress) {
            fg = vec4(0.0, 0.0, 0.0, progress);
        }

        gl_FragColor = fg;
    }`
