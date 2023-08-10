
## nnNOWww

### Rules

#### Transcribed Ruleset (from the cabinet)

    Instructions
    - 1, 2, 3 OR 4 PLAYERS - 5 BALLS PER PLAYER
    - Insert one coin and wait for the machine to reset before inserting
      coin for second player.
    - Players take turns shooting as shown on back glass.
    - Points are scored as indicated.
    - Hitting a drop target scores 100 points and adds 100 points to
      corresponding bonus.
    - A tilt does not disqualify a player.
    - 1 replay for matching last number in score to number
      that appears on back glass after game is over.

#### Script Analysis (loserman76)

- Bumpers award 1pt when unlit and 10pts when lit

- Newgame sequence
  - From bootup mode
    - Spend a credit
    - Startup sounds
    - Set match reel (literally random)
    - InProgress=true
    - BonusMultiplier=1
  - From reset timer (???)
    - InProgress=true
    - For each player
      - Reset score
      - Reset replay payouts
      - @nd lane light on
      - Reset droptargets
      - Bonus lights on
      - Run ZeroToNine from 9 (will inc to 0 first)

- New ball sequence
  - If you've run out of balls or credits
    - Reset flippers
    - Lights off
    - Bumpers off
    - Check for points-match replay
  - Otherwise start a new round
    - Reset droptargets
    - Reset bonus multiplier

#### Script analysis (spanish)

- There are 8 slignshots in this version, each one awards 10 points always
- Awards extra credits at certain score milestones?

        ' Up = current player
        ' AwardSpecial adds a credit
        ' I think the credit1..3 are just for tracking which have been awarded already
        sub displayscore()
          if score(up) >= 6000 and credit1(up)=false then
            awardspecial
            credit1(up)=true
          end if
          if score(up) >= 7500 and credit2(up)=false then
            awardspecial
            credit2(up)=true
          end if
          if score(up) >= 9900 and credit3(up)=false then
            awardspecial
            credit3(up)=true
          end if
        end sub

### FX Ideas

[ ] chromatic ball trails
[ ] move stripes
[ ] cycle face colors
[ ] cycle hair colors
[ ] basic strobing
[ ] paint splashes
[ ] paint trails from eyes
[ ] background dropout to stripe tunnel, or starfield
[ ] face animation
[ ] hair animation
[ ] particles
[ ] silhouette mode
[ ] smoke trails on ball
[ ] smoke UV offset in bg
[ ] target banks get brighter as multiplier increases
[ ] e^-x glow outlines
[ ] explode ball on drain

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
