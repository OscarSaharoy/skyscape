// Oscar Saharoy 2022


export default `

vec3 atmosphereNoise( vec3 viewDir ) {

	return vec3(
		0.001 * ( hash31( viewDir*10. ) - 0.5 )
	);
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

    return rayleighDensity * ( RAYLEIGH_SCATTERING_COEFFS + RAYLEIGH_ABSORPTION_COEFFS )
         + mieDensity      * ( MIE_SCATTERING_COEFFS      + MIE_ABSORPTION_COEFFS      )
         + ozoneDensity    * ( OZONE_SCATTERING_COEFFS    + OZONE_ABSORPTION_COEFFS    );
}


vec3 opticalDepth( 
        vec3 rayOrigin, vec3 rayDir, float rayLength ) {

    vec3 opticalDepth = vec3(0.);
    float stepSize = 
        rayLength / float(NSAMPLES);
    vec3 samplePoint = rayOrigin;

    vec3 prevSample = extinction(samplePoint);
    samplePoint += rayDir * stepSize;

    for( int i = 0; i < NSAMPLES; i++ ) {

        vec3 newSample = extinction(samplePoint);

        opticalDepth += ( prevSample + newSample ) 
            * .5 * stepSize;

        samplePoint += rayDir * stepSize;
        prevSample = newSample;
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
    float mieDensity = 
        exp( -heightAboveSurface / 1200. );

    float cosTheta = dot(viewDir, uSunDir);
    float rayleighPhase = 
        3. / 4. * ( 1. + cosTheta*cosTheta );
    float g = 1.;
    float miePhase = 
        (1.-g)*(1.-g) /
        ( pow(1. + g*g - 2.*g*cosTheta, 1.5) );


    return transmittance * (
        RAYLEIGH_SCATTERING_COEFFS 
        * rayleighDensity * rayleighPhase
        + MIE_SCATTERING_COEFFS 
        * mieDensity * miePhase
    );
}


vec3 inScatteredLightAlongViewray( 
        vec3 viewPos, vec3 viewDir, float rayLength ) {

    vec3 inScatteredLight = vec3(0.);
    float stepSize = 
        rayLength / float(NSAMPLES);
    vec3 samplePoint = viewPos;

    vec3 prevSample = inScatteredLightAtPoint(
        samplePoint, viewDir, viewPos);
    samplePoint += viewDir * stepSize;

    for( int i = 0; i < NSAMPLES; i++ ) {

        vec3 newSample = inScatteredLightAtPoint(
            samplePoint, viewDir, viewPos);

        inScatteredLight += ( prevSample + newSample ) 
            * .5 * stepSize;

        samplePoint += viewDir * stepSize;
        prevSample = newSample;
    }

    return inScatteredLight;
}


vec3 atmosphereLight( vec3 viewDir ) {

	float distThroughAtmosphere = intersectSphere(
		vec3(0), viewDir, 
		EARTH_CENTRE, ATMOSPHERE_RADIUS
	).w;

    if( viewDir.y < -5e-3 )
        distThroughAtmosphere = 
            VIEWER_HEIGHT / -viewDir.y;

    return inScatteredLightAlongViewray( vec3(0), viewDir, distThroughAtmosphere) + texture2D( uAtmosphereLight, gl_FragCoord.xy/uResolution ).xyz * step( 0.5, uFramesStationary );
}

`;
