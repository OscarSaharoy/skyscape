// Oscar Saharoy 2022


// mie funcs
//float mieDensity = exp( -heightAboveSurface / 1200. );
//float g = .7;
//float miePhase = 3. / (8.*PI) * (1. - g*g) * (1. + cosTheta*cosTheta) / (1. + g*g) / pow((1. + g*g - 2.*g*cosTheta), 1.5);

export default `


float rayleighDensityRatio( vec3 point ) {
    
    float lengthScale = 7994.;

    float heightAboveSurface = 
        length(point - EARTH_CENTRE) - EARTH_RADIUS;

    return exp( - heightAboveSurface / lengthScale );
}

float mieDensityRatio( vec3 point ) {
    
    float lengthScale = 1200.;

    float heightAboveSurface = 
        length(point - EARTH_CENTRE) - EARTH_RADIUS;

    return exp( - heightAboveSurface / lengthScale );
}

float ozoneDensityRatio( vec3 point ) {

    float heightAboveSurface = 
        length(point - EARTH_CENTRE) - EARTH_RADIUS;

    return max(0., 1. - abs(heightAboveSurface - 25e+3) / 15e+3 );
}


vec3 extinction( vec3 point ) {

    float heightAboveSurface = 
        length(point - EARTH_CENTRE) - EARTH_RADIUS;

    float rayleighDensity = 
        exp( - heightAboveSurface / 8000. );
    float mieDensity = 
        exp( -heightAboveSurface / 1200. );
    float ozoneDensity = 
        max(0., 
            1. - abs(heightAboveSurface - 25e+3) 
                / 15e+3 );

    return rayleighDensity * ( RAYLEIGH_SCATTERING_COEFFS + RAYLEIGH_ABSORPTION_COEFFS );
        //+ mieDensity * ( MIE_SCATTERING_COEFFS + MIE_ABSORPTION_COEFFS )
        //+ ozoneDensity * ( OZONE_SCATTERING_COEFFS + OZONE_ABSORPTION_COEFFS );
}

vec3 opticalDepth( 
        vec3 rayOrigin, vec3 rayDir, float rayLength ) {

    int numOpticalDepthPoints = 10;

    vec3 opticalDepth = vec3(0.);
    float stepSize = rayLength 
        / float(numOpticalDepthPoints);
    vec3 densitySamplePoint = 
        rayOrigin + 0.5 * stepSize * rayDir;

    for( int i = 0; i < numOpticalDepthPoints; ++i ) {
        opticalDepth += 
            extinction(densitySamplePoint) * stepSize;
        densitySamplePoint += rayDir * stepSize;
    }

    return opticalDepth;
}


vec3 inScatteredLightAtPoint( 
        vec3 point, vec3 viewDir, vec3 viewPos ) {

    float sunRayLength = intersectSphere( 
        point, uSunDir, 
        EARTH_CENTRE, ATMOSPHERE_RADIUS ).w;

    vec3 sunRayOpticalDepth = opticalDepth( 
        point, uSunDir, sunRayLength );

    vec3 viewRayOpticalDepth = opticalDepth( 
        point, -viewDir, length(point-viewPos) ); 

    vec3 transmittance = exp( 
        - (sunRayOpticalDepth + viewRayOpticalDepth) 
    );

    float heightAboveSurface = 
        length(point - EARTH_CENTRE) - EARTH_RADIUS;
    float rayleighDensity = 
        exp( - heightAboveSurface / 8000. );

    float cosTheta = dot(viewDir, uSunDir);
    float rayleighPhase = 1.; 
        3. / (16. * PI) * ( 1. + cosTheta*cosTheta );

    return  transmittance * (
        RAYLEIGH_SCATTERING_COEFFS 
        * rayleighDensity * rayleighPhase
        //+ MIE_SCATTERING_COEFFS 
        //* mieDensity * miePhase
    );
}


vec3 calculateLight( 
        vec3 viewPos, vec3 viewDir, float rayLength ) {

    int numInScatteringPoints = 10;
    vec3 inScatteredLight = vec3(0.);
    float stepSize = 
        rayLength / float(numInScatteringPoints);
    vec3 inScatterPoint = 
        viewPos + 0.5 * stepSize * viewDir;

    for( int i = 0; i < numInScatteringPoints; i++ ) {

        inScatteredLight += inScatteredLightAtPoint(
            inScatterPoint, viewDir, viewPos) 
            * stepSize;

        inScatterPoint += viewDir * stepSize;
    }

    return inScatteredLight;
}


vec3 atmosphereLight( vec3 viewDir ) {

	float distThroughAtmosphere = intersectSphere(
		vec3(0), viewDir, 
		EARTH_CENTRE, ATMOSPHERE_RADIUS
	).w;

    if( viewDir.y < -1e-2 )
        distThroughAtmosphere = 
            VIEWER_HEIGHT / -viewDir.y;

    return calculateLight(
        vec3(0), viewDir, distThroughAtmosphere);
}


vec3 atmosphereNoise( vec3 viewDir ) {

	return vec3(
		0.006 * ( hash31( viewDir*10. ) - 0.5 ) 
	);
}

`;
