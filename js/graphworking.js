var spheregeometry = new THREE.BoxGeometry( 1, 1, 1, 10, 10, 10 );
// morph box into a sphere
for ( var i = 0; i < spheregeometry.vertices.length; i ++ ) {

    spheregeometry.vertices[ i ].normalize().multiplyScalar(0.45); // or whatever size you want

}
var outlinegeometry = new THREE.SphereGeometry( 0.5, 0.5, 0.5 );
var nodematerials = {};
var rules = [];

var colorlist = ['#8dd3c7','#ffffb3','#bebada','#fb8072','#80b1d3','#fdb462','#b3de69','#fccde5','#d9d9d9','#bc80bd','#ccebc5','#ffed6f'];
function newnodematerial(state_) {
  if (! nodematerials[state_]) {
    nodematerials[state_] = new THREE.MeshStandardMaterial();
    let nodematerialslength = Object.keys(nodematerials).length;
    if (nodematerialslength < colorlist.length) {
      nodematerials[state_].color.set(colorlist[nodematerialslength]);
    } else {
      nodematerials[state_].color.set('rgb('+Math.floor(Math.random()*256).toString()+','+Math.floor(Math.random()*256).toString()+','+Math.floor(Math.random()*256).toString()+')');
    }
    nodematerials[state_].metalness = 0;

    // never let lightness be less than 0.5
    let hsl;
    let offset = 0.5 - nodematerials["A"].color.getHSL(hsl)['l'];
    if (offset > 0) {
      nodematerials[state_].color.offsetHSL(0,0,offset);
    }
    //create image
    var bitmap = document.createElement('canvas');
    var g = bitmap.getContext('2d');
    bitmap.width = 128;
    bitmap.height = 128;
    let base_size = 80;
    let actual_size = base_size/state_.length;
    g.font = 'Bold '+actual_size.toString()+'px Arial';

    g.fillStyle = 'white';
    g.fillRect(0, 0, bitmap.width, bitmap.height);

    g.fillStyle = 'black';
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(state_, bitmap.width / 2, bitmap.height / 2);

    // canvas contents will be used for a texture
    var texture = new THREE.Texture(bitmap)
    texture.needsUpdate = true;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( 1, 1 );

    nodematerials[state_].map = texture;
  } else {
    console.log('state already exists in nodematerials')
  }
}
// newnodematerial('A');

function new_rule(state1_i_, state2_i_, type_i_, dir_i_, state1_f_, state2_f_, type_f_, dir_f_) {
  console.log("New rule");
  dir_f_ = dir_f_.normalize();
  let rule = {}
  argnames = ["state1_i", "state2_i", "type_i", "dir_i", "state1_f", "state2_f", "type_f", "dir_f"]
  for (let i=0; i<arguments.length; i++) {
    arg =  arguments[i];
    argname = argnames[i]
    rule[argname] = arg;
  }
  rules.push(rule);
}
function load_rules_from_file() {

}

