// Oscar Saharoy 2022


export const skyVert = `

// ====================================================================================

varying vec3 vNormal;

void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    vNormal = normal;
}

// ====================================================================================

`; export const skyFrag = `

// ====================================================================================

uniform float uTime;
uniform vec2 uResolution;

varying vec3 vNormal;

float hash13(vec3 p3) {

	p3  = fract(p3 * .1031);
    p3 += dot(p3, p3.zyx + 31.32);
    return fract((p3.x + p3.y) * p3.z);
}

void main() {
    
    vec3 black = vec3(0);
    vec3 blue = vec3(0, 112, 147) / 255.;
    vec3 up = vec3(0, 1, 0);
    float upness = dot(vNormal, up);

    gl_FragColor.rgb = mix(black, blue, pow(11., -upness));
    gl_FragColor.a = 1.;

    float star = hash13(vNormal * 100.);
    gl_FragColor.rgb += clamp( 1000.*(star - 0.999), 0., 1. );
    //gl_FragColor.rgb = vNormal;
}

// ====================================================================================

`;

