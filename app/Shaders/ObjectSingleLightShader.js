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
        float ratioOne = lengthToLightOnePosition/alteredLightRadius;

        if(ratioOne < 1.0 && fg.a > .5) {
            fg.r *= max(0.2, (1.0-ratioOne))*2.0*(max(.5, flameVariation));
            fg.g *= .5;
            fg.b *= .5;
        } else {
            fg.r *= .1;
            fg.g *= .1;
            fg.b *= .1;
        }
        gl_FragColor = fg;
    }`

})