function interpret_rules(rules_text_) {
  // nodes = [];
  for (i = nodes.length-1; i>=0; i--) {
    nodes[i].remove();
  }
  let arrayoflines = rules_text_.split('\n');
  let phase;
  let rule;
  let legacy = legacycheckbox.checked;
  for (line of arrayoflines) {
    rule = undefined;
    if (line == "States:") {
      phase = 'states';
    } else if (line == "Bonds:") {
      phase = 'bonds';
    } else if (line == "Rules:") {
      phase = 'rules';
    } else {
      rule = line.split(' ');
    }
    if ((rule != undefined) && (rule != '')) {
      console.log(rule, phase);
      if (phase == 'states') {
        // if rule calls for a material which doesn't exist, create material
        let material_exists;
        let rulematerial = rule[rule.length-1];
        material_exists = false;
        for (let material in nodematerials) {
          if (material == rulematerial) {
            material_exists = true;
          }
        }
        if (! material_exists) {
          newnodematerial(rulematerial);
        }
        let y = parseFloat(rule[1]);
        let x;
        if (legacy) {
          x = parseFloat(rule[0])+0.5*y;
        } else {
          x = parseFloat(rule[0]);
        }
        let z = 0;
        if (rule.length == 4) {
          z = parseFloat(rule[2]);
        }
        let node = new Node(x,y,z,[], state=rulematerial);
        nodes.push(node);
      }

      if (phase == 'bonds') {
        let ruleis3d;
        if (rule.length == 7) {
          ruleis3d = true;
        } else if (rule.length == 5) {
          ruleis3d = false;
        } else {
          console.log('Bond config must have either 5 or 7 arguments (x1 y1 (z1) x2 y2 (z2) type)');
        }
        //node 1 of bond config
        let y1 = parseFloat(rule[1]);
        let x1;
        if (legacy) {
          x1 = parseFloat(rule[0])+0.5*y1;
        } else {
          x1 = parseFloat(rule[0]);
        }
        let z1;
        let x2;
        let y2;
        let z2;
        if (ruleis3d) {
          z1 = parseFloat(rule[2]);
          y2 = parseFloat(rule[4]);
          if (legacy) {
            x2 = parseFloat(rule[3])+0.5*y2;
          } else {
            x2 = parseFloat(rule[3]);
          }
          z2 = parseFloat(rule[5]);
        } else {
          z1 = 0;
          y2 = parseFloat(rule[3]);
          if (legacy) {
            x2 = parseFloat(rule[2])+0.5*y2;
          } else {
            x2 = parseFloat(rule[2]);
          }
          z2 = 0;
        }

        let type;
        let typeentry;
        if (ruleis3d) {
          typeentry = rule[6];
        } else {
          typeentry = rule[4];
        }
        if (typeentry == 'rigid' || typeentry == '1') {
          type = 'rigid';
        } else if (typeentry == 'flexible' || typeentry == '2') {
          type = 'flexible';
        }
        let node1;
        let node2;
        for (node of nodes) {
          if (node.pos.x == x1 && node.pos.y == y1 && node.pos.z == z1) {
            node1 = node;
            console.log(node.pos);
          } else if (node.pos.x == x2 && node.pos.y == y2 && node.pos.z == z2) {
            node2 = node;
            console.log(node.pos);
          }
        }
        if (node1 != undefined && node2 != undefined) {
          if (type == 'rigid') {
            edges.push(new Edge(node1, node2, 'rigid'))
          } else if (type == 'flexible') {
            edges.push(new Edge(node1, node2, 'flexible'))
          }
        } else {
          console.log('Tried to form edge between nodes in positions ' + x1,y1,z1 + ' and ' + x2,y2,z2 +' but there are no nodes in one or both of those positions');
        }
      }
      if (phase == 'rules') {
        console.log('rules' + rule);
      }
    }
  }
}

// var material = nodematerials['A'];
var highlightmaterial = new THREE.MeshToonMaterial();
highlightmaterial.color.set(0xff0000);
highlightmaterial.emissive.set(0xffffff);
highlightmaterial.transparent = true;
highlightmaterial.opacity = 0.5;
highlightmaterial.side = THREE.BackSide;

highlightmaterial.emissiveIntensity = 0.8;

var outlinematerial = new THREE.MeshToonMaterial();
outlinematerial.color.set(0x000000);
outlinematerial.side = THREE.BackSide;

var rigidbondmaterial = new THREE.MeshToonMaterial();
var flexiblebondmaterial = new THREE.MeshToonMaterial();

class Node {
  constructor (x_,y_,z_, edges_, state_ = 'A') {
    this.pos = new THREE.Vector3(x_,y_,z_);
    this.edges = edges_;
    this.state = state_;
  }

  add_edges (edges_) {
    this.edges.push(edges_)
  }

  create_node(direction_, type_, state_) {
    let newnode_pos = this.pos.clone().add(direction_.clone());
    let node = new Node( newnode_pos.x, newnode_pos.y, newnode_pos.z, [] , state_=state_);
    nodes.push(node);
    let edge = new Edge( this, node, type_);
    edges.push(edge);
    return node;
  }

  apply_random_rule() {
    let n = Math.floor(Math.random()*rules.length);
    return this.apply_rule(n)
  }

