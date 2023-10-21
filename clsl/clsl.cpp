#include <iostream>
#include "vec3.h"

int main() {

	vec3 a = vec3( 1, 2, 3 );
	vec3 b = vec3( 4, 5, 6 );

	vec3 c1 = sin(a) * cos(b);
	vec3 c2 = 1/2. * ( sin(a+b) + sin(a-b) );
	
	std::cout << c1 << std::endl;
	std::cout << c2 << std::endl;
}

