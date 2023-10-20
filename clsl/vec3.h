
#ifndef VEC3_H
#define VEC3_H
#include <cmath>
#include <functional>

class vec3 {
	public:

	float x;
	float y;
	float z;

	vec3(float x, float y, float z) : x(x), y(y), z(z) {}

	float operator[](int i) { 
		float vals[3] = {x,y,z};
		return vals[i]; 
	}
};

std::ostream& operator<<( std::ostream& os, const vec3& v ) {
	return ( os << "vec3( " << v.x << ", " << v.y << ", " << v.z << " )" );
}

vec3 operator+( const vec3& a, const vec3& b ) {
	return vec3( a.x+b.x, a.y+b.y, a.z+b.z );
}
vec3 operator+( const vec3& a, const float b ) {
	return vec3( a.x+b, a.y+b, a.z+b );
}
vec3 operator+( const float a, const vec3& b ) {
	return b + a;
}

vec3 operator-( const vec3& a, const vec3& b ) {
	return vec3( a.x-b.x, a.y-b.y, a.z-b.z );
}
vec3 operator-( const vec3& a, const float b ) {
	return vec3( a.x-b, a.y-b, a.z-b );
}
vec3 operator-( const float a, const vec3& b ) {
	return b - a;
}

vec3 operator*( const float a, const vec3& b ) {
	return vec3( a*b.x, a*b.y, a*b.z );
}
vec3 operator*( const vec3& a, const float b ) {
	return b * a;
}

vec3 operator/( const vec3& a, const float b ) {
	return vec3( a.x/b, a.y/b, a.z/b );
}

float length( const vec3& v ) {
	return sqrt( v.x*v.x + v.y*v.y + v.z*v.z );
}

float dot( const vec3& a, const vec3& b ) {
	return a.x*b.x + a.y*b.y + a.z*b.z;
}

vec3 cross( const vec3& a, const vec3& b ) {
	return vec3( a.y*b.z - a.z*b.y,  a.z*b.x - a.x*b.z, a.x*b.y + a.y*b.x );
}

#define map(func) \
vec3 func(const vec3& v) { \
	return vec3( func(v.x), func(v.y), func(v.z) ); \
}

map(sin)
map(cos)

#endif

