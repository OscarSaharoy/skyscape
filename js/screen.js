// Oscar Saharoy 2022

import * as THREE from './three.module.js'; 
import vertexShader from "../glsl/vertex.glsl.js";
import skyFragmentShader from "../glsl/skyFragment.glsl.js";
import { uniforms } from "./uniforms.js";


const screenScene = new THREE.Scene();
screenScene.background = new THREE.Color( 0xb01050 );


const skyMaterial = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: skyFragmentShader,
    uniforms: uniforms,
    side: THREE.BackSide,
});
const skyGeometry = new THREE.IcosahedronGeometry( 1, 3 );
const skySphere   = new THREE.Mesh( skyGeometry, skyMaterial );
screenScene.add( skySphere );


export function renderScreen( renderer, camera ) {

	renderer.setRenderTarget( null );
	renderer.render( screenScene, camera );
}

