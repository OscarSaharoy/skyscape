// Oscar Saharoy 2023

import { skyUniforms, renderer } from "./skyscape.js";
import { canvas } from "./canvas.js";
import { camera } from "./camera.js";
import { atmosphereLightBuffers } from "./atmosphere-light.js";


const dpr = window.devicePixelRatio;

function resize() {

    const width  = canvas.clientWidth;
    const height = canvas.clientHeight;

    renderer.setSize( width*dpr, height*dpr, false );

	atmosphereLightBuffers.forEach( buffer => 
		buffer.setSize( width*dpr, height*dpr ) );

    skyUniforms.uResolution.value.set( width*dpr, height*dpr );

    const aspect = canvas.width / canvas.height;
    camera.aspect = aspect;
    camera.fov = Math.min( 60 * Math.max( 1, 1/aspect ), 100 );
    camera.updateProjectionMatrix();

	skyUniforms.uFramesStationary.value = 0;
}

new ResizeObserver( resize ).observe( canvas );

