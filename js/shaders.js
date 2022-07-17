// Oscar Saharoy 2022


export const skyVert = `

// =====================================================

varying vec3 vNormal;

void main() {
	
    gl_Position = projectionMatrix 
				* modelViewMatrix 
				* vec4( position, 1.0 );
    vNormal     = normal;
}

// =====================================================

`; export const skyFrag = `

// =====================================================

// === defs ===

uniform float uTime;
uniform vec2 uResolution;
uniform float uZoom;

varying vec3 vNormal;

#define PI 3.14159265
#define UP vec3(0, 1, 0)
#define DOWN vec3(0, -1, 0)


// === utility functions ===

float saturate( float x ) {
	return clamp( x, 0., 1. );
}

vec3 saturate( vec3 v ) {
	return clamp( v, 0., 1. );
}

float hash11(float p) {
	p = fract(p * .1031);
    p *= p + 33.33;
    p *= p + p;
    return fract(p);
}

vec2 hash12(float p) {
	vec2 p2 = fract(vec2(p) 
			* vec2(536.1031, 465.1030));
	p2 += dot(p2, p2.yx+33.33);
	return fract((p2.xy+p2.yy)*p2.yx);
}

vec3 hash13(float p) {
	vec3 p3 = fract(vec3(p) 
			* vec3(.1031, .1030, .0973));
	p3 += dot(p3, p3.yzx+337.33);
	return fract((p3.xxy+p3.yzz)*p3.zyx);
}

float hash31(vec3 p3) {
	p3  = fract(p3 * 1362.1031);
    p3 += dot(p3, p3.zyx + 31.32);
    return fract((p3.x + p3.y) * p3.z);
}

vec3 hash33( vec3 p ) {
    vec3 q = vec3( 
		dot( p, vec3(127.1,311.7,432.2) ), 
		dot( p, vec3(269.5,183.3,847.6) ), 
		dot( p, vec3(419.2,371.9,927.0) )
	);
    return fract(sin(q)*43758.5453);
}


// === starlight functions ===

vec3 dirToCellUV( vec3 dir,
		float bandOffset, float cellOffset ) {

	float bandHeight = 0.08;
	float phi = acos( dot( UP, dir ) );
	float band = floor( phi / bandHeight ) 
		       * bandHeight + bandOffset * bandHeight;

	float areaMiddle = bandHeight * bandHeight;
	float topHeight = cos( band );
	float bottomHeight = cos( band + bandHeight );
	float bandArea = 2. * PI 
				   * ( topHeight - bottomHeight );
	float divisions = floor( bandArea / areaMiddle );

	float theta = atan( -dir.x, -dir.z ) + PI;
	float cellLength = 2. * PI / divisions;
	float cell = floor( theta / cellLength ) 
			   * cellLength + cellOffset * cellLength;

	vec3 cellCoords = vec3(band, cell, 0.); 

	float phic = (phi - band) / bandHeight;
	float thetac = (theta - cell) / cellLength;

	if(cellOffset < 0. && theta < cellLength)
		cell += divisions * cellLength;
    if(cellOffset > 0. && theta > 2.*PI - cellLength)
		cell -= divisions * cellLength;

	vec3 celluv = vec3(
		phic - .5,
		thetac - .5,
		hash11( hash11(band) + cell )
	);

	return celluv;
}

vec3 starFunction( vec3 celluv ) {

    float size = pow(celluv.z, 15.);

	return saturate(vec3(
		1. / length(celluv.xy)
           / pow(uZoom, 0.75)
           * size * 0.004
	       - .05
	));
}

vec3 starLight( vec3 viewDir ) {

    vec3 light = vec3(0);

	for( float bo=-1.; bo<1.1; ++bo)
	for( float co=-1.; co<1.1; ++co) {

		vec3 celluv = dirToCellUV( viewDir, bo, co );
		celluv.xy += hash12(celluv.z * 100.) - .5;

		light += starFunction( celluv );
	}

    return light * vec3(1, 1, 1);
}


// === atmosphere functions ===

vec3 atmosphereLight( vec3 viewDir ) {

    return vec3(0.4, 0.7, 0.9);
}



// === main ===

void main() {

    vec3 viewDir = normalize(vNormal);
    
    gl_FragColor.a = 1.;
	gl_FragColor.rgb = vec3(.1);
    //gl_FragColor.rgb += starLight( viewDir );
    gl_FragColor.rgb += atmosphereLight( viewDir );
}

// =====================================================

`;

