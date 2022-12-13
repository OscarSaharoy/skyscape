// Oscar Saharoy 2022

//window.onerror = error => alert(error);

import * as THREE from './three.module.js'; 
import skyVertexShader from "../glsl/skyVertex.glsl.js";
import skyFragmentShader from "../glsl/skyFragment.glsl.js";

const canvas = document.querySelector( 
    "#shader-canvas" );
const renderer = new THREE.WebGLRenderer(
    {canvas: canvas, antialias: true});
const dpr   = window.devicePixelRatio;
//renderer.setPixelRatio(dpr);

const UP    = new THREE.Vector3(  0,  1,  0 );
const DOWN  = new THREE.Vector3(  0, -1,  0 );
const NORTH = new THREE.Vector3(  1,  0,  0 );
const SOUTH = new THREE.Vector3( -1,  0,  0 );
const EAST  = new THREE.Vector3(  0,  0,  1 );
const WEST  = new THREE.Vector3(  0,  0, -1 );

const scene = new THREE.Scene();
scene.background = new THREE.Color( 0xb01050 );

const aspect = canvas.width / canvas.height;
const fov = Math.min( 
    60 * Math.max( 1, 1/aspect ), 100 );
const near = 0.1;
const far = 30;
export const camera = new THREE.PerspectiveCamera( 
    fov, aspect, near, far );
const cameraForward = new THREE.Vector3( 0, 0, -1 );
camera.lookAt( cameraForward );


export const skyUniforms = {
    uTime:        { value: 0. },
    uResolution:  { value: new THREE.Vector2() },
	uZoom:        { value: 1. },
	uSkyRotation: { value: new THREE.Matrix4() },
	uSunDir:      { value: new THREE.Vector3() },
	uMoonDir:     { value: new THREE.Vector3() },
};

const skyMaterial = new THREE.ShaderMaterial({
    vertexShader: skyVertexShader,
    fragmentShader: skyFragmentShader,
    uniforms: skyUniforms,
    side: THREE.BackSide
});


{
    const geometry = 
        new THREE.IcosahedronGeometry( 1, 3 );
    const material = skyMaterial; 
    const sphere = new THREE.Mesh( geometry, material );
    scene.add( sphere );

    // render the sphere first and clear depth buffer 
    // straight after so it appears behind everything
    sphere.renderOrder = -1;
    sphere.onAfterRender = 
        renderer => renderer.clearDepth();
}


export function panCamera( delta ) {

    const right = new THREE.Vector3()
				.crossVectors( cameraForward, UP );
    const over  = new THREE.Vector3()
				.crossVectors( cameraForward, right );

    if( UP.dot(cameraForward) > 0 && delta.y < 0
     || UP.dot(cameraForward) < 0 && delta.y > 0 )
        over.normalize();

    const sensitivity = -9 / (camera.zoom + 2.);

    const adjust = new THREE.Vector3().addVectors(
        right.multiplyScalar(delta.x),
        over.multiplyScalar( delta.y)
    ).multiplyScalar(sensitivity);

    cameraForward.add( adjust );
    cameraForward.normalize();
    camera.lookAt( cameraForward );

	renderer.render(scene, camera);
}

export function zoomCamera( delta, centre ) {
    
    const adjust = 1.17 ** delta;

    camera.zoom *= adjust;
    camera.zoom = Math.max( 0.5, camera.zoom );
    camera.updateProjectionMatrix();

	skyUniforms.uZoom.value = camera.zoom;

	renderer.render(scene, camera);
}


function resizeRendererToDisplaySize( renderer ) {

    const width   = canvas.clientWidth;
    const height  = canvas.clientHeight;

    renderer.setSize( width*dpr, height*dpr, false );
    skyUniforms.uResolution.value.set(
        width*dpr, height*dpr );

    const aspect = canvas.width / canvas.height;
    camera.aspect = aspect;
    camera.fov = Math.min( 
        60 * Math.max( 1, 1/aspect ), 100 );
    camera.updateProjectionMatrix();
}

new ResizeObserver( 
	() => resizeRendererToDisplaySize(renderer) 
).observe( canvas );


//renderer.render(scene, camera);

skyUniforms.uSunDir.value.set(0, -0.06, -1).normalize();
window.addEventListener("DOMContentLoaded",
    () => setTimeout( () => renderer.render(scene, camera), 0 )
);


function download() {

    const link = document.createElement("a");
    
    link.href = renderer.domElement
		.toDataURL( "image/jpeg", 0.92 );
    link.download = "image.jpg";
    link.click();
}
