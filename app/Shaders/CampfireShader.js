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
        float alteredLightRadius = lightRadius/1.3+(flameVariation*80.0);

        float lengthToLightOnePosition = sqrt(pow(abs(gl_FragCoord.x-lightOnePosition.x), 2.0) + pow(abs((gl_FragCoord.y-lightOnePosition.y)*yscale), 2.0));
        float ratioOne = lengthToLightOnePosition/alteredLightRadius;

        float rscale = 3.0;
        float gscale = 3.0;
        float bscale = 1.0;

        float threshold = 1.4;
        if(ratioOne < threshold) {
            //offsetRatio is now 0.0-1.0 (real range 0.0-1.2)
            float offsetRatio = ratioOne/threshold;

            //ratioOne is set to be 1.0-1.2 (to express some sort of gradient without going below 1.0)
            ratioOne = 1.0 + ((threshold-1.0) * offsetRatio);

            //colorShift is set to be shiftScale-1.0
            float shiftScale = 3.0;
            float colorShift = ((1.0-offsetRatio) * (shiftScale-1.0)) + 1.0;

            rscale /= pow(colorShift, 2.0);
        }

        //The smaller the right hand side of the expression, the more potent the color will be
        fg.r /= pow(ratioOne, rscale);
        fg.g /= pow(ratioOne, gscale);
        fg.b /= pow(ratioOne, bscale);
        gl_FragColor = fg;
    }`

})
