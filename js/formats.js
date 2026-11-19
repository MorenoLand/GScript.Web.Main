const fileFormatTabs = [
  {
    id: 'overview',
    label: 'Overview',
    icon: 'fas fa-compass',
    title: 'Format map',
    lead: 'A practical reference for the level, map, and animation files used by the classic tools.',
    chips: ['.nw', '.gmap', '.gani', '.zelda', '.graal', '.gupd', '.gpak'],
    sections: [
      {
        title: 'Format map',
        rows: [
          ['.nw', 'Text level: a 64 x 64 tile board, links, signs, chests, baddies, NPCs, and optional coarse heights.'],
          ['.gmap', 'Text world grid: WIDTH x HEIGHT levels, level names, terrain corners and seeds, optional TILEMAP.'],
          ['.gxml', 'XML scene tile map: image maps, animations, sprites, and tile layers.'],
          ['.gani', 'Text animation: sprites, frame rows, effects, sounds, and an optional script.'],
          ['.zelda / .graal', 'Legacy binary level: a packed 4096-tile board, then object sections.'],
          ['.gupd', 'Text update manifest: files, version, mode, and subpackages.'],
          ['.gpak / .gpake', 'ZIP archive packages: .gpak plain, .gpake with DES-ECB encrypted entries.'],
          ['Terrain', 'Optional height data inside .nw or .gmap, generated into a 65 x 65 field.']
        ]
      },
      {
        title: 'How the pieces fit',
        points: [
          'A .nw is one level. A .gmap arranges .nw files into a world and can carry shared terrain.',
          'A .gxml is a scene, not a level grid; it supplies its own image maps and tile layers.',
          'A .gani is referenced by objects; it is not part of the level board.',
          '.gupd tells a client what to download; .gpak and .gpake package files into a mountable archive.'
        ]
      },
      {
        title: 'Where to start',
        points: [
          'Reading or writing a level: the .nw tab, then the .gmap tab for worlds.',
          'Working with terrain: the Terrain tab after the .gmap height sections.',
          'Building an animation: the .gani tab.',
          'Shipping files to clients: the .gupd and .gpak tabs.'
        ]
      }
    ]
  },
  {
    id: 'nw',
    label: '.nw',
    icon: 'fas fa-border-all',
    title: '.nw level files',
    lead: 'Text levels begin with GLEVNW01 and are made from command lines plus block sections.',
    sections: [
      {
        title: 'File skeleton',
        code: 'GLEVNW01\nBOARD 0 0 64 0 <128 base64 chars>\n...\nBOARD 0 63 64 0 <128 base64 chars>\n\nLINK level2.nw 10 20 4 2 30 40\nSIGN 12 18\nText shown by the sign.\nSIGNEND\n\nCHEST 8 9 greenrupee 0\nNPC image.png 20 22\n// script\nNPCEND\nTILESET pics1.png',
        note: 'The editor writes one BOARD line per row for layer 0. Extra layers are written only where tiles exist.'
      },
      {
        title: 'Plain text notes',
        points: [
          'The old binary formats use run-length encoded tile packets, so tiny/simple levels can be very small.',
          '.nw writes text. A normal 64x64 base layer alone is 64 BOARD lines and about 9.3 KB before objects.',
          'That sounds wasteful, but text compresses well with lz/gzip and is much easier for tools and people to inspect.'
        ]
      },
      {
        title: 'Atlas and collision',
        points: [
          'Levels are 64 x 64 tiles. Tiles are 16 x 16 pixels from a packed tileset atlas, usually pics1.png.',
          'Older atlas layouts can be 116 x 32 tiles; later tooling usually treats the atlas as 128 x 32.',
          'Tile collision is not stored per level in these formats. It is hard-coded behavior or arrays.dat.'
        ]
      },
      {
        title: 'Terrain block (optional)',
        code: 'HEIGHTS\n0,0,12,18,20,24,18,9,0\n...\nHEIGHTSEND',
        note: 'Nine rows of nine comma-separated floats: the corners of the 8 x 8 tile blocks (64 / 8 + 1 = 9). Only the first nine rows and the first nine values of a row are read; an empty line also ends the block. Without this block the level is flat at height 0 unless a gmap supplies terrain.'
      },
      {
        title: 'How level terrain is used',
        points: [
          'A level inside a gmap inherits the gmap borders and seed; its own HEIGHTS block only refines the generated 65 x 65 field.',
          'The fine field is generated at load time, not stored in the .nw file. See the Terrain tab for the exact math.'
        ]
      },
      {
        title: 'Tile base64 encoding',
        code: 'base64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"\n\n// Each .nw tile is two characters.\nvalue = base64.indexOf(char1) * 64 + base64.indexOf(char2)\n\n// Convert packed value to the classic tileset atlas coordinate.\ntileX = (value & 0xF) + 16 * floor((value >> 4) / 32)\ntileY = (value >> 4) % 32\n\n// Convert atlas coordinate back to a two-character .nw tile.\nvalue = floor(tileX / 16) * 512 + (tileX % 16) + tileY * 16\nchar1 = base64[value >> 6]\nchar2 = base64[value & 0x3F]',
        note: 'A BOARD row with width 64 has 128 characters because every tile is exactly two base64 characters. The same atlas math decodes the 12-bit and 13-bit tile packets in .zelda and .graal.'
      },
      {
        title: 'Level entries',
        rows: [
          ['BOARD x y width layer data', 'Tile run. Each tile is two base64 characters. The default board is usually 64 rows of width 64 on layer 0.'],
          ['LINK nextLevel x y width height nextX nextY [nextLayer layer]', 'Warp rectangle in Suite .nw files. Older docs describe LevelName Width Height X Y NewX NewY, so importers should be prepared for legacy ordering.'],
          ['SIGN x y [layer]', 'Text block ending at SIGNEND.'],
          ['CHEST x y item signIndex [layer]', 'Treasure chest. Item names use the editor item table.'],
          ['BADDY x y type [layer]', 'Baddy block with up to three verse lines, ending at BADDYEND.'],
          ['NPC image x y [layer]', 'NPC block ending at NPCEND. Use - for no image.'],
          ['TILESET filename [type]', 'Tileset metadata, commonly pics1.png.']
        ]
      },
      {
        title: 'Level object basics',
        rows: [
          ['Links', 'Integer rectangles that move the player to another level and destination coordinate. NewX/NewY can be decimal values or playerx/playery in old data.'],
          ['Baddies', 'Enemy entries with x, y, type, and three optional verse strings: on notice, on hit, and when hurt.'],
          ['Signs', 'Indexed text strings used for signs, dialog, and other message boxes.'],
          ['Treasure boxes', '2x2 chests with an item type and optional sign/message index. They hold built-in items, not NPCs.'],
          ['NPCs', 'Self-contained scripted objects with x/y, optional image, and source code. NPC weapons can persist with the player, but a level file entry is just coordinates, image, and code.']
        ]
      },
      {
        title: 'Link parameter order',
        rows: [
          ['Old document order', 'LevelName Width Height X Y NewX NewY. This is the ordering stated for the historical file formats.'],
          ['Editor .nw order', 'nextLevel X Y Width Height nextX nextY. The current level editor reads and writes this order for its .nw files.']
        ],
        note: 'Importers should be ready for both orders; the field names are the only reliable signal.'
      }
    ]
  },
  {
    id: 'gmap',
    label: '.gmap',
    icon: 'fas fa-map',
    title: '.gmap maps',
    lead: 'A GMAP is a text manifest that arranges level files into a larger world grid.',
    sections: [
      {
        title: 'Core shape',
        code: 'GRMAP001\nWIDTH 3\nHEIGHT 2\nTILESET pics1.png\nLEVELNAMES\nlevel_a.nw,level_b.nw,level_c.nw\nlevel_d.nw,level_e.nw,level_f.nw\nLEVELNAMESEND',
        note: 'Suite reads WIDTH, HEIGHT, TILESET, and LEVELNAMES. The grid rows are comma-separated filenames.'
      },
      {
        title: 'How editors merge it',
        points: [
          'Each grid cell is one 64x64 level.',
          'The editor loads the referenced .nw files, offsets their tiles by cellX * 64 and cellY * 64, and merges objects the same way.',
          'Missing levels leave empty cells instead of invalidating the whole map.'
        ]
      },
      {
        title: 'Keywords',
        rows: [
          ['WIDTH n / HEIGHT n', 'Grid size in levels. The map covers WIDTH * 64 by HEIGHT * 64 tiles.'],
          ['LEVELNAMES ... LEVELNAMESEND', 'One comma-separated row per grid row. Entries are level file names.'],
          ['GENERATED name_.png', 'Builds LEVELNAMES from a pattern. The prefix is the text before the first underscore, the suffix starts at the first dot, the column is a letter (two for a grid at least 26 wide, high letter first), and the row is 1-based, padded to two digits at height 10 or more and three at 100 or more.'],
          ['GENSEED n', 'Map seed used while generating the shared borders.'],
          ['LEVHEIGHT n / LEVCHAOS n', 'Level height deviation and chaos. Defaults are 4.0 and 0.6.'],
          ['HEIGHTMAP ... HEIGHTMAPEND', 'HEIGHT + 1 rows of WIDTH + 1 comma-separated corner heights.'],
          ['RANDOMSEEDS ... RANDOMSEEDSEND', 'HEIGHT rows of WIDTH per-level 32-bit seeds.'],
          ['HEIGHTS level ... HEIGHTSEND', 'Nine rows of nine coarse heights for one level.'],
          ['MINIMAPIMG file', 'Minimap picture.'],
          ['NOAUTOMAPPING', 'Marks the tile map as loaded.'],
          ['TILEMAP file [tileset]', 'Loads a tile map, optionally with its tileset.']
        ],
        note: 'Unknown keywords and short lines are ignored. The grid size is applied at the end. Height and seed sections may list more rows than the grid; out-of-range writes are ignored.'
      },
      {
        title: 'Terrain sections',
        points: [
          'HEIGHTMAP is a corner grid, not a tile grid: (WIDTH + 1) * (HEIGHT + 1) values in row-major order.',
          'RANDOMSEEDS holds one seed per level: WIDTH * HEIGHT values, row-major.',
          'HEIGHTS holds a 9 x 9 coarse grid per level: corners of 8 x 8 tile blocks.',
          'A gmap with HEIGHTMAP has heights. A level without its own or inherited heights stays flat at 0.'
        ]
      },
      {
        title: 'Indexing the terrain arrays',
        code: 'corner(row, column) = row * (WIDTH + 1) + column\nseed(row, column)   = row * WIDTH + column\n\n// A HEIGHTMAP row has WIDTH + 1 values;\n// a RANDOMSEEDS row has WIDTH values.'
      }
    ]
  },
  {
    id: 'gxml',
    label: 'GXML',
    icon: 'fas fa-layer-group',
    title: 'GXML tile maps',
    lead: 'GXML is an XML scene format for image maps, animations, sprites, and tile layers.',
    chips: ['.gxml', 'TILEMAP', 'TTileMap'],
    sections: [
      {
        title: 'Where it is used',
        rows: [
          ['Gmap line', 'TILEMAP yourmap.gxml loads the scene into the gmap tile map.'],
          ['Script', 'TTileMap.loadTileMapXML(path) loads it into a map a script made. The older loadTileMap(level, datablocks) pair is deprecated.'],
          ['Normal view', 'A gmap with TILEMAP uses the tile map for the view matrix and draw list, so the normal game view renders it.'],
          ['GUI', 'GuiTilesCtrl loads it with loadTileMapXML and draws it inside a control, with camera position, size and bounds.'],
          ['File place', '.gxml is a map file, so it belongs under maps/.']
        ]
      },
      {
        title: 'Document structure',
        code: '<level>\n  <layerconfig layer="0" sortmode="off"/>\n  <imagemaps>...</imagemaps>\n  <animations>...</animations>\n  <objects>...</objects>\n  <tilelayers>...</tilelayers>\n</level>',
        note: 'Only a level root is read. layerconfig sets the sort mode of a layer numbered 0-31; the other four sections hold one child per image map, animation, sprite, or tile layer.'
      },
      {
        title: 'Tile layers',
        code: '<tile x="12" y="7" imageMap="tiles" frame="0"\n      animationName="" flags="collision,fliphorizontal"/>',
        rows: [
          ['x, y', 'Tile position in the layer grid.'],
          ['imageMap', 'Name of an image map declared in the imagemaps section.'],
          ['frame', 'Frame number in that image map.'],
          ['animationName', 'Name of an animation declared in the animations section.'],
          ['flags', 'Comma list; collision, fliphorizontal and flipvertical are recognized.']
        ],
        note: 'A non-tile child of a tile layer sets a layer setting by its element name, with the element text as the value. If tile size is missing or not above zero, it becomes the layer size divided by the tile count.'
      },
      {
        title: 'Image maps, animations and sprites',
        points: [
          'An entry under imagemaps uses its xmlname attribute as the image map name; its other children are copied as settings.',
          'An entry under animations does the same for an animation name.',
          'An entry under objects makes a sprite and copies its child settings; the sprite is added to the layer its settings name.'
        ]
      },
      {
        title: 'Display and ownership',
        points: [
          'A gmap of one level takes its size from the tile map; a multi-level gmap keeps its grid size.',
          'When a level owns the map, the map is protected from script changes and reloads when the file changes.',
          'GuiTilesCtrl is a separate display path: it owns its own map and its camera properties.',
          'TTileMap.loadTileMapXML is the script path for data processing; a bare TTileMap does not draw by itself.'
        ]
      }
    ]
  },
  {
    id: 'classic',
    label: '.zelda / .graal',
    icon: 'fas fa-box-archive',
    title: '.zelda and .graal binary levels',
    lead: 'The compact legacy formats store a header, a packed 4096-tile board, then object sections.',
    sections: [
      {
        title: 'Known headers',
        columns: ['Header', 'Tiles', 'Links', 'Baddies', 'Signs', 'Chests', 'NPCs', 'Notes'],
        matrix: [
          ['Z3-V1.03', '12', '✓', '?', '✓', '✗', '✗', 'Baddy support uncertain'],
          ['Z3-V1.04', '12', '✓', '✓', '✓', '✗', '✗', 'LttP baddies; default .zelda header'],
          ['GR-V1.00', '12', '✓', '✓', '✓', '?', '?', 'LttP baddies; extra # after baddy stop'],
          ['GR-V1.01', '12', '✓', '✓', '✓', '✓', '✓', 'LttP baddies; NPC entries may contain garbage'],
          ['GR-V1.02', '13', '✓', '✓', '✓', '✓', '✓', 'All baddies; golden soldier and two lizard types'],
          ['GR-V1.03', '13', '✓', '✓', '✓', '✓', '✓', 'All baddies; golden rupee, electric bombs, horses; default .graal header']
        ]
      },
      {
        title: 'Tile stream',
        code: 'bits = header is GR-V1.02 or GR-V1.03 ? 13 : 12\ncontrolBit = bits == 13 ? 0x1000 : 0x800\n\nwhile board has fewer than 4096 tiles:\n  packet = read next 12 or 13 bits, little-endian from the byte stream\n\n  if packet has controlBit:\n    repeatCount = packet & 0xFF\n    doubleRepeat = packet has bit 0x100\n    continue\n\n  if repeatCount == 1:\n    append decodeTile(packet)\n  else if doubleRepeat:\n    read two tile packets A and B\n    append A, B, A, B... repeatCount times\n  else:\n    append decodeTile(packet) repeatCount times\n\ndecodeTile(index):\n  atlasX = floor(index / 512) * 16 + index % 16\n  atlasY = floor(index / 16) % 32',
        note: 'The packed stream starts immediately after the 8-byte header. There is no tile count; stop only after producing 4096 tiles. Everything after the tile block is byte-aligned, so ignore leftover bits from the last packet.'
      },
      {
        title: 'Binary object sections',
        rows: [
          ['Links', 'ASCII lines until #. Parameters are destination, width, height, x, y, newX, newY in the old document; Suite reads/writes destination, x, y, width, height, newX, newY for its own exports and tolerates destination names with spaces.'],
          ['Baddies', 'Three raw bytes for x, y, type, then one line of three verse strings. The document describes quote separators; Suite reads/writes backslash separators. Ends with FF FF FF and a newline.'],
          ['NPCs', '.graal only. Each line starts with x+32 and y+32 bytes, then optional image, #, and source code. NPC line breaks are stored as byte A7. Ends with #.'],
          ['Chests', 'GR-V1.02/1.03. Each line stores x+32, y+32, itemIndex+32, signIndex+32, then newline. Ends with #; some versions may also include a null chest FF FF FF 00.'],
          ['Signs', 'Run until EOF. Each line starts with x+32 and y+32, then encoded sign text. Sign text is not ASCII; it uses the old sign character table.']
        ]
      },
      {
        title: 'Chest sign index',
        code: 'no sign = 31\n\n// Decode chest sign parameter from old binary files:\nsignIndex = (param + 224) % 256\n\n// Encode a sign index for a chest:\nparam = (signIndex + 32) % 256'
      },
      {
        title: 'Sign character table',
        rows: [
          ['32-57', 'ASCII 65-90: A-Z'],
          ['58-83', 'ASCII 97-122: a-z'],
          ['84-93', 'ASCII 48-57: 0-9'],
          ['94', 'ASCII 33: !'],
          ['95', 'ASCII 63: ?'],
          ['96', 'ASCII 45: -'],
          ['97', 'ASCII 46: .'],
          ['98', 'ASCII 44: ,'],
          ['99', 'Ellipsis glyph'],
          ['100', 'ASCII 62: >'],
          ['101', 'ASCII 40: ('],
          ['102', 'ASCII 41: )'],
          ['103-105', 'Ancient 1, Ancient 2, Ancient 3'],
          ['106', 'Head glyph'],
          ['107', 'ASCII 34: double quote'],
          ['108-111', 'Up, Down, Left, Right arrow glyphs'],
          ['112', 'ASCII 39: apostrophe'],
          ['113', 'ASCII 58: colon'],
          ['114', 'ASCII 47: slash'],
          ['115', 'ASCII 126: tilde'],
          ['116', 'ASCII 38: ampersand'],
          ['117', 'ASCII 35: #'],
          ['118', 'Yinyang glyph'],
          ['119', 'ASCII 32: space'],
          ['120', 'ASCII 60: <'],
          ['121-124', 'Bold A, Bold B, Bold X, Bold Y'],
          ['125', 'ASCII 59: semicolon'],
          ['126', 'ASCII 10: newline']
        ]
      },
      {
        title: 'Old corruption note',
        points: [
          'Some old accepted levels have corrupted-looking sections, especially around early NPC support.',
          'The old document notes that NPC text could look like extra baddy definitions or nonsense source code, probably from uncleared editor memory.',
          'A reader should be forgiving after the tile stream and not assume every weird object tail means the whole file is invalid.'
        ]
      },
      {
        title: 'Object order',
        code: 'links, terminated by "#\\n"\nbaddies, terminated by FF FF FF + newline\nNPCs, terminated by "#\\n" (.graal only)\nchests, terminated by "#\\n" (.graal GR-V1.02/1.03)\nsigns, until end of file',
        note: 'NPC code stores line breaks as byte 0xA7. Sign characters use the old sign sprite-sheet table instead of plain ASCII.'
      }
    ]
  },
  {
    id: 'gani',
    label: '.gani',
    icon: 'fas fa-person-running',
    title: '.gani animation files',
    lead: 'GANI files define reusable animation sprites, frame pieces, optional effects, sounds, and script code.',
    sections: [
      {
        title: 'File skeleton',
        code: 'GANI0001\nSPRITE 0001 BODY 0 0 32 48 body\nDEFAULTHEAD head19.png\nDEFAULTBODY body.png\nLOOP\nANI\n 1 0 0,2 16 0\n 1 0 0,2 16 0\n 1 0 0,2 16 0\n 1 0 0,2 16 0\nWAIT 1\nANIEND\nSCRIPT\n// optional script\nSCRIPTEND',
        note: 'The animation editor saves GANI0001. It can load the bad GANI0FP4 watermark header and resave it cleanly.'
      },
      {
        title: 'Commands parsed by the Suite editor',
        rows: [
          ['SPRITE index source left top width height [comment]', 'Defines a cropped sprite. Source can be HEAD, BODY, SWORD, SHIELD, SPRITES, HORSE, PICS, ATTR1-ATTR19, PARAM1-PARAM10, or a custom image filename.'],
          ['DEFAULTTYPE filename', 'Overrides default art for a type, for example DEFAULTHEAD head0.png or DEFAULTSPRITES sprites.png.'],
          ['ATTACHSPRITE parent child x y', 'Attaches a sprite to a parent after the parent in draw order.'],
          ['ATTACHSPRITE2 parent child x y', 'Attaches a sprite before/behind the parent in draw order.'],
          ['ZOOMEFFECT index scale', 'Uniform scale.'],
          ['STRETCHXEFFECT / STRETCHYEFFECT index scale', 'Axis-specific scale.'],
          ['ROTATEEFFECT index radians', 'Rotation is stored in radians in the file.'],
          ['COLOREFFECT index r g b a', 'Color channels are 0.0 to 1.0 floats.'],
          ['EFFECTMODE index mode', 'Stores the numeric render/effect mode.'],
          ['LOOP / CONTINUOUS / SETBACKTO name', 'Playback flags and fallback animation.'],
          ['SINGLEDIR or SINGLEDIRECTION', 'One direction row per frame instead of four.'],
          ['FRAMES n', 'Sets the animation frame count used by the player.'],
          ['LAYER n', 'Draw order. 0-2 map to n - 1, 3 maps to 8, and 4 or more map to n + 6.'],
          ['ANTIALIAS', 'Enables antialiasing for the animation.'],
          ['ROTATEPROJECTILE', 'Rotates a projectile with its direction.'],
          ['ANI ... ANIEND', 'Frame rows. A line is one direction; four lines make a frame unless SINGLEDIRECTION is set.'],
          ['WAIT n', 'Adds n 50ms ticks to the current frame delay.'],
          ['PLAYSOUND file [x y]', 'Sound event on the current frame. Defaults are x = 1.5, y = 2.0; values are tile-space offsets.'],
          ['PARAMn / ATTRn', 'In an ANI line these replace a sprite number, followed by x and y.'],
          ['MOVIE ... MOVIEEND', 'Movie block. ACTOR kind text opens a track; FRAME time,text adds a key. Kinds are CHAR, SPRITE, SOUND and TEXT.'],
          ['SCRIPT ... SCRIPTEND', 'Optional script payload after ANIEND.']
        ]
      },
      {
        title: 'Frame rows',
        code: 'spriteIndex xOffset yOffset,spriteIndex xOffset yOffset\n12 0 0,7 -3 -8\n\n// A four-direction frame is four ANI lines:\n// up, left, down, right. SINGLEDIRECTION uses one line per frame.',
        note: 'Entries are groups of three words. The first is a sprite number, PARAMn or ATTRn; the next two are integer offsets. A line with no valid entry is skipped. A frame is stored only when it has all required directions; an unfinished frame at ANIEND or at the end of the file is dropped.'
      },
      {
        title: 'Sprite and attachment rules',
        points: [
          'SPRITE needs six parameters: number, image type, left, top, width and height. Sprite number 0 marks the animation as missing a sprite.',
          'ATTACHSPRITE attaches the second sprite to the first after it in draw order; ATTACHSPRITE2 attaches it before the first.',
          'COLOREFFECT channels are floats from 0.0 to 1.0. ZOOM, STRETCHX and STRETCHY take a scale; ROTATE takes radians.',
          'The scanner ignores unknown lines, so comments and extra text are safe.'
        ]
      }
    ]
  },
  {
    id: 'terrain',
    label: 'Terrain',
    icon: 'fas fa-mountain-sun',
    title: 'Terrain heights',
    lead: 'How the optional height field is stored and generated, enough to reproduce the shape in another language.',
    chips: ['.nw HEIGHTS', '.gmap HEIGHTMAP', '65 x 65'],
    sections: [
      {
        title: 'Where the values live',
        rows: [
          ['.nw HEIGHTS', 'Nine rows of nine comma-separated floats: corners of the 8 x 8 tile blocks. It refines the generated field.'],
          ['.gmap HEIGHTMAP', '(HEIGHT + 1) rows of (WIDTH + 1) corner heights. This is the shared border net between levels.'],
          ['.gmap RANDOMSEEDS', 'HEIGHT rows of WIDTH 32-bit seeds, one per level.'],
          ['.gmap HEIGHTS level', 'Nine rows of nine coarse heights for one named level.'],
          ['No heights', 'The ground is flat at height 0.']
        ]
      },
      {
        title: 'Field shape',
        points: [
          'Each level uses a 65 x 65 grid of corner heights: 64 tiles plus one shared edge in each direction.',
          'The fine grid is generated on load. Only the coarse 9 x 9 control points and the gmap border net are stored.',
          'The client height field is float; the generator computes in double and rounds the interpolation steps to float.'
        ]
      },
      {
        title: 'Generation parameters',
        rows: [
          ['LevelHeightDeviation', 'Default 4.0. Starting amplitude for the shared borders and the level interior.'],
          ['LevelChaos', 'Default 0.6. Each recursion multiplies the amplitude by this value.'],
          ['MapSeed', 'GENSEED, or 0. Seeds the shared border pass.'],
          ['Level seed', 'The RANDOMSEEDS entry for the level, or 0. Seeds the interior pass.']
        ]
      },
      {
        title: 'Midpoint displacement',
        code: 'random(seed):\n  seed = (seed * 0x08088405 + 1) & 0xFFFFFFFF\n  return seed / 4294967296\n\nfill(top, left, bottom, right, amplitude):\n  if right - left <= 1 and bottom - top <= 1: return\n  midX = (left + right) / 2\n  midY = (top + bottom) / 2\n  h[midY][midX] = (h[top][left] + h[bottom][right]) / 2\n                 + (random() - 0.5) * 2 * amplitude\n  fill(top, left, midY, midX, amplitude * chaos)\n  fill(midY, midX, bottom, right, amplitude * chaos)',
        note: 'Only the top-left and bottom-right corners are averaged. The border pass fills the shared edges; the level pass fills the interior with four quadrant recursions. The random function is the classic Delphi generator, so another language must match the 32-bit multiply and the 2^-32 scale exactly.'
      },
      {
        title: 'Coarse control points',
        code: 'delta = target - h[y * 8][x * 8]\nif delta == 0: skip\n\nfor row in max(0, y * 8 - 7) .. min(64, y * 8 + 7):\n  rowWeight = 8 - abs(row - y * 8)\n  for column in max(0, x * 8 - 7) .. min(64, x * 8 + 7):\n    columnWeight = 8 - abs(column - x * 8)\n    h[row][column] += delta * rowWeight * columnWeight / 64',
        note: 'A 9 x 9 HEIGHTS block is a control net. Each point lands on a multiple of 8 and adds a triangular falloff over a 15 x 15 region. Overlapping regions sum.'
      },
      {
        title: 'Reading a height',
        code: 'i = row * 65 + column\ntl = f[i]       tr = f[i + 1]\nbl = f[i + 65]  br = f[i + 66]\n\nleft  = tl + (bl - tl) * fractionY\nright = tr + (br - tr) * fractionY\nheight = left + (right - left) * fractionX',
        note: 'Interpolate along y on both sides, then along x. On the first and last tile rows the corners are averaged with the adjacent level so the seam matches.'
      },
      {
        title: 'Bounds and edge cases',
        points: [
          'Only the first nine rows and the first nine values of a HEIGHTS row are used.',
          'A gmap height or seed section may list more rows or columns than the grid; writes outside the arrays are ignored.',
          'A level without a height field reads as 0, even if a neighbouring level has heights.'
        ]
      }
    ]
  },
  {
    id: 'gupd',
    label: '.gupd',
    icon: 'fas fa-file-lines',
    title: 'Update packages',
    lead: 'A .gupd file is a text manifest: it names files a client may download, a version, and how the installer should treat them.',
    chips: ['.gupd', 'GRPKG001'],
    sections: [
      {
        title: 'Manifest skeleton',
        code: 'GRPKG001\nNAME Starter files\nVERSION 2\nPLATFORM any\nMODE required\nDESCRIPTION\nThe default files.\nDESCRIPTIONEND\nSUBPACKAGE extras.gupd\nFILE levels/heads/head0.png\nFILE sounds/click.wav\nUSECHECKSUM',
        note: 'The first line must be exactly GRPKG001. Every other line is a keyword and, where it takes one, a single space before its value. Unknown lines are ignored.'
      },
      {
        title: 'Manifest lines',
        rows: [
          ['NAME text', 'Name shown by the installer.'],
          ['VERSION n', 'Version compared to four decimal places.'],
          ['PLATFORM any|win', 'Only packages that say any or the client platform count. Use any; current clients report win.'],
          ['MODE optional|required|base', 'optional is the default. required installs when the local version is lower. base is checked at every login, so keep it small.'],
          ['DESCRIPTION ... DESCRIPTIONEND', 'Text shown by the installer. A line that is exactly DESCRIPTIONEND ends it.'],
          ['SUBPACKAGE name.gupd', 'Another package the client should request. Names are lower case and end in .gupd.'],
          ['FILE path', 'A path relative to the client user folder. The server finds the file by its bare name.'],
          ['USECHECKSUM', 'Compare CRC32 checksums instead of file times. Only the bare word counts.'],
          ['PROTECTOVERWRITE / ACCOUNTS / FLAG', 'Kept as script properties; they do not change the download itself.'],
          ['ISMAINEXECUTABLE', 'The package holds the program executable.']
        ]
      },
      {
        title: 'How a package is resolved',
        points: [
          'basepackage.gupd is requested first; its SUBPACKAGE lines name the rest.',
          'The client sends its local version and file times, or checksums when the manifest asks for them. The server sends only files that are missing or older.',
          'Manifests live in updatepackages/, or updatepackages/<server>/ for a game server. Package files go where each FILE path says.',
          'A FILE line is ignored when its path is outside the client safe character set, or when a game server tries to ship programs or a file already listed by a login package.'
        ]
      }
    ]
  },
  {
    id: 'gpak',
    label: '.gpak / .gpake',
    icon: 'fas fa-file-zipper',
    title: 'Archive packages',
    lead: '.gpak is a plain ZIP package. .gpake is the same container with every entry DES-ECB encrypted.',
    chips: ['.gpak', '.gpake', 'levels/gpaks/'],
    sections: [
      {
        title: 'Container layout',
        rows: [
          ['.gpak', 'Plain ZIP archive mounted as a folder.'],
          ['.gpake', 'ZIP archive whose entry data is encrypted; the client marks it encrypted by extension.'],
          ['Location', 'Stored under levels/gpaks/.'],
          ['Path form', 'levels/gpaks/pack.gpake/levels/icon.png is read from inside the archive.'],
          ['Entry names', 'Plain file names at the archive root, with folders as path segments.'],
          ['Compression', 'Deflate (method 8), applied to the ciphertext.'],
          ['Key storage', 'No key is stored in the archive; the server sends it separately.'],
          ['Entry lookup', 'The client keeps the entry number and central-directory position from registration.']
        ]
      },
      {
        title: 'The key',
        points: [
          'One 8-byte key per package, not per entry.',
          'The key is two 32-bit numbers. Write each low byte first (LE32), concatenate, then reverse the bits of every byte for a standard DES implementation.',
          'The client DES reads key bits low-to-high, which is why the reversal is required.',
          'The server sends the key when the client requests the file. Until it arrives, entries report unavailable.'
        ],
        code: 'key[0..3] = LE32(first)\nkey[4..7] = LE32(second)\nfor i in 0..7: key[i] = reverseBits(key[i])\n\n// now use key with standard DES'
      },
      {
        title: 'Entry encryption',
        points: [
          'DES in ECB mode. Only whole 8-byte blocks are processed; a trailing 1-7 byte tail is copied unchanged.',
          'Encrypt, then deflate. A reader inflates first, then decrypts.',
          'Every entry in a .gpake is decrypted with the package key, so all entries must be encrypted.'
        ],
        code: 'plain = inflate(entry.data)\nfor offset in 0 .. len(plain) - 8 step 8:\n  plain[offset..offset+8] = DES-ECB-decrypt(plain[offset..offset+8], key)\n// a tail shorter than 8 bytes is left as-is'
      },
      {
        title: 'Key packet',
        rows: [
          ['104 file key', 'One character = name length + 0x20, then the file name, one character = key number + 0x20, then two GInt5 numbers.'],
          ['GInt5', 'Five characters; each is a base-128 digit plus 0x20, most significant first.'],
          ['68 / 84 / 102 / 69', 'Large file transfer: start with the name, size as GInt5, 32,000-byte data chunks, end with the name.']
        ],
        note: 'The key number identifies the key version. The package name is the file name the key belongs to.'
      },
      {
        title: 'Making one',
        code: '1. zip the files, keeping the names the client will look up\n2. choose first and second; build the DES key as above\n3. replace every entry data with DES-ECB ciphertext\n   (whole 8-byte blocks; leave a shorter tail)\n4. name the archive .gpake\n5. send first and second to the client in packet 104',
        note: 'The deflate compression is applied to the ciphertext, so encrypted entries barely shrink.'
      },
      {
        title: 'Reader quirks',
        points: [
          'Some shipped archives have central-directory offsets one byte short. A tolerant reader should adjust the offset or find the local header; the entry data is still intact.',
          'A damaged archive or a failed inflate yields empty data, not a partial file.'
        ]
      },
      {
        title: 'Choosing the right format',
        rows: [
          ['Plain package', 'Use .gpak. Entries are readable without a key.'],
          ['Protected package', 'Use .gpake plus its two key words. Every entry must be encrypted.'],
          ['Update a client cache', 'Use .gupd plus loose files. The server can send only changed files.'],
          ['Ship programs', 'Only a login server package can list them; a game server package cannot.']
        ]
      }
    ]
  }
];

