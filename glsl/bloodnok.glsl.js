
export default `

// atmospheric scattering specifics

// Mie scattering
float miePhase = 0.9;
vec3 mieScatteringConstants = MIE_SCATTERING_COEFFS;
vec3 mieAbsorptionConstants = MIE_ABSORPTION_COEFFS;

// Rayleigh scattering
float rayleighPhase = -0.01;
vec3 rayleighScatteringConstants = RAYLEIGH_SCATTERING_COEFFS;

// Cloud scattering
float cloudAbsorb = 1.; // amount of absorption by clouds
float cloudScatter = 12.0; // amount of omni-directional scatter off clouds
float cloudMie = 1.; // amount of Mie scattering by clouds


vec3 lightCol = vec3(1);
vec4 sph1 = vec4 (0,0,0,1);


mat4x3 absorptionTransferMatrix;
/*
*/


vec4 clampPositive( vec4 x ) {
	return max( vec4(0), x );
}

float rand(vec2 co) {
	return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

float rand(vec3 co) {
	return fract(sin(dot(co.xyz ,vec3(12.9898,78.233,47.985))) * 43758.5453);
}

// credit: iq/rgba
float hash( float n ) {
	return fract(sin(n)*43758.5453);
}


// credit: iq/rgba
float noise( in vec3 x ) {
	vec3 p = floor(x);
	vec3 f = fract(x);
	f = f*f*(3.0-2.0*f);
	float n = p.x + p.y*57.0 + 113.0*p.z;
	float res = mix(mix(mix( hash(n+  0.0), hash(n+  1.0),f.x),
						mix( hash(n+ 57.0), hash(n+ 58.0),f.x),f.y),
					mix(mix( hash(n+113.0), hash(n+114.0),f.x),
						mix( hash(n+170.0), hash(n+171.0),f.x),f.y),f.z);
	return res;
}


float fbm(in vec3 x) {
	float i = 1.0;
	
	float n = noise(x * i) / i; i *= 2.0;
	n+= noise(x * i) / i; i *= 2.0;
	n+= noise(x * i) / i; i *= 2.0;
	n+= noise(x * i) / i; i *= 2.0;
	n+= noise(x * i) / i; i *= 2.0;
	n+= noise(x * i) / i; i *= 2.0;

	return n;
}


//============================================================
// Intersection Formulae
//============================================================


// intersect ray ro+rd with sphere sph, calculates both entry and exit points.
mediaIntersection mSphere(in vec3 ro, in vec3 rd, in vec4 sph) {

	mediaIntersection res;
	res.tnear = -1.0;
	res.tfar = -1.0;


	// sphere intersection
	float r = sph.w; //radius
	vec3 oc = ro - sph.xyz; //origin = position sphere
	float b = 2.0*dot(oc,rd);
	float c = dot(oc,oc)-r*r;
	float h = b*b - 4.0*c;

	if (h >= 0.0) {
		float hsqrt = sqrt(h);
		res.tnear = (-b - hsqrt) / 2.0;
		res.tfar = (-b + hsqrt)/2.0;
	}

	return res;
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


float mieDensity( in vec3 pos ) {

    float heightAboveSurface = 
        length(pos - EARTH_CENTRE) - EARTH_RADIUS;
    return exp( -heightAboveSurface / 1200. );
}

float rayleighDensity( in vec3 pos ) {

    float heightAboveSurface = 
        length(pos - EARTH_CENTRE) - EARTH_RADIUS;
    return exp( - heightAboveSurface / 8000. );
}

float cloudDensity( in vec3 pos ) {

    float heightAboveSurface = 
        length(pos - EARTH_CENTRE) - EARTH_RADIUS;
	
	float lowGap = smoothstep( 0., 1., heightAboveSurface / 1000. );
	float highClip = smoothstep( 0., 1., (15000. - heightAboveSurface) / 1000. );

	return 1e-5*( fbm(pos*5e-5) - 1.2 );// * lowGap * highClip;
}

vec4 atmosphereComp( in vec3 pos ) {

	return vec4(
		rayleighDensity( pos ),
		mieDensity( pos ),
		cloudDensity( pos ),
		0.//ozoneDensity( pos )
	);

	// returns a vec4 of the rayleigh, mie, cloud and ozone densities at a given point
	vec4 res = vec4(0);

    float heightAboveSurface = 
        length(pos - EARTH_CENTRE) - EARTH_RADIUS;

    res[0] = exp( - heightAboveSurface / 8000. ); // rayleigh
    res[1] = exp( - heightAboveSurface / 1200. ); // mie

	float lowGap = smoothstep( 0., 1., heightAboveSurface / 1000. );
	float highClip = smoothstep( 0., 1., (15000. - heightAboveSurface) / 1000. );

	res[2] = ( fbm(pos*5e-5) - 1.2 ) * lowGap * highClip; // cloud
	res[3] = max(0., 1. - abs(heightAboveSurface - 25e+3) / 15e+3 ); // ozone

	return res;
}

vec3 attenuationToSun( in vec3 apos ) {

	mediaIntersection hit = intersectAtmosphere( apos, uSunDir ); // cast ray to sun, intersect with inner edge of sphere
	float dtl = 0.;//( hit.tfar - hit.tnear ) / float(nSamples); // keep it rather chunky, don't want to bog down
	//dtl = (hit.tfar - hit.tnear) * clamp( 0.2 - 0.2 * cloudDensityAtSpos*10000., 0.001, 1. );
	dtl = (hit.tfar - hit.tnear) * 0.2;

	absorptionTransferMatrix[0] = RAYLEIGH_SCATTERING_COEFFS;
	absorptionTransferMatrix[1] = MIE_SCATTERING_COEFFS + MIE_ABSORPTION_COEFFS;
	absorptionTransferMatrix[2] = vec3( cloudAbsorb + cloudScatter );
	//absorptionTransferMatrix[0] = OZONE_SCATTERING_COEFFS + OZONE_ABSORPTION_COEFFS;

	vec3 transmittance = vec3(1);

	for( float tl = hit.tnear; tl < hit.tfar; tl += dtl ) {
		
		vec3 spos = apos + uSunDir * tl;

		vec4 atmComp = atmosphereComp( spos );
		atmComp = clampPositive( atmComp );

		vec3 extinctionThisStep = dtl * absorptionTransferMatrix * atmComp;

		transmittance *= exp( - extinctionThisStep );
	}

	return transmittance;
}


vec3 scatteredLight( in vec3 ro, in vec3 rd, in mediaIntersection hit ) {
	
	vec3 light = vec3(0);

	//hit.tnear += hash( hit.tnear*100. )*0.1;
	vec3 pos = ro + hit.tnear * rd;	//hit position

	// step through atmosphere, cast rays to lightsource to determine shadow.
	float dt = 0.;//(hit.tfar - hit.tnear) / float(uSamplePointsPerFrame);
	dt = (hit.tfar - hit.tnear) * 0.2;
	//dt = (hit.tfar - hit.tnear) * clamp( 0.2 - 0.2 * cloudDensityAtApos*1000., 0.001, 1. );
	
	// raymarch through sphere:
	// - calculate cumulative absorption
	// - calculate influx at each point
	// - raymarch towards sun & repeat above process.
	
	float mieMass = 0.0;
	float rayleighMass = 0.0;
	float cloudMass = 0.0;

	float t = hit.tnear;
	for( int i = 0; i < uSamplePointsPerFrame; ++i ) {

		t = hit.tnear + dt * (float(i) + hash(uFramesStationary) );
		vec3 apos = ro + rd * t; // position along atmosphere ray
						
		float stepMieDensity = mieDensity(apos) * dt;
		mieMass += stepMieDensity; // total mie density along path
						
		float stepRayleighDensity = rayleighDensity(apos) * dt;
		rayleighMass += stepRayleighDensity; // total rayliegh density from viewer to point

		float cloudDensityAtApos = cloudDensity( apos );
		cloudDensityAtApos = max( 0., cloudDensityAtApos );
		float stepCloudDensity = cloudDensityAtApos * dt;
		cloudMass += stepCloudDensity; // total cloud density from viewer to point
		
		vec3 mieScatterFactors =
			phase( dot(rd,uSunDir), miePhase ) * mieScatteringConstants
			* stepMieDensity;

		vec3 rayleighScatterFactors =
			phase( dot(rd,uSunDir), rayleighPhase ) * rayleighScatteringConstants
			* stepRayleighDensity;

		vec3 cloudScatterFactors =
			vec3( phase( dot(rd,uSunDir), miePhase ) * cloudMie + cloudScatter )
			* stepCloudDensity;

		vec3 influx = lightCol * attenuationToSun( apos );

		vec3 attenuationToViewer = exp( -(
			rayleighMass * rayleighScatteringConstants +
			mieMass * mieScatteringConstants +
			cloudMass * vec3(cloudScatter) +
			mieMass * mieAbsorptionConstants +
			cloudMass * vec3(cloudAbsorb)
		) );

		light += influx * ( rayleighScatterFactors + mieScatterFactors + cloudScatterFactors ) * attenuationToViewer;

		// sun disc
		float mie_eye = phase( dot(rd,uSunDir), 0.9995 ) * stepMieDensity; // relative amount of Mie scattering.
		//light += mie_eye * influx * attenuationToViewer;
	}

	return max( vec3(0), light );
}


vec4 lightAndExtinction( vec3 viewDir, float prevExtinction ) {

	// get start and end t values for ray through atmosphere
	mediaIntersection atmosphereHit = intersectAtmosphere( vec3(0), viewDir );

	return vec4( scatteredLight( vec3(0), viewDir, atmosphereHit ), 1. );
}

`
