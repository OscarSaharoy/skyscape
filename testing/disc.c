/*
L^2 = (R+H)^2 - R^2

a = arcsin( R / (R+H) )
*/

#include <stdio.h>
#include <math.h>

int main() {

	float R = 6360000.;
	double dR = 6360000.;

	float h = 0.;
	double dh = 0.;

	for( int i = 0; i < 10; ++i ) {
		printf( "h: %f\n", h );
		printf( "float: %1.30f\n", (R+h)/R );
		printf( "double: %1.30f\n", (dR+dh)/dR );
		printf( "float2: %1.30f\n", 1. + h/R );
		printf( "double2: %1.30f\n", 1. + dh/dR );

		double dd = 10;
		h += (float)dd;
		dh += dd;
	}
	return 0;
}
