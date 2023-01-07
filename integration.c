#include <stdio.h>
#include <stdlib.h>
#include <time.h>


float func( const float x ) {

	return 1.f / (x*x);
}



int main() {

	srand(time(NULL));
	float result = 0.0f;

	int nSamples = 1000000;
	float integrationRange = 4.f;
	float sampleWidth = integrationRange / nSamples;

	for( int i = 0; i < nSamples; ++i ) {

		float rand01 = (float)(rand()) / RAND_MAX;
		float sample = rand01 * 4 + 1;

		result += func( sample );	
	}

	printf( "%f\n", result * sampleWidth );
}
