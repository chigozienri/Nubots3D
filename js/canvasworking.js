var play = false;
var pan = true;

var polyfill = new WebVRPolyfill();
console.log("Using webvr-polyfill version " + WebVRPolyfill.version);
var renderer = new THREE.WebGLRenderer();
renderer.setClearColor (0x888888, 1);

var canvas_width;
var canvas_height;
var aspect;
function setcanvassize () {
	// Make canvas appropriate size for fullscreen or not
	if (document.webkitFullscreenElement) {
		canvas_width = screen.width;
		canvas_height = screen.height;

	} else {
		canvas_width = window.innerWidth;
		canvas_height = 350;
	}

	aspect =  canvas_width / canvas_height;
	renderer.setSize(canvas_width, canvas_height);
}

setcanvassize();
// Append the canvas element created by the renderer to document body element.
var canvasdiv = document.getElementById("canvas_div")
var canvas = renderer.domElement;
canvasdiv.appendChild(canvas);
canvas.setAttribute("tabindex", 0);

//UI
var buttondiv = document.getElementById("buttons_div");

var fullscreen = document.createElement("input");
fullscreen.setAttribute("type", "button");
fullscreen.setAttribute("name", "fullscreen");
fullscreen.setAttribute("value", "Enter Fullscreen");
buttondiv.appendChild(fullscreen);

var vr = document.createElement("input");
vr.setAttribute("type", "button");
vr.setAttribute("name", "vr");
vr.setAttribute("value", "Enter VR");
buttondiv.appendChild(vr);

var next = document.createElement("input");
next.setAttribute("type", "button");
next.setAttribute("name", "next");
next.setAttribute("value", "Next Step");
buttondiv.appendChild(next);

var playbutton = document.createElement("input");
playbutton.setAttribute("type", "button");
playbutton.setAttribute("name", "play");
playbutton.setAttribute("value", "Play");
buttondiv.appendChild(playbutton);

var tiltpanbutton = document.createElement("input");
tiltpanbutton.setAttribute("type", "button");
tiltpanbutton.setAttribute("name", "tiltpan");
tiltpanbutton.setAttribute("value", "PAN + ZOOM / tilt");
buttondiv.appendChild(tiltpanbutton);

var view2d = document.createElement("input");
view2d.setAttribute("type", "button");
view2d.setAttribute("name", "view2d");
view2d.setAttribute("value", "Snap to 2D view");
buttondiv.appendChild(view2d);

// Framerate display
var frameratedisplay = document.createElement("input");
buttondiv.appendChild(frameratedisplay);

// Rules input boxes

var rulesdiv = document.getElementById("rules_div");

var rulesuploaddiv = document.createElement("div");
rulesuploaddiv.innerHTML = 'Upload .rules file: ';
let fileinput = document.createElement("input");
fileinput.setAttribute("type", "file");
rulesuploaddiv.appendChild(fileinput);
rulesdiv.appendChild(rulesuploaddiv);

var rulesdownloaddiv = document.createElement("div");
rulesdownloaddiv.innerHTML = "Download .rules file: ";
let filedownload = document.createElement("input");
filedownload.setAttribute("type", "button");
filedownload.setAttribute("value", "Download");
rulesdownloaddiv.appendChild(filedownload);
rulesdiv.appendChild(rulesdownloaddiv);

var examplesdropdown = document.createElement("ul");
examplesdropdown.setAttribute("type", "dropdown");
examplesdropdown.innerHTML = "Examples:";
let examples = {'Default': 'default.rules', 'Sierpinski': 'sierpinski.rules',
'Waving Arm': 'wavingarm.rules', 'Square to Triangle': 'SquaretoTriangle2.rules',
 'River Crossing': 'rivercrossing.rules'};
for (exampleprettyname in examples) {
	let example = document.createElement("li");
	let examplea = document.createElement("a");
	examplea.setAttribute("href", "#");
	examplea.innerHTML= exampleprettyname;
	example.appendChild(examplea);
	let url = 'rules/' + examples[exampleprettyname];
	examplea.addEventListener('click', e => rulesfromurl(url));
	examplesdropdown.appendChild(example);
}
// TODO: Maybe add autoscan directory for new example files?

rulesuploaddiv.appendChild(examplesdropdown);

