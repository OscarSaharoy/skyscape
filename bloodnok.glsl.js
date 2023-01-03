#define PI 3.1415927
/*
	@geofftnz

	forking someone's raytraced sphere in order to do some material testing.
    atmospheric scattering attempt.
    
    Basic idea:
    Ray traced sphere, ray march through interior.
    Accumulate Mie+Rayleigh scattering
    Accumulate air and cloud density.
    At each point on the primary ray march, do a secondary ray march towards the light source to calculate amount of light reaching point.
    
    Full of bugs & fudge factors.

*/
// atmospheric scattering specifics

// Rayleigh absorbtion constant. Controls how different frequencies are scattered. Makes the sky blue.
vec3 Kr = vec3(0.1287, 0.2698, 0.7216);

// Mie scattering
float miePhase = 0.9;
float mieAmount = 0.01;

// Rayleigh scattering
float ralPhase = -0.01;
float rayleighAmount = 0.9;  // how blue is your sky?

float absorbCoeff = 0.7;  // how much the air absorbs light.
float cloudScatter = 20.0;  // amount of omni-directional scatter off clouds.
float cloudAbsorbFactor = 20.0;  // attenuation by clouds.
float cloudMie = 100.0; // amount of Mie scattering by clouds

float airDensityBase = 0.2;

vec3 lightcol = vec3(10.0,9.0,8.0);

vec4 sph1 = vec4 (0.0,0.0,0.0,1.0);




float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

float rand(vec3 co){
    return fract(sin(dot(co.xyz ,vec3(12.9898,78.233,47.985))) * 43758.5453);
}

// credit: iq/rgba
float hash( float n )
{
    return fract(sin(n)*43758.5453);
}


// credit: iq/rgba
float noise( in vec3 x )
{
    vec3 p = floor(x);
    vec3 f = fract(x);
    f = f*f*(3.0-2.0*f);
    float n = p.x + p.y*57.0 + 113.0*p.z;
    float res = mix(mix(mix( hash(n+  0.0), hash(n+  1.0),f.x),
                        mix( hash(n+ 57.0), hash(n+ 58.0),f.x),f.y),
                    mix(mix( hash(n+113.0), hash(n+114.0),f.x),
                        mix( hash(n+170.0), hash(n+171.0),f.x),f.y),f.z);
    return res;
}


float fbm(in vec3 x)
{
	float i = 1.0;
	
	float n = noise(x * i) / i; i *= 2.0;
	n+= noise(x * i) / i; i *= 2.0;
	n+= noise(x * i) / i; i *= 2.0;
	n+= noise(x * i) / i; i *= 2.0;
	n+= noise(x * i) / i; i *= 2.0;
    n+= noise(x * i) / i; i *= 2.0;

	return n;
}

//------------------------------------------------------------------------------
// Colour space transform
//------------------------------------------------------------------------------

// https://en.wikipedia.org/wiki/Academy_Color_Encoding_System#Converting_ACES2065-1_RGB_values_to_CIE_XYZ_values
vec3 RGBtoXYZ(vec3 col)
{
    const mat3 x = mat3(
        	vec3(0.9525523959,0.3439664498,0.0),
        	vec3(0,0.7281660966,0.0),
        	vec3(0.0000936786,-0.0721325464,1.0088251844)
        );
    return x * col;
}

vec3 XYZtoRGB(vec3 col)
{
    const mat3 x = mat3(
        	vec3(1.0498110175,-0.4959030231,0.0),
        	vec3(0.0,1.3733130458,0.0),
        	vec3(-0.0000974845,0.0982400361,0.9912520182)
        );
    return x * col;
}


//============================================================
// credit: demofox https://www.shadertoy.com/view/4tyXDR
#define OBJECT_REFLECTIVITY 0.0 // How reflective the object is. regardless of fresnel.
float FresnelReflectAmount (float n1, float n2, vec3 normal, vec3 incident)
{
    // Schlick aproximation
    float r0 = (n1-n2) / (n1+n2);
    r0 *= r0;
    float cosX = -dot(normal, incident);
    if (n1 > n2)
    {
        float n = n1/n2;
        float sinT2 = n*n*(1.0-cosX*cosX);
        // Total internal reflection
        if (sinT2 > 1.0)
            return 1.0;
        cosX = sqrt(1.0-sinT2);
    }
    float x = 1.0-cosX;
    float ret = r0+(1.0-r0)*x*x*x*x*x;

    // adjust reflect multiplier for object reflectivity
    ret = (OBJECT_REFLECTIVITY + (1.0-OBJECT_REFLECTIVITY) * ret);
    return ret;
}



