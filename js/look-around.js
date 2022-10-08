// Oscar Saharoy 2022

import * as THREE from "./three.module.js"; 
import { camera, panCamera, zoomCamera } from "./skyscape.js";

const canvas = document.querySelector( "#shader-canvas" );

const activePointers = {};
let prevMeanPointer = new THREE.Vector3();
let prevPointerSpread = 0;


function getRelativePointerPos( event ) {

    const canvasBox = canvas.getBoundingClientRect();
    const maxDimension = Math.max( canvasBox.width, canvasBox.height );

    const pointerX = event.clientX - canvasBox.width  / 2;
    const pointerY = event.clientY - canvasBox.height / 2;

    return new THREE.Vector3( pointerX / maxDimension, pointerY / maxDimension, 0 ); 
}

function getMeanPointerPos( activePointers ) {

    return Object.values(activePointers)
                 .reduce( (acc, val) => acc.add(val), new THREE.Vector3() )
                 .divideScalar( Object.keys(activePointers).length );
}

function getPointerSpread( activePointers ) {
    
    const mean = getMeanPointerPos( activePointers );

    return Object.values( activePointers )
                 .reduce( (acc, val) => acc + mean.distanceTo(val), 0 );
}


function onPointerdown( event ) {

    activePointers[event.pointerId] = getRelativePointerPos( event );
    
    prevMeanPointer = getMeanPointerPos( activePointers );
    prevPointerSpread = getPointerSpread( activePointers );
}

function onPointermove( event ) {
    
    if( !(event.pointerId in activePointers) ) return;

    activePointers[event.pointerId] = getRelativePointerPos( event );

	if( canvas.style.cursor != "grabbing" )
		canvas.style.cursor  = "grabbing";
}

function onPointerup( event ) {

    // remove the pointer from activePointers
    // (does nothing if it wasnt in them)
    delete activePointers[event.pointerId];
    
    if( !Object.keys(activePointers).length ) 
        return canvas.style.cursor = "auto";

    prevMeanPointer = getMeanPointerPos( activePointers );
    prevPointerSpread = getPointerSpread( activePointers );
}

function controlsLoop() {

    requestAnimationFrame( controlsLoop );

    if( !Object.keys(activePointers).length ) return;

    const meanDelta = getMeanPointerPos( activePointers ).sub( prevMeanPointer );
    prevMeanPointer = getMeanPointerPos( activePointers ); 
    panCamera( meanDelta );

    const spreadDelta = getPointerSpread( activePointers ) - prevPointerSpread;
    prevPointerSpread = getPointerSpread( activePointers );
    zoomCamera( spreadDelta * 40, getMeanPointerPos(activePointers) );
}
controlsLoop();

function onWheel( event ) {

	event.preventDefault();
    zoomCamera( -event.deltaY / 200, getRelativePointerPos(event) ); 
}

canvas.addEventListener( "pointerdown", onPointerdown );
canvas.addEventListener( "pointermove", onPointermove );
canvas.addEventListener( "pointerup", onPointerup );
canvas.addEventListener( "pointerleave", onPointerup );
canvas.addEventListener( "wheel", onWheel, {passive: false} );

