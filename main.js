var renderer;
var scene;
var camera;
var mesh;
var material;

const MIX_METHODS = {
  Average: 0,
  Additive: 1,
  Multiplicative: 2,
  Screen: 3,
};

var options = {
  background: '#000000',
  stopTime: false,
  planeWidth: 100.0,
  planeHeight: 100.0,
  planeWidthSegments: 100,
  planeHeightSegments: 100,
  sphere: false,
  sphereRadius: 40.0,
  bumpNoiseFrequency: 0.02,
  bumpNoiseAmplitude: 5.0,
  bumpNoiseSpeed: 0.5,
  redNoiseFrequency: 0.015,
  redNoiseAmplitude: 1.0,
  redNoiseSpeed: 0.375,
  greenNoiseFrequency: 0.016,
  greenNoiseAmplitude: 1.0,
  greenNoiseSpeed: 0.4,
  blueNoiseFrequency: 0.018,
  blueNoiseAmplitude: 1.0,
  blueNoiseSpeed: 0.45,
  whiteNoiseFrequency: 0.03,
  whiteNoiseAmplitude: 1.0,
  whiteNoiseSpeed: 0.75,
  overExposure: false,
  useImage: true,
  invert: false,
  scanline: false,
  vignette: false,
  displacement: false,
  displacementFrequency: 0.005,
  displacementAmplitude: 300,
  zoomBlur: false,
  zoomBlurStrength: 0.75,
  zoomBlurMix: 3,
  chromaticAberration: false,
  chromaticAberrationStrength: 0.2,
  chromaticAberrationMix: 1,
};
var stats;
var controls;

var orthoScene;
var orthoCamera;
var orthoQuad;
var effectTexture;
var effectMaterial;

var start = Date.now();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color('#000000');

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
  camera.position.z = 100;
  camera.target = new THREE.Vector3(0, 0, 0);
  scene.add(camera);

  resetGeometry();

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.autoClear = false;
  document.body.appendChild(renderer.domElement);

  orthoScene = new THREE.Scene();
  orthoCamera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, .00001, 1000);
  orthoQuad = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), effectMaterial);
  orthoScene.add(orthoQuad);

  effectTexture = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBFormat,
  });

  setupGui();

  stats = new Stats();
  document.body.appendChild(stats.domElement);

  controls = new THREE.OrbitControls(camera, renderer.domElement);

  window.addEventListener("resize", resize, false);
  resize();
  update();
}

function setupGui() {
  var gui = new dat.GUI();
  var folder = gui.addFolder("Environment");
  folder.addColor(options, "background").onChange(function(color) {
    scene.background = new THREE.Color(color);
  });
  folder.add(options, "stopTime");
  folder = gui.addFolder("Geometry");
  folder.add(options, "planeWidth", 1.0, 200.0).onChange(resetGeometry);
  folder.add(options, "planeHeight", 1.0, 200.0).onChange(resetGeometry);
  folder.add(options, "planeHeightSegments", 1, 200).onChange(resetGeometry);
  folder.add(options, "planeWidthSegments", 1, 200).onChange(resetGeometry);
  folder.add(options, "sphere").onFinishChange(resetGeometry);
  folder.add(options, "sphereRadius", 1.0, 100.0).onChange(resetGeometry);
  folder = gui.addFolder("Bump Noise");
  folder.add(options, "bumpNoiseFrequency", 0.0, 0.2);
  folder.add(options, "bumpNoiseAmplitude", 0.0, 30.0);
  folder.add(options, "bumpNoiseSpeed", 0.0, 10.0);
  folder = gui.addFolder("Material");
  folder.add(options, "redNoiseFrequency", 0.0, 0.1);
  folder.add(options, "redNoiseAmplitude", 0.0, 5.0);
  folder.add(options, "redNoiseSpeed", 0.0, 10.0);
  folder.add(options, "greenNoiseFrequency", 0.0, 0.1);
  folder.add(options, "greenNoiseAmplitude", 0.0, 5.0);
  folder.add(options, "greenNoiseSpeed", 0.0, 10.0);
  folder.add(options, "blueNoiseFrequency", 0.0, 0.1);
  folder.add(options, "blueNoiseAmplitude", 0.0, 5.0);
  folder.add(options, "blueNoiseSpeed", 0.0, 10.0);
  folder.add(options, "whiteNoiseFrequency", 0.0, 0.1);
  folder.add(options, "whiteNoiseAmplitude", 0.0, 5.0);
  folder.add(options, "whiteNoiseSpeed", 0.0, 10.0);
  folder.add(options, "overExposure");
  folder.add(options, "useImage");
  folder = gui.addFolder("After Effects");
  folder.add(options, "invert");
  folder.add(options, "scanline");
  folder.add(options, "vignette");
  folder.add(options, "displacement");
  folder.add(options, "displacementFrequency", 0, 0.01);
  folder.add(options, "displacementAmplitude", 0, 2000);
  folder.add(options, "zoomBlur");
  folder.add(options, "zoomBlurStrength", 0.0, 1.0);
  folder.add(options, "zoomBlurMix", MIX_METHODS);
  folder.add(options, "chromaticAberration");
  folder.add(options, "chromaticAberrationStrength", 0.0, 1.0);
  folder.add(options, "chromaticAberrationMix", MIX_METHODS);
  gui.remember(options);
}

