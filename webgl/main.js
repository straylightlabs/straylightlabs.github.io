var renderer;
var scene;
var camera;
var mesh;
var material;

const MAX_SECONDS = 10.0;
const MAX_FPS = 60.0;
const MIX_METHODS = {
  Exclusive: 0,
  Average: 1,
  Additive: 2,
  Multiplicative: 3,
  Screen: 4,
};

var activeOptions = {
  background: '#ffffff',
  planeWidth: 100.0,
  planeHeight: 100.0,
  planeWidthSegments: 100,
  planeHeightSegments: 100,
  sphere: false,
  sphereRadius: 40.0,
  rotationX: 100.0,
  rotationY: 0.0,
  rotationZ: 0.0,
  scaleX: 1.0,
  scaleY: 1.0,
  scaleZ: 1.0,
  positionX: 0.0,
  positionY: 0.0,
  positionZ: 0.0,
  bumpTime: 0.0,
  bumpNoiseFrequency: 0.02,
  bumpNoiseAmplitude: 5.0,
  bumpNoiseSpeed: 0.5,
  colorTime: 0.0,
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
  hole: false,
  holeInverted: false,
  holeColor: '#ffffff',
  holeCenterU: 0.5,
  holeCenterV: 0.5,
  holeRadius: 0.1,
  holeDepth: 0.2,
  zoomBlur: false,
  zoomBlurStrength: 0.75,
  zoomBlurMix: 0,
  triangleBlur: false,
  triangleBlurStrength: 0.75,
  triangleBlurMix: 0,
  chromaticAberration: false,
  chromaticAberrationStrength: 0.2,
  chromaticAberrationMix: 1,
  hue: 0.0,
  saturation: 0.0,
};
var optionsArray = [];
var stats;
var controls;
var slider;
var gui;

var orthoScene;
var orthoCamera;
var orthoQuad;
var effectTexture;
var effectMaterial;

var time = 0;
var timeInterval;
var lastTime;

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
  setupTimeline();

  stats = new Stats();
  document.body.appendChild(stats.domElement);

  controls = new THREE.OrbitControls(camera, renderer.domElement);

  window.addEventListener("resize", resize, false);
  resize();
  update();
}

