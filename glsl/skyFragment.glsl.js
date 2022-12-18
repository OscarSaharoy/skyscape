// Oscar Saharoy 2022

import defs from "./defs.glsl.js";
import utility from "./utility.glsl.js";
import stars from "./stars.glsl.js";
import sun from "./sun.glsl.js";
import moon from "./moon.glsl.js";
import atmosphere from "./atmosphere.glsl.js";
import ocean from "./ocean.glsl.js";


export default

defs +
utility + 
stars +
sun +
moon +
atmosphere +
ocean +
`

void main() {

    vec3 viewDir = normalize(vNormal);
    vec3 light = vec3(0);

	//light = vec3(0.05);
    //light += starLight( viewDir );
	//light += sunLight( viewDir );
	//light += moonLight( viewDir );
    light += atmosphereLight( viewDir );
	light += atmosphereNoise( viewDir );
    //light += oceanLight( viewDir, light );
	light += sunLight( viewDir );

    gl_FragColor.a = uFramesStationary == 0. ? 1. : 0.05;

	// gamma correction
    light = pow(light , vec3(1. / 2.2));
	gl_FragColor.rgb = light;
}

`;