function resetGeometry() {
  if (mesh) {
    scene.remove(mesh);
  }
  if (!options.sphere) {
    mesh = new THREE.Mesh(new THREE.PlaneGeometry(
        options.planeWidth, options.planeHeight, options.planeWidthSegments, options.planeHeightSegments), material);
    mesh.rotation.x = Math.PI / 1.8;
    scene.add(mesh);
  } else {
    mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(
        options.sphereRadius, 5), material);
    scene.add(mesh);
  }
}

function resize() {
  var w = window.innerWidth;
  var h = window.innerHeight;

  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();

  var ww = w * window.devicePixelRatio;
  var hh = h * window.devicePixelRatio;
  effectTexture.setSize(ww, hh);
  effectMaterial.uniforms.vResolution.value = new THREE.Vector2(ww, hh);

  orthoCamera.left   = - w / 2;
  orthoCamera.right  =   w / 2;
  orthoCamera.top    =   h / 2;
  orthoCamera.bottom = - h / 2;
  orthoCamera.updateProjectionMatrix();

  orthoQuad.scale.set(w, h, 1);
}

function update() {
  const time = .00025 * (Date.now() - start);
  material.uniforms.time.value = time;
  material.uniforms.speed.value = options.bumpNoiseSpeed;
  material.uniforms.frequency.value = options.bumpNoiseFrequency;
  material.uniforms.amplitude.value = options.bumpNoiseAmplitude;
  material.uniforms.rSpeed.value = options.redNoiseSpeed;
  material.uniforms.rFrequnecy.value = options.redNoiseFrequency;
  material.uniforms.rAmplitude.value = options.redNoiseAmplitude;
  material.uniforms.gSpeed.value = options.greenNoiseSpeed;
  material.uniforms.gFrequnecy.value = options.greenNoiseFrequency;
  material.uniforms.gAmplitude.value = options.greenNoiseAmplitude;
  material.uniforms.bSpeed.value = options.blueNoiseSpeed;
  material.uniforms.bFrequnecy.value = options.blueNoiseFrequency;
  material.uniforms.bAmplitude.value = options.blueNoiseAmplitude;
  material.uniforms.wSpeed.value = options.whiteNoiseSpeed;
  material.uniforms.wFrequnecy.value = options.whiteNoiseFrequency;
  material.uniforms.wAmplitude.value = options.whiteNoiseAmplitude;
  material.uniforms.wOverExposed.value = options.overExposure;
  material.uniforms.useImage.value = options.useImage;

  effectMaterial.uniforms.time.value = time;
  effectMaterial.uniforms.displacement.value = options.displacement;
  effectMaterial.uniforms.displacementFrequency.value = options.displacementFrequency;
  effectMaterial.uniforms.displacementAmplitude.value = options.displacementAmplitude;
  effectMaterial.uniforms.zoomBlur.value = options.zoomBlur;
  effectMaterial.uniforms.zoomBlurStrength.value = options.zoomBlurStrength;
  effectMaterial.uniforms.zoomBlurMix.value = options.zoomBlurMix;
  effectMaterial.uniforms.chromaticAberration.value = options.chromaticAberration;
  effectMaterial.uniforms.chromaticAberrationStrength.value = options.chromaticAberrationStrength;
  effectMaterial.uniforms.chromaticAberrationMix.value = options.chromaticAberrationMix;
  effectMaterial.uniforms.invert.value = options.invert;
  effectMaterial.uniforms.scanline.value = options.scanline;
  effectMaterial.uniforms.vignette.value = options.vignette;

  render();

  stats.update();
  requestAnimationFrame(update);
}

