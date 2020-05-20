define([], function() {

    return `
    precision mediump float;
    varying vec2 vTextureCoord;
    uniform sampler2D uSampler;

    void main()
    {
       gl_FragColor = vec4(1, 0, 1, 0);
    }`

})
