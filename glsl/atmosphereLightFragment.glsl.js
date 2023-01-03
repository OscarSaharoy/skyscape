// Oscar Saharoy 2023

import defs from "./defs.glsl.js";
import utility from "./utility.glsl.js";
import atmosphere from "./atmosphere.glsl.js";


export default 

defs +
utility +
atmosphere +
`

void main() {

    vec3 viewDir = normalize(vNormal);
    vec3 light = vec3(0);

    light += atmosphereLight( viewDir );

	gl_FragColor = vec4( light, 1. );
}

`;
