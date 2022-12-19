// Oscar Saharoy 2022

import { renderScene, skyUniforms } from "./skyscape.js";


const dpr  = window.devicePixelRatio;

function resizeRendererToDisplaySize( canvas, camera, renderer, accumulationBuffer ) {

    const width   = canvas.clientWidth;
    const height  = canvas.clientHeight;

    renderer.setSize( width*dpr, height*dpr, false );
    skyUniforms.uResolution.value.set( width*dpr, height*dpr );
	accumulationBuffer.setSize( width*dpr, height*dpr );
	skyUniforms.uAccumulator = accumulationBuffer.texture;

    const aspect = canvas.width / canvas.height;
    camera.aspect = aspect;
    camera.fov = Math.min( 60 * Math.max( 1, 1/aspect ), 100 );
    camera.updateProjectionMatrix();

	skyUniforms.uFramesStationary.value = 0;

	renderScene();
}

export const setupResize = (canvas, camera, renderer, accumulationBuffer) => 
	new ResizeObserver( 
		() => resizeRendererToDisplaySize( canvas, camera, renderer, accumulationBuffer ) 
	).observe( canvas );

