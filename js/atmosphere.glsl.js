// Oscar Saharoy 2022

export default `


float densityAtPoint( vec3 point ) {

    float densityFalloff = 1.;
    float densityMultiplier = 6e-7;

    float heightAboveSurface = 
        length(point - EARTH_CENTRE) - EARTH_RADIUS;
    float height01 = heightAboveSurface 
        / ( ATMOSPHERE_RADIUS - EARTH_RADIUS  );
    float localDensity = densityMultiplier 
        * exp(-height01 * densityFalloff) 
        * (1. - height01);

    return exp( - heightAboveSurface / 8000. );
}

vec3 extinction( vec3 point ) {

    float heightAboveSurface = 
        length(point - EARTH_CENTRE) - EARTH_RADIUS;

    float rayleighDensity = exp( - heightAboveSurface / 8000. );
    float mieDensity = exp( -heightAboveSurface / 1200. );
    float ozoneDensity = max(0., 1. - abs(heightAboveSurface - 25e+3) / 15e+3 );

    return rayleighDensity * ( RAYLEIGH_SCATTERING_COEFFS + RAYLEIGH_ABSOPTION_COEFFS )
        + mieDensity * ( MIE_SCATTERING_COEFFS + MIE_ABSOPTION_COEFFS )
        + ozoneDensity * ( OZONE_SCATTERING_COEFFS + OZONE_ABSOPTION_COEFFS );
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
        opticalDepth += extinction(densitySamplePoint) * stepSize;
        densitySamplePoint += rayDir * stepSize;
    }

    return opticalDepth;
}


vec3 calculateLight( 
        vec3 viewPos, vec3 viewDir, float rayLength ) {

    int numInScatteringPoints = 10;

    vec3 inScatteredLight = vec3(0.);
    float stepSize = rayLength 
        / float(numInScatteringPoints);
    vec3 inScatterPoint = 
        viewPos + 0.5 * stepSize * viewDir;

    for( int i = 0; i < numInScatteringPoints; i++ ) {

        float sunRayLength = intersectSphere( 
            inScatterPoint, uSunDir, 
            EARTH_CENTRE, ATMOSPHERE_RADIUS ).w;

        vec3 sunRayOpticalDepth = opticalDepth( 
            inScatterPoint, uSunDir, sunRayLength );

        vec3 viewRayOpticalDepth = opticalDepth( 
            inScatterPoint, -viewDir, 
            stepSize * float(i) ); 

        vec3 transmittance = exp( 
            - (sunRayOpticalDepth + viewRayOpticalDepth) 
        );

        float heightAboveSurface = 
            length(inScatterPoint - EARTH_CENTRE) - EARTH_RADIUS;
        float cosTheta = dot(viewDir, uSunDir);

        float rayleighDensity = exp( - heightAboveSurface / 8000. );
        float rayleighPhase = 3. / (16. * PI) * ( 1. + cosTheta*cosTheta );

        float mieDensity = exp( -heightAboveSurface / 1200. );
        float g = .7;
        float miePhase = 3. / (8.*PI) * (1. - g*g) * (1. + cosTheta*cosTheta) / (1. + g*g) / pow((1. + g*g - 2.*g*cosTheta), 1.5);

        inScatteredLight += transmittance * stepSize * (
            RAYLEIGH_SCATTERING_COEFFS * rayleighDensity * rayleighPhase
            + MIE_SCATTERING_COEFFS * mieDensity * miePhase
        );
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
        distThroughAtmosphere = VIEWER_HEIGHT / -viewDir.y;

    return calculateLight(
        vec3(0), viewDir, distThroughAtmosphere);
}


vec3 atmosphereNoise( vec3 viewDir ) {

	return vec3(
		0.006 * ( hash31( viewDir*10. ) - 0.5 ) 
	);
}

`;
