// Oscar Saharoy 2022

window.onerror = error => alert(error);

import * as THREE from 'three'; 
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { skyVert, skyFrag } from "./shaders.js";

const canvas = document.querySelector( "#shader-canvas" );
const renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true});
const dpr   = window.devicePixelRatio;
//renderer.setPixelRatio(dpr);

const UP = new THREE.Vector3( 0, 1, 0 );
const NORTH = new THREE.Vector3(  1, 0,  0 );
const SOUTH = new THREE.Vector3( -1, 0,  0 );
const EAST  = new THREE.Vector3(  0, 0,  1 );
const WEST  = new THREE.Vector3(  0, 0, -1 );

const scene = new THREE.Scene();
scene.background = new THREE.Color( 0x101050 );

const aspect = canvas.width / canvas.height;
const fov = Math.min( 60 * Math.max( 1, 1/aspect ), 100 );
const near = 0.1;
const far = 30;
export const camera = new THREE.PerspectiveCamera( fov, aspect, near, far );
const cameraForward = new THREE.Vector3( 0, 0, -1 );

{
    const geometry = new THREE.PlaneGeometry( 100, 100 );
    const material = new THREE.MeshBasicMaterial( {color: 0x000000} );
    const plane = new THREE.Mesh( geometry, material );
    plane.position.y = -0.2;
    plane.rotateX( -Math.PI / 2);
    scene.add( plane );
}


const skyUniforms = {
    uTime:        { value: 0. },
    uResolution:  { value: new THREE.Vector2() },
	uZoom:        { value: 1. },
	uSkyRotation: { value: new THREE.Matrix4() },
	uSunDir:      { value: new THREE.Vector3() },
	uMoonDir:     { value: new THREE.Vector3() },
};

const skyMaterial = new THREE.ShaderMaterial({
    vertexShader: skyVert,
    fragmentShader: skyFrag,
    uniforms: skyUniforms,
    side: THREE.BackSide
});


{
    const geometry = new THREE.IcosahedronGeometry( 1, 3 );
    const material = skyMaterial; // new THREE.MeshBasicMaterial( { color: 0x0000ff, side: THREE.BackSide } );
    const sphere = new THREE.Mesh( geometry, material );
    scene.add( sphere );

    // render the sphere first and clear depth buffer straight after so it appears behind everything
    sphere.renderOrder = -1;
    sphere.onAfterRender = renderer => renderer.clearDepth();
}

{
    const geometry = new THREE.TorusKnotGeometry( 10, .2, 1000, 16, 2, 7 );
	const material = new THREE.MeshBasicMaterial( { color: 0x00ddff } );
    const knot = new THREE.Mesh( geometry, material );
    //scene.add( knot );
}

{
    const loader = new GLTFLoader();
    
    loader.load(
        "../city.glb",
        gltf => {
			scene.add( gltf.scene );
			gltf.scene.position.y = -0.2;
		}
    );
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
    //uniforms.uResolution.value.set( width * dpr, height * dpr );

    const aspect = canvas.width / canvas.height;
    camera.aspect = aspect;
    camera.fov = Math.min( 60 * Math.max( 1, 1/aspect ), 100 );
    camera.updateProjectionMatrix();
}

new ResizeObserver( () => resizeRendererToDisplaySize(renderer) ).observe( canvas );


function render( millis ) {
    requestAnimationFrame(render);

    renderer.render(scene, camera);
    skyUniforms.uTime.value = millis * 0.001;
	setAstroUniforms( millis + 1e+5 );
}

requestAnimationFrame(render);


function download() {

    const link = document.createElement("a");
    
    link.href = renderer.domElement
		.toDataURL( "image/jpeg", 0.92 );
    link.download = "image.jpg";
    link.click();
}
