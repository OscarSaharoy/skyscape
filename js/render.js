// Oscar Saharoy 2023

import { skyUniforms, renderer, renderScreen } from "./skyscape.js";
import { renderAtmosphereLight } from "./atmosphere-light.js";


// render loop
( function renderLoop() {
	requestAnimationFrame( renderLoop );

	if( skyUniforms.uFramesStationary.value >= 5 ) return;

	renderAtmosphereLight();
	renderScreen();
} )();
