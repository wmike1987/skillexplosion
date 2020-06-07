define([], function() {

    return `
    precision mediump float;
    varying vec2 vTextureCoord;
    uniform sampler2D uSampler;

    void main()
    {
       vec4 fg = texture2D(uSampler, vTextureCoord);
       if(fg.a > 0.0) {
           gl_FragColor = fg;
           gl_FragColor.r *= 1.0;
           gl_FragColor.g *= 3.0;
           gl_FragColor.b *= 3.0;
       } else {
           gl_FragColor = fg;
       }
    }`

})