function inputbox (name_) {
	let boxdiv = document.createElement("div");
	boxdiv.setAttribute("id", "inputbox");
	boxdiv.innerHTML = name_ + '<br />\n';
	let box = document.createElement("textarea");
	box.setAttribute("type", "textarea");
	box.setAttribute("rows", "10");
	box.setAttribute("cols", "20");
	boxdiv.appendChild(box);
	rulesdiv.appendChild(boxdiv);
	return box;
}
var statesbox = inputbox('States');
var bondsbox = inputbox('Bonds');
var rulesbox = inputbox('Rules');
var aliasbox = inputbox('Aliases');

var submitrules = document.createElement("input");
submitrules.setAttribute("type", "submit");
rulesdiv.appendChild(submitrules);

var legacycheckboxdiv = document.createElement("div");
legacycheckboxdiv.innerHTML = 'Legacy format rules?';
var legacycheckbox = document.createElement("input");
legacycheckbox.setAttribute("type", "checkbox");
legacycheckbox.setAttribute("checked", "true");
legacycheckboxdiv.appendChild(legacycheckbox);
rulesdiv.appendChild(legacycheckboxdiv);

// TODO
// function readRules() {
// 	console.log(rulesbox.value);
//   return rulesbox;
// }
function submitRules() {
		nodematerials = {};
		interpret_states(statesbox.value);
		interpret_bonds(bondsbox.value);
		interpret_aliases(aliasbox.value);
		interpret_rules(rulesbox.value);
}

function load_rules_from_file(file_) {
	console.log(file_);
	let re = /[\r?\n]/gi
  let arrayoflines = file_.split(re);
	console.log(arrayoflines);
  let phase;
  let rule;

	let states = '';
	let bonds = '';
	let rules = '';
	let aliases = '';

  for (line of arrayoflines) {
    if (line == "States:") {
      phase = 'states';
    } else if (line == "Bonds:") {
      phase = 'bonds';
    } else if (line == "Rules:") {
      phase = 'rules';
    } else if (line == "Aliases:") {
      phase = 'aliases';
    } else {
      if (phase == 'states') {
				states += (line + '\n');
			} else if (phase == 'bonds') {
				bonds += (line + '\n');
			} else if (phase == 'rules') {
				rules += (line + '\n');
			} else if (phase == 'aliases') {
				aliases += (line + '\n');
			}
		statesbox.value = states;
		bondsbox.value = bonds;
		rulesbox.value = rules;
		if (aliases.length > 0) {
			aliasbox.value = aliases;
		}

    }
  }
}

function rulesfromurl(url_) {

	let reader = new FileReader();
	reader.onload = function (e) {
		load_rules_from_file(e.target.result);
		submitRules();
	}

  // read text from URL location
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url_, true);
	xhr.responseType = "blob";
	xhr.onload = function() {
		console.log(xhr.response)
		return reader.readAsText(xhr.response);
	}
	xhr.send(null);
}

function fileUpload(evt) {
	let file = evt.target.files[0]; // FileList object
	// console.log(file);
	let reader = new FileReader();
	reader.onload = function (e) {
		load_rules_from_file(e.target.result);
		submitRules();
	}
	reader.readAsText(file);
}

function fileDownload(evt) {
	let rulesfile = createrulesfile();
	console.log(rulesfile);
	evt.preventDefault();
	saveAs(
		  new Blob(
			  [rulesfile]
			, {type: "text/plain;charset=utf-8"}
		)
		, "rules.rules"
	);
}

// Create a three.js scene.
var scene = new THREE.Scene();

// Create a three.js camera.
var fov = 40;
var near = 1;
var far = 100;

// perspectivecamera
// var camera =  new THREE.PerspectiveCamera(fov, aspect, near, far + 1);
// camera.position.x = 0;
// camera.position.y = 0;
// camera.position.z = 5;
var frustumSize = 1000;
// var camera = new THREE.OrthographicCamera(
//     window.innerWidth / -2, // frustum left plane
//     window.innerWidth / 2, // frustum right plane.
//     window.innerHeight / 2, // frustum top plane.
//     window.innerHeight / -2, // frustum bottom plane.
//     near, // frustum near plane.
//     far // frustum far plane.
// );

