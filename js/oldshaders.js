// Oscar Saharoy 2021


const fragmentShader = `

// ====================================================================================


uniform float uTime;
uniform vec2  uResolution;
uniform vec3  uViewPos;
uniform vec3  uViewDir;
uniform vec3  uSunDir;


#define PI 3.14159
#define WORLD_RADIUS 100.0
#define ATM_RADIUS 101.5
#define N_STEPS 5.
#define X vec3( 1., 0., 0. )
#define Y vec3( 0., 1., 0. )
#define Z vec3( 0., 0., 1. )
#define SCATTERING 1.
#define DENSITY_FALLOFF 5.
#define WAVELENGTHS vec3( 400. / 700., 400. / 530., 400. / 440. ) 

float saturate( in float x ) {
     
    return clamp( x, 0., 1. );
}

vec3 saturate( in vec3 colour ) {
    
    return clamp( colour, vec3(0.), vec3(1.) );
}

vec3 hash3( vec3 p ) {

    vec3 q = vec3( dot( p, vec3(127.1,311.7,432.2) ), 
                   dot( p, vec3(269.5,183.3,847.6) ), 
                   dot( p, vec3(419.2,371.9,927.0) ) );

    return fract(sin(q)*43758.5453);
}

mat4 rotationMatrix(vec3 axis, float angle) {

    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    
    return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                0.0,                                0.0,                                0.0,                                1.0);
}

vec3 getView( in vec2 fragCoord ) {
 
    // uv in clip space -0.5 to 0.5 in smaller of x and y and scaled the same in other axis

    float scale = 1. / max( uResolution.x, uResolution.y );
    vec2 offset = vec2( -0.5, -0.5 ) * uResolution * scale;
    vec2 uv = fragCoord * scale + offset;
    
    // generate the view ray

    //vec3 forward = normalize( uViewDir );
    //vec3 right   = normalize( cross( forward, Y ) );
    //vec3 up      = normalize( cross( right, forward ) );

    vec3 forward = uViewDir;
    vec3 right   = normalize( cross( forward, uViewPos ) );
    vec3 up      = normalize( cross( right, forward ) );

    // focal length of camera
    float r = 0.5;

    return normalize( r * forward + uv.x * right + uv.y * up );
}


vec2 intersectWorld( in vec3 viewPos, in vec3 viewDir ) {

    float b = 2. * dot( viewPos, viewDir );
    float c = dot( viewPos, viewPos ) - WORLD_RADIUS * WORLD_RADIUS;

    float d = b*b - 4.*c;

    if( d < 0. ) return vec2( -1., 0. );

    float s = sqrt( d );

    float nearHit = max( 0., -( b + s) / 2. );
    float farHit  = -( b - s) / 2.;

    if( farHit < 0. ) return vec2( -1., 0. );

    return vec2( nearHit, farHit - nearHit );
}

vec2 intersectAtm( in vec3 viewPos, in vec3 viewDir ) {

    float b = 2. * dot( viewPos, viewDir );
    float c = dot( viewPos, viewPos ) - ATM_RADIUS * ATM_RADIUS;

    float d = b*b - 4.*c;

    if( d < 0. ) return vec2( -1., 0. );

    float s = sqrt( d );

    float nearHit = max( 0., -( b + s) / 2. );
    float farHit  = -( b - s) / 2.;

    if( farHit < 0. ) return vec2( -1., 0. );

    return vec2( nearHit, farHit - nearHit );
}

float densityAtPoint( in vec3 point ) {

    float heightAboveSurface = length( point ) - WORLD_RADIUS;
    float scaledHeight = heightAboveSurface / ( ATM_RADIUS - WORLD_RADIUS );

    float localDensity = exp( - scaledHeight * DENSITY_FALLOFF );
    
    return localDensity;
}

float opticalDepthO( in vec3 rayOrigin, in vec3 rayDir ) {

    float height = length( rayOrigin );
    float cos = dot( rayOrigin, rayDir ) / height;

    float scale = exp( 1.1 + 2.25 * exp( -2.*cos ) );

    return exp( -0.35 * ( height - WORLD_RADIUS ) ) * scale;
}

float opticalDepth( in vec3 rayOrigin, in vec3 rayDir, in float rayLength ) {
    
    if( rayLength == -1. ) rayLength = intersectAtm( rayOrigin, rayDir ).y;
    
    float stepSize = rayLength / N_STEPS;
    float opticalDepth = 0.;
    vec3 densitySamplePoint = rayOrigin + rayDir * 0.5 * stepSize;
   
    for( int i=0; i<int(N_STEPS); ++i ) {
   
        float localDensity = densityAtPoint( densitySamplePoint );
        opticalDepth += localDensity * stepSize;
        densitySamplePoint += rayDir * stepSize; 
    }

    return opticalDepth;
}

vec3 atmLight( in vec3 viewPos, in vec3 viewDir ) {
    
    vec2 worldHitInfo = intersectWorld( viewPos, viewDir );
    float distToWorld = worldHitInfo.x;

    vec2 atmHitInfo = intersectAtm( viewPos, viewDir );
    float distToAtm = atmHitInfo.x;
    float distThroughAtm = atmHitInfo.y; 

    bool inAtm    = distToAtm   ==  0.;
    bool hitAtm   = distToAtm   != -1.;
    bool hitWorld = distToWorld != -1.;

    // if the view ray doesn't pass through the atmosphere there is no light contirbution from it
    if( !hitAtm ) return vec3( 0. );

    float closestWorldDist = length( viewPos - min( dot(viewDir, viewPos), 0. ) * viewDir ) - WORLD_RADIUS;
    float distToHorizon = sqrt( dot(viewPos, viewPos) - WORLD_RADIUS*WORLD_RADIUS );
    float horizonNearnessScale = .2 / distToHorizon * uResolution.x;
    float horizonNearness = saturate( - closestWorldDist * horizonNearnessScale );

    //return vec3( horizonNearness );

    //distThroughAtm = hitWorld ? distToWorld - distToAtm : distThroughAtm; 
    distThroughAtm = mix( distThroughAtm, distToWorld - distToAtm, horizonNearness );

    vec3 pointInAtm = viewPos + viewDir * distToAtm;
    
    float stepSize = distThroughAtm / N_STEPS;
    vec3 scatterCoefficients = pow( WAVELENGTHS, vec3(4.) ) * SCATTERING;
    
    vec3 inScatterPoint = pointInAtm + viewDir * 0.5 * stepSize;
    vec3 inScatteredLight = vec3( 0. ) + ( hash3(viewDir).x  - 0.5 ) * 0.005;
    for( int i=0; i<int(N_STEPS); ++i ) {
        
        float sunRayOpticalDepth  = opticalDepth( inScatterPoint, uSunDir, -1. );
        float viewRayOpticalDepth = opticalDepth( pointInAtm, viewDir, length( pointInAtm - inScatterPoint ) );
        //float viewRayOpticalDepth = opticalDepth( inScatterPoint, -viewDir ) - opticalDepth( pointInAtm, -viewDir );
        //float viewRayOpticalDepth = opticalDepth( pointInAtm, viewDir ) - opticalDepth( inScatterPoint, viewDir );
            //inAtm && !hitWorld
            //? opticalDepth( pointInAtm, viewDir ) - opticalDepth( inScatterPoint, viewDir )
            //: opticalDepth( inScatterPoint, -viewDir ) - opticalDepth( pointInAtm, -viewDir ); 
            
        vec3 transmittance = exp( -( sunRayOpticalDepth + viewRayOpticalDepth) * scatterCoefficients );
       
        float localDensity = densityAtPoint( inScatterPoint );

        inScatteredLight += localDensity * transmittance * scatterCoefficients * stepSize;
        inScatterPoint += viewDir * stepSize;
    }
    
    return inScatteredLight;
}


vec3 worldLight( in vec3 viewPos, in vec3 viewDir ) {

    float distToWorld = intersectWorld( viewPos, viewDir ).x;

    if( distToWorld == -1. ) return vec3( 0. );

    float closestWorldDist = length( viewPos - min( dot(viewDir, viewPos), 0. ) * viewDir ) - WORLD_RADIUS;
    float distToHorizon = sqrt( dot(viewPos, viewPos) - WORLD_RADIUS*WORLD_RADIUS );
    float horizonNearnessScale = .2 / distToHorizon * uResolution.x;
    float horizonNearness = saturate( - closestWorldDist * horizonNearnessScale );

    vec3 worldPos = viewPos + distToWorld * viewDir;
    vec3 normal   = normalize( worldPos );

    vec3 scatterCoefficients = pow( WAVELENGTHS, vec3(4.) ) * SCATTERING;
    float diffuse = dot( normal, uSunDir );
    float opticalDepth = opticalDepth( worldPos, -viewDir, -1. ) - opticalDepth( viewPos, -viewDir, -1. );

    return vec3( 0.15, 0.28, 0.5 ) * 0.4 * horizonNearness * diffuse * exp( -opticalDepth * SCATTERING );
}

vec3 starLight( in vec3 viewPos, in vec3 viewDir, in vec3 preColour ) {

    float fadeOut = intersectWorld( viewPos, viewDir ).x != -1. 
        ? 0. 
        : saturate( 1. - length( preColour ) * 5. ); 

    float cellSize = 0.08;

    vec3 cell = floor( viewDir / cellSize );
    vec3 offset = hash3( cell ) * 0.5 + 0.25;

    vec3 cellPos = mod( viewDir, vec3(1) * cellSize ) / cellSize;
    vec3 freakedCellPos = cellPos - offset;
    float freakedLength = length( freakedCellPos );
    float light = saturate( 0.015 / freakedLength - 0.2 );

    return vec3( light * fadeOut );
}

vec3 sunLight( in vec3 viewPos, in vec3 viewDir ) {

    return vec3( 0. );
}


void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    
    vec3 colour  = vec3( 0. );
    vec3 viewDir = getView( fragCoord );

    colour += atmLight( uViewPos, viewDir );
    colour += worldLight( uViewPos, viewDir );
    colour += starLight ( uViewPos, viewDir, colour );
    colour += sunLight  ( uViewPos, viewDir );

    fragColor = vec4( colour, 1.0 );
}


void main() {

    mainImage( gl_FragColor, gl_FragCoord.xy );
}


// ====================================================================================

`;