float pointRayDistance(vec3 ro, vec3 rd, vec3 p)
{
	vec3 u = p-ro;
	float cosvu = dot(rd,u);
	if (cosvu<0.0) return length(p-ro);
	vec3 puv = rd * (cosvu / length(rd));
	vec3 qq = ro + puv;
	return length(p-qq);
}

// intersection through participating media (like atmospheres)
struct iMediaIntersection
{
    float tnear;   // first intersection
    float tfar;    // last intersection
    uint mnear;    // material first hit (atmosphere?)
    uint mfar;     // material on second hit (atmosphere or ground)
    vec3 nor;      // normal at first intersection
};


// intersect ray ro+rd with sphere sph, calculates both entry and exit points.
iMediaIntersection mSphere(in vec3 ro, in vec3 rd, in vec4 sph){

    iMediaIntersection res;
    res.tnear = -1.0;
    res.tfar = -1.0;
    res.mnear = 0u;
    res.mfar = 0u;
    
    // sphere intersection
	float r = sph.w; //radius
	vec3 oc = ro - sph.xyz; //origin = position sphere
	float b = 2.0*dot(oc,rd);
	float c = dot(oc,oc)-r*r;
	float h = b*b - 4.0*c;
    
	if (h >= 0.0)
    {
        float hsqrt = sqrt(h);
        res.tnear = (-b - hsqrt) / 2.0;
        res.mnear = 1u;  // atmospheric hit
        
        res.nor = normalize(ro + rd * res.tnear - sph.xyz);
        
        res.tfar = (-b + hsqrt)/2.0;
        res.mfar = 1u;  // atmospheric exit
    }

    return res;
}



float iSphere (in vec3 ro, in vec3 rd, in vec4 sph){
	//a sphere centered at the origin has eq: |xyz| = r
	//meaning, |xyz|^2 = r^2, meaning <xyz,xyz> = r^2
	// now, xyz = ro + t*rd, therefore |ro|^2 + t^2 + 2<ro,rd>t - r^2 = 0
	// which is a quadratic equation. so
	float r = sph.w; //radius
	vec3 oc = ro - sph.xyz; //origin = position sphere
	float b = 2.0*dot(oc,rd);
	float c = dot(oc,oc)-r*r;
	float h = b*b - 4.0*c;
	if (h <0.0) return -1.0;
	float t = (-b - sqrt(h))/2.0;
	return t;
}

float iSphere2 (in vec3 ro, in vec3 rd, in vec4 sph){
	//a sphere centered at the origin has eq: |xyz| = r
	//meaning, |xyz|^2 = r^2, meaning <xyz,xyz> = r^2
	// now, xyz = ro + t*rd, therefore |ro|^2 + t^2 + 2<ro,rd>t - r^2 = 0
	// which is a quadratic equation. so
	float r = sph.w; //radius
	vec3 oc = ro - sph.xyz; //origin = position sphere
	float b = 2.0*dot(oc,rd);
	float c = dot(oc,oc)-r*r;
	float h = b*b - 4.0*c;
	if (h <0.0) return -1.0;
	float t = (-b + sqrt(h))/2.0;
	return t;
}

vec3 nSphere (in vec3 pos, in vec4 sph){
	return (pos - sph.xyz) / sph.w;
}

float iPlane(in vec3 ro, in vec3 rd){
	//eq. of a plane, y=0 = ro.y + t*rd.y
	return -ro.y/rd.y;
}

vec3 nPlane( in vec3 pos){
	return vec3(0.0,1.0,0.0);
}


float intersect( in vec3 ro, in vec3 rd, out float resT){
	resT = 1000.0;
	float id = -1.0;
	float tsph = iSphere (ro, rd, sph1); //intersect with sphere
	float tpla = iPlane (ro,rd); //intersect with plane
	if (tsph > 0.0){
		id = 1.0;
		resT = tsph;
	}
	if (tpla > 0.0 && tpla < resT){
		id = 2.0;
		resT = tpla;
	}
	return id;
}


iMediaIntersection mediaIntersect( in vec3 ro, in vec3 rd){

    iMediaIntersection res;
    res.tnear = -1.0;
    res.mnear = 0u;
    res.tfar = -1.0;
    res.mfar = 0u;
    
    iMediaIntersection res2 = mSphere(ro,rd,sph1);
    res = res2;
    
    return res;
}


