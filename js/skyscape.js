// Oscar Saharoy 2022

// divert errors to alerts so we can debug on mobile easier
//window.onerror = error => alert(error);

import * as THREE from './three.module.js'; 
import skyVertexShader from "../glsl/skyVertex.glsl.js";
import skyFragmentShader from "../glsl/skyFragment.glsl.js";
import { canvas } from "./canvas.js";
import { camera } from "./camera.js";


export const renderer = new THREE.WebGLRenderer( {canvas: canvas, antialias: true} );

const scene      = new THREE.Scene();
scene.background = new THREE.Color( 0xb01050 );

const renderScene = () => renderer.render(scene, camera);

//need to figure out new rendering order & implement
// new render order, 4 buffers, 3 render passes
// copy accumulator into new buffer to give to raymarcher
// raymarch -> render into and update accumulator
// render into sky buffer (combine accumulator with stars, sun etc)
// render onto screen (using sky texture and SSR on ocean)
//need to figure out accumulation and averaging
//need to figure out importance sampling
//need to implment dual scattering approximation style thing

// each frame
// copy previous sky light into sky light copy 
// render new sky light step and add on sky light copy -> sky light (float texture)
// final render: render waves sampling reflections from sky light and adding sun, moon and stars to samples from sky light


export const skyUniforms = {
    uTime:        { value: 0. },
	uZoom:        { value: 1. },
	uFramesStationary: { value: 0 },
    uResolution:  { value: new THREE.Vector2() },
	uSunDir:      { value: new THREE.Vector3() },
	uMoonDir:     { value: new THREE.Vector3() },
	uStarsRotation: { value: new THREE.Matrix4() },
	uAtmosphereLight: { value: null },
	uAtmosphereLightPrev: { value: null },
};
skyUniforms.uSunDir.value.set(0, -0.06, -1).normalize();

const skyMaterial = new THREE.ShaderMaterial({
    vertexShader: skyVertexShader,
    fragmentShader: skyFragmentShader,
    uniforms: skyUniforms,
    side: THREE.BackSide,
});

const geometry = new THREE.IcosahedronGeometry( 1, 3 );
const sphere   = new THREE.Mesh( geometry, skyMaterial );
scene.add( sphere );


// render loop
( function renderLoop() {
	renderer.setRenderTarget( null );
	requestAnimationFrame( renderLoop );
	if( skyUniforms.uFramesStationary.value < 5 ) renderScene();
} )();

