// Oscar Saharoy 2022

// divert errors to alerts so we can debug on mobile easier
//window.onerror = error => alert(error);

import * as THREE from './three.module.js'; 
import skyVertexShader from "../glsl/skyVertex.glsl.js";
import atmosphereLightFragmentShader from "../glsl/atmosphereLightFragment.glsl.js";
import { skyUniforms, renderer } from "./skyscape.js";
import { camera } from "./camera.js";


export const atmosphereLightBuffer = new THREE.WebGLRenderTarget( 1, 1, { depthBuffer: false, type: THREE.FloatType } );
skyUniforms.uAtmosphereLight.value = atmosphereLightBuffer.texture;


const scene = new THREE.Scene();
const renderScene = () => renderer.render(scene, camera);

const skyMaterial = new THREE.ShaderMaterial({
    vertexShader: skyVertexShader,
    fragmentShader: atmosphereLightFragmentShader,
	uniforms: skyUniforms,
    side: THREE.BackSide,
});

const geometry = new THREE.IcosahedronGeometry( 1, 3 );
const material = skyMaterial; 
const sphere   = new THREE.Mesh( geometry, material );
scene.add( sphere );


// render loop
( function renderLoop() {
	renderer.setRenderTarget( atmosphereLightBuffer );
	requestAnimationFrame( renderLoop );
	if( skyUniforms.uFramesStationary.value < 5 ) renderScene();
} )();

