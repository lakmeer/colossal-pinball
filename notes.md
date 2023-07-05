
# TODO

- Make Zone an interface
  - Force
  - Sink
  - Well
  - Slow
- Remove 'intersects' from Collider and give it to Zone
- Change the intersection overlay to a collision overlay, test
  each point with a fake Ball and mark how far it gets moved,
  use this value to create a heatmap over the table.

- Whole game state as object, pass to renderer, make reactive

- Table
  - Split into horizontal chunks
  - Simulate any chunks with balls in, and their neighbours
  - Minimap
  - Launcher


## Pinball terms

### General

- Flippers
- Plunger
- Apron (lowest assembly)
- Return lane
- Tilt/smash sensors

### Techniques

- Lock shot
  - Holds the ball
  - Gives you a new ball,
  - Releases when multiball is activated

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
- 


