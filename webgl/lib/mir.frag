varying vec3 vPosition;
varying vec2 vUv;
uniform sampler2D tDiffuse;
uniform float cTime;
uniform float rSpeed;
uniform float rFrequnecy;
uniform float rAmplitude;
uniform float gSpeed;
uniform float gFrequnecy;
uniform float gAmplitude;
uniform float bSpeed;
uniform float bFrequnecy;
uniform float bAmplitude;
uniform float wSpeed;
uniform float wFrequnecy;
uniform float wAmplitude;
uniform int wOverExposed;
uniform int useImage;

float PI = 3.14159265358979323846264;

void main() {
    if (useImage > 0) {
        gl_FragColor = texture2D(tDiffuse, vUv);
        return;
    }

    float r = rAmplitude * pnoise(vPosition * rFrequnecy + cTime * rSpeed, vec3(10.0));
    float g = gAmplitude * pnoise(vPosition * gFrequnecy + cTime * gSpeed, vec3(10.0));
    float b = bAmplitude * pnoise(vPosition * bFrequnecy + cTime * bSpeed, vec3(10.0));
    vec3 color = vec3(r, g, b);

    float n = wAmplitude * pnoise(vPosition * wFrequnecy + cTime * wSpeed, vec3(10.0));
    if (wOverExposed > 0) {
        n = pow(.001, n);
    }
    color += vec3(n);

    gl_FragColor = vec4(color, 1.0);
}
