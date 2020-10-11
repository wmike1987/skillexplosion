import * as PIXI from 'pixi.js'

const shaderVert =
    `precision highp float;
    attribute vec2 aVertexPosition;
    attribute vec2 aTextureCoord;
    attribute vec4 aColor;
    attribute float aTextureId;
    uniform mat3 projectionMatrix;
    uniform mat3 translationMatrix;
    varying vec2 vTextureCoord;
    varying vec4 vColor;
    varying float vTextureId;

    void main(void){
        gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
        vTextureCoord = aTextureCoord;
        vTextureId = aTextureId;
        vColor = aColor;
    }`;

const shaderFrag =
    `varying vec2 vTextureCoord;
    varying vec4 vColor;
    varying float vTextureId;
    uniform sampler2D uSamplers[%count%];

    void main(void) {
        vec4 color;
        float textureId = floor(vTextureId+0.5);
        %forloop%
        gl_FragColor = color * vColor;
    }`;

var colorGeometry = class ColorGeometry extends PIXI.Geometry
{
	constructor(_static = false)
	{
		super();

		this._buffer = new PIXI.Buffer(null, _static, false);

		this._indexBuffer = new PIXI.Buffer(null, _static, true);

        var TYPES = PIXI.TYPES;
		this.addAttribute('aVertexPosition', this._buffer, 2, false, TYPES.FLOAT)
			.addAttribute('aTextureCoord', this._buffer, 2, false, TYPES.FLOAT)
			.addAttribute('aColor', this._buffer, 4, false, TYPES.FLOAT)
			.addAttribute('aTextureId', this._buffer, 1, true, TYPES.FLOAT)
			.addIndex(this._indexBuffer);
	}
}

var ColorPlugin = class BatchPlugin extends PIXI.AbstractBatchRenderer
{
	constructor(renderer)
	{
		super(renderer);

		this.shaderGenerator = new PIXI.BatchShaderGenerator(shaderVert, shaderFrag);
		this.geometryClass = colorGeometry;
		this.vertexSize = 9;
	}

	packInterleavedGeometry(element, attributeBuffer, indexBuffer, aIndex, iIndex) {
		const {
			uint32View,
			float32View,
		} = attributeBuffer;

        var color = {r: 1.0, g: 1.0, b: 1.0, a: 1.0};
		if (element.color) {
			color = element.color;
        }

		const p = aIndex / this.vertexSize;
		const uvs = element.uvs;
		const indices = element.indices;
		const vertexData = element.vertexData;
		let textureId = element._texture.baseTexture._batchLocation;

		for (let i = 0; i < vertexData.length; i += 2)
		{
			float32View[aIndex++] = vertexData[i];
			float32View[aIndex++] = vertexData[i + 1];
			float32View[aIndex++] = uvs[i];
			float32View[aIndex++] = uvs[i + 1];
			float32View[aIndex++] = color.r;
			float32View[aIndex++] = color.g;
			float32View[aIndex++] = color.b;
			float32View[aIndex++] = color.a;
			float32View[aIndex++] = textureId;
		}

		for (let i = 0; i < indices.length; i++)
		{
			indexBuffer[iIndex++] = p + indices[i];
		}
	}
};

export default ColorPlugin;
