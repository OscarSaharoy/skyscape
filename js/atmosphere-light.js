// Oscar Saharoy 2022

import * as THREE from './three.module.js'; 
import skyVertexShader from "../glsl/skyVertex.glsl.js";
import atmosphereLightFragmentShader from "../glsl/atmosphereLightFragment.glsl.js";
import { skyUniforms, renderer } from "./skyscape.js";
import { camera } from "./camera.js";

const floatType = renderer.capabilities.isWebGL2 ? THREE.FloatType : THREE.HalfFloatType;

// setup 2 alternating render targets
export const atmosphereLightBuffers = [
	new THREE.WebGLRenderTarget( 1, 1, { depthBuffer: false, type: floatType, magFilter: THREE.NearestFilter, minFilter: THREE.NearestFilter } ),
	new THREE.WebGLRenderTarget( 1, 1, { depthBuffer: false, type: floatType, magFilter: THREE.NearestFilter, minFilter: THREE.NearestFilter } ),
];


// create scene and setup sky to render
const scene = new THREE.Scene();

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


export function renderAtmosphereLight() {

	// alternate rendering between the two atmospherelight buffers to allow shader to use output of previous render step
	// (ping pong rendering)
	const activeAtmosphereLightBuffer = 
		atmosphereLightBuffers[ skyUniforms.uFramesStationary.value % 2 ];
	const inactiveAtmosphereLightBuffer = 
		atmosphereLightBuffers[ ( skyUniforms.uFramesStationary.value + 1 ) % 2 ];

	renderer.setRenderTarget( activeAtmosphereLightBuffer );
	skyUniforms.uAtmosphereLight.value = inactiveAtmosphereLightBuffer.texture;
	renderer.render( scene, camera );
	skyUniforms.uAtmosphereLight.value = activeAtmosphereLightBuffer.texture;
}

