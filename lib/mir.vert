varying vec3 vPosition;
varying vec2 vUv;
uniform float time;
uniform float speed;
uniform float frequency;
uniform float amplitude;

void main() {
    vPosition = position;
    vUv = uv;
    float f = amplitude * pnoise(position * frequency + time * speed, vec3(10.0));
    vec4 pos = vec4(position + f * normal, 1.0);
    gl_Position = projectionMatrix * modelViewMatrix * pos;
}
