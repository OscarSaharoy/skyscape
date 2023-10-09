#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <math.h>

#define EARTH_RADIUS 6360e+3

typedef struct {
	float x;
	float y;
	float z;
} vec3;

float length( vec3 v ) {
	return sqrtf( v.x*v.x + v.y*v.y + v.z*v.z );
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

float integrateAlongRay() {

	vec3 ro = { 0., 0., 0. };
	vec3 rd = { .1, 0., 1. };
	rd = normalize( rd );
	float rayLength = 100000.f;
	float nSteps = 100.f;
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

float estimate() {
	
	vec3 rd = { .1, 0., 1. };
	return 1.f;
}


int main() {

	printf( "integrateAlongRay: %f\n", integrateAlongRay() );
	printf( "integrate: %f\n", integrate() );
	printf( "estimate: %f\n", estimate() );
}
