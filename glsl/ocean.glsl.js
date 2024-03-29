// Oscar Saharoy 2022

export default `

#define NO_OCEAN_REFLECTION vec3(-1)
#define NO_OCEAN_INTERSECT vec4(-1)

vec4 intersectOcean( vec3 viewDir ) {

	if( dot( viewDir, UP ) > 0. )
		return NO_OCEAN_INTERSECT;

    float distToEarth = 
        VIEWER_HEIGHT / dot(viewDir, UP);
    vec3 earthIntersect = vec3(0) 
        + viewDir * distToEarth;

	return vec4( earthIntersect, distToEarth );
}

vec3 oceanReflectionDir( vec3 viewDir ) {

	vec3 normal = UP;

	if( dot( viewDir, normal ) > 0. )
		return NO_OCEAN_REFLECTION;
	
	return reflect( viewDir, normal );
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
