varying vec2 vUv;
uniform float time;
uniform sampler2D tDiffuse;
uniform vec2 vResolution;
uniform int displacement;
uniform float displacementFrequency;
uniform float displacementAmplitude;
uniform int zoomBlur;
uniform float zoomBlurStrength;
uniform int zoomBlurMix;
uniform int chromaticAberration;
uniform float chromaticAberrationStrength;
uniform int chromaticAberrationMix;
uniform int invert;
uniform int scanline;
uniform int vignette;

float random(vec3 p, float seed) {
    return fract(sin(dot(p + seed, vec3(12.9898, 78.233, 151.7182))) * 43758.5453 + seed);
}

void addEffect(vec4 color, int mix) {
    if (mix == 0) {  // average
        gl_FragColor = (gl_FragColor + color) * .5;
    } else if (mix == 1) {  // multiplicative
        gl_FragColor += color;
    } else if (mix == 2) {  // additive
        gl_FragColor *= color;
    } else if (mix == 3) {  // screen
        gl_FragColor = 1.0 - (1.0 - color) * (1.0 - gl_FragColor);
    }
}

vec4 getZoomBlur(float strength) {
    vec2 to_center = vec2(.5) - vUv;
    float offset = random(gl_FragCoord.xyz, 0.0);

    vec4 color = vec4(0.0);
    float total = 0.0;
    for (float t = 0.0; t <= 40.0; t += 1.0) {
        float percent = (t + offset) / 40.0;
        float weight = 4.0 * (percent - percent * percent);
        vec4 sampled = texture2D(tDiffuse, vUv + to_center * percent * strength);
        sampled.rgb *= sampled.a;
        color += sampled * weight;
        total += weight;
    }

    color /= total;
    color.rgb /= color.a + 0.00001;
    return color;
}

vec4 getChromaticAberration(float strength) {
    float d = length(vUv - vec2(0.5, 0.5));
    float blur = d * strength;
    return vec4(
        texture2D(tDiffuse, vec2(vUv.x + blur, vUv.y)).r,
        texture2D(tDiffuse, vUv).g,
        texture2D(tDiffuse, vec2(vUv.x - blur, vUv.y)).b,
        1.0
    );
}

vec4 getDisplacement(float frequency, float amplitude) {
    float f1 = pnoise(vec3(gl_FragCoord.xy * frequency, 0.0), vec3(10.0));
    vec2 p = vec2(
        gl_FragCoord.x + amplitude * cos(f1) * f1,
        gl_FragCoord.y + amplitude * sin(f1) * f1);
    return texture2D(tDiffuse, p / vResolution);
}

void main() {
    if (displacement > 0) {
        gl_FragColor = getDisplacement(displacementFrequency, displacementAmplitude);
    } else {
        gl_FragColor = texture2D(tDiffuse, vUv);
    }

    if (zoomBlur > 0) {
        addEffect(getZoomBlur(zoomBlurStrength), zoomBlurMix);
    }
    if (chromaticAberration > 0) {
        addEffect(getChromaticAberration(chromaticAberrationStrength), chromaticAberrationMix);
    }
    if (invert > 0) {
        gl_FragColor = vec4(1.0) - gl_FragColor;
    }
    if (scanline > 0) {
        float scanline = sin(vUv.y * 800.0) * 0.04;
        gl_FragColor -= scanline;
    }
    if (vignette > 0) {
        float d = length(vUv - vec2(0.5, 0.5));
        gl_FragColor *= 1.0 - d * 0.5;
    }

    gl_FragColor.a = 1.0;
}
