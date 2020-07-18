define([], function() {

    return `
    precision mediump float;
    varying vec2 vTextureCoord;
    uniform sampler2D uSampler;
    uniform vec2 lightOnePosition;
    uniform float flameVariation;
    uniform float lightRadius;

    void main()
    {
        vec4 fg = texture2D(uSampler, vTextureCoord);

        float yscale = 2.0;
        float alteredLightRadius = lightRadius + flameVariation*80.0;

        float lengthToLightOnePosition = sqrt(pow(abs(gl_FragCoord.x-lightOnePosition.x), 2.0) + pow(abs((gl_FragCoord.y-lightOnePosition.y)*yscale), 2.0));
        float litScale = lengthToLightOnePosition/alteredLightRadius;

        //darkness scale values
        float rScale = 0.2;
        float gScale = 0.2;
        float bScale = 0.5; //favor blue

        //start the fade into night at this threshold
        float fadePoint = 0.75;
        if(litScale >= fadePoint) {
            float fadeScale = 1.0;
            if(litScale < 1.0) {
                //This goes from 1 (lightest fade point) --> 0 (approaching darkness)
                //So when we're at our darkest, make no change to the darkness scale values.
                //When we're at our lightest value, we'll add enough to get the scale values back to 1.0.
                fadeScale = ((1.0-litScale)/(1.0-fadePoint));
                rScale += (1.0-rScale) * fadeScale;
                gScale += (1.0-gScale) * fadeScale;
                bScale += (1.0-bScale) * fadeScale;
            }

            fg.r *= rScale;
            fg.g *= gScale;
            fg.b *= bScale;
        }

        gl_FragColor = fg;
    }`

})
