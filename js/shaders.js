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

uniform float uTime;
uniform vec2 uResolution;
uniform float uZoom;

varying vec3 vNormal;

#define PI 3.14159265
#define UP vec3(0, 1, 0)
#define DOWN vec3(0, -1, 0)


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

vec3 hash13(float p) {
	vec3 p3 = fract(vec3(p) 
			* vec3(.1031, .1030, .0973));
	p3 += dot(p3, p3.yzx+33.33);
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

    float size
        = pow( celluv.z, 4. )
        * pow(2. - celluv.z, -15.);
    
    size
        = saturate(0.2*celluv.z - 0.05)
        + saturate(20.*(celluv.z-1.)+1.);

    size
        = pow(celluv.z, 15.);

	return saturate(vec3(
		1. / length(celluv.xy)
           / pow(uZoom, 0.75)
           * size * 0.01
	       - .05
	));
}

void main() {

    vec3 viewDir = normalize(vNormal);
    
    gl_FragColor.a = 1.;
	gl_FragColor.rgb = vec3(.1);

	for( float bo=-1.; bo<1.1; ++bo)
	for( float co=-1.; co<1.1; ++co) {
		vec3 celluv = dirToCellUV( viewDir, bo, co );

		float jitter = .7;
		celluv += (hash13(celluv.z) - .5)
				* vec3(jitter, jitter, 0.);

		gl_FragColor.rgb += starFunction( celluv );
	}
}

// =====================================================

`;