function setupGui() {
  gui = new dat.GUI();
  var folder = gui.addFolder("Environment");
  folder.addColor(activeOptions, "background").listen();
  folder = gui.addFolder("Geometry");
  folder.add(activeOptions, "planeWidth", 1.0, 200.0).onChange(resetGeometry);
  folder.add(activeOptions, "planeHeight", 1.0, 200.0).onChange(resetGeometry);
  folder.add(activeOptions, "planeHeightSegments", 1, 200).onChange(resetGeometry);
  folder.add(activeOptions, "planeWidthSegments", 1, 200).onChange(resetGeometry);
  folder.add(activeOptions, "sphere").onFinishChange(resetGeometry);
  folder.add(activeOptions, "sphereRadius", 1.0, 100.0).onChange(resetGeometry);
  folder.add(activeOptions, "rotationX", 0.0, 360.0).listen();
  folder.add(activeOptions, "rotationY", 0.0, 360.0).listen();
  folder.add(activeOptions, "rotationZ", 0.0, 360.0).listen();
  folder.add(activeOptions, "scaleX", 0.1, 10.0).listen();
  folder.add(activeOptions, "scaleY", 0.1, 10.0).listen();
  folder.add(activeOptions, "scaleZ", 0.1, 10.0).listen();
  folder.add(activeOptions, "positionX", -100.0, 100.0).listen();
  folder.add(activeOptions, "positionY", -100.0, 100.0).listen();
  folder.add(activeOptions, "positionZ", -100.0, 100.0).listen();
  folder = gui.addFolder("Bump Noise");
  folder.add(activeOptions, "bumpTime", 0.0, 50.0).listen();
  folder.add(activeOptions, "bumpNoiseFrequency", 0.0, 0.2).listen();
  folder.add(activeOptions, "bumpNoiseAmplitude", 0.0, 30.0).listen();
  folder.add(activeOptions, "bumpNoiseSpeed", 0.0, 10.0).listen();
  folder = gui.addFolder("Material");
  folder.add(activeOptions, "colorTime", 0.0, 50.0).listen();
  folder.add(activeOptions, "redNoiseFrequency", 0.0, 0.1).listen();
  folder.add(activeOptions, "redNoiseAmplitude", 0.0, 5.0).listen();
  folder.add(activeOptions, "redNoiseSpeed", 0.0, 10.0).listen();
  folder.add(activeOptions, "greenNoiseFrequency", 0.0, 0.1).listen();
  folder.add(activeOptions, "greenNoiseAmplitude", 0.0, 5.0).listen();
  folder.add(activeOptions, "greenNoiseSpeed", 0.0, 10.0).listen();
  folder.add(activeOptions, "blueNoiseFrequency", 0.0, 0.1).listen();
  folder.add(activeOptions, "blueNoiseAmplitude", 0.0, 5.0).listen();
  folder.add(activeOptions, "blueNoiseSpeed", 0.0, 10.0).listen();
  folder.add(activeOptions, "whiteNoiseFrequency", 0.0, 0.1).listen();
  folder.add(activeOptions, "whiteNoiseAmplitude", 0.0, 5.0).listen();
  folder.add(activeOptions, "whiteNoiseSpeed", 0.0, 10.0).listen();
  folder.add(activeOptions, "overExposure").listen();
  folder.add(activeOptions, "useImage").listen();
  folder = gui.addFolder("After Effects");
  folder.add(activeOptions, "invert").listen();
  folder.add(activeOptions, "scanline").listen();
  folder.add(activeOptions, "vignette").listen();
  folder.add(activeOptions, "displacement").listen();
  folder.add(activeOptions, "displacementFrequency", 0, 0.01).listen();
  folder.add(activeOptions, "displacementAmplitude", 0, 2000).listen();
  folder.add(activeOptions, "hole").listen();
  folder.add(activeOptions, "holeInverted").listen();
  folder.addColor(activeOptions, "holeColor").listen();
  folder.add(activeOptions, "holeCenterU", 0.0, 1.0).listen();
  folder.add(activeOptions, "holeCenterV", 0.0, 1.0).listen();
  folder.add(activeOptions, "holeRadius", 0.01, 1.0).listen();
  folder.add(activeOptions, "holeDepth", 0.01, 1.0).listen();
  folder.add(activeOptions, "zoomBlur").listen();
  folder.add(activeOptions, "zoomBlurStrength", 0.0, 1.0).listen();
  folder.add(activeOptions, "zoomBlurMix", MIX_METHODS).listen();
  folder.add(activeOptions, "triangleBlur").listen();
  folder.add(activeOptions, "triangleBlurStrength", 0.0, 50.0).listen();
  folder.add(activeOptions, "triangleBlurMix", MIX_METHODS).listen();
  folder.add(activeOptions, "chromaticAberration").listen();
  folder.add(activeOptions, "chromaticAberrationStrength", 0.0, 1.0).listen();
  folder.add(activeOptions, "chromaticAberrationMix", MIX_METHODS).listen();
  folder.add(activeOptions, "hue", -1.0, 1.0).listen();
  folder.add(activeOptions, "saturation", -1.0, 1.0).listen();
}

