// Oscar Saharoy 2022

// divert errors to alerts so we can debug on mobile easier
//window.onerror = error => alert(error);

import * as THREE from './three.module.js'; 
import skyVertexShader from "../glsl/skyVertex.glsl.js";
import skyFragmentShader from "../glsl/skyFragment.glsl.js";

export const canvas = document.querySelector( "#shader-canvas" );
const renderer = new THREE.WebGLRenderer( {canvas: canvas, antialias: true} );

const UP    = new THREE.Vector3(  0,  1,  0 );
const DOWN  = new THREE.Vector3(  0, -1,  0 );
const NORTH = new THREE.Vector3(  1,  0,  0 );
const SOUTH = new THREE.Vector3( -1,  0,  0 );
const EAST  = new THREE.Vector3(  0,  0,  1 );
const WEST  = new THREE.Vector3(  0,  0, -1 );

const scene = new THREE.Scene();
scene.background = new THREE.Color( 0xb01050 );

const aspect = canvas.width / canvas.height;
const dpr    = window.devicePixelRatio;
const fov    = Math.min( 60 * Math.max( 1, 1/aspect ), 100 );
const near   = 0.1;
const far    = 30;
export const camera = new THREE.PerspectiveCamera( fov, aspect, near, far );
const cameraForward = new THREE.Vector3( 0, 0, -1 );
camera.lookAt( cameraForward );
//renderer.setPixelRatio(dpr);

export const renderScene = () => renderer.render(scene, camera);


export const skyUniforms = {
    uTime:        { value: 0. },
    uResolution:  { value: new THREE.Vector2() },
	uZoom:        { value: 1. },
	uSkyRotation: { value: new THREE.Matrix4() },
	uSunDir:      { value: new THREE.Vector3() },
	uMoonDir:     { value: new THREE.Vector3() },
};
skyUniforms.uSunDir.value.set(0, -0.06, -1).normalize();


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



function resizeRendererToDisplaySize( renderer ) {

    const width   = canvas.clientWidth;
    const height  = canvas.clientHeight;

    renderer.setSize( width*dpr, height*dpr, false );
    skyUniforms.uResolution.value.set( width*dpr, height*dpr );

    const aspect = canvas.width / canvas.height;
    camera.aspect = aspect;
    camera.fov = Math.min( 60 * Math.max( 1, 1/aspect ), 100 );
    camera.updateProjectionMatrix();

	renderScene();
}

new ResizeObserver( 
	() => resizeRendererToDisplaySize(renderer) 
).observe( canvas );

