// ============================================================================
// REALISTIC WW2 EUROPEAN CITY (CLASSIC HAUSSMANN FACADES, SOLID BALCONIES & BREAKABLE WALLS)
// ============================================================================

window.CityWorld = (function () {
    const colliders = [];
    const destructibles = [];
    const destructibleWallPanels = [];
    const coverNodes = [];
    const windowGarrisonNodes = [];
    const ambushZones = [];
    const burningFires = [];

    function buildWorld(scene) {
        colliders.length = 0;
        destructibles.length = 0;
        destructibleWallPanels.length = 0;
        coverNodes.length = 0;
        windowGarrisonNodes.length = 0;
        ambushZones.length = 0;
        burningFires.length = 0;

        const cobbleTex = GameTextures.getCobblestoneTexture();
        const churchMat = GameTextures.getChurchStoneMaterial();
        const roofMat = GameTextures.getSlateRoofMaterial();
        const facadeMats = [
            GameTextures.getBuildingFacadeMaterial(0),
            GameTextures.getBuildingFacadeMaterial(1),
            GameTextures.getBuildingFacadeMaterial(2),
            GameTextures.getBuildingFacadeMaterial(3)
        ];

        const groundMat = new THREE.MeshStandardMaterial({
            map: cobbleTex,
            bumpMap: cobbleTex,
            bumpScale: 0.05,
            roughness: 0.86,
            metalness: 0.08
        });
        const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x56524a, roughness: 0.85 });
        const brickRubbleMat = new THREE.MeshStandardMaterial({ color: 0x5c3324, roughness: 0.92 });
        const darkInteriorMat = new THREE.MeshStandardMaterial({ color: 0x12100e, roughness: 0.95 });
        const timberMat = new THREE.MeshStandardMaterial({ color: 0x36261a, roughness: 0.9 });
        const sandbagMat = new THREE.MeshStandardMaterial({ color: 0x7c7156, roughness: 0.9 });
        const ironMat = new THREE.MeshStandardMaterial({ color: 0x222528, roughness: 0.5, metalness: 0.78 });

        // 1. Cobblestone City Ground Plane
        const ground = new THREE.Mesh(new THREE.PlaneGeometry(560, 560), groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);

        // Raised Sidewalk Boulevards
        createSidewalkStrip(scene, -21, -20, 6, 290, sidewalkMat);
        createSidewalkStrip(scene,  21, -20, 6, 290, sidewalkMat);

        // 2. GRAND RUINED GOTHIC CATHEDRAL ("DOM ST. NIKOLAUS")
        buildDestroyedCathedral(scene, 0, -18, churchMat, roofMat, brickRubbleMat, timberMat, ironMat);

        // Second Bombed-Out Parish Church
        buildDestroyedParishChurch(scene, 82, -88, churchMat, roofMat);

        // 3. CLASSIC EUROPEAN MULTI-STORY TOWNHOUSE BLOCKS (WITH SOLID 2ND-FLOOR BALCONY GARRISONS & BREAKABLE WALLS)
        const cityBlocks = [
            // West Side of Main Avenue
            { x: -38, z: -130, w: 22, d: 26, h: 15.5, variant: 0, ruinType: 'corner_blown', faceDir: 1 },
            { x: -38, z: -92,  w: 22, d: 26, h: 17.0, variant: 1, ruinType: 'mansard_damaged', faceDir: 1 },
            { x: -46, z: -48,  w: 24, d: 24, h: 16.0, variant: 3, ruinType: 'half_collapsed', faceDir: 1 },
            { x: -48, z: 12,   w: 24, d: 28, h: 18.0, variant: 2, ruinType: 'mansard_damaged', faceDir: 1 },
            { x: -38, z: 54,   w: 22, d: 26, h: 15.5, variant: 0, ruinType: 'corner_blown', faceDir: 1 },
            { x: -38, z: 92,   w: 24, d: 26, h: 17.5, variant: 1, ruinType: 'mansard_damaged', faceDir: 1 },

            // East Side of Main Avenue
            { x: 38,  z: -130, w: 22, d: 26, h: 16.5, variant: 2, ruinType: 'mansard_damaged', faceDir: -1 },
            { x: 38,  z: -92,  w: 22, d: 26, h: 15.0, variant: 3, ruinType: 'corner_blown', faceDir: -1 },
            { x: 46,  z: -48,  w: 24, d: 24, h: 18.0, variant: 1, ruinType: 'mansard_damaged', faceDir: -1 },
            { x: 48,  z: 12,   w: 24, d: 28, h: 16.0, variant: 0, ruinType: 'half_collapsed', faceDir: -1 },
            { x: 38,  z: 54,   w: 22, d: 26, h: 17.0, variant: 2, ruinType: 'mansard_damaged', faceDir: -1 },
            { x: 38,  z: 92,   w: 24, d: 26, h: 16.0, variant: 3, ruinType: 'corner_blown', faceDir: -1 },

            // Outer Western & Eastern Boulevard Blocks
            { x: -86, z: -108, w: 26, d: 26, h: 16.0, variant: 1, ruinType: 'mansard_damaged', faceDir: 1 },
            { x: -86, z: -55,  w: 26, d: 28, h: 17.5, variant: 0, ruinType: 'half_collapsed', faceDir: 1 },
            { x: -86, z: 5,    w: 28, d: 26, h: 15.0, variant: 2, ruinType: 'corner_blown', faceDir: 1 },
            { x: -84, z: 62,   w: 26, d: 26, h: 17.0, variant: 3, ruinType: 'mansard_damaged', faceDir: 1 },

            { x: 86,  z: -35,  w: 26, d: 28, h: 16.5, variant: 0, ruinType: 'corner_blown', faceDir: -1 },
            { x: 86,  z: 22,   w: 28, d: 28, h: 15.5, variant: 1, ruinType: 'half_collapsed', faceDir: -1 },
            { x: 84,  z: 74,   w: 26, d: 26, h: 17.5, variant: 2, ruinType: 'mansard_damaged', faceDir: -1 },

            { x: -28, z: 136,  w: 32, d: 22, h: 19.0, variant: 1, ruinType: 'mansard_damaged', faceDir: 1 },
            { x: 28,  z: 136,  w: 32, d: 22, h: 19.0, variant: 3, ruinType: 'corner_blown', faceDir: -1 }
        ];

        cityBlocks.forEach((b) => {
            createEuropeanTownhouseBlock(
                scene,
                b.x, b.z, b.w, b.d, b.h, b.faceDir,
                facadeMats[b.variant % facadeMats.length],
                darkInteriorMat, roofMat, brickRubbleMat, timberMat, ironMat, sandbagMat,
                b.ruinType
            );
        });

        // 4. STREETLAMPS, BURNING SHERMAN WRECKS, CRATERS & SANDBAG BARRICADES
        for (let z = -140; z <= 110; z += 25) {
            createCrushableStreetlamp(scene, -18.2, z, ironMat);
            createCrushableStreetlamp(scene,  18.2, z, ironMat);
        }

        const wrecks = [
            { x: -10.5, z: -105, ry: 0.42 },
            { x: 12.5,  z: -62,  ry: -0.58 },
            { x: -13.0, z: 24,   ry: 0.78 },
            { x: 13.5,  z: 72,   ry: -0.45 },
            { x: -58.0, z: -22,  ry: 1.85 },
            { x: 58.0,  z: -15,  ry: -1.45 }
        ];
        wrecks.forEach(w => createBurningTankWreck(scene, w.x, w.z, w.ry, ironMat));

        const craters = [
            { x: 4,   z: -118, r: 4.5 },
            { x: -6,  z: -78,  r: 5.0 },
            { x: 7,   z: -42,  r: 5.2 },
            { x: -5,  z: 38,   r: 5.0 },
            { x: 8,   z: 86,   r: 5.4 }
        ];
        craters.forEach(c => createShellCrater(scene, c.x, c.z, c.r, brickRubbleMat));

        const barricades = [
            { x: -11, z: -112 }, { x: 11, z: -112 },
            { x: -12, z: -68 },  { x: 12, z: -68 },
            { x: -12, z: 8 },    { x: 12, z: 8 },
            { x: -11, z: 62 },   { x: 11, z: 62 }
        ];
        barricades.forEach(bl => createCrushableBarricade(scene, bl.x, bl.z, ironMat, sandbagMat));

        // 5. US ARMY PLATOON AMBUSH SECTORS (Long-range trigger radii so platoons are deployed 115m-150m ahead, never popping in close!)
        ambushZones.push(
            { id: 'rue_de_la_gare', name: 'Rue de la Gare Boulevard', x: 0, z: -48, radius: 145, spawned: false },
            { id: 'cathedral_square', name: 'St. Nikolaus Cathedral Square', x: 0, z: 18, radius: 135, spawned: false },
            { id: 'kaiserstrasse', name: 'Kaiserstrasse Commercial District', x: 0, z: 88, radius: 135, spawned: false },
            { id: 'west_market', name: 'Western Market Quarter', x: -64, z: -15, radius: 130, spawned: false },
            { id: 'east_parish', name: 'Eastern Parish & Alleyways', x: 64, z: -15, radius: 130, spawned: false }
        );
    }

    function createSidewalkStrip(scene, x, z, w, d, mat) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, 0.22, d), mat);
        mesh.position.set(x, 0.11, z);
        mesh.receiveShadow = true;
        scene.add(mesh);
    }

    const destructibleBricks = [];
    const fallingMasonryBlocks = [];

    // Helper: Builds a realistic multi-course curved/angled wall of individual pillowed burlap sandbags
    function buildStackedSandbagWall(parentGroup, centerX, centerZ, facingYaw, courses = 4, bagsPerRow = 5, sandbagMat, timberMat) {
        const bagGroup = new THREE.Group();
        bagGroup.position.set(centerX, 0, centerZ);
        bagGroup.rotation.y = facingYaw;

        const bagW = 0.66;
        const bagH = 0.23;
        const bagD = 0.38;

        for (let row = 0; row < courses; row++) {
            const countInRow = Math.max(2, bagsPerRow - (row === courses - 1 ? 1 : 0));
            const stagger = (row % 2 === 1) ? (bagW * 0.42) : 0;
            const totalRowW = countInRow * (bagW + 0.03);

            for (let b = 0; b < countInRow; b++) {
                const bx = -totalRowW / 2 + b * (bagW + 0.03) + stagger * (b % 2 === 0 ? 1 : -0.5);
                const by = row * (bagH * 0.88) + bagH * 0.5;
                // Gentle arc curvature like a real WW2 sandbag fighting position
                const curveZ = Math.pow((bx / (totalRowW * 0.5 + 0.01)), 2) * 0.35;

                // Pillowed burlap sack body
                const bagMesh = new THREE.Mesh(
                    new THREE.BoxGeometry(bagW, bagH, bagD),
                    sandbagMat
                );
                bagMesh.position.set(bx, by, curveZ + (Math.random() - 0.5) * 0.04);
                bagMesh.rotation.set(
                    (Math.random() - 0.5) * 0.08,
                    (bx * -0.18) + (Math.random() - 0.5) * 0.14,
                    (Math.random() - 0.5) * 0.07
                );
                bagMesh.scale.set(0.96 + Math.random() * 0.08, 0.92 + Math.random() * 0.12, 0.95 + Math.random() * 0.1);
                bagMesh.castShadow = true;
                bagMesh.receiveShadow = true;
                bagGroup.add(bagMesh);

                // Tied burlap choke neck on one end of the sandbag
                if ((b + row) % 2 === 0) {
                    const neck = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.05, 0.09, 0.12, 7),
                        sandbagMat
                    );
                    neck.rotation.z = Math.PI / 2;
                    neck.position.set(bx + bagW * 0.52, by, curveZ);
                    bagGroup.add(neck);
                }
            }
        }

        // Vertical wooden bracing stakes driven behind the sandbag wall
        if (timberMat) {
            for (let s = -1; s <= 1; s += 2) {
                const stake = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, courses * bagH + 0.22, 7), timberMat);
                stake.position.set(s * (bagsPerRow * bagW * 0.32), (courses * bagH) * 0.5, 0.24);
                stake.rotation.x = -0.08;
                stake.castShadow = true;
                bagGroup.add(stake);
            }
        }

        parentGroup.add(bagGroup);
        return bagGroup;
    }

    // Classic Multi-Story European Townhouse with Battlefield-Style Cellular Masonry Destruction Anywhere You Shoot!
    function createEuropeanTownhouseBlock(
        scene, x, z, w, d, h, faceDir,
        facadeMat, darkInteriorMat, roofMat, rubbleMat, timberMat, ironMat, sandbagMat, ruinType
    ) {
        const group = new THREE.Group();
        group.position.set(x, 0, z);

        // Raised stone sidewalk skirt around building
        const walk = new THREE.Mesh(
            new THREE.BoxGeometry(w + 4.2, 0.24, d + 4.2),
            new THREE.MeshStandardMaterial({ color: 0x555149, roughness: 0.85 })
        );
        walk.position.set(0, 0.12, 0);
        walk.receiveShadow = true;
        group.add(walk);

        const mainHeight = (ruinType === 'half_collapsed') ? h * 0.72 : h;
        const buildingId = 'bldg_' + Math.round(x) + '_' + Math.round(z);

        // 1. Interior Structural Skeleton (Exposed when you blast holes anywhere in the outer masonry walls!)
        // Dark interior void core recessed slightly inside the walls, plus real wooden floor slabs & cross-beams!
        const innerCore = new THREE.Mesh(
            new THREE.BoxGeometry(w - 3.2, mainHeight - 0.8, d - 3.2),
            darkInteriorMat
        );
        innerCore.position.set(0, (mainHeight - 0.8) / 2, 0);
        group.add(innerCore);

        // Interior 1st, 2nd, and 3rd floor wooden floor decks & cross-beams visible inside blasted holes
        const floorHeights = [0.35, 5.95, 11.2];
        floorHeights.forEach(fy => {
            if (fy < mainHeight - 0.8) {
                const floorSlab = new THREE.Mesh(
                    new THREE.BoxGeometry(w - 1.2, 0.32, d - 1.2),
                    timberMat
                );
                floorSlab.position.set(0, fy, 0);
                floorSlab.receiveShadow = true;
                group.add(floorSlab);

                // Interior room partition cross-wall so holes reveal multi-room depth
                const partition = new THREE.Mesh(
                    new THREE.BoxGeometry(w - 2.2, 4.8, 0.35),
                    rubbleMat
                );
                partition.position.set(0, fy + 2.4, 0);
                group.add(partition);
            }
        });

        // 2. Build All 4 Exterior Walls out of Individual Destructible Cellular Masonry Blocks (`destructibleBricks`)
        // Shooting ANY point on ANY wall carves a jagged hole right at the impact point and triggers gravity collapse!
        const wallThickness = 1.25;
        const rows = Math.max(3, Math.round(mainHeight / 2.65));
        const cellH = mainHeight / rows;

        function buildCellularWall(wallSide, wallX, wallZ, spanLength, alongZ) {
            const cols = Math.max(4, Math.round(spanLength / 2.85));
            const cellSpan = spanLength / cols;

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const offsetAlong = -spanLength / 2 + (c + 0.5) * cellSpan;
                    const cy = (r + 0.5) * cellH;
                    const cx = alongZ ? wallX : (wallX + offsetAlong);
                    const cz = alongZ ? (wallZ + offsetAlong) : wallZ;

                    const bw = alongZ ? wallThickness : (cellSpan + 0.04);
                    const bd = alongZ ? (cellSpan + 0.04) : wallThickness;

                    const cellMesh = new THREE.Mesh(
                        new THREE.BoxGeometry(bw, cellH + 0.04, bd),
                        facadeMat
                    );
                    cellMesh.position.set(cx, cy, cz);
                    cellMesh.castShadow = true;
                    cellMesh.receiveShadow = true;
                    scene.add(cellMesh);

                    destructibleBricks.push({
                        buildingId,
                        wallSide,
                        col: c,
                        row: r,
                        mesh: cellMesh,
                        x: cx,
                        y: cy,
                        z: cz,
                        bw,
                        bh: cellH,
                        bd,
                        destroyed: false,
                        damaged: false,
                        balconyGroup: null,
                        garrisonSoldier: null
                    });
                }
            }
        }

        // Street-facing Front Wall, Back Wall, North Wall, and South Wall — ALL 100% destructible cell-by-cell!
        buildCellularWall('front', x + faceDir * (w / 2 - 0.62), z, d, true);
        buildCellularWall('back',  x - faceDir * (w / 2 - 0.62), z, d, true);
        buildCellularWall('north', x, z + (d / 2 - 0.62), w - 1.2, false);
        buildCellularWall('south', x, z - (d / 2 - 0.62), w - 1.2, false);

        // 3. Solid 2nd-Floor Wrought-Iron Balconies Attached to the Street-Facing Wall
        for (let wing = -1; wing <= 1; wing += 2) {
            const balZ = z + wing * (d * 0.25);
            const balX = x + faceDir * (w / 2 - 0.55);

            const balGroup = new THREE.Group();
            balGroup.position.set(balX, 0, balZ);

            // Recessed Dark Open French Balcony Doorway on 2nd Floor
            const doorVoid = new THREE.Mesh(new THREE.BoxGeometry(0.35, 2.35, 1.45), darkInteriorMat);
            doorVoid.position.set(faceDir * 0.55, 7.35, 0);
            balGroup.add(doorVoid);

            // Solid 3D Stone & Wrought-Iron Balcony Platform at y = 6.15m
            const balconyDeck = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.24, 4.2), ironMat);
            balconyDeck.position.set(faceDir * 1.25, 6.15, 0);
            balconyDeck.castShadow = true;
            balconyDeck.receiveShadow = true;
            balGroup.add(balconyDeck);

            // Low Wrought-Iron Balcony Railing (0.68m high so soldier's chest & head are clearly exposed to the tank's MG!)
            const frontRail = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.68, 4.2), ironMat);
            frontRail.position.set(faceDir * 1.88, 6.58, 0);
            balGroup.add(frontRail);

            scene.add(balGroup);

            const panelRecord = {
                mesh: balGroup,
                x: balX + faceDir * 1.1,
                y: 6.5,
                z: balZ,
                radius: 3.4,
                destroyed: false,
                garrisonSoldier: null
            };
            destructibleWallPanels.push(panelRecord);

            windowGarrisonNodes.push({
                x: balX + faceDir * 1.25,
                y: 6.27, // Exact top surface of balconyDeck
                z: balZ,
                faceDir: faceDir,
                occupiedBy: null,
                parentPanel: panelRecord
            });
        }

        addBoxCollider(x, z, w, d, mainHeight);

        // Architectural Cornice Ledge & Mansard Slate Roof
        const cornice = new THREE.Mesh(new THREE.BoxGeometry(w + 0.7, 0.55, d + 0.7), rubbleMat);
        cornice.position.set(0, mainHeight + 0.25, 0);
        cornice.castShadow = true;
        group.add(cornice);

        if (ruinType !== 'half_collapsed') {
            const roofH = 4.2;
            const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.68, roofH, 4), roofMat);
            roof.position.set(0, mainHeight + roofH / 2 + 0.4, 0);
            roof.rotation.y = Math.PI / 4;
            roof.scale.set(w / Math.max(w, d), 1, d / Math.max(w, d));
            roof.castShadow = true;
            group.add(roof);

            for (let c = -1; c <= 1; c += 2) {
                const chimney = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.8, 1.2), rubbleMat);
                chimney.position.set(c * (w * 0.3), mainHeight + roofH * 0.75, -d * 0.25);
                chimney.castShadow = true;
                group.add(chimney);
            }
        }

        // 4. Street-Level Stacked Burlap Sandbag Fortifications at Building Corners (Zero round donuts!)
        const cornerZ = [-d / 2 - 2.6, d / 2 + 2.6];
        cornerZ.forEach((zOff) => {
            const barrierX = x + faceDir * (w / 2 + 2.6);
            const barrierZ = z + zOff;

            const cornerGroup = new THREE.Group();
            cornerGroup.position.set(barrierX, 0, barrierZ);

            // Multi-course stacked pillowed burlap sandbags
            buildStackedSandbagWall(cornerGroup, 0, 0, faceDir > 0 ? Math.PI / 2 : -Math.PI / 2, 4, 5, sandbagMat, timberMat);

            scene.add(cornerGroup);
            destructibles.push({ mesh: cornerGroup, x: barrierX, z: barrierZ, radius: 2.1 });

            // Place Cover Node 2.4m BEHIND the sandbag wall so soldiers crouch cleanly behind the sandbags!
            registerCoverNode(barrierX - faceDir * 2.4, barrierZ, barrierX + faceDir * 1.6, barrierZ);
        });

        scene.add(group);
    }

    // Battlefield-Style Dynamic Destruction: Carves a localized 3D breach hole at the EXACT impact coordinate (hitPos)
    // and triggers gravity cascade collapse of unsupported masonry blocks above the hole!
    function carveBuildingDestructionHole(scene, hitPos, blastRadius = 4.2, spawnDebrisCallback = null) {
        let destroyedCount = 0;
        const newlyDestroyedBricks = [];
        const charredMat = new THREE.MeshStandardMaterial({ color: 0x26221e, roughness: 0.95 });

        // 1. Blast out all masonry cells within blastRadius of hitPos, and fracture/scorch cells on the rim!
        for (let i = 0; i < destructibleBricks.length; i++) {
            const b = destructibleBricks[i];
            if (b.destroyed) continue;

            const dist = Math.hypot(b.x - hitPos.x, b.y - hitPos.y, b.z - hitPos.z);
            if (dist < blastRadius) {
                b.destroyed = true;
                scene.remove(b.mesh);
                newlyDestroyedBricks.push(b);
                destroyedCount++;

                if (spawnDebrisCallback) {
                    spawnDebrisCallback(b.x, b.y, b.z, b.bw, b.bh, b.bd);
                }
            } else if (dist < blastRadius + 1.95 && !b.damaged) {
                // Jagged broken rim around the hole so the breach looks irregular & organic!
                b.damaged = true;
                b.mesh.material = charredMat;
                b.mesh.scale.set(0.76 + Math.random() * 0.18, 0.72 + Math.random() * 0.20, 0.92);
                b.mesh.rotation.set(
                    (Math.random() - 0.5) * 0.22,
                    (Math.random() - 0.5) * 0.22,
                    (Math.random() - 0.5) * 0.22
                );
            }
        }

        // 2. Also check if any 2nd-floor wrought-iron balcony is within the blast radius!
        for (let p = 0; p < destructibleWallPanels.length; p++) {
            const panel = destructibleWallPanels[p];
            if (!panel.destroyed &&
                Math.hypot(panel.x - hitPos.x, panel.z - hitPos.z) < blastRadius + 1.4 &&
                Math.abs(panel.y - hitPos.y) < blastRadius + 1.5) {
                panel.destroyed = true;
                scene.remove(panel.mesh);
                destroyedCount++;
                if (panel.garrisonSoldier && panel.garrisonSoldier.alive) {
                    panel.garrisonSoldier.fallingFromBuilding = true;
                    panel.garrisonSoldier.isWindowGarrison = false;
                    panel.garrisonSoldier.vy = -2.5;
                }
            }
        }

        // 3. Battlefield Gravity Cascade Physics: Any intact upper wall blocks directly above destroyed blocks
        // lose structural support and collapse downward under gravity!
        if (newlyDestroyedBricks.length > 0) {
            for (let i = 0; i < destructibleBricks.length; i++) {
                const upper = destructibleBricks[i];
                if (upper.destroyed) continue;

                const lostSupportBelow = newlyDestroyedBricks.some(lower =>
                    lower.buildingId === upper.buildingId &&
                    lower.wallSide === upper.wallSide &&
                    lower.col === upper.col &&
                    upper.row > lower.row &&
                    upper.row <= lower.row + 2
                );

                if (lostSupportBelow && Math.random() < 0.82) {
                    upper.destroyed = true;
                    fallingMasonryBlocks.push({
                        mesh: upper.mesh,
                        x: upper.x,
                        y: upper.y,
                        z: upper.z,
                        vx: (upper.x - hitPos.x) * 0.6 + (Math.random() - 0.5) * 3.0,
                        vy: -1.0 - Math.random() * 2.5,
                        vz: (upper.z - hitPos.z) * 0.6 + (Math.random() - 0.5) * 3.0,
                        rx: (Math.random() - 0.5) * 3.8,
                        ry: (Math.random() - 0.5) * 3.8,
                        rz: (Math.random() - 0.5) * 3.8,
                        delay: 0.05 + (upper.row * 0.07),
                        spawnDebrisCallback
                    });
                }
            }
        }

        return destroyedCount;
    }

    // Updates falling structural wall blocks (Gravity cascade collapse)
    function updateDestructionPhysics(scene, dt) {
        for (let i = fallingMasonryBlocks.length - 1; i >= 0; i--) {
            const fb = fallingMasonryBlocks[i];
            if (fb.delay > 0) {
                fb.delay -= dt;
                continue;
            }
            fb.vy -= 22.0 * dt;
            fb.x += fb.vx * dt;
            fb.y += fb.vy * dt;
            fb.z += fb.vz * dt;

            fb.mesh.position.set(fb.x, fb.y, fb.z);
            fb.mesh.rotation.x += fb.rx * dt;
            fb.mesh.rotation.y += fb.ry * dt;
            fb.mesh.rotation.z += fb.rz * dt;

            if (fb.y <= 0.65) {
                if (fb.spawnDebrisCallback) {
                    fb.spawnDebrisCallback(fb.x, 0.6, fb.z, 1.5, 1.0, 1.5);
                }
                scene.remove(fb.mesh);
                fallingMasonryBlocks.splice(i, 1);
            }
        }
    }

    // Grand Ruined Gothic Cathedral ("Dom St. Nikolaus" - NO floating wall nodes!)
    function buildDestroyedCathedral(scene, cx, cz, churchMat, roofMat) {
        const group = new THREE.Group();
        group.position.set(cx, 0, cz);

        const plaza = new THREE.Mesh(
            new THREE.BoxGeometry(36, 0.35, 52),
            new THREE.MeshStandardMaterial({ color: 0x524e46, roughness: 0.88 })
        );
        plaza.position.set(0, 0.17, 0);
        plaza.receiveShadow = true;
        group.add(plaza);

        const towerL = new THREE.Mesh(new THREE.BoxGeometry(10.5, 34, 10.5), churchMat);
        towerL.position.set(-10.5, 17, -18);
        towerL.castShadow = true;
        towerL.receiveShadow = true;
        group.add(towerL);
        addBoxCollider(cx - 10.5, cz - 18, 10.5, 10.5, 34);

        const spireL = new THREE.Mesh(new THREE.ConeGeometry(6.8, 17, 8), roofMat);
        spireL.position.set(-10.5, 42.5, -18);
        spireL.castShadow = true;
        group.add(spireL);

        const towerR = new THREE.Mesh(new THREE.BoxGeometry(10.5, 21, 10.5), churchMat);
        towerR.position.set(10.5, 10.5, -18);
        towerR.castShadow = true;
        towerR.receiveShadow = true;
        group.add(towerR);
        addBoxCollider(cx + 10.5, cz - 18, 10.5, 10.5, 21);

        const narthex = new THREE.Mesh(new THREE.BoxGeometry(11, 22, 4.5), churchMat);
        narthex.position.set(0, 11, -18.5);
        narthex.castShadow = true;
        group.add(narthex);
        addBoxCollider(cx, cz - 18.5, 11, 4.5, 22);

        const roseOuter = new THREE.Mesh(new THREE.TorusGeometry(3.8, 0.6, 10, 24), churchMat);
        roseOuter.position.set(0, 14.8, -20.9);
        group.add(roseOuter);

        const wallL = new THREE.Mesh(new THREE.BoxGeometry(3.2, 16, 30), churchMat);
        wallL.position.set(-14.2, 8, 1);
        wallL.castShadow = true;
        wallL.receiveShadow = true;
        group.add(wallL);
        addBoxCollider(cx - 14.2, cz + 1, 3.2, 30, 16);

        const wallR = new THREE.Mesh(new THREE.BoxGeometry(3.2, 14, 30), churchMat);
        wallR.position.set(14.2, 7, 1);
        wallR.castShadow = true;
        wallR.receiveShadow = true;
        group.add(wallR);
        addBoxCollider(cx + 14.2, cz + 1, 3.2, 30, 14);

        for (let i = 0; i < 4; i++) {
            const zPos = -9 + i * 7.5;
            const pierL = new THREE.Mesh(new THREE.BoxGeometry(2.2, 13, 2.2), churchMat);
            pierL.position.set(-17.8, 6.5, zPos);
            pierL.castShadow = true;
            group.add(pierL);

            const pierR = new THREE.Mesh(new THREE.BoxGeometry(2.2, 12, 2.2), churchMat);
            pierR.position.set(17.8, 6.0, zPos);
            pierR.castShadow = true;
            group.add(pierR);

            registerCoverNode(cx - 20.5, cz + zPos, cx - 22.5, cz + zPos);
            registerCoverNode(cx + 20.5, cz + zPos, cx + 22.5, cz + zPos);
        }

        scene.add(group);
    }

    function buildDestroyedParishChurch(scene, cx, cz, churchMat, roofMat) {
        const group = new THREE.Group();
        group.position.set(cx, 0, cz);

        const belfry = new THREE.Mesh(new THREE.BoxGeometry(9, 26, 9), churchMat);
        belfry.position.set(0, 13, -9);
        belfry.castShadow = true;
        group.add(belfry);
        addBoxCollider(cx, cz - 9, 9, 9, 26);

        const spire = new THREE.Mesh(new THREE.ConeGeometry(5.8, 12, 8), roofMat);
        spire.position.set(0, 32, -9);
        group.add(spire);

        const naveBody = new THREE.Mesh(new THREE.BoxGeometry(14, 12, 18), churchMat);
        naveBody.position.set(0, 6, 4);
        naveBody.castShadow = true;
        group.add(naveBody);
        addBoxCollider(cx, cz + 4, 14, 18, 12);

        scene.add(group);
    }

    function createCrushableStreetlamp(scene, x, z, ironMat) {
        const g = new THREE.Group();
        g.position.set(x, 0, z);

        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.16, 5.2, 10), ironMat);
        post.position.y = 2.6;
        post.castShadow = true;
        g.add(post);

        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.1, 0.1), ironMat);
        arm.position.set(x < 0 ? 0.4 : -0.4, 5.0, 0);
        g.add(arm);

        scene.add(g);
        destructibles.push({ mesh: g, x, z, radius: 1.1 });
    }

    function createBurningTankWreck(scene, x, z, ry, steelMat) {
        const g = new THREE.Group();
        g.position.set(x, 0, z);
        g.rotation.y = ry;

        const charredMat = new THREE.MeshStandardMaterial({
            color: 0x26231e,
            roughness: 0.82,
            metalness: 0.48
        });

        const hull = new THREE.Mesh(new THREE.BoxGeometry(2.9, 1.65, 5.6), charredMat);
        hull.position.y = 0.95;
        hull.castShadow = true;
        hull.receiveShadow = true;
        g.add(hull);

        const turret = new THREE.Mesh(new THREE.SphereGeometry(1.22, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.65), charredMat);
        turret.position.set(0.1, 1.75, -0.15);
        turret.rotation.z = 0.14;
        turret.castShadow = true;
        g.add(turret);

        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 3.5, 10), steelMat);
        barrel.rotation.x = Math.PI / 2 - 0.18;
        barrel.position.set(0.1, 2.05, -2.1);
        g.add(barrel);

        const fireLight = new THREE.PointLight(0xff6a1a, 2.5, 26);
        fireLight.position.set(0, 2.6, 0.5);
        g.add(fireLight);

        burningFires.push({ x, y: 2.3, z, light: fireLight, phase: Math.random() * 10 });

        scene.add(g);
        addBoxCollider(x, z, 3.3, 5.6, 2.5);
        registerCoverNode(x - 3.2, z + 1.2, x - 4.5, z + 1.2);
        registerCoverNode(x + 3.2, z - 1.2, x + 4.5, z - 1.2);
    }

    // Replaces the old TorusGeometry "donut" crater with a Realistic Multi-Course Stacked Sandbag Emplacement!
    function createShellCrater(scene, x, z, radius, rubbleMat) {
        const sandbagMat = new THREE.MeshStandardMaterial({ color: 0x7b7159, roughness: 0.92 });
        const timberMat = new THREE.MeshStandardMaterial({ color: 0x473322, roughness: 0.9 });

        const fortGroup = new THREE.Group();
        fortGroup.position.set(x, 0, z);

        // Two angled wings of stacked pillowed burlap sandbags forming a chevron WW2 MG / Rifle nest
        buildStackedSandbagWall(fortGroup, -1.35, 0, 0.32, 4, 4, sandbagMat, timberMat);
        buildStackedSandbagWall(fortGroup, 1.35, 0, -0.32, 4, 4, sandbagMat, timberMat);

        // Low scattered stone/dirt berm in front of the sandbags (never a round torus!)
        for (let m = -1; m <= 1; m++) {
            const dirtChunk = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45 + Math.random() * 0.25, 0), rubbleMat);
            dirtChunk.position.set(m * 1.1, 0.16, 0.55);
            dirtChunk.scale.set(1.3, 0.45, 0.95);
            dirtChunk.receiveShadow = true;
            fortGroup.add(dirtChunk);
        }

        scene.add(fortGroup);
        destructibles.push({ mesh: fortGroup, x, z, radius: 2.3 });

        registerCoverNode(x - 1.6, z - 1.8, x - 2.6, z - 0.4);
        registerCoverNode(x + 1.6, z - 1.8, x + 2.6, z - 0.4);
    }

    function createCrushableBarricade(scene, x, z, steelMat, sandbagMat) {
        const group = new THREE.Group();
        group.position.set(x, 0, z);
        const timberMat = new THREE.MeshStandardMaterial({ color: 0x473322, roughness: 0.9 });

        // Czech Hedgehog Steel Anti-Tank Obstacle
        for (let i = 0; i < 3; i++) {
            const beam = new THREE.Mesh(new THREE.BoxGeometry(0.22, 2.1, 0.22), steelMat);
            beam.position.y = 0.82;
            beam.rotation.set(i === 0 ? 0.65 : -0.5, i * 1.05, i === 1 ? 0.65 : -0.4);
            beam.castShadow = true;
            group.add(beam);
        }

        // Stacked Individual Pillowed Sandbag Wall beside the Hedgehog
        buildStackedSandbagWall(group, 2.1, 0, 0.15, 4, 5, sandbagMat, timberMat);

        scene.add(group);
        destructibles.push({ mesh: group, x: x + 1.4, z, radius: 2.3 });
        registerCoverNode(x + 2.1, z - 2.1, x + 3.8, z - 2.1);
    }

    function addBoxCollider(x, z, w, d, h) {
        colliders.push({
            minX: x - w / 2,
            maxX: x + w / 2,
            minZ: z - d / 2,
            maxZ: z + d / 2,
            h: h,
            cx: x,
            cz: z
        });
    }

    function registerCoverNode(coverX, coverZ, peekX, peekZ) {
        coverNodes.push({
            coverPos: new THREE.Vector3(coverX, 0, coverZ),
            peekPos: new THREE.Vector3(peekX, 0, peekZ),
            occupiedBy: null
        });
    }

    function resolveTankMovement(scene, nextX, nextZ, tankRadius, onCrushCallback) {
        let rx = Math.max(-245, Math.min(245, nextX));
        let rz = Math.max(-245, Math.min(245, nextZ));
        let scrapedWall = false;

        for (let i = 0; i < colliders.length; i++) {
            const c = colliders[i];
            const closestX = Math.max(c.minX, Math.min(rx, c.maxX));
            const closestZ = Math.max(c.minZ, Math.min(rz, c.maxZ));
            const dx = rx - closestX;
            const dz = rz - closestZ;
            const distSq = dx * dx + dz * dz;

            if (distSq < tankRadius * tankRadius) {
                scrapedWall = true;
                const dist = Math.sqrt(distSq);
                if (dist > 0.0001) {
                    const overlap = tankRadius - dist;
                    rx += (dx / dist) * overlap;
                    rz += (dz / dist) * overlap;
                } else {
                    rx += tankRadius;
                }
            }
        }

        for (let d = destructibles.length - 1; d >= 0; d--) {
            const item = destructibles[d];
            if (Math.hypot(rx - item.x, rz - item.z) < tankRadius + item.radius * 0.65) {
                scene.remove(item.mesh);
                destructibles.splice(d, 1);
                if (onCrushCallback) onCrushCallback(item.x, item.z);
            }
        }

        return { x: rx, z: rz, scrapedWall };
    }

    return {
        buildWorld,
        colliders,
        destructibles,
        destructibleWallPanels,
        destructibleBricks,
        carveBuildingDestructionHole,
        updateDestructionPhysics,
        coverNodes,
        windowGarrisonNodes,
        ambushZones,
        burningFires,
        resolveTankMovement
    };
})();
