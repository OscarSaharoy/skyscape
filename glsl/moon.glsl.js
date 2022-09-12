// Oscar Saharoy 2022

export default `

vec3 moonLight( vec3 viewDir ) {

	vec3 light = vec3(0);

	vec3 moonPos = uMoonDir * MOON_DIST;

	vec4 moonIntersect = intersectSphere(
		vec3(0), viewDir, 
		moonPos, MOON_RADIUS);

	if( moonIntersect.w != 0.0 ) {

        light += saturate(dot(
            normalize(moonIntersect.xyz - moonPos), 
            uSunDir) * 4.);
    }

	return light;
}

`;
