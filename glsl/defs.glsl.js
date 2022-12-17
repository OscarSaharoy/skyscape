// Oscar Saharoy 2022

export default `

uniform float uTime;
uniform vec2 uResolution;
uniform float uZoom;
uniform mat4 uSkyRotation;
uniform vec3 uSunDir;
uniform vec3 uMoonDir;

varying vec3 vNormal;

#define PI 3.14159
#define PHI 1.618033
#define UP vec3(0, 1, 0)
#define DOWN vec3(0, -1, 0)
#define SUN_DIST 151560000000. 
#define SUN_RADIUS 696340000. 
#define MOON_DIST 384400000. 
#define MOON_RADIUS 1737e+3 
#define EARTH_RADIUS 6360e+3
#define EARTH_CENTRE vec3(0,-EARTH_RADIUS,0)
#define ATMOSPHERE_RADIUS 6460e+3
#define VIEWER_HEIGHT 2.

#define RAYLEIGH_SCATTERING_COEFFS vec3(5.802, 13.6, 33.1)   * 1e-6
#define RAYLEIGH_ABSORPTION_COEFFS vec3(0.)                  * 1e-6
#define MIE_SCATTERING_COEFFS      vec3(3.996)               * 1e-6
#define MIE_ABSORPTION_COEFFS      vec3(4.40)                * 1e-6
#define OZONE_SCATTERING_COEFFS    vec3(0)                   * 1e-6
#define OZONE_ABSORPTION_COEFFS    vec3(0.681, 1.881, 0.085) * 1e-6

`;