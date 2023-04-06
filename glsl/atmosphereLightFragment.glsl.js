// Oscar Saharoy 2023

import defs from "./defs.glsl.js";
import utility from "./utility.glsl.js";
import bloodnok from "./bloodnok.glsl.js";


export default 

defs +
utility +
bloodnok +
`

void main() {

    vec3 viewDir = normalize(vNormal);

	vec4 prevLightAndExtinction = texture2D( uAtmosphereLight, gl_FragCoord.xy/uResolution );

	float addToPrev = step( 0.5, uFramesStationary );

	gl_FragColor = 
		lightAndExtinction( viewDir, prevLightAndExtinction.w )
		+ prevLightAndExtinction * addToPrev;
}

`;
