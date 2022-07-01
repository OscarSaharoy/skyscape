// Oscar Saharoy 2022

import * as THREE from "https://unpkg.com/three@0.140.0/build/three.module.js"; 

const canvas = document.querySelector( "#shader-canvas" );
const renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true});
const dpr   = window.devicePixelRatio;

const up = new THREE.Vector3( 0, 1, 0 );

const scene = new THREE.Scene();
scene.background = new THREE.Color( 0x101050 );

const fov = 60;
const aspect = canvas.width / canvas.height;
const near = 0.1;
const far = 50;
const camera = new THREE.PerspectiveCamera( fov, aspect, near, far );
const cameraForward = new THREE.Vector3( 0, 0, -1 );

{
    const geometry = new THREE.PlaneGeometry( 100, 100 );
    const material = new THREE.MeshBasicMaterial( {color: 0x000000} );
    const plane = new THREE.Mesh( geometry, material );
    plane.position.y = -2;
    plane.rotateX( -Math.PI / 2);
    scene.add( plane );
}

{
    const geometry = new THREE.TorusKnotGeometry( 10, 3, 100, 16 );
    const material = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
    const torusKnot = new THREE.Mesh( geometry, material );
    scene.add( torusKnot );
}


// const uniforms = {
//     uTime:          { value: 0 },
//     uResolution:    { value: new THREE.Vector2() },
// };
// 
// const material = new THREE.ShaderMaterial({
//     fragmentShader: fragmentShader,
//     uniforms: uniforms,
//     transparent: true,
//     precision: "highp",
// });
// 
// scene.add(new THREE.Mesh(plane, material));


export function panCamera( delta ) {

    const right = new THREE.Vector3().crossVectors( cameraForward, up );
    const over = new THREE.Vector3().crossVectors( cameraForward, right );

    if( up.dot(cameraForward) > 0 && delta.y < 0
     || up.dot(cameraForward) < 0 && delta.y > 0 )
        over.normalize();

    const sensitivity = -12 / (0.85*camera.zoom + 2.15); 

    const adjust = new THREE.Vector3().addVectors(
        right.multiplyScalar(delta.x),
        over.multiplyScalar(delta.y)
    ).multiplyScalar(sensitivity);

    cameraForward.add( adjust );
    cameraForward.normalize();
    camera.lookAt( cameraForward );
}

export function zoomCamera( delta ) {
    
    const adjust = 1.17 ** delta;

    camera.zoom *= adjust;
    camera.zoom = Math.max( 0.5, camera.zoom );
    camera.updateProjectionMatrix();
}


function resizeRendererToDisplaySize( renderer ) {

    const width   = canvas.clientWidth;
    const height  = canvas.clientHeight;

    renderer.setSize( width*dpr, height*dpr, false );
    //uniforms.uResolution.value.set( width * dpr, height * dpr );

    const aspect = canvas.width / canvas.height;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
}

new ResizeObserver( () => resizeRendererToDisplaySize(renderer) ).observe( canvas );


function render( time ) {

    renderer.render(scene, camera);

    //uniforms.uTime.value = time * 0.001;

    requestAnimationFrame(render);
}

requestAnimationFrame(render);


function download() {

    const link = document.createElement("a");
    
    link.href = renderer.domElement.toDataURL( "image/jpeg", 0.92 );
    link.download = "image.jpg";
    link.click();
}