function render() {
  if (!options.zoomBlur &&
      !options.chromaticAberration &&
      !options.invert &&
      !options.scanline &&
      !options.vignette &&
      !options.displacement) {
    renderer.render(scene, camera);
    return;
  }

  renderer.render(scene, camera, effectTexture, true);
  orthoQuad.material.uniforms.tDiffuse.value = effectTexture.texture;
  renderer.render(orthoScene, orthoCamera);
}

$(function() {
  $.when(
      $.get({ url: "lib/pnoise.glsl", cache: false }),
      $.get({ url: "lib/mir.vert", cache: false }),
      $.get({ url: "lib/mir.frag", cache: false }),
      $.get({ url: "lib/two-pass.vert", cache: false }),
      $.get({ url: "lib/two-pass.frag", cache: false })
  ).done(function(
      pnoise,
      mirVert,
      mirFrag,
      twoPassVert,
      twoPassFrag) {
    var textureLoader = new THREE.TextureLoader();
    material = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { type: "t", value: textureLoader.load('images/gradient.png') },
        time: { type: "f", value: 0.0 },
        speed: { type: "f", value: 0.0 },
        frequency: { type: "f", value: 0.0 },
        amplitude: { type: "f", value: 0.0 },
        rSpeed: { type: "f", value: 0.0 },
        rFrequnecy: { type: "f", value: 0.0 },
        rAmplitude: { type: "f", value: 0.0 },
        gSpeed: { type: "f", value: 0.0 },
        gFrequnecy: { type: "f", value: 0.0 },
        gAmplitude: { type: "f", value: 0.0 },
        bSpeed: { type: "f", value: 0.0 },
        bFrequnecy: { type: "f", value: 0.0 },
        bAmplitude: { type: "f", value: 0.0 },
        wSpeed: { type: "f", value: 0.0 } ,
        wFrequnecy: { type: "f", value: 0.0 },
        wAmplitude: { type: "f", value: 0.0 },
        wOverExposed: { type: "i", value: 0 },
        useImage: { type: "i", value: 0 },
      },
      vertexShader: pnoise[0] + mirVert[0],
      fragmentShader: pnoise[0] + mirFrag[0],
      side: THREE.DoubleSide,
    });

    effectMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { type: "t", value: 0 },
        time: { type: "f", value: 0.0 },
        vResolution: { type: "v2", value: new THREE.Vector2(1, 1) },
        displacement: { type: "i", value: 0 },
        displacementFrequency: { type: "f", value: 0.0 },
        displacementAmplitude: { type: "f", value: 0 },
        zoomBlur: { type: "i", value: 0 },
        zoomBlurStrength: { type: "f", value: 0.0 },
        zoomBlurMix: { type: "i", value: 0 },
        chromaticAberration: { type: "i", value: 0 },
        chromaticAberrationStrength: { type: "f", value: 0.0 },
        chromaticAberrationMix: { type: "i", value: 0 },
        invert: { type: "i", value: 0 },
        scanline: { type: "i", value: 0 },
        vignette: { type: "i", value: 0 },
      },
      vertexShader: twoPassVert[0],
      fragmentShader: pnoise[0] + twoPassFrag[0],
      depthWrite: false,
    });

    init();
  });
});
