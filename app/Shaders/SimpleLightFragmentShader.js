define([], function() {

    return `
    precision mediump float;
    varying vec2 vTextureCoord;
    uniform sampler2D uSampler;
    uniform vec2 stageResolution;
    uniform vec2 lightOnePosition;
    uniform vec2 lightTwoPosition;
    uniform vec2 lightThreePosition;
    uniform vec2 lightFourPosition;
    uniform vec2 lightFivePosition;

    void main()
    {
       vec4 fg = texture2D(uSampler, vTextureCoord);
       float lightRadius = 250.0;
       float currentXPixel = vTextureCoord.x * stageResolution.x;
       float currentYPixel = vTextureCoord.y * stageResolution.y;
       float lengthToLightOnePosition = sqrt(pow(abs(currentXPixel-lightOnePosition.x), 2.0) + pow(abs(currentYPixel-lightOnePosition.y), 2.0));
       float lengthToLightTwoPosition = sqrt(pow(abs(currentXPixel-lightTwoPosition.x), 2.0) + pow(abs(currentYPixel-lightTwoPosition.y), 2.0));

       float ratioOne = lengthToLightOnePosition/lightRadius;
       if(lengthToLightOnePosition <= lightRadius) {
           fg.g += .10*(1.0-ratioOne);
           gl_FragColor = fg;
       } else {
           gl_FragColor = fg;
       }

       float ratioTwo = lengthToLightTwoPosition/lightRadius;
       if(lengthToLightTwoPosition <= lightRadius) {
           fg.r += .20*(1.0-ratioTwo);
           gl_FragColor = fg;
       } else {
           gl_FragColor = fg;
       }
    }`

})
