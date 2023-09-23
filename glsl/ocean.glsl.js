// Oscar Saharoy 2022

export default `

#define NO_OCEAN_LIGHT vec3(-1)

vec3 oceanReflectionDir( vec3 viewDir ) {

	if( dot( viewDir, UP ) > 0. )
		return NO_OCEAN_LIGHT;
	
	return reflect( viewDir, UP );
}

vec3 oceanLight( vec3 viewDir, vec3 preLight ) {

    float distToEarth = 
        VIEWER_HEIGHT / dot(viewDir, UP);
    vec3 earthIntersect = vec3(0) 
        + viewDir * distToEarth;

    vec3 intersectCube = floor(earthIntersect / 100.);

    return vec3(hash31(intersectCube)) 
        * step(distToEarth, 0.);
}

`;
