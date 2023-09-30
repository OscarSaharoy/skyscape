// Oscar Saharoy 2023

import defs from "./defs.glsl.js";
import utility from "./utility.glsl.js";
import ocean from "./ocean.glsl.js";
import bloodnok from "./bloodnok.glsl.js";
import alro from "./alro.glsl.js";


export default 

defs +
utility +
ocean +
bloodnok +
alro +
`

void main() {

    vec3 viewDir = normalize(vNormal);
    vec3 light = vec3(0);

	//light += inScatteredLight( viewDir );

	vec3 reflectedViewDir = oceanReflectionDir( viewDir );
	if( reflectedViewDir == NO_OCEAN_INTERSECT ) {
		vec3 totalTransmittance = vec3(1.0);
		light += mainRay(vec3(0), viewDir, normalize(vec3(1)), totalTransmittance, 0., true);
	}

	gl_FragColor = vec4( light, 1. );
}

`;
