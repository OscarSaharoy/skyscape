// Oscar Saharoy 2022

export default `

vec3 sunLight( vec3 viewDir ) {

	vec3 light = vec3(0);

	vec3 sunPos = uSunDir * SUN_DIST;

	vec4 sunIntersect = intersectSphere(
		vec3(0), viewDir, 
		sunPos, SUN_RADIUS);

	if( sunIntersect.w == 0.0 ) return vec3(0);

	light += 1.;

	return light;
}

`;
