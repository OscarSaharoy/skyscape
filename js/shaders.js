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
uniform mat4 uSkyRotation;
uniform vec3 uSunDir;
uniform vec3 uMoonDir;

varying vec3 vNormal;

#define PI 3.14159
#define PHI 1.618033
#define UP vec3(0, 1, 0)
#define DOWN vec3(0, -1, 0)
#define SUN_DIST 151560000000. 
#define SUN_RADIUS 696340000. 
#define MOON_DIST 384400000. 
#define MOON_RADIUS 1737400. 
#define EARTH_RADIUS 6400000.
#define EARTH_CENTRE vec3(0,-EARTH_RADIUS,0)
#define ATMOSPHERE_RADIUS 6500000.
#define VIEWER_HEIGHT 2.


// === utility functions ===

float saturate( float x ) {
	return clamp( x, 0., 1. );
}

vec3 saturate( vec3 v ) {
	return clamp( v, 0., 1. );
}

float hash11(float p) {
	p = 27.2772 * fract(p);
	p += 27.2772;
	p *= p;
	return fract(p);
}

vec2 hash12(float p) {
	vec2 p2 = fract(vec2(p) * vec2(536.1031, 465.1030));
	p2 += dot(p2, p2.yx+33.33);
	return fract((p2.xy+p2.yy)*p2.yx);
}

float hash31(vec3 p3) {
	p3 = fract(p3 * 153.274682 + .73529);
    p3 *= p3 + 27.2772;
	return fract((p3.x + p3.y) * p3.z);
}

vec3 random3(vec3 c) {
	float j = 4096.0*sin(dot(c,vec3(17.0, 59.4, 15.0)));
	vec3 r;
	r.z = fract(512.0*j);
	j *= .125;
	r.x = fract(512.0*j);
	j *= .125;
	r.y = fract(512.0*j);
	return r-0.5;
}

const float F3 =  0.3333333;
const float G3 =  0.1666667;

/* 3d simplex noise */
float simplex3d(vec3 p) {
	 /* 1. find current tetrahedron T and it's four vertices */
	 /* s, s+i1, s+i2, s+1.0 - absolute skewed (integer) coordinates of T vertices */
	 /* x, x1, x2, x3 - unskewed coordinates of p relative to each of T vertices*/

	 /* calculate s and x */
	 vec3 s = floor(p + dot(p, vec3(F3)));
	 vec3 x = p - s + dot(s, vec3(G3));

	 /* calculate i1 and i2 */
	 vec3 e = step(vec3(0.0), x - x.yzx);
	 vec3 i1 = e*(1.0 - e.zxy);
	 vec3 i2 = 1.0 - e.zxy*(1.0 - e);

	 /* x1, x2, x3 */
	 vec3 x1 = x - i1 + G3;
	 vec3 x2 = x - i2 + 2.0*G3;
	 vec3 x3 = x - 1.0 + 3.0*G3;

	 /* 2. find four surflets and store them in d */
	 vec4 w, d;

	 /* calculate surflet weights */
	 w.x = dot(x, x);
	 w.y = dot(x1, x1);
	 w.z = dot(x2, x2);
	 w.w = dot(x3, x3);

	 /* w fades from 0.6 at the center of the surflet to 0.0 at the margin */
	 w = max(0.6 - w, 0.0);

	 /* calculate surflet components */
	 d.x = dot(random3(s), x);
	 d.y = dot(random3(s + i1), x1);
	 d.z = dot(random3(s + i2), x2);
	 d.w = dot(random3(s + 1.0), x3);

	 /* multiply d by w^4 */
	 w *= w;
	 w *= w;
	 d *= w;

	 /* 3. return the sum of the four surflets */
	 return dot(d, vec4(52.0));
}

