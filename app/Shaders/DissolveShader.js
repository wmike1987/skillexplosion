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
      return fract(sin(dot(co.xy, vec2(a, b))) * c)*.8 + .2;
    }

    void main()
    {
        float rate = .2;
        float gridLocX = floor(gl_FragCoord.x/(gridSize));
        float gridLocY = floor(gl_FragCoord.y/(gridSize));
        vec2 loc = vec2(gridLocX, gridLocY);
        float r = rand(loc);
        vec4 fg = texture2D(uSampler, vTextureCoord);

        if(r >= progress) {
            float ratio = 1.0 - min(1.0, ((r-progress)/rate));
            fg = vec4(fg.r*ratio, fg.g*ratio, fg.b*ratio, ratio);
        }

        gl_FragColor = fg;
    }`
