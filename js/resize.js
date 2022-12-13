// Oscar Saharoy 2022

import { renderScene, skyUniforms } from "./skyscape.js";


const dpr  = window.devicePixelRatio;

function resizeRendererToDisplaySize( canvas, camera, renderer ) {

    const width   = canvas.clientWidth;
    const height  = canvas.clientHeight;

    renderer.setSize( width*dpr, height*dpr, false );
    skyUniforms.uResolution.value.set( width*dpr, height*dpr );

    const aspect = canvas.width / canvas.height;
    camera.aspect = aspect;
    camera.fov = Math.min( 60 * Math.max( 1, 1/aspect ), 100 );
    camera.updateProjectionMatrix();

	renderScene();
}

export const setupResize = (canvas, camera, renderer) => 
	new ResizeObserver( 
		() => resizeRendererToDisplaySize( canvas, camera, renderer ) 
	).observe( canvas );