vec4 intersectSphere( vec3 rayOrigin, vec3 rayDir,
		vec3 sphereCentre, float sphereRadius ) {

	vec3 ro = rayOrigin;
	vec3 rd = rayDir;
	vec3 c  = sphereCentre;
	float R = sphereRadius;

	vec4 result = vec4(0.0);

	vec3 ro2c = c - ro;
	float distToClosest = dot(rd, ro2c);
	vec3 closestPoint = ro + rd * distToClosest;
	float centreToClosest = length(
		closestPoint - sphereCentre
	);

    if( distToClosest > 0. )
        result.xyz = closestPoint;

	if( centreToClosest > R )
		return result;
	
	float closestToIntersect = sqrt(
		R*R - centreToClosest*centreToClosest
	);
	float distToSphere = 
		distToClosest - closestToIntersect;
	float distThroughSphere = 
		closestToIntersect * 2. + min(0., distToSphere);
	if( distThroughSphere < 0. )
		return result;
	vec3 intersect = rayOrigin 
				   + max(0., distToSphere) * rayDir;

	result.xyz = intersect;
	result.w = distThroughSphere;

	return result;
}

float distToSphere( vec3 rayOrigin, vec3 rayDir,
		vec3 sphereCentre, float sphereRadius ) { 

	vec3 ro = rayOrigin;
	vec3 rd = rayDir;
	vec3 c  = sphereCentre;
	float R = sphereRadius;

	vec3 ro2c = c - ro;
	float distToClosest = dot(rd, ro2c);

    if( distToClosest < 0. )
        return 0.;

	vec3 closestPoint = ro + rd * distToClosest;
	float centreToClosest = length(
		closestPoint - sphereCentre
	);

	if( centreToClosest > R )
		return 0.;
	
	float closestToIntersect = sqrt(
		R*R - centreToClosest*centreToClosest
	);
	float distToSphere = 
		distToClosest - closestToIntersect;

    return distToSphere;
}

// === starlight ===

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
	float twinkle = 
		1. - hash11(uTime + celluv.z) * 0.2;
	vec2 jitter = hash12(celluv.z) * 2. - 1.;

	return saturate(vec3(
		1. / length(celluv.xy + jitter)
           * size * 0.002 * twinkle
	       - .001
	)
	/ pow(uZoom, 0.75));
}

vec3 starLight( vec3 viewDir ) {

	vec3 rotatedView = 
		(vec4(viewDir, 1.) * uSkyRotation).xyz;

    vec3 light = vec3(0);

	for( float bo=-1.; bo<1.1; ++bo)
	for( float co=-1.; co<1.1; ++co) {

		vec3 celluv = dirToCellUV( 
			rotatedView, bo, co );
		celluv.xy += hash12(celluv.z * 100.) - .5;

		light += starFunction( celluv );
	}

    return light * vec3(1, 1, 1);
}

// === sunlight ===

vec3 sunLight( vec3 viewDir ) {

	vec3 light = vec3(0);

	vec3 sunPos = uSunDir * SUN_DIST;

	vec4 sunIntersect = intersectSphere(
		vec3(0), viewDir, 
		sunPos, SUN_RADIUS);

	if( sunIntersect.w == 0.0 ) return vec3(0);

	light += 1.;

	return light;
}


// === moonlight ===

vec3 moonLight( vec3 viewDir ) {

	vec3 light = vec3(0);

	vec3 moonPos = uMoonDir * MOON_DIST;

	vec4 moonIntersect = intersectSphere(
		vec3(0), viewDir, 
		moonPos, MOON_RADIUS);

	if( moonIntersect.w != 0.0 ) {

        light += saturate(dot(
            normalize(moonIntersect.xyz - moonPos), 
            uSunDir) * 4.);
    }

	return light;
}


// === atmosphere ===

float densityAtPoint( vec3 point ) {

    float densityFalloff = 1.;
    float densityMultiplier = 1e-5;

    float heightAboveSurface = 
        length(point - EARTH_CENTRE) - EARTH_RADIUS;
    float height01 = heightAboveSurface 
        / ( ATMOSPHERE_RADIUS - EARTH_RADIUS  );
    float localDensity = densityMultiplier 
        * exp(-height01 * densityFalloff) 
        * (1. - height01);

    return localDensity;
}

