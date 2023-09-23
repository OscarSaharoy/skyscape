// Oscar Saharoy 2023

import { uniforms } from "./uniforms.js";
import { canvas } from "./canvas.js";
import { camera } from "./camera.js";
import { renderer } from "./renderer.js";
import { atmosphereLightBuffers } from "./atmosphere-light.js";


const dpr = 0.25;//window.devicePixelRatio;

function resize() {

    const width  = canvas.clientWidth;
    const height = canvas.clientHeight;

    renderer.setSize( width*dpr, height*dpr, false );

	atmosphereLightBuffers.forEach( buffer => 
		buffer.setSize( width*dpr, height*dpr ) );

    uniforms.uResolution.value.set( width*dpr, height*dpr );

    const aspect = canvas.width / canvas.height;
    camera.aspect = aspect;
    camera.fov = Math.min( 60 * Math.max( 1, 1/aspect ), 100 );
    camera.updateProjectionMatrix();

	uniforms.uFramesStationary.value = 0;
}

new ResizeObserver( resize ).observe( canvas );

