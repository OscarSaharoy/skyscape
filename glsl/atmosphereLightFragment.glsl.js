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
    vec3 light = vec3(0);

	light += inScatteredLight( viewDir );

	gl_FragColor = vec4( light, 1. );
}

`;