// mie/rayleigh phase - @pyalot http://codeflow.org/entries/2011/apr/13/advanced-webgl-part-2-sky-rendering/
// sensible g: mie:0.97, ral:-0.01
float phase(float alpha, float g){
    float gg = g*g;
    float a = 3.0*(1.0-gg);
    float b = 2.0*(2.0+gg);
    float c = 1.0+alpha*alpha;
    float d = pow(1.0+gg-2.0*g*alpha, 1.5);
    return (a/b)*(c/d);
}

// exponential absorbtion - @pyalot http://codeflow.org/entries/2011/apr/13/advanced-webgl-part-2-sky-rendering/
vec3 absorb(float dist, vec3 col, float f)
{
    vec3 c = col;    
    c *= (vec3(1.0) - pow(Kr, vec3(f / max(dist,0.0000000001))));
    //c *= (vec3(1.0) - pow(vec3(0.05,0.7,0.9), vec3(f / max(dist*0.5,0.0000000001))));
    //c *= (vec3(1.0) - pow(vec3(0.01,0.85,0.9), vec3(f / max(dist*0.1,0.0000000001))));
    return c;
}

float cloudAbsorb(float cloud)
{
    return exp(-cloud * cloudAbsorbFactor);
}

float airDens(vec3 pos){
    
    //return 5.0 * exp(-7.0 * alt) * (1.0-alt);  // last factor is lies, but makes sure we end at 0.0 at edge of atmosphere
    return airDensityBase;
}

