export const PROLOGUE = {
  top: 'Prologue',
  title: 'The Hearth Goes Out',
  body: [
    'Long ago, the Hearth burned at the center of the world. Every window, every kitchen, every heart glowed with its warmth.',
    'Then the Gloom came, a creeping dark that drinks light. The Hearth shattered into shards and went out, and the shards were scattered across ten forgotten realms.',
    'You are Ember, the last spark, no bigger than a thought. A faint voice still hums inside you: the memory of the fire. It says: <i>gather the shards, and relight the Hearth.</i>',
  ],
};

export const LEVELS = [
  {
    name: 'Mossy Hollow', realm: 'Realm I', theme: 'forest',
    sky: 0x14243a, fog: 0x1e3b3c, top: 0x8bd45a, rock: 0x5a4533, glow: 0x9cff7a,
    count: 12, gap: [1.4, 2.6], size: [4.2, 6], dy: [-0.4, 0.9], lateral: 0.45,
    shards: 5, ice: 0, moving: 0, crumble: 0, enemies: 2, chase: 0, speed: 2.2,
    pads: 2, powerups: 2, anchors: 1, par: 90, wind: 0,
    voice: [
      { at: 0.2, text: 'Easy, little spark. Every jump is a small act of faith.' },
      { at: 0.55, text: 'Do you feel that? The moss is warming up around you.' },
      { at: 0.85, text: 'The portal is close. I can almost smell woodsmoke.' },
    ],
    hint: 'Shift dashes (and burns wisps). Green pads launch you. Find the hidden diary page.',
    lore: 'Day 1. Mother says I am old enough to tend the Hearth. I am so proud I could burst. It is warm here, and everyone smiles when they pass the window.',
    echo: 'A warm hand rests on a small shoulder in the memory. Somewhere inside you, Cinder hums the tune before you hear it.',
    intro: [
      'The forest remembers warmth. Moss still glows where the old fire once touched it.',
      'A wisp of Gloom drifts between the trees. It cannot stand your light. Press <b>F</b> and your Flare will burn it away. Hold <b>Shift</b> to dash: wisps cannot survive a dash either.',
    ],
    outro: [
      'The first shard-light stirs in your chest, and the moss around you blooms for a moment.',
      '<i>"Little spark... you are warmer than I remembered. Go north. Frostfall Pass is calling."</i>',
    ],
  },
  {
    name: 'Frostfall Pass', realm: 'Realm II', theme: 'ice',
    sky: 0x1a2b4a, fog: 0x2b4768, top: 0xcff4ff, rock: 0x6c8fb3, glow: 0x9be8ff,
    count: 16, gap: [1.6, 2.9], size: [3.8, 5.4], dy: [-0.5, 1.0], lateral: 0.55,
    shards: 6, ice: 0.65, moving: 0.12, crumble: 0, enemies: 3, chase: 0.34, speed: 2.8,
    pads: 2, powerups: 2, anchors: 2, lumen: 0.12, par: 140, wind: 15,
    voice: [
      { at: 0.2, text: 'Frost keeps secrets. Some of these bridges only appear in firelight. Use your Flare.' },
      { at: 0.55, text: 'The families used to sing here. Listen: the wind still remembers the tune.' },
      { at: 0.85, text: 'Nearly through. Do not let the ice have your footing.' },
    ],
    hint: 'Ice is slippery. When the gale blows, it pushes you in the air.',
    lore: 'Day 212. Frostfall is quiet now. The families stopped coming when the snow got deep. I light the Hearth anyway, in case they remember the way.',
    echo: 'Footprints in the snow lead to the window, and stop. <i>"Someone used to wait here,"</i> says Cinder, and does not say who.',
    intro: [
      'Here the cold bites harder than the Gloom itself. The ice is as smooth as a held breath.',
      'Some wisps have learned to hunt. They will follow you across the frozen bridges, so keep your Flare ready. And when the gale rises, the wind will push you through the air.',
    ],
    outro: [
      'Frost melts in a small circle around your feet. Beneath it, the old stones carry names: the families who gathered here for warmth.',
      '<i>"They kept the fire together," says the voice. "Alone, it is only a flame. Together, it is a home."</i>',
    ],
  },
  {
    name: 'Cinder Ruins', realm: 'Realm III', theme: 'lava',
    sky: 0x2a0e12, fog: 0x4a1a14, top: 0xffa245, rock: 0x3a2a2a, glow: 0xffb347,
    count: 18, gap: [1.8, 3.1], size: [3.6, 5], dy: [-0.5, 1.1], lateral: 0.6,
    shards: 6, ice: 0, moving: 0.1, crumble: 0.3, enemies: 3, chase: 0.4, speed: 3.1,
    pads: 1, powerups: 2, spinners: 3, geysers: 4, spitters: 1, anchors: 2, par: 170, wind: 0,
    voice: [
      { at: 0.2, text: 'The smiths never learned to build anything slowly. Mind the blades.' },
      { at: 0.55, text: 'I used to hear hammers here. Now only the fire talks to itself.' },
      { at: 0.85, text: 'Almost out of the forge. You are braver than the smiths ever were.' },
    ],
    hint: 'Hop over spinning blades. Geysers glow before they erupt. Lanterns save your place.',
    lore: 'Day 600. The smiths have gone. I told the Hearth they would be back by spring. It flickered at me. I think it knew I was lying.',
    echo: 'The anvils glow for a heartbeat. <i>"Spring never came,"</i> Cinder murmurs. <i>"I am sorry I never told you that."</i>',
    intro: [
      'The forge-city of the Hearth smiths. Its fires burned so hot that the ground never forgot.',
      'The old stones crumble beneath you. Do not stand still, and do not trust the cracks. The smiths\' blades still spin, and the geysers still wake. Light the old lanterns to save your place.',
    ],
    outro: [
      'You find the smiths\' last anvil. A single sentence is carved into it: <i>"We built the Hearth to be shared. Someone kept it all to themselves."</i>',
      'The voice falls quiet for a long while. Then: <i>"Onward. The library."</i>',
    ],
  },
  {
    name: 'The Drowned Library', realm: 'Realm IV', theme: 'library',
    sky: 0x0b2630, fog: 0x14414a, top: 0x6fe3d0, rock: 0x2c4a54, glow: 0x7ff3e6,
    count: 20, gap: [1.8, 3.2], size: [3.6, 5], dy: [-0.5, 1.1], lateral: 0.6,
    shards: 7, ice: 0.1, moving: 0.3, crumble: 0.12, blink: 0.2, enemies: 3, chase: 0.6, speed: 3.4,
    pads: 2, powerups: 3, spinners: 1, spitters: 2, anchors: 2, lumen: 0.15, par: 200, wind: 0,
    voice: [
      { at: 0.2, text: 'It is raining indoors. Of course it is. Nothing in this place stayed where it belonged.' },
      { at: 0.55, text: 'Hear the thunder? That is not weather. That is the Gloom, clearing its throat.' },
      { at: 0.85, text: 'Keep going. I think the Keeper wrote their last pages up ahead.' },
    ],
    hint: 'Ghost platforms fade in and out. Spitters fire dark orbs: burn them with Flare.',
    lore: 'Day 901. The library flooded. I saved one book and it is blank. I do not think I can write anything good in it anymore.',
    echo: 'The blank book glows faintly in your mind. <i>"Write anything,"</i> says Cinder. <i>"A first line is enough. I always told them that."</i>',
    intro: [
      'Water has swallowed the great library, but the books still float, whispering every story the Hearth ever warmed.',
      'One of them is open. It tells of a Keeper, a child who tended the Hearth alone through the longest winter. Some shelves flicker in and out of the water, and the Spitters guard the aisles.',
    ],
    outro: [
      'You read the last page before the ink fades: <i>"The Keeper lost everyone they loved, one by one. To protect the Hearth from grief, they sealed it in the dark."</i>',
      'Your light trembles. <i>"Ember... the Gloom is not an invader. It is a sorrow, and it has been waiting for someone to come back."</i>',
    ],
  },
  {
    name: 'The Long Night', realm: 'Realm V', theme: 'night',
    sky: 0x0a0618, fog: 0x1a1030, top: 0x9a8cff, rock: 0x241c3a, glow: 0xb8a8ff,
    count: 16, gap: [1.8, 3.0], size: [3.8, 5.2], dy: [0.55, 1.2], lateral: 0.5,
    shards: 6, ice: 0, moving: 0.15, crumble: 0.15, blink: 0.1, lumen: 0.15, enemies: 3, chase: 0.8, speed: 3.2,
    pads: 2, powerups: 3, spinners: 1, spitters: 1, anchors: 3, par: 140, wind: 0, tide: 0.5,
    voice: [
      { at: 0.1, text: 'It is rising, Ember. The Gloom is climbing the stair behind you. RUN.' },
      { at: 0.5, text: 'Light the lanterns! They push the dark back. Do not stop for anything else.' },
      { at: 0.85, text: 'You are outrunning your own shadow, little spark. Do not look back.' },
    ],
    hint: 'The Gloom is rising behind you. Keep climbing. Lanterns push it back.',
    lore: 'Day 1200. It rose tonight, the dark. I think it is me. I think I am the one making it. I do not know how to make it stop.',
    echo: 'The dark rises, and Cinder holds very still. <i>"I know this cold. I felt it the night I stopped being able to reach them."</i>',
    intro: [
      'Night falls early in the fifth realm, and it does not fall from the sky. It rises from the ground like a tide of ink.',
      'The Gloom is moving, and it is coming for you. Climb the old stair of lamps. Do not stand still, and do not stop to look down.',
    ],
    outro: [
      'You break through the top of the stair as the dark crashes against the last lantern and turns back, hissing.',
      '<i>"That was not an enemy chasing you, Ember,"</i> says the voice. <i>"That was a heart, running out of places to hide. And it has hidden in many places before this one. Follow its memories upward."</i>',
    ],
  },
  {
    name: 'The Glass Orchard', realm: 'Realm VI', theme: 'glass',
    sky: 0x2a1838, fog: 0x4a2a5a, top: 0xffc8f0, rock: 0x8a6aa8, glow: 0xff9be8,
    count: 20, gap: [2.0, 3.3], size: [3.4, 4.8], dy: [-0.4, 1.0], lateral: 0.6,
    shards: 7, ice: 0.2, moving: 0.1, crumble: 0.08, blink: 0.1, lumen: 0.3, enemies: 4, chase: 0.5, speed: 3.4,
    pads: 2, powerups: 3, spinners: 1, spitters: 2, anchors: 3, par: 230, wind: 14,
    voice: [
      { at: 0.2, text: 'Glass trees. I remember the Keeper planting one for every person who left.' },
      { at: 0.55, text: 'They never grew. They only shone. And they shatter when the wind turns.' },
      { at: 0.85, text: 'Do not look at your reflection too long. It remembers everything.' },
    ],
    hint: 'Light bridges and strong gusts. Flare the dark gaps and time your jumps against the wind.',
    lore: 'Day 1500. I planted a tree for everyone who left. I stopped counting at forty. They do not grow. They only shine, and they break when the wind blows.',
    echo: 'Every glass tree rings softly. <i>"Forty trees,"</i> Cinder whispers. <i>"I counted too. I counted every one."</i>',
    intro: [
      'The orchard was the Keeper\'s first attempt at hope: one tree for everyone who left. But the trees turned to glass, and the glass remembers every face.',
      'The bridges between the branches only exist in firelight, and the wind carries the sound of old goodbyes. Use your Flare, and mind the gusts.',
    ],
    outro: [
      'You step out of the orchard with a pocketful of reflections. Each one is a small, forgotten smile.',
      '<i>"They were not sad trees,"</i> says the voice, almost to itself. <i>"They were full of people. The Keeper only saw the empty branches."</i>',
    ],
  },
  {
    name: 'The Clockwork Spire', realm: 'Realm VII', theme: 'brass',
    sky: 0x2a1c10, fog: 0x4a3018, top: 0xe8b860, rock: 0x6a4a2a, glow: 0xffd27a,
    count: 22, gap: [2.0, 3.4], size: [3.4, 4.8], dy: [0.4, 1.1], lateral: 0.5,
    shards: 8, ice: 0, moving: 0.32, crumble: 0.1, blink: 0.1, lumen: 0, enemies: 4, chase: 0.6, speed: 3.6,
    pads: 2, powerups: 3, spinners: 4, geysers: 3, spitters: 2, anchors: 3, par: 260, wind: 0,
    voice: [
      { at: 0.2, text: 'Hear that ticking? Every clock in here stopped at the same minute.' },
      { at: 0.55, text: 'The Keeper built this tower to stop time. Winter was supposed to stay still.' },
      { at: 0.85, text: 'You are keeping better time than the whole tower, little spark.' },
    ],
    hint: 'Blades, steam geysers and moving gears. Everything here runs on a rhythm: learn it.',
    lore: 'Day 1800. I built a clock that only counts to the moment they left. It never gets any later. Maybe that is exactly what I wanted.',
    echo: 'The clock ticks backward for a beat. <i>"It is all right to let the hour move,"</i> says Cinder. <i>"It was never your fault that it stopped."</i>',
    intro: [
      'A tower of brass and stopped clocks, built by someone who wanted winter never to end, because the alternative was the spring that would not bring anyone back.',
      'Every gear here still turns, out of habit. Blades sweep, steam bursts, and the floors slide on rails. Learn the rhythm.',
    ],
    outro: [
      'At the top, every clock face reads the same minute. You reach out and nudge one hand forward, and somewhere below, a tiny bell rings.',
      '<i>"Time moved,"</i> whispers the voice. <i>"Just one minute. But it was the first one in a very long time."</i>',
    ],
  },
  {
    name: 'Starfall Reach', realm: 'Realm VIII', theme: 'star',
    sky: 0x050a28, fog: 0x0c1848, top: 0xfff0b0, rock: 0x2a3868, glow: 0xffe680,
    count: 18, gap: [2.8, 4.1], size: [3.0, 4.2], dy: [-0.3, 0.9], lateral: 0.7,
    shards: 7, ice: 0, moving: 0.15, crumble: 0, blink: 0.3, lumen: 0.15, enemies: 4, chase: 0.7, speed: 3.7,
    pads: 3, powerups: 4, spinners: 2, spitters: 3, anchors: 5, par: 230, wind: 10,
    voice: [
      { at: 0.2, text: 'The gaps are wide here. Glide. Grapple. The Keeper came here to beg the stars for help.' },
      { at: 0.55, text: 'They did not answer. They fell instead, one by one, trying to reach the ground.' },
      { at: 0.85, text: 'Almost there. I can feel the Keeper nearby, like a held breath.' },
    ],
    hint: 'Wide gaps: glide after your double jump, and grapple to the golden rings.',
    lore: 'Day 2100. I asked the stars to bring the Hearth back. They fell instead, one by one. I think they were only trying to come to me.',
    echo: 'A star lands in your light and goes quiet. <i>"They were never falling away from the Keeper,"</i> says Cinder. <i>"They were falling toward home."</i>',
    intro: [
      'On the longest night of the Keeper\'s life, they climbed this mountain and begged the stars to relight the Hearth. The stars answered by falling.',
      'The wreckage floats here, island after island, with gaps wider than any jump. Glide. Grapple. Trust the rings.',
    ],
    outro: [
      'You catch a falling star in both hands. It is small, and warm, and it hums a tune you almost remember.',
      '<i>"They were not refusing,"</i> says the voice. <i>"They were coming. Just too slowly for someone who was waiting."</i>',
    ],
  },
  {
    name: 'The Drowning Hour', realm: 'Realm IX', theme: 'flood',
    sky: 0x061a22, fog: 0x0e3038, top: 0x6ad0e0, rock: 0x1c3c48, glow: 0x7ff3ff,
    count: 22, gap: [2.0, 3.4], size: [3.2, 4.6], dy: [0.7, 1.3], lateral: 0.5,
    shards: 8, ice: 0, moving: 0.2, crumble: 0.2, blink: 0.15, lumen: 0.1, enemies: 4, chase: 0.8, speed: 3.8,
    pads: 3, powerups: 4, spinners: 2, spitters: 2, anchors: 4, par: 190, wind: 0, tide: 0.62,
    voice: [
      { at: 0.1, text: 'This is the flood. It is the darkest the Gloom ever got. Climb, Ember. Climb!' },
      { at: 0.5, text: 'Every lantern you light buys you time. Do not skip a single one.' },
      { at: 0.85, text: 'You are almost above the water. Hold on. Do not look down.' },
    ],
    hint: 'The flood rises fast. Light every lantern, and never stop climbing.',
    lore: 'Day 2400. I cried until the floor was gone. The dark rose to meet me. It was warm in a terrible way, and I let it in.',
    echo: 'The water goes still around you. Cinder sings three notes of a lullaby, small and cracked. <i>"I could not reach them down here. Now I can."</i>',
    intro: [
      'This is where the Keeper finally broke. They cried until the world had no floor, and the dark rose to meet them, warm and endless.',
      'The flood is faster than the night, and meaner. Light every lantern, use every ring, and do not stop climbing.',
    ],
    outro: [
      'You burst through the surface of the dark and gasp, a spark above a sea of grief.',
      '<i>"Now you have seen it all,"</i> says the voice, and it sounds like it is crying. <i>"One realm left. The Heart. And the Keeper, who is not a monster. Be gentle."</i>',
    ],
  },
  {
    name: 'The Cold Heart', realm: 'Realm X', theme: 'boss',
    sky: 0x120a1e, fog: 0x2a1238, top: 0xd9a8ff, rock: 0x2a2038, glow: 0xff7ad9,
    count: 18, gap: [2.1, 3.5], size: [3.4, 4.6], dy: [0.3, 1.1], lateral: 0.5,
    shards: 9, ice: 0.08, moving: 0.24, crumble: 0.16, blink: 0.16, enemies: 5, chase: 0.8, speed: 3.9,
    pads: 2, powerups: 4, spinners: 3, spitters: 3, anchors: 4, lumen: 0.12, par: 260, wind: 10, bossHp: 8,
    voice: [
      { at: 0.25, text: 'I am afraid, Ember. I will not say it twice. Keep climbing.' },
      { at: 0.6, text: 'The air is thin and cold. That is the Heart breathing.' },
      { at: 0.9, text: 'Whatever is up there was a person once. Remember that when you flare.' },
    ],
    boss: true, endSize: 22,
    hint: 'Climb to the Cold Heart. Flare warms it. Jump or dash through its shockwaves and shots.',
    lore: 'Last page. If you are reading this, the fire is still out. Please do not be angry with me. I only did not want to be alone while it went out.',
    intro: [
      'The last realm hangs upside down in the sky, a staircase of broken glass leading to the Cold Heart, where the Hearth once stood.',
      'Gather every shard on the way up. You will need them all. And you will need to be brave. Everything you have learned will be tested.',
    ],
    outro: [],
  },
];

