export default `
    precision mediump float;
    varying vec2 vTextureCoord;
    uniform sampler2D uSampler;
    uniform vec3 colors;
    uniform float progress;
    uniform bool invertProgress;

    void main()
    {
        vec4 fg = texture2D(uSampler, vTextureCoord);
        vec4 originalFg = vec4(fg.r, fg.g, fg.b, fg.a);

        fg.r *= colors.r;
        fg.g *= colors.g;
        fg.b *= colors.b;

        float rDiff = originalFg.r - fg.r;
        float gDiff = originalFg.g - fg.g;
        float bDiff = originalFg.b - fg.b;

        float myProgress = progress;
        if(invertProgress) {
            myProgress = 1.0 - myProgress;
        }

        rDiff *= myProgress;
        gDiff *= myProgress;
        bDiff *= myProgress;

        fg.r = originalFg.r - rDiff;
        fg.g = originalFg.g - gDiff;
        fg.b = originalFg.b - bDiff;

        gl_FragColor = fg;
    }
`
