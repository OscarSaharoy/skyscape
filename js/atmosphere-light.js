// Oscar Saharoy 2022

import * as THREE from './three.module.js'; 
import { skyUniforms } from "./skyscape.js";
import { floatType } from "./renderer.js";

import vertexShader from "../glsl/vertex.glsl.js";
import atmosphereLightFragmentShader from "../glsl/atmosphereLightFragment.glsl.js";


// setup 2 alternating render targets
export const atmosphereLightBuffers = [
	new THREE.WebGLRenderTarget( 1, 1, { depthBuffer: false, type: floatType, magFilter: THREE.NearestFilter, minFilter: THREE.NearestFilter } ),
	new THREE.WebGLRenderTarget( 1, 1, { depthBuffer: false, type: floatType, magFilter: THREE.NearestFilter, minFilter: THREE.NearestFilter } ),
];


// create scene and setup sky to render
const atmosphereLightScene = new THREE.Scene();

const atmosphereLightMaterial = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: atmosphereLightFragmentShader,
	uniforms: skyUniforms,
    side: THREE.BackSide,
});

const atmosphereLightGeometry = new THREE.IcosahedronGeometry( 1, 3 );
const atmosphereLightMesh = new THREE.Mesh( atmosphereLightGeometry, atmosphereLightMaterial );
atmosphereLightScene.add( atmosphereLightMesh );


export function renderAtmosphereLight( renderer, camera ) {

	// alternate rendering between the two atmospherelight buffers to allow shader to use output of previous render step
	// (ping pong rendering)
	const activeAtmosphereLightBuffer = 
		atmosphereLightBuffers[ skyUniforms.uFramesStationary.value % 2 ];
	const inactiveAtmosphereLightBuffer = 
		atmosphereLightBuffers[ ( skyUniforms.uFramesStationary.value + 1 ) % 2 ];

	renderer.setRenderTarget( activeAtmosphereLightBuffer );
	skyUniforms.uAtmosphereLight.value = inactiveAtmosphereLightBuffer.texture;
	renderer.render( atmosphereLightScene, camera );
	skyUniforms.uAtmosphereLight.value = activeAtmosphereLightBuffer.texture;
}