function setupTimeline() {
  save = $('<span class="ui-icon ui-icon-star"></span>').appendTo($('body'));
  save.css('position', 'absolute');
  save.css('left', 20);
  save.css('bottom', 10);
  save.click(function(e) {
    const tag = new Date().getTime();
    localStorage.setItem(tag, JSON.stringify({
      sliders: slider.limitslider('values'),
      optionsArray: optionsArray,
    }));
    location.hash = '#' + tag;
    save.addClass('disabled');
    setTimeout(function() {
      save.removeClass('disabled');
    }, 2000);
  });

  play = $('<span class="ui-icon ui-icon-play"></span>').appendTo($('body'));
  play.css('position', 'absolute');
  play.css('left', 50);
  play.css('bottom', 10);
  play.click(function(e) {
    if (play.hasClass('ui-icon-play')) {
      play.removeClass('ui-icon-play');
      play.addClass('ui-icon-pause');
      timeInterval = setInterval(function() {
        const currentTime = new Date().getTime() / 1000;
        if (lastTime !== undefined) {
          var nextTime = time + (currentTime - lastTime);
          if (nextTime > MAX_SECONDS) {
            nextTime = 0.0;
          }
          setCurrentTime(nextTime);
        }
        lastTime = currentTime;
      }, 1000 / MAX_FPS);
    } else {
      play.removeClass('ui-icon-pause');
      play.addClass('ui-icon-play');
      clearInterval(timeInterval);
      lastTime = undefined;
    }
  });

  sliderValues = [0];
  if (location.hash) {
    const rawData = localStorage.getItem(location.hash.substr(1));
    if (rawData) {
      const data = JSON.parse(rawData);
      sliderValues = data.sliders;
      time = sliderValues[0] / MAX_FPS;
      optionsArray = data.optionsArray;
    }
  }

  slider = $('<div />').appendTo($('body'));
  slider.css('position', 'absolute');
  slider.css('left', 100);
  slider.css('bottom', 20);
  slider.css('width', 700);
  slider.limitslider({
    values: sliderValues,
    max: MAX_SECONDS * MAX_FPS,
    label: function(value) {
      const index = slider.limitslider('values').slice(1).indexOf(value);
      return index >= 0 ? index : '';
    }
  });

  const clickHandler = function(e) {
    const index = $(this).index();
    console.log(index);
    if (index === 0) {
      return;
    }
    $('.ui-slider-handle').removeClass('active');
    freezeOptions();

    const optionIndex = index - 1;
    $(this).addClass('active');
    activateOptions(optionIndex);

    if (e.altKey) {
      slider.limitslider('remove', index);
      optionsArray.splice(optionIndex, 1);
    }
  };

  $('.ui-slider-handle').first().click(function(e) {
    if (e.shiftKey) {
      const values = slider.limitslider('values');
      if (values.slice(1).indexOf(values[0]) >= 0) {
        // Avoid adding overlapping keyframes.
        return;
      }

      optionsArray.push(getCurrentOptions());
      slider.limitslider('insert', null, values[0]);
      $('.ui-slider-handle').last().click(clickHandler);
    }
  });
  $('.ui-slider-handle').click(clickHandler);

  $(document).mousemove(function(e) {
    const newTime = slider.limitslider('values')[0] / MAX_FPS;
    if (newTime === time) {
      return;
    }
    $('.ui-slider-handle').removeClass('active');
    freezeOptions();
    time = newTime;
  });
}

function copy(src, dest) {
  for (key in src) {
    if (src[key] !== dest[key]) {
      dest[key] = src[key];
    }
  }
  return dest;
}

function freezeOptions() {
  for (var i = 0; i < optionsArray.length; i++) {
    optionsArray[i] = copy(optionsArray[i], {});
  }
}

function activateOptions(index) {
  copy(optionsArray[index], activeOptions);
  optionsArray[index] = activeOptions;
}

function setCurrentTime(t) {
  time = t;
  const values = slider.limitslider('values');
  values[0] = t * MAX_FPS;
  slider.limitslider('option', { values: values });
}

function getCurrentOptions() {
  if (slider === undefined) {
    return activeOptions;
  }
  const keyframes = slider.limitslider('values').slice(1);
  const currentFrame = parseInt(time * MAX_FPS);
  var prevKeyframe;
  var prevKeyframeOptions;
  var nextKeyframe;
  var nextKeyframeOptions;
  keyframes.forEach(function(keyframe, index) {
    if (keyframe < currentFrame && (prevKeyframe === undefined || prevKeyframe < keyframe)) {
      prevKeyframe = keyframe;
      prevKeyframeOptions = optionsArray[index];
    }
    if (keyframe >= currentFrame && (nextKeyframe === undefined || nextKeyframe > keyframe)) {
      nextKeyframe = keyframe;
      nextKeyframeOptions = optionsArray[index];
    }
  });
  if (prevKeyframe === undefined && nextKeyframe === undefined) {
    return activeOptions;
  }
  if (prevKeyframe === undefined) {
    return nextKeyframeOptions;
  }
  if (nextKeyframe === undefined) {
    return prevKeyframeOptions;
  }
  var currentOptions = {};
  for (key in prevKeyframeOptions) {
    var prevValue = prevKeyframeOptions[key];
    var nextValue = nextKeyframeOptions[key];
    currentOptions[key] =
      (typeof prevValue !== 'number')
      ? prevValue
      : prevValue + (nextValue - prevValue) / (nextKeyframe - prevKeyframe) * (currentFrame - prevKeyframe);
  }
  return currentOptions;
}

