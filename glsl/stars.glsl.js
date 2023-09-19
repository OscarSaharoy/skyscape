// Oscar Saharoy 2022

export default `

#define POLE_SENTINEL vec3(-1)

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

	if( band < 1.5 * bandHeight || band > PI - 2.5 * bandHeight  )
		return POLE_SENTINEL;

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

	vec2 jitter = hash12(celluv.z) * 3. - 1.5;
	float scale = 0.00003 * ( 1. - pow( length(jitter) / 2.12, 0.06 ) );
	float r = length(celluv.xy + jitter);

	if( scale < 0.000001 ) return vec3(0);

	return saturate(
		vec3( scale / pow(r, 1.8) - 0.001 )
		/ pow(uZoom, 0.75)
	);
}

vec3 starLight( vec3 viewDir ) {

	vec3 rotatedView = 
		(vec4(viewDir, 1.) * uStarsRotation).xyz;

    vec3 light = vec3(0);

	for( float bo=-1.; bo<1.1; ++bo)
	for( float co=-1.; co<1.1; ++co) {

		vec3 celluv = dirToCellUV( 
			rotatedView, bo, co );

		if( celluv == POLE_SENTINEL )
			continue;

		//if( celluv.z > 0.05 ) continue;

		light += starFunction( celluv );
	}

    return light * vec3(1, 1, 1);
}

`;