  check_move (vector_) {
    let can_move = true;
    let new_pos = this.pos.clone().add(vector_.clone());
    // console.log('proposed');
    // console.log(new_pos);
    for (let i = nodes.length-1; i >= 0; i--) {
      let node = nodes[i];
      console.log(i);
    //   // console.log(node.pos.clone().distanceTo(new_pos.clone()))
      if (node.pos.clone().distanceTo(new_pos.clone()) == 0) {
        can_move = false;
      }
    }
    //
    console.log(can_move);
    return can_move;
  }

  move(vector_) {
    let can_move = this.check_move(vector_);
    if (can_move) {
      this.pos = this.pos.clone().add(vector_.clone());
      this.show();
      for (let i = 0; i < this.edges.length; i++) {
        let edge = this.edges[i];
        edge.show();
      }
    }
    return can_move;
  }

  move_all(vector_,except_) {
    for (let i = this.edges.length-1; i>=0; i--) { // for every edge of this node
      let edge = this.edges[i];
      if ((edge.node1 == except_) || (edge.node2 == except_)) { // Do not move except_ node
        console.log('don\'t move except');
      } else {
        if (edge.node1 == this) {
          return edge.node2.move_all(vector_, this);
        } else if (edge.node2 == this) {
          return edge.node1.move_all(vector_, this);
        } else {
          console.log('something\'s gone wrong');
        }
      }
    }
  }


