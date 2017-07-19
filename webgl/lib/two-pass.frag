varying vec2 vUv;
uniform float time;
uniform sampler2D tDiffuse;
uniform vec2 vResolution;
uniform int displacement;
uniform float displacementFrequency;
uniform float displacementAmplitude;
uniform int hole;
uniform int holeInverted;
uniform vec3 holeColor;
uniform vec2 holeCenter;
uniform float holeRadius;
uniform float holeDepth;
uniform int zoomBlur;
uniform float zoomBlurStrength;
uniform int zoomBlurMix;
uniform int triangleBlur;
uniform float triangleBlurStrength;
uniform int triangleBlurMix;
uniform int chromaticAberration;
uniform float chromaticAberrationStrength;
uniform int chromaticAberrationMix;
uniform int invert;
uniform int scanline;
uniform int vignette;
uniform float hue;
uniform float saturation;

float random(vec3 p, float seed) {
    return fract(sin(dot(p + seed, vec3(12.9898, 78.233, 151.7182))) * 43758.5453 + seed);
}

void addEffect(vec4 color, int mix) {
    if (mix == 0) {
        gl_FragColor = color;
    } else if (mix == 1) {  // average
        gl_FragColor = (gl_FragColor + color) * .5;
    } else if (mix == 2) {  // multiplicative
        gl_FragColor += color;
    } else if (mix == 3) {  // additive
        gl_FragColor *= color;
    } else if (mix == 4) {  // screen
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

vec4 getTriangleBlur(float strength) {
    vec2 delta_x = vec2(strength / vResolution.x, 0.0);
    vec2 delta_y = vec2(0.0, strength / vResolution.y);
    vec4 color = vec4(0.0);
    float total = 0.0;

    // Randomize the lookup values to hide the fixed number of samples.
    float offset = random(vec3(12.9898, 78.233, 151.7182), 0.0);

    for (float t = -30.0; t <= 30.0; t++) {
        float percent = (t + offset - 0.5) / 30.0;
        float weight = 1.0 - abs(percent);
        for (int i = 0; i < 2; i++) {
            vec2 delta = i == 0 ? delta_x : delta_y;
            vec4 sample = texture2D(tDiffuse, vUv + delta * percent);

            // Switch to pre-multiplied alpha to correctly blur transparent images.
            sample.rgb *= sample.a;

            color += sample * weight;
            total += weight;
        }
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

vec4 getHoled(vec2 center, float radius, float depth) {
    float dimension = max(vResolution.x, vResolution.y);
    vec2 uv = vec2(0.5, 0.5) + (gl_FragCoord.xy - vResolution * 0.5) / vec2(dimension);
    float r = (radius - distance(center, uv)) / radius;
    vec2 coord = gl_FragCoord.xy / vResolution;
    if (holeInverted == 0) {
        if (r < 0.0) {
            return vec4(holeColor, 1.0);
        }
        if (r > holeDepth) {
            return texture2D(tDiffuse, coord);
        }
        return texture2D(tDiffuse, coord + (coord - center) * (1.0 - r / holeDepth));
    } else {
        if (r < 0.0) {
            return texture2D(tDiffuse, coord);
        }
        if (r > holeDepth) {
            return vec4(holeColor, 1.0);
        }
        return texture2D(tDiffuse, coord + (center - coord) * r / holeDepth);
    }
}

vec4 adjustHue(vec4 color, float hue) {
    float angle = hue * 3.14159265;
    float s = sin(angle), c = cos(angle);
    vec3 weights = (vec3(2.0 * c, -sqrt(3.0) * s - c, sqrt(3.0) * s - c) + 1.0) / 3.0;
    color.rgb = vec3(
        dot(color.rgb, weights.xyz),
        dot(color.rgb, weights.zxy),
        dot(color.rgb, weights.yzx)
        );
    return color;
}

vec4 adjustSaturation(vec4 color, float saturation) {
  float average = (color.r + color.g + color.b) / 3.0;
  if (saturation > 0.0) {
    color.rgb += (average - color.rgb) * (1.0 - 1.0 / (1.001 - saturation));
  } else {
    color.rgb += (average - color.rgb) * (-saturation);
  }
  return color;
}

void main() {
    if (displacement > 0) {
        gl_FragColor = getDisplacement(displacementFrequency, displacementAmplitude);
    } else if (hole > 0) {
        gl_FragColor = getHoled(holeCenter, holeRadius, holeDepth);
    } else {
        gl_FragColor = texture2D(tDiffuse, vUv);
    }

    if (zoomBlur > 0) {
        addEffect(getZoomBlur(zoomBlurStrength), zoomBlurMix);
    }
    if (triangleBlur > 0) {
        addEffect(getTriangleBlur(triangleBlurStrength), triangleBlurMix);
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
    if (hue != 0.0) {
        gl_FragColor = adjustHue(gl_FragColor, hue);
    }
    if (saturation != 0.0) {
        gl_FragColor = adjustSaturation(gl_FragColor, saturation);
    }

    gl_FragColor.a = 1.0;
}
