var tolerance = 0.01;
var flexible_stretchable_distance = 2**0.5 + tolerance;
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
    let offset = 0.5 - nodematerials[state_].color.getHSL(hsl)['l'];
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
  // dir_f_ = dir_f_.normalize();
  let rule = {}
  argnames = ["state1_i", "state2_i", "type_i", "dir_i", "state1_f", "state2_f", "type_f", "dir_f"]
  for (let i=0; i<arguments.length; i++) {
    arg =  arguments[i];
    argname = argnames[i]
    rule[argname] = arg;
  }
  rules.push(rule);
}

function remove_comments(text_) {
  let re = /\[[\s\S]*?\]/gi
  let text = text_.replace(re, '');
  re = /[\s]+$|[\s]+[\n]/
  text = text.replace(re, '\n');
  return text;
}

function interpret_states(states_text_) {
  let legacy = legacycheckbox.checked;
  // TODO: get better deletion of old states
  for (i = nodes.length-1; i>=0; i--) {
    nodes[i].remove();
  }
  let states = remove_comments(states_text_);
  states = states.split('\n');
  let stateis3d;
  for (line of states) {
    if (line == '') {
      continue;
    }
    let state = line.split(' ');

    // check if conf gives 2d or 3d
    if (state.length == 4) {
      stateis3d = true;
    } else if (state.length == 3) {
      stateis3d = false;
    } else {
      console.log('State config must have either 3 or 4 arguments (x y (z) state)')
    }
    // if rule calls for a material which doesn't exist, create material
    let material_exists;
    let rulematerial = state[state.length-1];
    material_exists = false;
    for (let material in nodematerials) {
      if (material == rulematerial) {
        material_exists = true;
      }
    }
    if (! material_exists) {
      newnodematerial(rulematerial);
    }

    // Add node to nodes in correct position
    let y;
    if (legacy) {
      y = parseFloat(state[1])*Math.sin(Math.PI/3);
    } else {
      y = parseFloat(state[1]);
    }
    let x;
    if (legacy) {
      x = parseFloat(state[0])+0.5*parseFloat(state[1]);
    } else {
      x = parseFloat(state[0]);
    }
    let z;
    if (stateis3d) {
      z = parseFloat(state[2]);
    } else {
      z = 0;
    }
    let node = new Node(x,y,z, rulematerial);
    nodes.push(node);
    // console.log(x, y, z);
  }
  // console.log(states);
}
function interpret_bonds(bonds_text_) {
  let legacy = legacycheckbox.checked;

  let bonds = remove_comments(bonds_text_);
  bonds = bonds.split('\n');
  for (line of bonds) {
    if (line == '') {
      continue;
    }
    let bond = line.split(' ');
    // console.log(bond);
    let bondis3d;
    if (bond.length == 7) {
      bondis3d = true;
    } else if (bond.length == 5) {
      bondis3d = false;
    } else {
      console.log('Bond config must have either 5 or 7 arguments (x1 y1 (z1) x2 y2 (z2) type)');
    }
    //node 1 of bond config
    let y1;
    if (legacy) {
      y1 = parseFloat(bond[1])*Math.sin(Math.PI/3);
    } else {
      y1 = parseFloat(bond[1]);
    }
    let x1;
    if (legacy) {
      x1 = parseFloat(bond[0])+0.5*parseFloat(bond[1]);
    } else {
      x1 = parseFloat(bond[0]);
    }
    let z1;
    let x2;
    let y2;
    let z2;
    if (bondis3d) {
      z1 = parseFloat(bond[2]);
      if (legacy) {
        y2 = parseFloat(bond[4])*Math.sin(Math.PI/3);
      } else {
        y2 = parseFloat(bond[4]);
      }
      if (legacy) {
        x2 = parseFloat(bond[3])+0.5*parseFloat(bond[4]);
      } else {
        x2 = parseFloat(bond[3]);
      }
      z2 = parseFloat(bond[5]);
    } else {
      z1 = 0;
      if (legacy) {
        y2 = parseFloat(bond[3])*Math.sin(Math.PI/3);
      } else {
        y2 = parseFloat(bond[3]);
      }
      if (legacy) {
        x2 = parseFloat(bond[2])+0.5*parseFloat(bond[3]);
      } else {
        x2 = parseFloat(bond[2]);
      }
      z2 = 0;
    }
    let rulenode1pos = new THREE.Vector3(x1,y1,z1);
    let rulenode2pos = new THREE.Vector3(x2,y2,z2);
    // console.log(rulenode1pos, rulenode2pos);
    let type;
    let typeentry;
    if (bondis3d) {
      typeentry = bond[6];
    } else {
      typeentry = bond[4];
    }
    if (typeentry == 'rigid' || typeentry == '1') {
      type = 'rigid';
    } else if (typeentry == 'flexible' || typeentry == '2') {
      type = 'flexible';
    }
    let node1;
    let node2;
    for (node of nodes) {
      if (node.pos.distanceTo(rulenode1pos) < tolerance) {
        node1 = node;
        // console.log(node.pos);
      } else if (node.pos.distanceTo(rulenode2pos) < tolerance) {
        node2 = node;
        // console.log(node.pos);
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
    // console.log(x1, y1, z1, x2, y2, z2, type);
  }
}
var aliases = {}
function interpret_aliases(alias_text_) {
  aliases = {};
  let aliases_temp = remove_comments(alias_text_);
  let aliases_list = aliases_temp.split('\n');
  // console.log(aliases_list);
  for (item of aliases_list) {
    if (item == '') {
      continue;
    }
    let alias = item.split(' ');
    aliases[alias[0]] = alias[1];
  }
}

function parseAlias(alias_) {
  let has_alias;
  has_alias = false;
  for (alias in aliases) {
    if (alias == alias_) {
      has_alias = true
    }
  }
  if (has_alias == true) {
    return aliases[alias_];
  } else {
    return alias_;
  }
}

function parseDir(dir_) {
  let normalize = false;
  let dir;
  if (dir_[dir_.length-1] == 'n') {
    normalize = true;
    dir = dir_.slice(1,-2);
  } else {
    dir = dir_.slice(1,-1);
  }
  dir = dir.split(',');
  let x = parseFloat(dir[0]);
  let y = parseFloat(dir[1]);
  let z;
  if (dir.length == 3) {
    z = parseFloat(dir[2]);
  } else {
    z = 0;
  }
  let threedir = new THREE.Vector3(x,y,z);
  if (normalize == true) {
    threedir = threedir.normalize();
  }
  return threedir;
}

function interpret_rules(rules_text_) {
  rules = [];
  let legacy = legacycheckbox.checked;
  let rules_temp = remove_comments(rules_text_);
  rules_temp = rules_temp.split('\n');
  for (line of rules_temp) {
    if (line == '') {
      continue;
    }
    let rule = line.split(' ');
    console.log(rule);
    if (rule.length == 8) {
      let dir_i = parseDir(parseAlias(rule[3]));
      let dir_f = parseDir(parseAlias(rule[7]));
      console.log('final direction', dir_f)
      let type_i = parseAlias(rule[2]);
      let type_f = parseAlias(rule[6]);

      new_rule(rule[0], rule[1], type_i, dir_i, rule[4], rule[5], type_f, dir_f);
    } else {
      console.log('Rule config must have 8 arguments (x1 y1 (z1) x2 y2 (z2) type)');
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
  constructor (x_,y_,z_, state_) {
    this.pos = new THREE.Vector3(x_,y_,z_);
    this.edges = []
    this.state = state_;
  }

  add_edge (edge_) {
    this.edges.push(edge_);
    // TODO
    // Check if edge already exists. If so, delete it
    // let edgeexists = false;
    // for (let edge of this.edges) {
    //   if ((edge.node1 == edge_.node1 &&
    //       edge.node2 == edge_.node2) ||
    //       (edge.node1 == edge_.node2 &&
    //       edge.node2 == edge_.node2)) {
    //     edgeexists = true;
    //   }
    //   if (edgeexists = false) {
    //     this.edges.push(edge_);
    //   } else {
    //     for (let edge in edges) {
    //       if (edges[edge] == edge_) {
    //         edges.pop(edge);
    //       }
    //     }
    //   }
    // }
  }

  create_node(direction_, type_, state_) {
    let newnode_pos = this.pos.clone().add(direction_.clone());
    let node = new Node( newnode_pos.x, newnode_pos.y, newnode_pos.z, state_);
    nodes.push(node);
    if (type_ == 'rigid' || type_ == 'flexible') {
      let edge = new Edge( this, node, type_);
      edges.push(edge);
    }
    return node;
  }

  apply_random_rule() {
    let n = Math.floor(Math.random()*rules.length);
    return this.apply_rule(n)
  }

  check_move (vector_) {
    let can_move = true;
    let new_pos = this.pos.clone().add(vector_.clone());
    // DEBUG console.log('proposed');
    // DEBUG console.log(new_pos);
    for (let i = nodes.length-1; i >= 0; i--) {
      let node = nodes[i];
      // DEBUG console.log(i);
      // DEBUG console.log(node.pos.clone().distanceTo(new_pos.clone()))
      if (node.pos.clone().distanceTo(new_pos.clone()) == 0) {
        can_move = false;
      }
    }
    //
    console.log(can_move);
    return can_move;
  }

  move(vector_) {
    this.pos = this.pos.clone().add(vector_.clone());
    this.show();
    for (let i = 0; i < this.edges.length; i++) {
      let edge = this.edges[i];
      edge.show();
    }
  }

  moveable_set(A, vector) {
    // Algorithm 4.1 Compute movable set M(C, A, B, vector).
    // • Step 1. Let M_set ← {A}, F_set ← {A}, B_set ← {}.
    console.log('Step 1')
    let B = this;
    console.log('M_set ← {A}');
    let M_set = [A];
    console.log('F_set ← {A}');
    let F_set = [A];
    console.log('B_set ← {}');
    let B_set = [];

    console.log('current state', 'M_set', M_set.length, 'F_set', F_set.length, 'B_set', B_set.length);

    function blocking_set(M_set_, F_set_, B_set_, vector_) {
      // • Step 2. Compute the blocking set B_set for the frontier set F_set along vector, as follows.
      // For each monomer X ∈ F_set, do:
      console.log('F_set');
      for (let i of F_set_) {
        console.log(i);
      }
      let Y_proposed_position;
      let X_proposed_position;
      console.log('For X in F_set');
      for (let X of F_set_) {
        console.log('Step 2.1: If X.pos + vector is occupied by a node Y not in M_set, then append Y to B_set');
        console.log('X', X);
        X_proposed_position = X.pos.clone().add(vector_.clone());
        console.log('X.pos', X.pos);
        console.log('X_proposed_position', X_proposed_position);
      // 1. If X.pos + vector is occupied by a node Y not in M_set, then append Y to B_set;

        for (let Y of nodes) {
          if (M_set_.indexOf(Y) == -1) {
            Y_proposed_position = Y.pos.clone().add(vector_.clone());
            if (X_proposed_position.distanceTo(Y.pos) < tolerance) {
              console.log('X.pos + vector is occupied by a node Y not in M_set, append Y to B_set');
              console.log('Y', Y, 'Y.pos', Y.pos);
              if (B_set_.indexOf(Y) == -1) {
                  B_set_.push(Y);
                  console.log('current state', 'M_set', M_set_.length, 'F_set', F_set_.length, 'B_set', B_set_.length);
              }
            }
          }
        }
        console.log('Step 2.2: If X is bonded to Y not in M_set, and if translating X by vector without translating Y would disrupt the bond between X and Y , then append Y to B_set');
        // 2. If X is bonded to Y not in M_set, and if translating X by vector
        // without translating Y would
        // disrupt the bond between X and Y , then append Y to B_set;
        for (let edge of X.edges) {
          let Y;
          if (edge.node1 == X) {
            Y = edge.node2;
          } else if (edge.node2 == X) {
            Y = edge.node1;
          } else {
            console.error('Something\'s gone wrong: A node contains edges which don\'t contain the node');
          }
          console.log('X is bonded to Y', Y)
          Y_proposed_position = Y.pos.clone().add(vector_.clone());
          console.log('Y_proposed_position', Y_proposed_position, 'Y.pos', Y.pos);

          if (M_set_.indexOf(Y) == -1) {
            console.log('Y is not in M_set');
            console.log('X proposed position', X_proposed_position, 'Y position', Y.pos);
            let bond_proposed_distance = X_proposed_position.distanceTo(Y.pos);
            // Ignore the special case where X = A, Y = B
            if ((X == A) && (Y == B)) {
              console.log('X = A, Y = B, ignore')
            } else {
              console.log('Bond proposed_distance', bond_proposed_distance);
              if (edge.type == 'rigid') {
                console.log('Bond is rigid, translating X by vector without translating Y would disrupt the bond between X and Y. Adding Y to B_set.');
                if (B_set_.indexOf(Y) == -1) {
                    B_set_.push(Y);
                }
              } else if (edge.type == 'flexible') {
                console.log('Bond is flexible, translating X by vector without translating Y may not disrupt the bond between X and Y')

                if (bond_proposed_distance > flexible_stretchable_distance) {
                  console.log('Distance is greater than stretchability of flexible bond, translating X by vector without translating Y would disrupt the bond between X and Y. Adding Y to B_set.')
                  if (B_set_.indexOf(Y) == -1) {
                      B_set_.push(Y);
                  }
                } else {
                  console.log('Bond is not disrupted by move, doing nothing.')
                }
              }
            } // not special case X=A, Y=B
          } // Y not in M_set
          console.log('current state', 'M_set', M_set_.length, 'F_set', F_set_.length, 'B_set', B_set_.length);
        } // for each edge of X
      } // for each X of F_set
      return B_set_;
    } // blocking_set function

    while(true) {
      console.log('Step 2: Compute the blocking set B_set for the frontier set F_set along vector');
      B_set = blocking_set(M_set, F_set, B_set, vector);

      console.log('Step 3: Inspect the blocking set');
      // • Step 3. Inspect the blocking set:
      // 1. If B ∈ B_set, return {};
      console.log('Step 3.1');
      if (B_set.indexOf(B) > -1) {
        console.log('B is in B_set, moveable_set is empty')
        return [];
      } else {
        console.log('B is not in B_set, continuing')
      }
      console.log('Step 3.2');
      // 2. If B_set = {}, return M_set;
      if (B_set.length == 0) {
        console.log('B_set is empty, returning moveable_set', M_set);
        return M_set;
      } else {
        console.log('B_set is not empty, continuing')
      }
      // 3. Otherwise, let M ← M ∪ B, F ← B, B ← {}, and go to Step 2.
      console.log('Step 3.3: let M_set ← M_set ∪ B_set, F_set ← B_set, B_set ← {}');
      M_set = M_set.concat(B_set);
      F_set = B_set;
      B_set = [];
      // console.log('F_set');
      // for (let i of F_set) {
      //   console.log(i);
      // }
    } // while loop steps 2 and 3
  } // moveable_set function

  move_set(A_, vector_) {
    let M_set = this.moveable_set(A_, vector_);
    for (let node of M_set) {
      node.move(vector_);
    }
    return M_set.length > 0;
  }

  apply_rule(rule_) {
    //TODO move to rule check
    if (rules.length < rule_) {
      console.log('Rule does not exist')
      return false;
    }
    let rule_applied = false;
    let stateinruledirection = undefined;
    let boundnode = undefined;
    let boundedge = undefined;
    let stringdirection = '(' + (rules[rule_]['dir_i'].x).toString() + ', ' + (rules[rule_]['dir_i'].y).toString() + ', ' + (rules[rule_]['dir_i'].z).toString() + ')';
    let nulledge = true;
    let rule_blocked = false;
    let n = rule_;
    let rule = rules[rule_];

    if (rule.state1_i == 'empty') {
      console.log('Rule with empty in state1_i position not supported');
      return false;
    }
    // if rule calls for a material which doesn't exist, create material
    let material_exists;
    let rulematerials = [rule.state1_i, rule.state1_f, rule.state2_i, rule.state2_f]
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
    console.log('Try to apply rule ' + (n).toString() + ' to node' );
    console.log(this);

    if (rule.state1_i == this.state) {
      console.log('State of this node matches initial state of node 1 in rule (' + this.state + ')');

      // check each edge to see if selected node is connected to node in direction asked for by rule

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
        if (direction.distanceTo(rule.dir_i) < tolerance) {
          nulledge=false;
          console.log('There is a bound node in direction specified by rule, setting nulledge to false')
          boundnode = boundnode_temp;
          boundedge = edge;
        }
      }

      if (((rule.type_i == 'null') || (rule.state2_i == 'empty')) && nulledge == true) { // in this case we need to check all nodes, not just neighbours
        for (let node of nodes) {
          let direction;
          // distance between this node and the node we are checking
          direction = node.pos.clone().sub(this.pos.clone());
          if (direction.distanceTo(rules[rule_]['dir_i']) < tolerance) {
            boundnode = node;
          }
        }
        console.log('boundnode', boundnode);
      }

      if (rule.state2_i != 'empty') {           // if the rule calls for an operation on an existing neighbour
        let deletenode2 = (rule.state2_f == 'empty');
        let change_direction = (rule.dir_i.distanceTo(rule.dir_f) > tolerance);
        console.log(change_direction);
        // console.log('rule.dir_i, rule.dir_f', rule.dir_i, rule.dir_f);
        let changenode2state = ((rule.state2_i != rule.state2_f) && (rule.state2_f != 'empty'));
        let deleteedge = ((rule.type_f == 'null') && (deletenode2 == false));
        if (typeof boundnode != 'undefined') {         // check that there is a neighbour in direction
          if (boundnode.state == rule.state2_i) { // check that neighbour in that direction is correct state
            let edgecorrect = false;
            if (typeof boundedge != 'undefined') {
              if (boundedge.type == rule.type_i) {
                edgecorrect = true;
              }
            }
            if ((edgecorrect == true) || (nulledge == true)) { // check that edge is correct type
              if ((change_direction == true) && (rule_blocked == false)) { // if the direction must change
                let relativedirection = rule.dir_f.clone().sub(rule.dir_i.clone());
                let string_relativedirection = '(' + (relativedirection.x).toString() + ', ' + (relativedirection.y).toString() + ', ' + (relativedirection.z).toString() + ')';
                if (this.move_set(boundnode, relativedirection)) {
                  console.log('Movement vector is ' + string_relativedirection);
                  rule_applied = true;
                  // console.log('rule applied true');
                } else {
                  rule_blocked = true;
                  console.log('Tried to move by vector ' + string_relativedirection + ' but the moveable set was empty')
                }
              }
              if ((deletenode2 == true) && (rule_blocked == false)) {       // if node 2 must be deleted
                boundnode.remove();
                console.log('Deleting nubot');
                rule_applied = true;
                // console.log('rule applied true');
              } else if ((changenode2state) && (rule_blocked == false)) { // if the neighbour must change state (but not delete)
                boundnode.state = rules[rule_]['state2_f'];
                boundnode.show();
                rule_applied = true;
                // console.log('rule applied true');
              }
              if (rule_blocked == false) {
                if (deleteedge) { // if the edge must be deleted (this is already dealt with if the node is deleted)
                  boundedge.remove();
                  console.log('Deleting edge')
                } else if ((rule.type_i == 'null') && (rule.type_f != 'null')) { // if the edge must be created
                  edges.push(new Edge(this, boundnode, rule.type_f));
                } else if (rule.type_i != rule.type_f) { // if the bond must change type (but not delete)
                  boundedge.type = rule.type_f;
                  boundedge.show();
                  rule_applied = true;
                  // console.log('rule applied true');
                }
              }
            } else { // if edge is not correct type
              console.log('Edge in direction' + stringdirection + 'does not have type specified by rule');
              rule_blocked = true;
            }
          } else { // if neighbour in direction is not correct state
              console.log('Node in direction' + stringdirection + 'does not have state specified by rule');
              rule_blocked = true;
            }
        } else { // if there are no neighbours in direction
          console.log('Tried to do operation on node in direction ' + stringdirection + ', that position is empty');
          rule_blocked = true;
        }
      } else { // rule state2_i is 'empty'\
        let createnode2 = (rules[rule_]['state2_f'] != 'empty');
        if (createnode2 == true) {
          if (typeof boundnode == 'undefined') { // create new nubot
            this.create_node(rule.dir_f, rule.type_f, rule.state2_f); // , type_=rules[n]['type_f'], state_=rules[n][1]
            rule_applied = true;
            // console.log('rule applied true');
          } else {
            console.log('Tried to create node in direction ' + stringdirection + ', but it is not empty');
            rule_blocked = true;
          }
        }
      }
      // Do operations on node1
      console.log(rule.state1_i, rule.state1_f, rule_blocked);
      if ((rule.state1_i != rule.state1_f) && (rule.state1_f != 'empty') && (rule_blocked == false)) {
        console.log("change state 1")
        this.state = rule.state1_f;
        this.show()
        rule_applied = true;
      } else if ((rule.state1_f == 'empty') && (rule_blocked == false)) {
        this.remove();
        rule_applied = true;
      }

    } else {
      console.log('State of this node (' + this.state + ') does not match initial state of node 1 in rule: (' + rules[rule_]['state1_i'] + ')' );
    }

    if (rule_applied) {
      console.log('Rule ' + (n).toString() + ' applied to node');
      return true;
    }
    else {
      console.log('Rule ' + (n).toString() + ' not applied');
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
    this.node1.add_edge(this);
    this.node2.add_edge(this);
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
