
export default `

// atmospheric scattering specifics


vec3 lightCol = vec3(1);


vec4 clampPositive( vec4 x ) {
	return max( vec4(0), x );
}


// mie/rayleigh phase - @pyalot http://codeflow.org/entries/2011/apr/13/advanced-webgl-part-2-sky-rendering/
// sensible g: mie:0.97, ral:-0.01
float phase(float alpha, float g) {
	float gg = g*g;
	float a = 3.0*(1.0-gg);
	float b = 2.0*(2.0+gg);
	float c = 1.0+alpha*alpha;
	float d = pow(1.0+gg-2.0*g*alpha, 1.5);
	return (a/b)*(c/d);
}


vec4 atmosphereComp( in vec3 pos ) {

	// returns a vec4 of the rayleigh, mie, cloud and ozone densities at a given point
	vec4 res = vec4(0);

    float heightAboveSurface = 
        length(pos - EARTH_CENTRE) - EARTH_RADIUS;

    res[0] = exp( - heightAboveSurface / 8000. ); // rayleigh
    res[1] = exp( - heightAboveSurface / 1200. ); // mie
	res[2] = fbm(pos*5e-5) - 1.2; // cloud
	res[3] = max(0., 1. - abs(heightAboveSurface - 25e+3) / 15e+3 ); // ozone

	return res;
}

vec4 phase( in float cosTheta ) {

	// returns a vec4 of the phase function for the 4 different atmopshere components
	// evaluated at cosTheta
	vec4 res = vec4(1);

	float miePhase = 0.9;
	float rayleighPhase = -0.01;
	float cloudPhase = 0.9;
	float ozonePhase = 0.;

	res[0] = phase( cosTheta, rayleighPhase );
	res[1] = phase( cosTheta, miePhase );
	res[2] = phase( cosTheta, cloudPhase ) * 1. / 12. + 1.;
	res[3] = phase( cosTheta, ozonePhase );

	return res;
}

vec3 transmittanceToSun( in vec3 apos ) {

	mediaIntersection hit = intersectAtmosphere( apos, uSunDir ); // cast ray to sun, intersect with inner edge of sphere
	float dtl = 0.;//( hit.tfar - hit.tnear ) / float(nSamples); // keep it rather chunky, don't want to bog down
	//dtl = (hit.tfar - hit.tnear) * clamp( 0.2 - 0.2 * cloudDensityAtSpos*10000., 0.001, 1. );
	dtl = (hit.tfar - hit.tnear) * 0.2;

	vec3 transmittance = vec3(1);

	for( float tl = hit.tnear; tl < hit.tfar; tl += dtl ) {
		
		vec3 spos = apos + uSunDir * tl;

		vec4 atmComp = atmosphereComp( spos );
		atmComp = clampPositive( atmComp );

		vec3 extinctionThisStep = (dtl * uExtinctionMatrix * atmComp).xyz;

		transmittance *= exp( - extinctionThisStep );
	}

	return transmittance;
}


vec3 inScatteredLight( in vec3 viewDir ) {

	// get start and end t values for ray through atmosphere
	mediaIntersection hit = intersectAtmosphere( vec3(0), viewDir );
	
	vec3 light = vec3(0);

	// step through atmosphere, cast rays to lightsource to determine shadow.
	float dt = 0.;//(hit.tfar - hit.tnear) / float(uSamplePointsPerFrame);
	float rayLength = hit.tfar - hit.tnear;
	dt = rayLength * 0.1;
	//dt = (hit.tfar - hit.tnear) * clamp( 0.2 - 0.2 * cloudDensityAtApos*1000., 0.001, 1. );
	
	vec3 transmittanceToViewer = vec3(1);

	float t = hit.tnear;
	for( int i = 0; i < uSamplePointsPerFrame; ++i ) {

		t = hit.tnear + dt * (float(i) + hash(uFramesStationary) );
		vec3 apos = viewDir * t; // position along atmosphere ray

		vec4 atmComp = atmosphereComp( apos );
		dt = rayLength * 0.2;
		atmComp = clampPositive( atmComp );

		float cosTheta = dot(viewDir,uSunDir);
		vec4 phaseComp = phase( cosTheta );
						
		vec3 extinctionThisStep = (uExtinctionMatrix * atmComp).xyz * dt;

		transmittanceToViewer *= exp( -extinctionThisStep );

		vec3 scatterThisStep = (uScatteringMatrix * (phaseComp * atmComp)).xyz * dt;

		vec3 influx = lightCol * transmittanceToSun( apos );
		light += influx * scatterThisStep * transmittanceToViewer;
	}

	return max( vec3(0), light );
}


`