// calculate cloud density
float cloud(vec3 pos){

    vec3 pos2 = pos - sph1.xyz;
    float density = 1.0-smoothstep(0.2,0.9,dot(pos2,pos2));

    pos += vec3(17.3,6.9,0.19) * iTime * 0.002;
    
    //return smoothstep(0.8,1.2,fbm(pos*2.0))*max(0.0,fbm(pos*2.0)-1.0);
    return max(0.0,(fbm(pos*2.3)* density)-0.8);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{

    Kr = RGBtoXYZ(Kr);

	vec3 light = normalize( vec3(0.5,1.0,0.5));
	//uv are the pixel coordinates, from 0 to 1
	vec2 uv = fragCoord.xy / iResolution.xy;

	vec2 p = fragCoord.xy/iResolution.xy;
	p = -1.0 + 2.0*p;
	p.x *= iResolution.x/iResolution.y;


    vec3 mse = iMouse.xyz;
    if (mse.z <= 0.0){  // default view
        mse.x = iResolution.x * 0.5;
        mse.y = iResolution.y * 0.5;
    }

    // turn mouse into spherical coords
	vec2 nMouse = (mse.xy / iResolution.xy)* PI;
	float th = nMouse.y; 
	float ph = -nMouse.x * 2.0;
    
   

	//vec3 ro = vec3(0.0,1.1,2.0); //camera position
    vec3 ro;
    float camdist = 2.0;
	ro.x = sin(th) * cos(ph) * camdist;
	ro.z = sin(th) * sin(ph) * camdist;
	ro.y = cos(th) * camdist;


	vec3 lookAt = sph1.xyz;
	vec3 front = normalize(lookAt - ro);
	vec3 left = normalize(cross(vec3(0,1,0), front));
	vec3 up = normalize(cross(front, left));
	vec3 rd0 = normalize(front*1.5 + left*p.x + up*p.y); // rect vector

    /*
	light.x = sin(th) * cos(ph);
	light.z = sin(th) * sin(ph);
	light.y = -cos(th);
	light = normalize(light);
    */
    light = normalize(vec3(1.0,1.0,1.0));
	
    iMediaIntersection hit = mediaIntersect(ro,rd0);

	vec3 col = vec3(0.0);
    float airDensity = 0.0;
    float cloudDensity = 0.0;
    float cloudAttenuation = 1.0;
    
	
	if (hit.tnear > 0.0){
    
    
		vec3 pos = ro + hit.tnear*rd0;	//hit position
        
        // calculate new ray direction based on refraction
        vec3 rd = refract(rd0,hit.nor,1.0/1.05);
        col = texture(iChannel0,rd).rgb * 0.25;
    
        if (hit.mnear == 1u){  // atmospheric hit
        
            // setup scattering            
            float mie = phase(dot(rd,light),miePhase) * mieAmount; // relative amount of Mie scattering.
            float rayleigh = phase(dot(rd,light),ralPhase) * rayleighAmount; // relative amount of Rayleigh scattering.
                
            // step through atmosphere, cast rays to lightsource to determine shadow.
            float litDensity = 0.0;
            float dt = (hit.tfar - hit.tnear) * 0.04;
            float hh = hash(iTime + dot(rd+ro,vec3(12.65898,37.3516781,17.651651)));  // add a little noise to the start of the ray traversal so smooth out banding.
            
            vec3 mieAccum = vec3(0.0);
            vec3 rayleighAccum = vec3(0.0);
            vec3 cloudAccum = vec3(0.0); // scatter from clouds
            vec3 totalInflux = vec3(0.0);
            
            // raymarch through sphere:
            // - calculate cumulative absorption
            // - calculate influx at each point
            //   - raymarch towards sun & repeat above process.
            
            for(float t = hit.tnear + hh * 0.01; t<hit.tfar-0.00001; t+=dt){
            
                vec3 apos = ro + rd * t;  // position along atmosphere ray
                
                float stepCloudDensity = cloud(apos) * dt;
                cloudDensity += stepCloudDensity; // total cloud density along path
                                
                float stepDensity = airDens(apos) * dt;  // calculates amount of air for this step
                
                airDensity += stepDensity;  // total air density from viewer to point
                
                //vec3 influx = lightcol;  // incoming light (todo: calculate this)
                vec3 influx = vec3(0.0);
                
                // do another raycast towards the sun
                float tsun = iSphere2(apos, light, sph1); // cast ray to sun, intersect with inner edge of sphere
                float dtl = tsun * 0.1; // keep it rather chunky, don't want to bog down
                float airToSun = 0.0;
                float cloudToSun = 0.0;
                float hh2 = hash(iTime + dot(apos,vec3(12.65898,37.3516781,17.651651)));

                for (float tl = hh2 * 0.1; tl < tsun; tl += dtl){
                    
                    vec3 spos = apos + light * tl;
                    cloudToSun += cloud(spos) * dtl;  // acumulate cloud density
                    airToSun += airDens(spos) * dtl;
                }
                
                influx = absorb(airToSun,lightcol,absorbCoeff) * cloudAbsorb(cloudToSun); 
                
                cloudAttenuation = cloudAbsorb(cloudDensity); //1.0 / (1.0 + cloudDensity * cloudAbsorb);
                
                rayleighAccum += absorb(airDensity,influx * Kr * rayleigh * stepDensity,absorbCoeff) * cloudAttenuation;
                
                // mie from air + cloud
                
                //mieAccum += absorb(airDensity,influx * (cloudScatter*dt+mie) * stepCloudDensity,absorbCoeff) * cloudAttenuation;  // original              
                //mieAccum += absorb(airDensity,influx * mie * ((cloudScatter*dt) + stepCloudDensity),absorbCoeff) * cloudAttenuation;  // broken?
                mieAccum += absorb(airDensity,influx * (mie * (stepDensity + stepCloudDensity*cloudMie) + (cloudScatter*stepCloudDensity)),absorbCoeff) * cloudAttenuation;
            }
        
            
            col += mieAccum;
            col += rayleighAccum;
            
            // sun disc
            float mie_eye = phase(dot(rd,light),0.9995) * 0.001; // relative amount of Mie scattering.
            col += absorb(airDensity,lightcol,absorbCoeff) * mie_eye * cloudAttenuation;
            
            // add some fresnel reflection
            vec3 refl = reflect(rd,hit.nor);
            float reflAmount = FresnelReflectAmount(1.0,1.5,hit.nor,rd);
            col = col * (1.0-reflAmount) + texture(iChannel1,refl).rgb * reflAmount;
            

        }

	}else{
        col = texture(iChannel0,rd0).rgb;
        col += lightcol * phase(dot(rd0,light),0.9995) * 0.001; // relative amount of Mie scattering.
	}


    // fake some sun glow (bloom / mie scattering in eye?)
    //float mie_eye = phase(dot(rd0,light),0.9995) * 0.001; // relative amount of Mie scattering.
    //col += absorb(airDensity,lightcol,absorbCoeff) * mie_eye * cloudAttenuation;
    


// reinhardt HDR tonemapping
	float whitelevel = 5.0;
	col = (col  * (vec3(1.0) + (col / (whitelevel * whitelevel))  ) ) / (vec3(1.0) + col);	

// ACES to RGB
    col = XYZtoRGB(col);

// gamma	
	col = pow(col,vec3(1.0/2.0));

	
	fragColor = vec4(col,1.0);
	
}