// orthographic camera
var DZOOM;
var OX;
var OY;
var camera = new THREE.OrthographicCamera(
	-DZOOM*aspect, // frustum left plane
	DZOOM*aspect, // frustum right plane
	DZOOM, // frustum top plane
	-DZOOM, // frustum bottom plane
	-1000, // frustum near plane
	1000 // frustum far plane
	)
function resetcamera() {
	// set the camera position (center)
	OX = 2.5;
	OY = 0;
	DZOOM = 3;
	camera.left = -DZOOM*aspect, // frustum left plane
	camera.right = DZOOM*aspect, // frustum right plane
	camera.top = DZOOM, // frustum top plane
	camera.bottom = -DZOOM, // frustum bottom plane
	camera.near = -1000, // frustum near plane
	camera.far = 1000, // frustum far plane
	camera.position.set(OX,OY,20);
	camera.up = new THREE.Vector3(0,1,0);
	camera.lookAt(new THREE.Vector3(OX,OY,0));
	camera.updateProjectionMatrix();
	return renderer.render(scene, camera);
}
resetcamera();
// pan and zoom
var view = d3.select(renderer.domElement);
//define a zoom behavior
var zoom = d3.behavior.zoom().on('zoom', function() {
    let x, y, z, _ref;
    z = zoom.scale();
    _ref = zoom.translate(), x = _ref[0], y = _ref[1];
    return window.requestAnimationFrame(function() {
			if (pan) {
	      camera.left = -DZOOM / z * aspect - x / canvas_width * DZOOM / z * 2 * aspect;
	      camera.right = DZOOM / z * aspect - x / canvas_width * DZOOM / z * 2 * aspect;
	      camera.top = DZOOM / z + y / canvas_height * DZOOM / z * 2;
	      camera.bottom = -DZOOM / z + y / canvas_height * DZOOM / z * 2;
	      camera.updateProjectionMatrix();
	      return renderer.render(scene, camera);
			}
		});
  });
view.call(zoom);

// Add light
var ambientLight = new THREE.AmbientLight( 0xffffff ); // soft white light
scene.add( ambientLight );
// var directionalLight = new THREE.DirectionalLight( 0xffffbb, 0.5 );
// directionalLight.position.set(1, 0.5, 0.5);
// scene.add( directionalLight );

// Check which object mouse is hovering over
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();

// Add outline ability

var composer = new THREE.EffectComposer( renderer );
var renderPass = new THREE.RenderPass( scene, camera );
composer.addPass( renderPass );
var outlinePass = new THREE.OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
composer.addPass( outlinePass );

function onMouseMove( event ) {

	// calculate mouse position in normalized device coordinates
	// (-1 to +1) for both components

	mouse.x = ( event.clientX / canvas_width ) * 2 - 1;
	mouse.y = - ( event.clientY / canvas_height ) * 2 + 1;
  // console.log(mouse.y);
}
window.addEventListener( 'mousemove', onMouseMove, false );

function onKeyPress ( event ) {
	if (event.key === ' ') {
		nextstep();
	}
}
canvas.addEventListener("keydown", onKeyPress, false);

// Create a reticle
var reticle = new THREE.Mesh(
  new THREE.RingBufferGeometry(0.005, 0.01, 15),
  new THREE.MeshBasicMaterial({ color: 0xffffff })
);
reticle.position.z = -1;
camera.add(reticle);
scene.add(camera);

// Create an axis
var linematerial = new THREE.LineBasicMaterial( { color: 0xff0000 } );
var geometry = new THREE.Geometry();
geometry.vertices.push(new THREE.Vector3( 0, 0, 0) );
geometry.vertices.push(new THREE.Vector3( 1, 0, 0) );
var line = new THREE.Line( geometry, linematerial );
scene.add(line);
var linematerial = new THREE.LineBasicMaterial( { color: 0x00ff00 } );
var geometry = new THREE.Geometry();
geometry.vertices.push(new THREE.Vector3( 0, 0, 0) );
geometry.vertices.push(new THREE.Vector3( 0, 1, 0) );
var line = new THREE.Line( geometry, linematerial );
scene.add(line);
var linematerial = new THREE.LineBasicMaterial( { color: 0x0000ff } );
var geometry = new THREE.Geometry();
geometry.vertices.push(new THREE.Vector3( 0, 0, 0) );
geometry.vertices.push(new THREE.Vector3( 0, 0, 1) );
var line = new THREE.Line( geometry, linematerial );
scene.add(line);


