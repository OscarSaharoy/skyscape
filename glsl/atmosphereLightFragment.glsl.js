// Oscar Saharoy 2023

import defs from "./defs.glsl.js";
import utility from "./utility.glsl.js";
import atmosphere from "./atmosphere.glsl.js";
import bloodnok from "./bloodnok.glsl.js";


export default 

defs +
utility +
bloodnok +
atmosphere +
`

void main() {

    vec3 viewDir = normalize(vNormal);
    vec3 light = vec3(0);

    light += atmosphereLight( viewDir );
	light += texture2D( uAtmosphereLight, gl_FragCoord.xy/uResolution ).xyz * step( 0.5, uFramesStationary );

	gl_FragColor = vec4( light, 1. );
}

`;
