export default `
    precision mediump float;
    varying vec2 vTextureCoord;
    uniform sampler2D uSampler;
    uniform vec4 inputPixel;
    uniform vec2 centerPoint;

    void main()
    {
        vec4 fg = texture2D(uSampler, vTextureCoord);

        float radius = 200.0;
        vec2 myCoord = vTextureCoord * inputPixel.xy;

        bool inWindow = false;
        float xDiff = myCoord.x - centerPoint.x;
        float yDiff = myCoord.y - centerPoint.y;
        if(sqrt(xDiff * xDiff + yDiff * yDiff) < radius) {
            inWindow = true;
        }

        if(inWindow) {
            fg.r = 1.0;
            fg.g = 0.0;
            fg.b = 0.0;
        }

        gl_FragColor = fg;
    }`
