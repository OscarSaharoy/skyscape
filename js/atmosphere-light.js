// Oscar Saharoy 2022

import * as THREE from './three.module.js'; 
import skyVertexShader from "../glsl/skyVertex.glsl.js";
import atmosphereLightFragmentShader from "../glsl/atmosphereLightFragment.glsl.js";
import { skyUniforms, renderer } from "./skyscape.js";
import { camera } from "./camera.js";


// setup 2 alternating render targets
export const atmosphereLightBuffers = [
	new THREE.WebGLRenderTarget( 1, 1, { depthBuffer: false, type: THREE.FloatType } ),
	new THREE.WebGLRenderTarget( 1, 1, { depthBuffer: false, type: THREE.FloatType } ),
];


// create scene and setup sky to render
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
	requestAnimationFrame( renderLoop );

	if( skyUniforms.uFramesStationary.value >= 5 ) return;

	// alternate rendering between the two atmospherelight buffers to allow shader to use output of previous render step
	const activeAtmosphereLightBuffer = 
		atmosphereLightBuffers[ skyUniforms.uFramesStationary.value % 2 ];
	const inactiveAtmosphereLightBuffer = 
		atmosphereLightBuffers[ ( skyUniforms.uFramesStationary.value + 1 ) % 2 ];

	renderer.setRenderTarget( activeAtmosphereLightBuffer );
	skyUniforms.uAtmosphereLight.value = inactiveAtmosphereLightBuffer.texture;
	renderScene();
	skyUniforms.uAtmosphereLight.value = activeAtmosphereLightBuffer.texture;

} )();

