export default `
    precision mediump float;
    varying vec2 vTextureCoord;
    uniform sampler2D uSampler;
    uniform vec2 lightOnePosition;
    uniform vec4 inputPixel;
    uniform float flameVariation;
    uniform float lightRadius;
    uniform float yOffset;
    uniform float lightPower;
    uniform float red;
    uniform float green;
    uniform float blue;

    void main()
    {
        vec4 fg = texture2D(uSampler, vTextureCoord);
        vec2 myCoord = vTextureCoord * inputPixel.xy;

        float yscale = 2.0;
        float alteredLightRadius = lightRadius + flameVariation*80.0;
        float lengthToLightOnePosition = sqrt(pow(abs(myCoord.x-lightOnePosition.x), 2.0) + pow(abs((myCoord.y+yOffset-lightOnePosition.y)*yscale), 2.0));
        float litScale = lengthToLightOnePosition/alteredLightRadius;

        //immediately dim the scene
        fg.r *= 0.15;
        fg.g *= 0.15;
        fg.b *= 0.6; //favor blue

        //light scale values
        float rScale = (1.0 + red * lightPower);
        float gScale = (1.0 + green * lightPower);
        float bScale = (1.0 + blue * lightPower);

        //light everything before the threshold and fade into the darkness at this point
        float fadePoint = 0.75;
        if(litScale <= fadePoint) {
            //This goes from 0 (most central point) --> 1 (moust outward point)
            float fadeScale = litScale/fadePoint;
            rScale += (1.0-rScale) * fadeScale;
            gScale += (1.0-gScale) * fadeScale;
            bScale += (1.0-bScale) * fadeScale;

            fg.r *= rScale;
            fg.g *= gScale;
            fg.b *= bScale;
        }

        gl_FragColor = fg;
    }`