function FileFormatsGuide() {
  const h = React.createElement;
  const [active, setActive] = React.useState('overview');
  const tab = fileFormatTabs.find(item => item.id === active) || fileFormatTabs[0];
  const panelRef = React.useRef(null);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get('format');
    if (requested && fileFormatTabs.some(item => item.id === requested)) setActive(requested);
  }, []);

  React.useEffect(() => {
    if (panelRef.current) panelRef.current.scrollTop = 0;
  }, [active]);

  const renderSection = (section, index) => h('section', { className: 'formats-section', key: `${tab.id}-${index}` },
    h('h3', null, section.title),
    section.points && h('ul', { className: 'formats-points' }, section.points.map((point, i) => h('li', { key: i }, point))),
    section.rows && h('div', { className: 'formats-table' }, section.rows.map((row, i) => h('div', { className: 'formats-row', key: i },
      h('strong', null, row[0]),
      h('span', null, row[1])
    ))),
    section.columns && section.matrix && h('div', { className: 'formats-matrix-wrap' },
      h('div', { className: 'formats-matrix' },
        section.columns.map((column, i) => h('div', { className: 'formats-matrix-head', key: `head-${i}` }, column)),
        section.matrix.flatMap((row, rowIndex) => row.map((cell, columnIndex) => h('div', {
          className: `formats-matrix-cell${columnIndex === 0 ? ' formats-matrix-name' : ''}${cell === '✓' ? ' formats-matrix-yes' : cell === '✗' ? ' formats-matrix-no' : cell === '?' ? ' formats-matrix-unknown' : ''}`,
          key: `${rowIndex}-${columnIndex}`
        }, cell)))
      )
    ),
    section.code && h('pre', { className: 'formats-code' }, h('code', null, section.code)),
    section.note && h('p', { className: 'formats-note' }, section.note)
  );

  return h('main', { className: 'formats-guide' },
    h('header', { className: 'formats-hero' },
      h('div', null,
        h('p', { className: 'formats-lede' }, 'Notes for reading and writing .nw, .gmap, .gani, .zelda, .graal, .gupd, and .gpak level, map, animation, and package files.')
      )
    ),
    h('nav', { className: 'formats-tabs', 'aria-label': 'File format sections' },
      fileFormatTabs.map(item => h('button', {
        key: item.id,
        type: 'button',
        className: item.id === active ? 'active' : '',
        onClick: () => {
          setActive(item.id);
          const url = new URL(window.location.href);
          url.searchParams.set('formats', '');
          url.searchParams.set('format', item.id);
          window.history.replaceState(null, '', `${url.pathname}?${url.searchParams.toString().replace('formats=', 'formats')}`);
        }
      }, h('i', { className: item.icon }), h('span', null, item.label)))
    ),
    h('article', { className: 'formats-panel', ref: panelRef },
      h('div', { className: 'formats-panel-head' },
        h('div', null,
          h('h2', null, tab.title),
          h('p', null, tab.lead)
        ),
        tab.chips && h('div', { className: 'formats-chips' }, tab.chips.map(chip => h('span', { key: chip }, chip)))
      ),
      tab.sections.map(renderSection)
    )
  );
}
