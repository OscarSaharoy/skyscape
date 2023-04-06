// Oscar Saharoy 2023

import * as THREE from './three.module.js'; 
import { canvas } from "./canvas.js";


export const renderer = new THREE.WebGLRenderer( {canvas: canvas, antialias: true, precision: 'highp'} );
export const floatType = renderer.capabilities.isWebGL2 ? THREE.FloatType : THREE.HalfFloatType;