float opticalDepth( 
        vec3 rayOrigin, vec3 rayDir, float rayLength ) {

    int numOpticalDepthPoints = 10;

    vec3 densitySamplePoint = rayOrigin;
    float stepSize = rayLength 
        / (float(numOpticalDepthPoints) - 1.);
    float opticalDepth = 0.;

    for( int i = 0; i < numOpticalDepthPoints; ++i ) {
        float localDensity = 
            densityAtPoint(densitySamplePoint);
        opticalDepth += localDensity * stepSize;
        densitySamplePoint += rayDir * stepSize;
    }

    return opticalDepth;
}


vec3 calculateLight( 
        vec3 viewPos, vec3 viewDir, float rayLength ) {

    int numInScatteringPoints = 10;

    vec3 inScatteredLight = vec3(0.);
    float stepSize = rayLength 
        / float(numInScatteringPoints);
    vec3 inScatterPoint = 
        viewPos + 0.5 * stepSize * viewDir;

    for( int i = 0; i < numInScatteringPoints; i++ ) {

        float sunRayLength = intersectSphere( 
            inScatterPoint, uSunDir, 
            EARTH_CENTRE, ATMOSPHERE_RADIUS ).w;

        float sunRayOpticalDepth = opticalDepth( 
            inScatterPoint, uSunDir, sunRayLength );

        float viewRayOpticalDepth = opticalDepth( 
            inScatterPoint, -viewDir, 
            stepSize * float(i) ); 

        vec3 transmittance = exp( 
            - (sunRayOpticalDepth + viewRayOpticalDepth) 
            * vec3(1., 1., 1.)
        );

        float localDensity = 
            densityAtPoint(inScatterPoint);

        inScatteredLight += 
            localDensity * transmittance * stepSize;
        inScatterPoint += viewDir * stepSize;
    }

    return inScatteredLight;
}

vec3 atmosphereLight( vec3 viewDir ) {

	vec3 light = vec3(0);

	vec4 atmosphereIntersect = intersectSphere(
		vec3(0), viewDir, 
		EARTH_CENTRE, ATMOSPHERE_RADIUS
	);

    //float distToEarth = distToSphere( 
    //  vec3(0), viewDir, EARTH_CENTRE, EARTH_RADIUS );
    float viewDotDown = dot( viewDir, DOWN );
    float distThroughAtmosphere;

    if( viewDotDown < 1e-2 )
        distThroughAtmosphere = atmosphereIntersect.w;
    else 
        distThroughAtmosphere = 
            VIEWER_HEIGHT / dot( viewDir, DOWN );
    

    return calculateLight(
        vec3(0), viewDir, distThroughAtmosphere);
}


vec3 atmosphereNoise( vec3 viewDir ) {

	return vec3(
		0.006 * ( hash31( viewDir*10. ) - 0.5 ) 
	);
}

// === ocean ===

vec3 oceanLight( vec3 viewDir, vec3 preLight ) {

    float distToEarth = 
        VIEWER_HEIGHT / dot(viewDir, UP);
    vec3 earthIntersect = vec3(0) 
        + viewDir * distToEarth;

    vec3 intersectCube = floor(earthIntersect / 100.);

    return vec3(hash31(intersectCube)) 
        * step(distToEarth, 0.);
}


// === main ===

void main() {

    vec3 viewDir = normalize(vNormal);
    vec3 light = vec3(0);
    
	//light = vec3(0.05);
    //light += starLight( viewDir );
	//light += sunLight( viewDir );
	//light += moonLight( viewDir );
    light += atmosphereLight( viewDir );
	light += atmosphereNoise( viewDir );
    //light += oceanLight( viewDir, light );
    
	light += sunLight( viewDir );
    gl_FragColor.a = 1.;
    gl_FragColor.rgb = light;
}

// =====================================================

`;