// Apply VR stereo rendering to renderer.
var effect = new THREE.VREffect(renderer);
effect.setSize(canvas.clientWidth, canvas.clientHeight, false);
var vrDisplay, controls;


// var geometry = new THREE.SphereGeometry( 0.05, 0.05, 0.05 );
// var material = new THREE.MeshNormalMaterial();
// var sphere = new THREE.Mesh( geometry, material );
// sphere.position.z = -1;
// scene.add( sphere );

// The polyfill provides this in the event this browser
// does not support WebVR 1.1
navigator.getVRDisplays().then(function (vrDisplays) {
  // If we have a native display, or we have a CardboardVRDisplay
  // from the polyfill, use it
  if (vrDisplays.length) {
    vrDisplay = vrDisplays[0];
    // Apply VR headset positional data to camera.
    controls = new THREE.VRControls(camera);
    // Kick off the render loop.
    vrDisplay.requestAnimationFrame(animate);
  }
  // Otherwise, we're on a desktop environment with no native
  // displays, so provide controls for a monoscopic desktop view
  else {
    controls = new THREE.OrbitControls(camera);
		controls.enabled = false;
    // controls.target.set(0, 0, -1);
    // Disable the "Enter VR" button
    vr.disabled = true;
    // Kick off the render loop.
    requestAnimationFrame(animate);
  }
});

// hoverContainer = new THREE.Object3D()
// scene.add(hoverContainer);

function sortIntersectsByDistanceToRay(intersects) {
  return _.sortBy(intersects, "distanceToRay");
}

// Request animation frame loop function
var lastRender = 0;
function animate(timestamp) {
  var delta = Math.min(timestamp - lastRender, 500);
  lastRender = timestamp;
	var framerate = 1000/delta;
	// console.log(framerate);
	frameratedisplay.setAttribute("value", parseFloat(framerate.toFixed(2)) + ' fps');
  // Update VR headset position and apply to camera.
  // controls.update();
  // Render the scene.
  effect.render(scene, camera);
	// composer.render(scene, camera);
  // Keep looping; if using a VRDisplay, call its requestAnimationFrame,
  // otherwise call window.requestAnimationFrame.
	if (play == true) {
		nextstep();
	}
	// Delete anything marked for deletion in scene
	scene.children.slice().forEach(function (child) {
		if (child.userData.delete) {
			scene.remove(child);
		}
	});

	setcanvassize(); // Make canvas appropriate size for fullscreen or not

  if (vrDisplay) {
    vrDisplay.requestAnimationFrame(animate);
  } else {
    requestAnimationFrame(animate);
  }

  // check for mouse hover over objects
  // update the picking ray with the camera and mouse position
	raycaster.setFromCamera( mouse, camera );

	// calculate objects intersecting the picking ray
	var intersects = raycaster.intersectObjects( scene.children );

  // First element in sorted_intersects is closest to camera
  if (intersects[0]) {
    let sorted_intersects = sortIntersectsByDistanceToRay(intersects);
    let intersect = sorted_intersects[0];
    if(intersect.object.userData.node) {
      highlightNode(intersect.object.userData.node) ;
    }
  }
  else {
    removeHighlights();
  }


  // on each frame, if there are nodes for which the model hasn't been added to the scene yet, add them to the scene.
  for (let node of nodes) {
    if (! node.model) {
      node.show();
    }
  }
  // same for edges
  for (let edge of edges) {
    if (! edge.model) {
      edge.show();
    }
  }
}
function onResize() {
  // The delay ensures the browser has a chance to layout
  // the page and update the clientWidth/clientHeight.
  // This problem particularly crops up under iOS.
  if (!onResize.resizeDelay) {
    onResize.resizeDelay = setTimeout(function () {
    //   onResize.resizeDelay = null;
    //   console.log('Resizing to %s x %s.', canvas.clientWidth, canvas.clientHeight);
    //   effect.setSize(canvas.clientWidth, canvas.clientHeight, false);
    //   camera.aspect = aspect;
    //   camera.updateProjectionMatrix();
			window.requestAnimationFrame(setcanvassize);
    }, 250);
  }
}
function onVRDisplayPresentChange() {
  console.log('onVRDisplayPresentChange');
  onResize();
  buttons.hidden = vrDisplay.isPresenting;
}
function onVRDisplayConnect(e) {
  console.log('onVRDisplayConnect', (e.display || (e.detail && e.detail.display)));
}
//Submit default rules when we load window
window.addEventListener('load', function() {
	rulesfromurl('rules/rivercrossing.rules');
	submitRules();
});

