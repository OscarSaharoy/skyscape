// Oscar Saharoy 2022

// divert errors to alerts so we can debug on mobile easier
window.onerror = error => alert(error);

import * as THREE from './three.module.js'; 
import vertexShader from "../glsl/vertex.glsl.js";
import skyFragmentShader from "../glsl/skyFragment.glsl.js";
import { canvas } from "./canvas.js";
import { camera } from "./camera.js";


//need to implement ray marching
//need to implment dual scattering approximation style thing

export const renderer = new THREE.WebGLRenderer( {canvas: canvas, antialias: true, precision: 'highp'} );

const scene      = new THREE.Scene();
scene.background = new THREE.Color( 0xb01050 );

export const skyUniforms = {
    uTime: { value: 0. },
	uZoom: { value: 1. },
	uFramesStationary: { value: 0 },
    uResolution: { value: new THREE.Vector2() },
	uSunDir: { value: new THREE.Vector3() },
	uMoonDir: { value: new THREE.Vector3() },
	uStarsRotation: { value: new THREE.Matrix4() },
	uAtmosphereLight: { value: null },
	uSamplePointsPerFrame: { value: 5 },
	uSamplePointsTotal: { value: 200 },
};
skyUniforms.uSunDir.value.set(0, -0.06, -1).normalize();

const skyMaterial = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: skyFragmentShader,
    uniforms: skyUniforms,
    side: THREE.BackSide,
});

const geometry = new THREE.IcosahedronGeometry( 1, 3 );
const sphere   = new THREE.Mesh( geometry, skyMaterial );
scene.add( sphere );


export function renderScreen() {

	renderer.setRenderTarget( null );
	renderer.render( scene, camera );
}