export const BOSS_DEAD = {
  top: 'The Cold Heart',
  title: 'The Gloom Cracks',
  body: [
    'The dark shell warms, softens, and splits like an eggshell. Inside is not a monster, but a child holding a lantern that is far too big for their hands.',
    '<i>"I only wanted it to stop hurting,"</i> says the Keeper. <i>"When the fire went out, I wrapped myself in the dark so no one could take anything else from me."</i>',
    'The voice inside you steps forward, brighter than it has ever been. <i>"I should have told you who I am. I am the first flame the Keeper\'s mother lit in this Hearth. When she went out, I hid in the last spark I could find, so someone could carry me home."</i>',
    'Ember glows softly. <i>"You do not have to keep it alone anymore."</i> Walk to the Hearth.',
  ],
};

export const CHOICE = {
  top: 'The Hearth',
  title: 'One Last Choice',
  body: [
    'The Hearth stands cold, and the last shard is warm in your light. Cinder, the Keeper and you stand around it.',
    'There are two ways to wake it. You can place the shard and light it <b>together</b>, three small flames sharing one fire. Or you can step into the Hearth and <b>become</b> it, burning steady for the world.',
  ],
  together: 'Light it together',
  become: 'Become the Hearth',
};

export const ENDINGS = {
  together: {
    top: 'Epilogue',
    title: 'The Hearth Burns Again',
    body: [
      'You place the last shard. The Hearth wakes, and warmth rolls across all ten realms: the moss, the frost, the cinders, the drowned books, the glass, the gears and the stars.',
      'The Keeper takes your hand, small light in small light, and Cinder settles between you like a lullaby coming home. In windows far below, a thousand lamps flicker on, one by one.',
      'The Gloom was never the end of the fire. It was only the fire, waiting to be shared.',
    ],
  },
  become: {
    top: 'Epilogue',
    title: 'The Fire That Stays',
    body: [
      'You step into the Hearth, and it does not hurt. It feels like being remembered. The shards sing, the dark lets go, and warmth rolls across all ten realms: the moss, the frost, the cinders, the drowned books, the glass, the gears and the stars.',
      'The Keeper kneels by the fire and does not look away. Cinder leaves your light and settles on their shoulder, a small warmth that goes wherever they go.',
      'Every night, a child tends a Hearth that has a heartbeat now. And every night, it burns a little brighter when they say hello.',
    ],
  },
};

export const DIARY_TIERS = [
  { min: 0, text: 'Most of the Keeper\'s diary is still unread. They smile anyway, and promise to write the rest down, someday, with you in it.' },
  { min: 4, text: 'You read most of the diary. The Keeper nods. <i>"You know the worst of me,"</i> they say, <i>"and you stayed."</i>' },
  { min: 10, text: 'And in the Keeper\'s blank book, in a careful child\'s hand, a first line appears: <i>"Today the Hearth is warm."</i> Cinder hums the whole lullaby, and the Keeper hums it back. (You found every diary page.)' },
];
