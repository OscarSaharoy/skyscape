// Oscar Saharoy 2022

// divert errors to alerts so we can debug on mobile easier
//window.onerror = error => alert(error);

import * as THREE from './three.module.js'; 
import vertexShader from "../glsl/vertex.glsl.js";
import skyFragmentShader from "../glsl/skyFragment.glsl.js";
import { uniforms } from "./uniforms.js";


//need to implement ray marching
//need to implment dual scattering approximation style thing

const scene      = new THREE.Scene();
scene.background = new THREE.Color( 0xb01050 );

const skyMaterial = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: skyFragmentShader,
    uniforms: uniforms,
    side: THREE.BackSide,
});

const geometry = new THREE.IcosahedronGeometry( 1, 3 );
const sphere   = new THREE.Mesh( geometry, skyMaterial );
scene.add( sphere );


export function renderScreen( renderer, camera ) {

	renderer.setRenderTarget( null );
	renderer.render( scene, camera );
}

