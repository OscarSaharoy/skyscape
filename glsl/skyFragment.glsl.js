// Oscar Saharoy 2022

import defs from "./defs.glsl.js";
import utility from "./utility.glsl.js";
import stars from "./stars.glsl.js";
import sun from "./sun.glsl.js";
import moon from "./moon.glsl.js";
import ocean from "./ocean.glsl.js";
import bloodnok from "./bloodnok.glsl.js";
import alro from "./alro.glsl.js";


export default

defs +
utility + 
stars +
sun +
moon +
ocean +
bloodnok +
alro +
`

void main() {

    vec3 viewDir = normalize(vNormal);
    vec3 light = vec3(0);

	//light = vec3(0.05);
    //light += starLight( viewDir );
	//light += moonLight( viewDir );
	//light += atmosphereNoise( viewDir );
    //light += oceanLight( viewDir, light );
	light += sunLight( viewDir );

    //light += texture2D(uAtmosphereLight, gl_FragCoord.xy/uResolution).xyz;

	//light += gl_FragCoord.xyy / uResolution.xyy;
	//light += unProjected.xyz / unProjected.w;
	//light += viewDir;
	//light += uUnProjectionMatrix[3].xyw;
	//
	vec3 reflectedViewDir = oceanReflectionDir( viewDir );
	if( reflectedViewDir == NO_OCEAN_REFLECTION ) {
		vec3 totalTransmittance = vec3(1.0);
		light += inScatteredLight( viewDir );
	}

	if( reflectedViewDir != NO_OCEAN_REFLECTION ) {
		vec4 ndc = uProjectionMatrix * vec4( reflectedViewDir, 1. );
		vec2 fragCoord = ( ( ndc.xy / ndc.w ) + 1. ) / 2.;
		vec3 skyLight = inScatteredLight( reflectedViewDir );
		float cosTheta = dot(viewDir, DOWN);
		float fresnel =
			0.7 * pow( cosTheta - 0.62, 2. )
			+ 0.72 * pow( 2., -8. * cosTheta );
		light += skyLight * fresnel;
	}
	
	// gamma correction
    light = pow(light , vec3(1. / 2.2));

	gl_FragColor = vec4( light, 1. );
}

`;

