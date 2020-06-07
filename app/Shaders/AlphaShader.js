define([], function() {

    return `
    precision mediump float;
    varying vec2 vTextureCoord;
    uniform sampler2D uSampler;

    void main()
    {
       vec4 fg = texture2D(uSampler, vTextureCoord);
       if(fg.r > 0.5) {
           gl_FragColor = fg;
           gl_FragColor.r = 0.0;
           gl_FragColor.g = 1.0;
           gl_FragColor.b = 0.0;
           gl_FragColor.a = 0.1;
       } else {
           gl_FragColor = fg;
       }
    }`

})