  apply_rule(rule_) {
    //TODO move to rule check
    // if rule calls for a material which doesn't exist, create material
    let material_exists;
    let rulematerials = [rules[rule_].state1_i, rules[rule_].state1_f, rules[rule_].state2_i, rules[rule_].state2_f]
    for (let rulematerial of rulematerials) {
      material_exists = false;
      for (let material in nodematerials) {
        if (material == rulematerial) {
          material_exists = true;
        }
      }
      if (! material_exists && rulematerial != 'empty') {
        console.log(rulematerial)
        newnodematerial(rulematerial);
      }
    }
    let rule_applied = false;
    let n = rule_;
    if (rules[0]) {
      console.log('Try to apply rule ' + (n).toString() + ' to node' );
      console.log(this);

      if (rules[n]['state1_i'] == this.state) {
        console.log('State of this node matches initial state of node 1 in rule (' + this.state + ')');

        // check each edge to see if selected node is connected to node in direction asked for by rule
        let stateinruledirection = undefined;
        let boundnode = undefined;
        let boundedge = undefined;
        let stringdirection = '(' + (rules[n]['dir_i'].x).toString() + ', ' + (rules[n]['dir_i'].y).toString() + ', ' + (rules[n]['dir_i'].y).toString() + ')';
        for (let edge of this.edges) {
          let direction;
          let boundnode_temp;
          if (edge.node1 == this) {
            direction = edge.node2.pos.clone().sub(edge.node1.pos.clone());
            boundnode_temp = edge.node2;
          }
          else {
            direction = edge.node1.pos.clone().sub(edge.node2.pos.clone());
            boundnode_temp = edge.node1;
          }
          if (direction.x == rules[n]['dir_i'].x && direction.y == rules[n]['dir_i'].y && direction.z == rules[n]['dir_i'].z) {
            // console.log(stringdirection);
            boundnode = boundnode_temp;
            boundedge = edge;
          }
        }

        if (rules[n]['state2_i'] != 'empty') {           // if the rule calls for an operation on an existing neighbour
          if (typeof boundnode != 'undefined') {         // check that there is a neighbour in direction
            if (boundnode.state == rules[n]['state2_i']) { // check that neighbour in that direction is correct state
              if (boundedge.type == rules[n]['type_i']) { // check that edge is correct type
                if (rules[n]['state2_f'] == 'empty') {       // if node 2 must be deleted
                  boundnode.remove();
                  console.log('delete nubot');
                  rule_applied = true;
                } else if (rules[n]['state2_i'] != rules[n]['state2_f']) { // if the neighbour must change state (but not delete)
                  boundnode.state = rules[n]['state2_f'];
                  boundnode.show();
                  rule_applied = true;
                } else {
                  if (rules[n]['type_f'] == 'null') { // if the edge must be deleted (this is already dealt with if the node is deleted)
                    boundedge.remove();
                  } else if (rules[n]['type_i'] != rules[n]['type_f']) { // if the bond must change type (but not delete)
                    boundedge.type = rules[n]['type_f'];
                    boundedge.show();
                    rule_applied = true;
                  }
                }
                if (rules[n].dir_i != rules[n].dir_f) { // if the direction must change
                  // let can_move = true;
                  // let new_pos = this.pos.clone().add(rules[n].dir_f.clone());
                  // console.log(new_pos);
                  // for (let i = 0; i< nodes.length; i++) {
                  //   let node = nodes[i];
                  //   console.log(node.pos.x.toString() + node.pos.y.toString() + node.pos.z.toString());
                  //   if ((node.pos.x == new_pos.x) && (node.pos.y == new_pos.y) && (node.pos.z == new_pos.z)) {
                  //     can_move = false;
                  //   }
                  // }
                  // if (can_move) {
                  //   boundnode.pos = new_pos;
                  //   boundnode.show();
                  //   boundedge.show();
                  //   rule_applied = true;
                  let relativedirection = rules[n].dir_f.clone().sub(rules[n].dir_i.clone());
                  let string_relativedirection = '(' + (rules[n]['dir_i'].x).toString() + ', ' + (rules[n]['dir_i'].y).toString() + ', ' + (rules[n]['dir_i'].y).toString() + ')';
                  if (boundnode.move(relativedirection)) {
                    rule_applied = true;
                  } else {
                    console.log('Tried to move by vector ' + string_relativedirection + ' but there was already something there')
                  }
                }
              } else { // if edge is not correct type
                console.log('Edge in direction' + stringdirection + 'does not have type specified by rule');
              }
            } else { // if there are neighbours is not correct state
                console.log('Node in direction' + stringdirection + 'does not have state specified by rule');
              }
          } else { // if there are no neighbours in direction
            console.log('Tried to do operation on node in direction ' + stringdirection + ', that position is empty');
          }
        } else {
          // create new nubot if rule has empty in state 2 initial.
          if (typeof boundnode == 'undefined') {
            this.create_node(rules[n]['dir_f'], rules[n]['type_f'], rules[n]['state2_f']); // , type_=rules[n]['type_f'], state_=rules[n][1]
            rule_applied = true;
          } else {
            console.log('Direction ' + stringdirection + ' is not empty');
          }
        }

    } else {
        console.log('State of this node (' + this.state + ') does not match initial state of node 1 in rule: (' + rules[n]['state1_i'] + ')' );
      }

      if (rule_applied) {
        console.log('Rule ' + (n).toString() + ' applied to node');
        return true;
      }
      else {
        console.log('Rule ' + (n).toString() + ' not applied');
        return false;
      }
    } else {
      console.log("No rules!");
      return false;
    }
  }

  remove() {
    // remove edges
    for (let i = this.edges.length-1; i >= 0; i--) {
      let edge = this.edges[i];
      console.log(edge);
      edge.remove();
    }

    // remove node from global list
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i] == this) {
        nodes.splice( i, 1);
      }
    }

    // remove model from scene
    scene.remove(this.model);
  }

  test() {
    console.log(this.state);
  }

  show() {
    // this.outlinemodel = new THREE.Mesh( outlinegeometry, outlinematerial);
    if (this.model) {
      scene.remove (this.model);
    }

    this.model = new THREE.Mesh( spheregeometry, nodematerials[this.state] );

    this.model.position.x = this.pos.x;
    this.model.position.y = this.pos.y;
    this.model.position.z = this.pos.z;
    this.model.userData = {node: this}
    scene.add( this.model );

  //   if (this.outlinemodel) {
  //     scene.remove (this.outlinemodel);
  //   }
  //
  //   this.outlinemodel.position.x = this.pos.x;
  //   this.outlinemodel.position.y = this.pos.y;
  //   this.outlinemodel.position.z = this.pos.z;
  //   this.outlinemodel.userData = {node: this}
  //   scene.add( this.outlinemodel );
  }
}
var highlightednodes = [];
function highlightNode(node_) {
  removeHighlights();

  // let geometry = new THREE.SphereGeometry( 0.5, 0.5, 0.5 );
  // // geometry.position.x = node_.pos.x;
  //
  // let highlightednode = new THREE.Mesh(geometry, highlightmaterial);
  // highlightednode.position.x = node_.pos.x;
  // highlightednode.position.y = node_.pos.y;
  // highlightednode.position.z = node_.pos.z;
  // hoverContainer.add(highlightednode);


  // highlightednodes.push(node_.model);
  outlinePass.selectedObjects.push(node_.model);
}

