# Nubots3D
Nubots in 3D
Nubots is an abstract model for algorithmic assembly using molecular robots (https://arxiv.org/abs/1301.2626).
This simulator expands the original model to use arbitrary 3D vectors.

Rule configuration:
The States: and Rules: boxes specify the initial configuration.
An individual bot is placed in the space using a line in the States box:
```
x y state
```
or 
```
x y z state
```
where x is the x coordinate, y is the y coordinate, z is the z coordinate, and state is the state. The x, y and z coordinates are floats, the state can be any string (no need to put it in quotation marks).
In the initial camera view, z points out of the screen towards you.
If only 3 arguments are given, the z coordinate is set to 0.
The arguments are separated by spaces.
For example, 
```
0 1 0 start
```
would give a bot with state "start" at position (0,1,0).

If "legacy format rules" is checked, the x and y coordinates are actually coordinates along the vectors (1,0,0) and (0.5,0.866,0) respectively.
The effect of this is to make it easier to specify coordinates on a triangular lattice.

Each bot state is separated by a line break

A bond between 2 bots in the initial configuration is specified using a line in the Bonds box:
```
x1 y1 x2 y2 type
```
or
```
x1 y1 z1 x2 y2 z2 type
```
where x1, y1 and z1 are the coordinates of the first bot, x2, y2 and z2 are the coordinates of the second bot, and type is one of either 'rigid' or 'flexible' (no quotation marks)

For example,
```
0 0 0 1 0 0 flexible
```
makes a flexible bond between bots at position (0,0,0) and (1,0,0).

If either of the positions is unoccupied by a bot from the states box, the bond will not be created.

The bond type can also be specified using an alias (see aliases, below)


Rules:
A rule is specified in the following format:
```
state1_i state2_i type_i dir_i state1_f state2_f type_f dir_f
```

For example,
```
A B flexible (0,1,1)n A B rigid (2,0,0)
```
will change a bot in state A with a neigbour in state B bound by a flexible bond in direction (0,1,1)n (where the n specifies a normalised vector) into a bot in state A bound to a bot in state B with a rigid bond in direction (2,0,0) (not normalised).

type_i and type_f can be one of null, flexible or rigid, or an alias.
dir_i and dir_f can be a vector in the format (x,y,z) with an optional n indicating that the vector should be normalised.
state2_i, state1_f, and state_2_f can be any string, or the special keyword empty which indicates that no bot is present in that position. This can be used to create or delete bots.
Note that you cannot use the keyword empty in state1_i (in this implementation, the rule is applied to the bot in the first position, so this bot must exist).

Aliases:
You may wish to create aliases for directions and bond types, especially if using legacy formatted rules.
Each line of the Aliases box is an alias followed by a definition, separated by a space. The definition can be a vector or a bond type.
The set of aliases below work for legacy formatted rules.
```
E (1,0,0)n
SE (0.5,-0.866,0)n
SW (-0.5,-0.866,0)n
W (-1,0,0)n
NW (-0.5,0.866,0)n
NE (0.5,0.866,0)n
0 null
1 rigid
2 flexible
```
