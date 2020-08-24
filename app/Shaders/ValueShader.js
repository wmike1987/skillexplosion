define([], function() {

    return `
    precision mediump float;
    varying vec2 vTextureCoord;
    uniform sampler2D uSampler;
    uniform vec3 colors;

    void main()
    {
        vec4 fg = texture2D(uSampler, vTextureCoord);

        fg.r *= colors.r;
        fg.g *= colors.g;
        fg.b *= colors.b;

        gl_FragColor = fg;
    }`

})
