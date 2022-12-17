// Oscar Saharoy 2022

import * as THREE from "./three.module.js"; 
import { renderScene, canvas, camera, skyUniforms } from "./skyscape.js";
import { panCamera, zoomCamera } from "./camera-control.js";
import { pointerOverSun, setSunDirection } from "./sun-control.js";


const activePointers = {};
let prevMeanPointer = new THREE.Vector3();
let prevPointerSpread = 0;
let draggingSun = false;


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

	if( draggingSun && Object.keys(activePointers).length ) return;

    activePointers[event.pointerId] = getRelativePointerPos( event );

	if( Object.keys(activePointers).length == 1
			&& pointerOverSun(camera, event) )
		draggingSun = true;
    
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
	draggingSun = false;
    
    if( !Object.keys(activePointers).length ) 
        return canvas.style.cursor = "auto";

    prevMeanPointer = getMeanPointerPos( activePointers );
    prevPointerSpread = getPointerSpread( activePointers );
}

function onWheel( event ) {

	event.preventDefault();
    zoomCamera( -event.deltaY / 200, getRelativePointerPos(event) ); 

	renderScene();
}


function controlsLoop() {

    requestAnimationFrame( controlsLoop );

    if( !Object.keys(activePointers).length ) return;

	if( draggingSun )
		setSunDirection( camera, getMeanPointerPos( activePointers ) );

	else {
		const meanDelta = getMeanPointerPos( activePointers ).sub( prevMeanPointer );
		prevMeanPointer = getMeanPointerPos( activePointers ); 
		panCamera( camera, meanDelta );

		const spreadDelta = getPointerSpread( activePointers ) - prevPointerSpread;
		prevPointerSpread = getPointerSpread( activePointers );
		zoomCamera( camera, spreadDelta * 40, getMeanPointerPos(activePointers) );
		skyUniforms.uZoom.value = camera.zoom;
	}

	renderScene();
}
controlsLoop();


canvas.addEventListener( "pointerdown", onPointerdown );
canvas.addEventListener( "pointermove", onPointermove );
canvas.addEventListener( "pointerup", onPointerup );
canvas.addEventListener( "pointerleave", onPointerup );
canvas.addEventListener( "wheel", onWheel, {passive: false} );

