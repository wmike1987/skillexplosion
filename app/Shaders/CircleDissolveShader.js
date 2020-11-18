export default `
    precision mediump float;
    varying vec2 vTextureCoord;
    uniform sampler2D uSampler;
    uniform float progress;
    uniform vec2 screenCenter;
    uniform vec2 screenSize;
    uniform float gridSize;
    uniform bool fadeOut;
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
        vec4 fg = texture2D(uSampler, vTextureCoord);

        float xDiff = abs(gl_FragCoord.x - screenCenter.x);
        float yDiff = abs(gl_FragCoord.y - screenCenter.y);
        float alteredXDiff = floor(xDiff/(gridSize));
        float alteredYDiff = floor(yDiff/(gridSize));
        xDiff = alteredXDiff;
        yDiff = alteredYDiff;

        float screenSizeHyp = sqrt(screenSize.x*screenSize.x + screenSize.y*screenSize.y)/gridSize;

        float inOrOut = 1.0;
        float addBuffer = 0.0;
        if(fadeOut) {
          addBuffer = 0.2;
        }
        float r = (sqrt(xDiff*xDiff + yDiff*yDiff)/(screenSizeHyp/2.0)*.8 + addBuffer);

        if(!fadeOut) {
          r = 1.0 - r;
        }

        if(r >= progress) {
            float ratio = 1.0 - min(1.0, ((r-progress)/rate));
            fg = vec4(fg.r*ratio, fg.g*ratio, fg.b*ratio, ratio);
        }

        gl_FragColor = fg;
    }`