function removeHighlights() {
  outlinePass.selectedObjects = [];
}

class Edge {
  constructor (node1_, node2_, type_ = 'rigid') {
    this.node1 = node1_;
    this.node2 = node2_;
    this.node1.add_edges(this);
    this.node2.add_edges(this);
    this.type = type_;
  }

  show() {
    let length = this.node1.pos.distanceTo(this.node2.pos);
    // let p = this.node2.pos.clone()

    // position of bond is half way between the two nodes
    // clone() method gets copy so multiplication etc. not done in place.
    let position = this.node1.pos.clone().add((this.node2.pos.clone().sub(this.node1.pos.clone())).multiplyScalar(0.5));
    let orientation = this.node2.pos.clone().sub(this.node1.pos.clone());
    let defaultorientation = new THREE.Vector3( 0, 1, 0);
    let rotationaxis = defaultorientation.clone().cross(orientation.clone()).normalize();
    let angletorotate = orientation.angleTo(defaultorientation);
// console.log(orientation);
    let geometry = new THREE.CylinderGeometry( 0.1, 0.1, length);
    // let material = new THREE.LineBasicMaterial( { color: 0x0000ff } );
    // geometry.vertices.push(this.node1.pos);
    // geometry.vertices.push(this.node2.pos);
    if (this.model) {
      scene.remove (this.model);
    }
    if (this.type == 'rigid') {
      this.model = new THREE.Mesh( geometry, rigidbondmaterial );
      this.model.material.color.set(0xff0000);
      this.model.material.metalness = 0;
    }
    else if (this.type == 'flexible') {
      this.model = new THREE.Mesh( geometry, flexiblebondmaterial );
      this.model.material.color.set(0x00ff00);
      this.model.material.metalness = 0;
    }
    this.model.position.x = position.x;
    this.model.position.y = position.y;
    this.model.position.z = position.z;
    this.model.setRotationFromAxisAngle(rotationaxis, angletorotate);
    scene.add( this.model );
  }

  remove() {
    // delete edge from node1 edge list
    console.log(this.node1.edges);
    for (let i = this.node1.edges.length-1; i >= 0 ; i--) {
      // console.log('node 1 edge ' + i);
      if (this.node1.edges[i] == this) {
        this.node1.edges.splice(i, 1);

          // console.log('deleted');
      }
    }
    // delete edge from node2 edge list
    // console.log(this.node2.edges);
    for (let i = this.node2.edges.length-1; i >= 0 ; i--) {
      // console.log('node 2 edge' + i);
      if (this.node2.edges[i] == this) {
        this.node2.edges.splice(i, 1);

          // console.log('deleted');
      }
    }
    // delete edge from global edge list
    for (let i = edges.length-1; i >= 0; i--) {
      if (edges[i] == this) {
        console.log('deleted');
        edges.splice( i, 1);
      }
    }

    // delete edge model from scene
    scene.remove(this.model);
  }
}

var nodes = [];
var edges = [];

// let node = new Node(0,0,0,[], state='A');
// nodes.push(node);

// node = node.create_node(new THREE.Vector3(1,0,0), type_='flexible', state_='B');

for (let node of nodes) {
  for (let edge of node.edges) {
    if (edge.node1 == node) {
      console.log(edge.node2.pos.clone().sub(node.pos.clone()));
    }
    else {
      console.log(edge.node1.pos.clone().sub(node.pos.clone()));
    }

  }
}
