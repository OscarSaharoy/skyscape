// Oscar Saharoy 2023

import { renderScreen } from "./skyscape.js";
import { renderAtmosphereLight } from "./atmosphere-light.js";
import { camera } from "./camera.js";
import { renderer } from "./renderer.js";
import { uniforms } from "./uniforms.js";
import "./look-around.js";
import "./resize.js";

// Todo
// need to implement ray marching
// need to implment dual scattering approximation style thing


// render loop
( function renderLoop() {
	requestAnimationFrame( renderLoop );

	if( uniforms.uFramesStationary.value >= 5 ) return;

	renderAtmosphereLight( renderer, camera );
	renderScreen( renderer, camera );
} )();
