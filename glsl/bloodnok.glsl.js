
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
	return 0.00001*max( 0., fbm(pos*1e-5) - 0.8 );
}

vec3 attenuationToSun( in vec3 apos ) {

	// do another raycast towards the sun
	float tsun = intersectAtmosphere( apos, uSunDir ).tfar; // cast ray to sun, intersect with inner edge of sphere
	float dtl  = tsun * 0.3; // keep it rather chunky, don't want to bog down

	float rayleighToSun = 0.0;
	float mieToSun      = 0.0;
	float cloudToSun    = 0.0;

	for (float tl = 0.; tl < tsun; tl += dtl) {
		
		vec3 spos = apos + uSunDir * tl;

		mieToSun      += mieDensity(spos)      * dtl;  // acumulate mie density
		rayleighToSun += rayleighDensity(spos) * dtl;
		cloudToSun    += cloudDensity(spos)    * dtl;  // acumulate cloud density
	}

	return exp( -(
		rayleighToSun * rayleighScatteringConstants +
		mieToSun * mieScatteringConstants +
		cloudToSun * vec3(cloudScatter) +
		mieToSun * mieAbsorptionConstants +
		cloudToSun * vec3(cloudAbsorb)
	) );
}


vec3 scatteredLight( in vec3 ro, in vec3 rd, in mediaIntersection hit ) {
	
	vec3 light = vec3(0);

	//hit.tnear += hash( hit.tnear*100. )*0.1;
	vec3 pos = ro + hit.tnear * rd;	//hit position

	// step through atmosphere, cast rays to lightsource to determine shadow.
	float dt = (hit.tfar - hit.tnear) / float(uSamplePoints);
	
	// raymarch through sphere:
	// - calculate cumulative absorption
	// - calculate influx at each point
	// - raymarch towards sun & repeat above process.
	
	float mieMass = 0.0;
	float rayleighMass = 0.0;
	float cloudMass = 0.0;

	float t = hit.tnear;
	for( int i = 0; i < uSamplePoints; ++i ) {

		t = hit.tnear + dt * (float(i) + hash(uFramesStationary + float(i)));
		vec3 apos = ro + rd * t; // position along atmosphere ray
						
		float stepMieDensity = mieDensity(apos) * dt;
		mieMass += stepMieDensity; // total mie density along path
						
		float stepRayleighDensity = rayleighDensity(apos) * dt;
		rayleighMass += stepRayleighDensity; // total rayliegh density from viewer to point

		float stepCloudDensity = cloudDensity(apos) * dt;
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

	return light;
}


/*
void mainImage( out vec4 fragColor, in vec2 fragCoord ) {

	vec2 p = ( fragCoord.xy - iResolution.xy * .5 )
		/ min(iResolution.x, iResolution.y) * 2.;

	vec3 ro = 2. * vec3(-cos(uTime*0.5), 0., sin(uTime*0.5));

	vec3 lookAt = sph1.xyz;
	vec3 front = normalize(lookAt - ro);
	vec3 left = normalize(cross(vec3(0,1,0), front));
	vec3 up = normalize(cross(front, left));

	vec3 rd = normalize(front*1.5 + left*p.x + up*p.y); // view dir
	vec3 lightDir = normalize(vec3(1));
	lightDir = normalize(vec3(.75,.25,0.25));
	
	vec3 light = vec3(0.0);
	mediaIntersection hit = mSphere(ro,rd,sph1);

	if (hit.tnear > 0.0)
		light += scatteredLight( ro, rd, hit, lightDir );

	// reinhardt HDR tonemapping
	float whitelevel = 5.;
	light = (light * (vec3(1.0) + (light / (whitelevel * whitelevel))  ) ) / (vec3(1.0) + light);	

	// gamma	
	light = pow(light,vec3(1.0/2.0));
	
	fragColor = vec4(light,1.0);
}
*/

`