// Resize the WebGL canvas when we resize and also when we change modes.
window.addEventListener('resize', onResize);
window.addEventListener('vrdisplaypresentchange', onVRDisplayPresentChange);
window.addEventListener('vrdisplayconnect', onVRDisplayConnect);
// Button click handlers.
fullscreen.addEventListener('click', e => enterFullscreen(renderer.domElement));
vr.addEventListener('click', e => vrDisplay.requestPresent([{source: renderer.domElement}]));
next.addEventListener('click', nextstep);
playbutton.addEventListener('click', function(e) {
	play = ! play;
	if (play == true) {
		playbutton.setAttribute("value", "Pause");
	} else {
		playbutton.setAttribute("value", "Play");
	}
});
tiltpanbutton.addEventListener('click', function(e) {
	pan = ! pan;
	controls.enabled = ! pan;
	if (pan == true) {
		tiltpanbutton.setAttribute("value", "PAN + ZOOM / tilt");
	} else {
		tiltpanbutton.setAttribute("value", "pan + zoom / TILT");
	}
});
view2d.addEventListener('click', function(e) {
	camera.position.set(OX,OY,20);
	camera.up = new THREE.Vector3(0,1,0);
	camera.lookAt(new THREE.Vector3(OX,OY,0));
});
submitrules.addEventListener('click', submitRules);
fileinput.addEventListener('change', fileUpload, false);
filedownload.addEventListener('click', fileDownload, false);


function enterFullscreen (el) {
  if (el.requestFullscreen) {
    el.requestFullscreen();
  } else if (el.mozRequestFullScreen) {
    el.mozRequestFullScreen();
  } else if (el.webkitRequestFullscreen) {
    el.webkitRequestFullscreen();
  } else if (el.msRequestFullscreen) {
    el.msRequestFullscreen();
  }
}
function updatestates () {
	let states = '';
	for (node of nodes) {
		let state = node.pos.x.toString() + ' ' + node.pos.y.toString() + ' ' + node.pos.z.toString() + ' ' + node.state;
		states += state + '\n'
	}
	statesbox.value = states;
	return states
}
function updatebonds() {
	let bonds = '';
	for (edge of edges) {
		let bond =
			edge.node1.pos.x.toString() + ' ' +
 			edge.node1.pos.y.toString() + ' ' +
			edge.node1.pos.z.toString() + ' ' +
			edge.node2.pos.x.toString() + ' ' +
			edge.node2.pos.y.toString() + ' ' +
			edge.node2.pos.z.toString() + ' ' +
			edge.type;
		bonds += bond + '\n'
	}
	bondsbox.value = bonds
	return bonds;
}
function createrulesfile() {
	let states = updatestates();
	let bonds = updatebonds();
	let rulesfile = '';
	rulesfile += 'States:\n';
	rulesfile += states;
	rulesfile += 'Bonds:\n';
	rulesfile += bonds;
	rulesfile += 'Rules:\n';
	rulesfile += rulesbox.value + '\n';
	rulesfile += 'Aliases:\n'
	rulesfile += aliasbox.value + '\n';
	return rulesfile;
}
function nextstep () {
	console.log("increment step");
	let applied = false;
	let attempts = 0;
	while (! applied) {
		attempts += 1;
		console.log('=================================');
		console.log('Attempt ' + (attempts).toString());
		n = Math.floor(Math.random()*nodes.length);
		applied = nodes[n].apply_random_rule();
		if (attempts >= 50) {
			console.log ('Tried 50 times with no successes');
			break;
		}
	}
	// rule_applied = false
	// while (! rule_applied) {
	// 	n = Math.floor(Math.random()*nodes.length);
	// 	rule_applied = nodes[n].apply_rule();
	// 	console.log(rule_applied);
	// }
}
