define([], function() {

    return `
    precision mediump float;
    varying vec2 vTextureCoord;
    uniform sampler2D uSampler;
    uniform float red;
    uniform float green;
    uniform float blue;

    void main()
    {
        vec4 fg = texture2D(uSampler, vTextureCoord);

        fg.r *= red;
        fg.g *= green;
        fg.b *= blue;

        gl_FragColor = fg;
    }`

})