function resetGeometry() {
  console.info('resetGeometry() called');
  if (mesh) {
    scene.remove(mesh);
  }
  const options = getCurrentOptions();
  if (!options.sphere) {
    mesh = new THREE.Mesh(new THREE.PlaneGeometry(
        options.planeWidth, options.planeHeight, options.planeWidthSegments, options.planeHeightSegments), material);
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
  const options = getCurrentOptions();

  if (!$('.ui-slider-handle').hasClass('active')) {
    copy(options, activeOptions);
  }

  scene.background = new THREE.Color(options.background);

  mesh.rotation.x = options.rotationX / 180 * Math.PI;
  mesh.rotation.y = options.rotationY / 180 * Math.PI;
  mesh.rotation.z = options.rotationZ / 180 * Math.PI;
  mesh.scale.x = options.scaleX;
  mesh.scale.y = options.scaleY;
  mesh.scale.z = options.scaleZ;
  mesh.position.x = options.positionX;
  mesh.position.y = options.positionY;
  mesh.position.z = options.positionZ;

  material.uniforms.time.value = options.bumpTime;
  material.uniforms.speed.value = options.bumpNoiseSpeed;
  material.uniforms.frequency.value = options.bumpNoiseFrequency;
  material.uniforms.amplitude.value = options.bumpNoiseAmplitude;
  material.uniforms.cTime.value = options.colorTime;
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

  // effectMaterial.uniforms.time.value = time;
  effectMaterial.uniforms.displacement.value = options.displacement;
  effectMaterial.uniforms.displacementFrequency.value = options.displacementFrequency;
  effectMaterial.uniforms.displacementAmplitude.value = options.displacementAmplitude;
  effectMaterial.uniforms.hole.value = options.hole;
  effectMaterial.uniforms.holeInverted.value = options.holeInverted;
  effectMaterial.uniforms.holeColor.value = new THREE.Color(options.holeColor);
  effectMaterial.uniforms.holeCenter.value =
      new THREE.Vector2(options.holeCenterU, options.holeCenterV);
  effectMaterial.uniforms.holeRadius.value = options.holeRadius;
  effectMaterial.uniforms.holeDepth.value = options.holeDepth;
  effectMaterial.uniforms.zoomBlur.value = options.zoomBlur;
  effectMaterial.uniforms.zoomBlurStrength.value = options.zoomBlurStrength;
  effectMaterial.uniforms.zoomBlurMix.value = options.zoomBlurMix;
  effectMaterial.uniforms.triangleBlur.value = options.triangleBlur;
  effectMaterial.uniforms.triangleBlurStrength.value = options.triangleBlurStrength;
  effectMaterial.uniforms.triangleBlurMix.value = options.triangleBlurMix;
  effectMaterial.uniforms.chromaticAberration.value = options.chromaticAberration;
  effectMaterial.uniforms.chromaticAberrationStrength.value = options.chromaticAberrationStrength;
  effectMaterial.uniforms.chromaticAberrationMix.value = options.chromaticAberrationMix;
  effectMaterial.uniforms.invert.value = options.invert;
  effectMaterial.uniforms.scanline.value = options.scanline;
  effectMaterial.uniforms.vignette.value = options.vignette;
  effectMaterial.uniforms.hue.value = options.hue;
  effectMaterial.uniforms.saturation.value = options.saturation;

  render();

  stats.update();
  requestAnimationFrame(update);
}

function render() {
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
        tDiffuse: { type: "t", value: textureLoader.load('images/gradient.jpg') },
        time: { type: "f", value: 0.0 },
        speed: { type: "f", value: 0.0 },
        frequency: { type: "f", value: 0.0 },
        amplitude: { type: "f", value: 0.0 },
        cTime: { type: "f", value: 0.0 },
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
        hole: { type: "i", value: 0 },
        holeInverted: { type: "i", value: 0 },
        holeColor: { type: "v3", value: new THREE.Vector3(1, 1, 1) },
        holeCenter: { type: "v2", value: new THREE.Vector2(1, 1) },
        holeRadius: { type: "f", value: 0.0 },
        holeDepth: { type: "f", value: 0.0 },
        zoomBlur: { type: "i", value: 0 },
        zoomBlurStrength: { type: "f", value: 0.0 },
        zoomBlurMix: { type: "i", value: 0 },
        triangleBlur: { type: "i", value: 0 },
        triangleBlurStrength: { type: "f", value: 0.0 },
        triangleBlurMix: { type: "i", value: 0 },
        chromaticAberration: { type: "i", value: 0 },
        chromaticAberrationStrength: { type: "f", value: 0.0 },
        chromaticAberrationMix: { type: "i", value: 0 },
        invert: { type: "i", value: 0 },
        scanline: { type: "i", value: 0 },
        vignette: { type: "i", value: 0 },
        hue: { type: "f", value: 0 },
        saturation: { type: "f", value: 0 },
      },
      vertexShader: twoPassVert[0],
      fragmentShader: pnoise[0] + twoPassFrag[0],
      depthWrite: false,
    });

    init();
  });
});
