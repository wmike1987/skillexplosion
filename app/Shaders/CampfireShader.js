define([], function() {

    return `
    precision mediump float;
    varying vec2 vTextureCoord;
    uniform sampler2D uSampler;
    uniform vec2 stageResolution;
    uniform vec2 lightOnePosition;

    void main()
    {
       vec4 fg = texture2D(uSampler, vTextureCoord);
       float lightRadius = 300.0;
       float currentXPixel = vTextureCoord.x * stageResolution.x;
       float currentYPixel = vTextureCoord.y * stageResolution.y;
       float lengthToLightOnePosition = sqrt(pow(abs(currentXPixel-lightOnePosition.x), 2.0) + pow(abs(currentYPixel-lightOnePosition.y), 2.0));

       float ratioOne = lengthToLightOnePosition/lightRadius;
       if(ratioOne > .80) {
           ratioOne = .80;
       }
       fg.r -= .05;
       fg.g -= .05;
       fg.b += .05;
       fg.a = ratioOne;
       gl_FragColor = fg;
    }`

})
