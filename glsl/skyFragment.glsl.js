// Oscar Saharoy 2022

import defs from "./defs.glsl.js";
import utility from "./utility.glsl.js";
import stars from "./stars.glsl.js";
import sun from "./sun.glsl.js";
import moon from "./moon.glsl.js";
import ocean from "./ocean.glsl.js";


export default

defs +
utility + 
stars +
sun +
moon +
ocean +
`

void main() {

    vec3 viewDir = normalize(vNormal);
    vec3 light = vec3(0);

	//light = vec3(0.05);
    //light += starLight( viewDir );
	//light += moonLight( viewDir );
	//light += atmosphereNoise( viewDir );
    //light += oceanLight( viewDir, light );
	//light += sunLight( viewDir );

    light += texture2D(uAtmosphereLight, gl_FragCoord.xy/uResolution).xyz / (uFramesStationary + 1.);

	//light += gl_FragCoord.xyy / uResolution.xyy;
	//light += unProjected.xyz / unProjected.w;
	//light += viewDir;
	//light += uUnProjectionMatrix[3].xyw;

	vec3 reflectedViewDir = oceanReflectionDir( viewDir );
	if( reflectedViewDir != NO_OCEAN_INTERSECT ) {
		vec4 ndc = uProjectionMatrix * vec4( reflectedViewDir, 1. );
		vec2 fragCoord = ( ( ndc.xy / ndc.w ) + 1. ) / 2.;
		if( fragCoord.y < 1. )
			light += texture2D(uAtmosphereLight, fragCoord).xyz / (uFramesStationary + 1.);
	}
	
	// reinhardt HDR tonemapping
    float whitelevel = 5.;
    light = ( light * (vec3(1.0) + (light / (whitelevel * whitelevel)) ) ) / (vec3(1.0) + light);

	// gamma correction
    light = pow(light , vec3(1. / 2.2));

	gl_FragColor = vec4( light, 1. );
}

`;

