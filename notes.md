
# TODO

- Change the intersection overlay to a collision overlay, test
  each point with a fake Ball and mark how far it gets moved,
  use this value to create a heatmap over the table.
- Whole game state as object, pass to renderer, make reactive
- Better debug ball spawner (drag and release, middle-click repeats last spawn)

- Table
  - Split into horizontal chunks
  - Simulate any chunks with balls in, and their neighbours
  - Minimap
  - Launcher
- Table definition
  - Helper function that takes a name, builds a string-indexed object so that
    playfield components can be referenced by scripts
  - Event trigger names on obstacle components
  - Table state

## nnoww

- Template table
- Event queue for scripting?
- Scripts organisation in table object
- Are table and gamestate object seperate?

### FX Ideas

- chromatic ball trails
- move stripes
- cycle face colors
- cycle hair colors
- basic strobing
- paint splashes
- paint trails from eyes
- background dropout to stripe tunnel, or starfield
- face animation
- hair animation
- particles
- silhouette mode
- smoke trails on ball
- smoke UV offset in bg
- target banks get brighter as multiplier increases
- e^-x glow outlines

### Music sync (If Only)

- Instrumental - 0:00 - 0:08
  - Bass throb only
  - Static
- Verse 1 - 0:08 - 0:23
  - Static
- Verse 2 - 0:23 - 0:39
  - Kick drum enters
  - Pulse ball
- Chorus 1 (soft) - 0:39 - 1:10 - 2x
  - Pads enter
  - Smoke trail on ball
  - Smoke bg
  - Strobe lights gently
- Intrumental - 1:10 - 1:26
  - Snare enters, hard synths
  - Snap color changes
   - Face colors
   - Ring colors
- Verse 3 - 1:26 - 1:42
  - Pulse traget banks
- Verse 4 - 1:42 - 1:58
  - Paint splash
- Chorus 2 (full) - 1:58 - 2:29 - 2x
  - Portal bg
  - Fade face colors
  - Technicolor lamps
  - Rainbow ball trail
- Break - 2:30 - 2:37
  - Pulse everything
- Solo - 2:37 - 2:53
  - Starburst
  - Drop background for starfield
  - Screaming face
  - Hair swirling
- Solo + High bells - 2:53 - 3:09
  - Smoke puffs on snare
- Chorus 3 (full) - 3:09 - 3:40 - 2x
  - Technicolor art lines
  - Fireworks
- Instrumental - 3:40 - 3:56
- Fadeout


### Features

- Ramps / multi-level
  - Subways
- Bumpers
- Spinners
- Droptargets
  - Banks of droptargets for combos
- Lamps
- Rollovers
- Slingshots -> collider.friction >= 1


## Theme Ideas

### Hunt for the colossal squid

- The table is much taller than a normal table but you play one tables worth
  at a time
- Progress the game in sectors but gating each one until a mode is completed
- Each sector represents going deeper into the ocean and gets harder
- More flippers come into play as you move up the table
- Falling back down doesnt drain the ball but drops you back to an earlier
  sector, but new drains exist at weird locations in deeper zones


### Sectors

#### Tide Pools

- Bright, sandy
- Waves lapping
- Easy combos and targets
- Seashell drop targets
- Snails drop targets
- Nudibranches
- Starfish
  - Graphic on the playfield with 5 lamps
  - Must disable all lamps at the same time
  - Lamps come back on after a timeout
  - Starfish regrow limbs
- Sea Urchins Spinner
- Orbit: rock wall

#### Reef

- Bright caustics
- Anenome drop targets
- Tropical fish targets
- Crabs bonus target
- Coral
  - Coral graphic on the upper playfield
  - Requires eel to access
  - Anenome targets are only on the upper deck
- Eels
  - Target Combos summon a fish, which gets eaten by the eel
  - Eel is now in this position and stays there until you summon another fish
  - Body of the eel could be a ramp, access to different areas depends on it's position
- Bobbit worms
  - Pop out to grab and drain the ball
  - Ball wanders over specific zones in the playfield?
  - Chances of strike go up as the mission progresses
  - Inlane hazard?
- Reef shark main graphic

#### Open Ocean

- Murky particles - microplastics
- Jellyfish - generic targets
- Ramora fish - 3-target bank combo to remove
- Sea turtle - special target
- Shark
  - Large shark forms most of the playfield
  - Curving around the back to form orbit ramp
  - Top of the sharks head is playable deck
  - Shark teeth form giant target combo
  - Shark mouth is a drain; more targets = more risk
  - Tail flatten at the end to form onramp

#### Deep Ocean

- Nearly black + bioluminescence
  - Some target are only visible by rimlighting
