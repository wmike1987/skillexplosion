export default `
    precision mediump float;
    varying vec2 vTextureCoord;
    uniform sampler2D uSampler;
    uniform float progress;
    uniform float a;
    uniform float b;
    uniform float c;

    float rand(vec2 co) {
      return fract(sin(dot(co.xy, vec2(a, b))) * c);
    }

    void main()
    {
        float r = rand(gl_FragCoord.xy);
        vec4 fg = texture2D(uSampler, vTextureCoord);

        if(r >= progress) {
            fg = vec4(0.0, 0.0, 0.0, 0.0);
        }

        gl_FragColor = fg;
    }`
