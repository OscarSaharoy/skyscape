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

const UP = new THREE.Vector3( 0, 1, 0 );
const NORTH = new THREE.Vector3(  1, 0,  0 );
const SOUTH = new THREE.Vector3( -1, 0,  0 );
const EAST  = new THREE.Vector3(  0, 0,  1 );
const WEST  = new THREE.Vector3(  0, 0, -1 );

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


const skyUniforms = {
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


let timePaused = false;
const toggleTimePausedOnSpace = 
    event => timePaused ^= (event.code === "Space");
document.addEventListener("keydown", toggleTimePausedOnSpace);


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
}

export function zoomCamera( delta, centre ) {
    
    const adjust = 1.17 ** delta;

    camera.zoom *= adjust;
    camera.zoom = Math.max( 0.5, camera.zoom );
    camera.updateProjectionMatrix();

	skyUniforms.uZoom.value = camera.zoom;
}


function setAstroUniforms( millis ) {

	const days = millis / 8.64e+7;

	const earthRotationAngle = days  * 2 * Math.PI;
	const sunAngle      = days / 365 * 2 * Math.PI;
	const moonAngle     = days / 27  * 2 * Math.PI;

	const axialTilt      = 23.4 / 360 * 2 * Math.PI;
	// from 0 at pole so not really latitude
	const viewerLatitude = 39   / 360 * 2 * Math.PI;

	const equatorialMoonDir = new THREE.Vector3(
		Math.sin(moonAngle), 0, -Math.cos(moonAngle)
	);
	const eclipticSunDir = new THREE.Vector3(
		Math.sin(sunAngle), 0, -Math.cos(sunAngle)
	);

	const eclipticToEquatorial = new THREE.Matrix4()
		.makeRotationAxis( NORTH, axialTilt );
	const equatorialSunDir = eclipticSunDir
		.applyMatrix4( eclipticToEquatorial );

	const earthSpinMatrix = new THREE.Matrix4()
		.makeRotationAxis( UP, earthRotationAngle );
	const latitudeRotationMatrix = new THREE.Matrix4()
		.makeRotationAxis( NORTH, viewerLatitude );

	skyUniforms.uSkyRotation.value = earthSpinMatrix
		.premultiply( latitudeRotationMatrix );
	skyUniforms.uSunDir.value = equatorialSunDir
		.applyMatrix4( skyUniforms.uSkyRotation.value );
	skyUniforms.uMoonDir.value = equatorialMoonDir
		.applyMatrix4( skyUniforms.uSkyRotation.value );
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


function render( millis, lastMillis ) {
    requestAnimationFrame( 
        newMillis => render(newMillis, millis) );

    const newuTime = skyUniforms.uTime.value 
        + (millis - lastMillis) * 0.001 * !timePaused;
    skyUniforms.uTime.value = newuTime;
	setAstroUniforms( newuTime * 1e+7 );

    renderer.render(scene, camera);
}
//render(0, 0);

setAstroUniforms(0);
skyUniforms.uSunDir.value.set(0, -0.08, -1).normalize();
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
