// Oscar Saharoy 2022

export default `

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
		(vec4(viewDir, 1.) * uStarsRotation).xyz;

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

`;
