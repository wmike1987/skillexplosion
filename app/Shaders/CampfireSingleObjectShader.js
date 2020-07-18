define([], function() {

    return `
    precision mediump float;
    varying vec2 vTextureCoord;
    uniform sampler2D uSampler;
    uniform vec2 stageResolution;
    uniform vec2 lightOnePosition;
    uniform float flameVariation;
    uniform float lightRadius;

    void main()
    {
        vec4 fg = texture2D(uSampler, vTextureCoord);

        float yscale = 2.0;
        float alteredLightRadius = lightRadius+(flameVariation*80.0);

        float lengthToLightOnePosition = sqrt(pow(abs(gl_FragCoord.x-lightOnePosition.x), 2.0) + pow(abs((gl_FragCoord.y-20.0-lightOnePosition.y)*yscale), 2.0));
        float litScale = lengthToLightOnePosition/alteredLightRadius;

        //fire scale values
        float rlScale = 2.0;  //favor red
        float blScale = .9;
        float glScale = .9;

        //darkness scale values
        float rdScale = 0.2;
        float gdScale = 0.2;
        float bdScale = 0.5; //favor blue

        //define theshold values
        float fadePoint = 0.75;
        float firePoint = 0.6;
        if(litScale >= fadePoint) {
            float fadeScale = 1.0;
            if(litScale < 1.0) {
                //This goes from 1 (lightest fade point) --> 0 (approaching darkness)
                //So when we're at our darkest, make no change to the darkness scale values.
                //When we're at our lightest value, we'll add enough to get the scale values back to 1.0.
                fadeScale = ((1.0-litScale)/(1.0-fadePoint));
                rdScale += (1.0-rdScale) * fadeScale;
                gdScale += (1.0-gdScale) * fadeScale;
                bdScale += (1.0-bdScale) * fadeScale;
            }

            fg.r *= rdScale;
            fg.g *= gdScale;
            fg.b *= bdScale;
        } else if(litScale <= firePoint){
            float fadeScale = 1.0;
            //This goes from 0 (lightest point) --> 1 (most outward point)
            //So when we're at our most outward, get back to no scaling.
            //When we're at our closest value, we'll have to full force of the light
            fadeScale = litScale/firePoint;
            rlScale += (1.0-rlScale) * fadeScale;
            glScale += (1.0-glScale) * fadeScale;
            blScale += (1.0-blScale) * fadeScale;

            fg.r *= rlScale;
            fg.g *= glScale;
            fg.b *= blScale;
        }

        gl_FragColor = fg;
    }`

})
