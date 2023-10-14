
export default `

// atmospheric scattering specifics


// intersection through participating media (like atmospheres)
struct mediaIntersection {
	float tnear;   // first intersection
	float tfar;    // last intersection
};
#define noIntersection mediaIntersection( -1., -1. )

mediaIntersection intersectAtmosphere( in vec3 ro, in vec3 rd ) {

	mediaIntersection res = noIntersection;

	// atmosphere intersection
	vec3 oc = ro - EARTH_CENTRE;
	float b = 2. * dot(oc, rd);
	float c = dot(oc,oc) - ATMOSPHERE_RADIUS * ATMOSPHERE_RADIUS;
	float det = b*b - 4. * c;

	if (det >= 0.) {

		res.tnear = max( 0., ( -b - sqrt(det) ) / 2. );
		res.tfar  =          ( -b + sqrt(det) ) / 2.;
	}

	// handle earth intersection
	/*
	vec4 oceanIntersection = intersectOcean( rd );
	if( oceanIntersection != NO_OCEAN_INTERSECT )
		res.tfar = oceanIntersection.w;
	*/

	return res;
}


float height( vec3 p ) {
	
	return length( p - EARTH_CENTRE ) - EARTH_RADIUS;
}

float integrateColumn( float h ) {

	return 8e+3 * (
		exp( -h / 8e+3  )
	);
}

float estimate(vec3 ro, vec3 rd) {
	
	vec3 up = vec3( 0., 1., 0. );
	float cosTheta = dot( rd, up );
	return integrateColumn(height(ro)) / cosTheta;
}


float estimate1(vec3 ro, vec3 rd) {
	
	vec3 down = vec3( 0.f, -1.f, 0.f );

	float cosGamma = dot( rd, down );
	float R = EARTH_RADIUS;
	float h = 100e+3;

	float h2 = R * cosGamma + sqrt(
		R*R*cosGamma*cosGamma + 2.*R*h + h*h
	);

	return integrateColumn(height(ro)) * h2/h;
}

float estimateDepth(vec3 ro, vec3 rd) {

	if( intersectSphere( ro, rd, EARTH_CENTRE, EARTH_RADIUS ).w != 0. )
		return 1e+10;
	
	return estimate1(ro, rd);
	return sqrt( estimate1(ro, rd) * estimate(ro, rd) );
}


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
	res[2] = max(0., 1. - abs(heightAboveSurface - 25e+3) / 15e+3 ); // ozone
	res[3] = fbm(pos*5e-5) - 1.2; // cloud

	res.yzw *= 0.;
	return res;
}

float stepSize( in vec4 atmComp, in float rayLength ) {
	
	return rayLength * clamp( 0.1 * - (atmComp[2] - 0.8), 0.01, 0.2 );
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
	res[2] = phase( cosTheta, ozonePhase );
	res[3] = phase( cosTheta, cloudPhase ) * 1. / 12. + 1.;

	return res;
}

vec3 transmittanceToSun( in vec3 apos ) {

	mediaIntersection hit = intersectAtmosphere( apos, uSunDir ); // cast ray to sun, intersect with inner edge of sphere
	float rayLength = hit.tfar - hit.tnear;
	float dtl = rayLength * 0.1;

	vec3 transmittance = vec3(1);

	for( float tl = hit.tnear; tl < hit.tfar; tl += dtl ) {
		
		vec3 spos = apos + uSunDir * tl;

		vec4 atmComp = atmosphereComp( spos );
		dtl = stepSize( atmComp, rayLength );
		atmComp = clampPositive( atmComp );

		vec3 extinctionThisStep = (dtl * uExtinctionMatrix * atmComp).xyz;

		transmittance *= exp( - extinctionThisStep );
		
		if( length(transmittance) < 0.01 )
			return transmittance;
	}

	return transmittance;
}

vec3 transmittanceToSun1( in vec3 apos ) {

	mediaIntersection hit = intersectAtmosphere( apos, uSunDir ); // cast ray to sun, intersect with inner edge of sphere
	float rayLength = hit.tfar - hit.tnear;

	vec3 ro = apos + uSunDir * hit.tnear;
	vec3 rd = uSunDir;

	float rayleighDepth = estimateDepth( ro, rd );

	vec3 transmittance = exp( 
		-rayleighDepth * vec3(5.80, 13.6, 33.1) * 1e-6
	);
	return transmittance;
}

vec3 inScatteredLight( in vec3 viewDir ) {

	// get start and end t values for ray through atmosphere
	mediaIntersection hit = intersectAtmosphere( vec3(0), viewDir );
	
	vec3 light = vec3(0);

	// step through atmosphere, cast rays to lightsource to determine shadow.
	float rayLength = hit.tfar - hit.tnear;
	float dt = rayLength * 0.01;
	
	vec3 transmittanceToViewer = vec3(1);
	vec3 lightLastStep = vec3(0);

	for( float t = hit.tnear + 10.; t < hit.tfar; t += dt ) {

		vec3 apos = viewDir * t; // position along atmosphere ray

		vec4 atmComp = atmosphereComp( apos );
		dt = stepSize( atmComp, rayLength );
		atmComp = clampPositive( atmComp );

		float cosTheta = dot(viewDir,uSunDir);
		vec4 phaseComp = phase( cosTheta );
						
		vec3 extinctionThisStep = (uExtinctionMatrix * atmComp).xyz * dt;

		transmittanceToViewer *= exp( -extinctionThisStep );
		
		vec3 scatterThisStep = (uScatteringMatrix * (phaseComp * atmComp)).xyz * dt;

		vec3 influx = lightCol * transmittanceToSun1( apos );
		light += ( lightLastStep + influx * scatterThisStep * transmittanceToViewer ) / 2.;
		vec3 lightLastStep = influx * scatterThisStep * transmittanceToViewer;

		if( length(transmittanceToViewer) < 0.01 )
			return max( vec3(0), light );
	}

	return max( vec3(0), light );
}


`
