// Oscar Saharoy 2022

export default `

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

float mod289(float x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 perm(vec4 x){return mod289(((x * 34.0) + 1.0) * x);}

float threenoise(vec3 p){
    vec3 a = floor(p);
    vec3 d = p - a;
    d = d * d * (3.0 - 2.0 * d);

    vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
    vec4 k1 = perm(b.xyxy);
    vec4 k2 = perm(k1.xyxy + b.zzww);

    vec4 c = k2 + a.zzzz;
    vec4 k3 = perm(c);
    vec4 k4 = perm(c + 1.0);

    vec4 o1 = fract(k3 * (1.0 / 41.0));
    vec4 o2 = fract(k4 * (1.0 / 41.0));

    vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
    vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);

    return o4.y * d.y + o4.x * (1.0 - d.y);
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

float rand(vec2 co) {
	return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

float rand(vec3 co) {
	return fract(sin(dot(co.xyz ,vec3(12.9898,78.233,47.985))) * 43758.5453);
}

// credit: iq/rgba
float hash( float n ) {
	return fract(sin(n)*43758.5453);
}


// credit: iq/rgba
float noise( in vec3 x ) {
	vec3 p = floor(x);
	vec3 f = fract(x);
	f = f*f*(3.0-2.0*f);
	float n = p.x + p.y*57.0 + 113.0*p.z;
	float res = mix(mix(mix( hash(n+  0.0), hash(n+  1.0),f.x),
						mix( hash(n+ 57.0), hash(n+ 58.0),f.x),f.y),
					mix(mix( hash(n+113.0), hash(n+114.0),f.x),
						mix( hash(n+170.0), hash(n+171.0),f.x),f.y),f.z);
	return res;
}


float fbm(in vec3 x) {
	float i = 1.0;
	
	float n = noise(x * i) / i; i *= 2.0;
	n+= noise(x * i) / i; i *= 2.0;
	n+= noise(x * i) / i; i *= 2.0;
	n+= noise(x * i) / i; i *= 2.0;
	n+= noise(x * i) / i; i *= 2.0;
	n+= noise(x * i) / i; i *= 2.0;

	return n;
}

`;