- Thermal vents - upkickers to upper deck
- Isopods - drop targets
- Siphonophores - main graphic
- Oarfish - wall runs along back of upper playfield
- Anglerfish
  - Lure is a dangling target that must be hit n times
  - Mouth of the fish will drain the ball.
  - Lure must be hit from oblique angles

#### Black Zone

- Lair of the squid
- Whale bones stick up from plsyfield to form bumpers
- Underside of whale carcass as main graphic
- Tentacles come from darkness to dangle targets
  - Move the targets around
  - Perhaps specifically dodge the ball
- Central drain is the beak of the squid, like a saarlac
- Eye watches the ball from the surface of the playfield


## Pinball terms

### General

- Flippers
- Plunger
- Apron (lowest assembly)
- Return lane
- Tilt/smash sensors

### Gameplay mechanics

- Multiball
  - Usually works by releasing captive or held balls all at once
- Extra ball
  - Extra life, basically
- Combos
  - Particularly target banks
  - Certain sequences of shots
- Missions / Modes
  - Main points are earned for particular shots based on current metastate
  - Game might not progress states until complete or aborted (or timed out)
  - Can be time-limited ("hurry-up" mode)
  - Wizard mode: sometimes the final mission
  - Special: sometimes rewards a replay game
  - Some modes will issue you extra balls
- Sacrifice
  - Exchange a ball for points
  - A hole that normally drains the ball for no points
  - You get a lot of points for sinking the ball but it costs a ball
  - Still drains the ball
- Jackpot
  - Usually the most points you can earn
  - Sometimes the win condition of the game
  - If game doesn't end, sometimes goes into Wizard mode
- Wizard mode
  - Usually the final mission, or after the win condition of the game
  - Maximum chaos
- Replay
  - A whole free game after your game ends
- Skill shot
  - Hitting a particular target directly off of a launch or ball release
- Lock shot
  - Holds the ball, and issues you a new ball
  - Releases when multiball is activated
- Hiding extra features under an upper-playfield flipper so that it is
  accessable when the flipper is activated.
- An upper flipper immediately below a target area where the ball can be
  trapped so you can mash it into targets repeatedly (Mandalorian)
- Launch selection
  - Between drain and launch, screen can show a range of options that can be
  selected with flipper buttons or by waiting for rotation.
  - Can be used to select missions, or attempt particular skill shots
- Peristant Track Advancement
  - Certain shots can advance a multiplier, enable certain features, or some
  other track that persists over all the missions (Star Trek TNG: Warp Factors)

### Techniques

- Flipper transfers
  - Alley pass: shoot the ball up the opposite inlane
  - Dead pass: bounce the ball off a static flipper and catch with the other one
  - Post pass: using the back of the flipper to hit the underside of the slingshot post
  - Tap pass: using a tiny flick to gently throw the ball to the other flipper
  - Ski pass: cradling a transferred ball by raising both flippers like a ski jump
- Cradle: holding the ball with an activated flipper
- Drop catch: absorb momentum of incoming ball by releasing a flipper
- Shielding: narrowing the drain diameter as the ball moves by clever flipper positioning
- Micro flip: dropping an active flipper just enough to bump a cradled ball

### Lamp Groups

- General illumination
- Controlled lamps - reflect perisstent state
- Flash lamps - momentary indicators

### Playfield features

- Ball guides
- Wire guides
- Ramps
- Bumpers
  - Passive / Dead Bumpers
  - Pop Bumpers
  - Disappearing Bumpers
- Rollovers
  - Lane rollovers
  - Star rollovers: omnidirectional
- Slingshots: Non-bumper-shaped bumpers that kick the ball
- Spinners: Reward more points for more spining (harder shots)
- Ejectile / Saucer / Kicker
  - Shallow divot that holds the ball for a second and then kicks it out
  - Upkicker / VUK / Popper: Same but vertical, usually into upper ramps
- Targets
  - Drop Targets: drop until you have the set, then return
  - Flyaway Targets: flips up and stays there
  - Bullseye Targets: may not have a special mechanic
  - Standup Targets: don't move or retract when hit
- Captive Ball: Holds the ball, blocking the lane
- Tunnels
  - Under-table runway that spits the ball out somewhere else
  - Cellar hole / subway: entrance to tunnels)
- Lanes: Any guided path, often includes rollovers
  - Inlane: Goes to flippers
  - Outlane: Goes to drain, sometimes has a Kickback
- Stopper / Saver / Magic Post
  - Temporarily blocks the drain
- Kickback: stopper for the outlane
- Magnets
- Orbit: ramp goes all the way around the back of the playfield


