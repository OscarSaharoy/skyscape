// Oscar Saharoy 2022


const fragmentShader = `

// ====================================================================================

uniform float uTime;
uniform vec2 uResolution;

void main() {

    float minDimension = min( uResolution.x, uResolution.y );
    float aspect = uResolution.x / uResolution.y;
    vec2 centredFragCoord = 2. * gl_FragCoord.xy - uResolution.xy;
    vec2 screenPos = centredFragCoord / minDimension;

    gl_FragColor.rgb = sin(screenPos.xyy * 10.);
    gl_FragColor.a = 1.;
}

// ====================================================================================

`;

