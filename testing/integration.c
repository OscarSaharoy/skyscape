#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <math.h>

#define vec3(x, y, z) {x, y, z}

#define EARTH_RADIUS 6360e+3

typedef struct {
	float x;
	float y;
	float z;
} vec3;

float dot( vec3 v_a, vec3 v_b ) {
	return v_a.x * v_b.x + v_a.y * v_b.y + v_a.z * v_b.z;
}

float length( vec3 v ) {
	return sqrtf(dot( v, v ));
}

vec3 scale( vec3 v, float f ) {
	vec3 res = { v.x * f, v.y * f, v.z * f };
	return res;
}

vec3 add( vec3 v_a, vec3 v_b ) {
	vec3 res = { v_a.x + v_b.x, v_a.y + v_b.y, v_a.z + v_b.z };
	return res;
}

vec3 sub( vec3 v_a, vec3 v_b ) {
	return add( v_a, scale( v_b, -1.f ) );
}

vec3 normalize( vec3 v ) {
	float l = length(v);
	vec3 res = { v.x / l, v.y / l, v.z / l };
	return res;
}

float func( const float x ) {

	return 1.f / (x*x + 1.f);
}

float rayleigh( const float h ) {

	return expf( -h / 12.5e+3 );
}

float mie( const float h ) {

	return expf( -h / 1.2e+3 );
}

float height( vec3 p ) {
	
	vec3 earthCentre = { 0.f, 0.f, -EARTH_RADIUS };
	return length( sub( p, earthCentre ) ) - EARTH_RADIUS;
}

float integrateAlongRay(vec3 ro, vec3 rd) {

	float rayLength = 1000000.f;
	float nSteps = 100000.f;
	float step = rayLength / nSteps;

	float result = 0.f;
	for( float t = 0.f; t < rayLength; t += step ) {
		//printf("%f: %f\n", t, result );
		vec3 p = add( ro, scale( rd, t ) );
		result += rayleigh( height(p) ) * step;
	}

	return result;
}

float integrate() {

	int nSamples = 100;
	float lowerLimit = 0.f;
	float upperLimit = 100e+3;
	float sampleWidth = ( upperLimit - lowerLimit ) / nSamples;

	float result = 0.0f;
	for( float x = lowerLimit; x < upperLimit; x += sampleWidth ) {

		//printf("%f: %f\n", x, result );
		result += rayleigh( x ) * sampleWidth;
	}

	return result;
}

float integrateColumn( float h ) {

	return 12.5e+3 * (
		expf( -h / 12.5e+3  )
	);
}

float estimate(vec3 ro, vec3 rd) {
	
	vec3 up = vec3( 0.f, 0.f, 1.f );
	float cosTheta = dot( rd, up );
	return integrateColumn(height(ro)) / cosTheta;
}

float estimate1(vec3 ro, vec3 rd) {
	
	vec3 down = vec3( 0.f, 0.f, -1.f );

	float cosGamma = dot( rd, down );
	float R = EARTH_RADIUS;
	float h = 100e+3;

	float h2 = R * cosGamma + sqrtf(
		R*R*cosGamma*cosGamma + 2.*R*h + h*h
	);

	return integrateColumn(height(ro)) * h2/h;
}

float estimate2(vec3 ro, vec3 rd) {
	
	return sqrtf( estimate1(ro, rd) * estimate(ro, rd) );
}


int main() {

	vec3 ro = vec3( 0.f, 0.f, 3331.f );
	vec3 rd = vec3( 100.f, 0.f, 1.f );
	rd = normalize( rd );

	printf( "integrateAlongRay: %f\n", integrateAlongRay(ro, rd) );
	printf( "estimate: %f\n",  estimate( ro, rd) );
	printf( "estimate1: %f\n", estimate1(ro, rd) );
	printf( "estimate2: %f\n", estimate2(ro, rd) );
}
