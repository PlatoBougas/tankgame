// ============================================================================
// HIGH-FIDELITY US INFANTRY PLATOONS (WINDOW GARRISONS, VOICE SHOUTS & BUILDING DESTRUCTION)
// ============================================================================

window.CombatSystem = (function () {
    const soldiers = [];
    const projectiles = [];
    const particles = [];
    const debrisChunks = [];
    const flashLights = [];

    let soldiersEliminated = 0;

    // Shared Realistic PBR Materials for US 1944 GIs
    const oliveDrabMat = new THREE.MeshStandardMaterial({ color: 0x485036, roughness: 0.85 });
    const coatMat = new THREE.MeshStandardMaterial({ color: 0x58543e, roughness: 0.82 });
    const webbingMat = new THREE.MeshStandardMaterial({ color: 0x6b6347, roughness: 0.88 });
    const helmetMat = new THREE.MeshStandardMaterial({ color: 0x343b26, roughness: 0.58, metalness: 0.28 });
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x2b1d14, roughness: 0.75 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd6a582, roughness: 0.72 });
    const gunWoodMat = new THREE.MeshStandardMaterial({ color: 0x4a2c18, roughness: 0.78 });
    const gunSteelMat = new THREE.MeshStandardMaterial({ color: 0x202224, roughness: 0.45, metalness: 0.8 });
    const bazookaMat = new THREE.MeshStandardMaterial({ color: 0x3a482c, roughness: 0.55, metalness: 0.42 });

    const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.32, metalness: 0.85 });
    const darkHairMat = new THREE.MeshStandardMaterial({ color: 0x2b1d12, roughness: 0.9 });

    // Builds a GTA-Style Sculpted Anatomical Human WW2 US Soldier (Contoured human proportions, face, joints & gear)
    function createSoldierMesh(role) {
        const group = new THREE.Group();

        // 1. Anatomical Human Legs (Hip Joint -> Tapered Thigh -> Spherical Knee -> Sculpted Calf with Leggings -> Lace Boot)
        function createAnatomicalLeg(xOff) {
            const legGrp = new THREE.Group();
            legGrp.position.set(xOff, 0.82, 0);

            const hipJoint = new THREE.Mesh(new THREE.SphereGeometry(0.098, 12, 10), oliveDrabMat);
            legGrp.add(hipJoint);

            const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.098, 0.082, 0.38, 14), oliveDrabMat);
            thigh.position.set(0, -0.19, 0);
            thigh.castShadow = true;
            legGrp.add(thigh);

            const knee = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), oliveDrabMat);
            knee.position.set(0, -0.38, 0.015);
            legGrp.add(knee);

            // M1938 Canvas Dismounted Leggings (Puttees) over calf
            const calf = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.062, 0.35, 14), webbingMat);
            calf.position.set(0, -0.55, 0);
            calf.castShadow = true;
            legGrp.add(calf);

            // Contoured Leather Combat Boot with rounded toe cap
            const bootAnkle = new THREE.Mesh(new THREE.CylinderGeometry(0.064, 0.068, 0.12, 12), bootMat);
            bootAnkle.position.set(0, -0.73, 0);
            legGrp.add(bootAnkle);

            const bootFoot = new THREE.Mesh(new THREE.SphereGeometry(0.072, 12, 10), bootMat);
            bootFoot.scale.set(0.92, 0.65, 1.65);
            bootFoot.position.set(0, -0.77, 0.055);
            legGrp.add(bootFoot);

            return legGrp;
        }

        const leftLeg = createAnatomicalLeg(-0.125);
        const rightLeg = createAnatomicalLeg(0.125);
        group.add(leftLeg);
        group.add(rightLeg);

        // 2. Anatomical Human Torso (Contoured Pelvis, Waist, Ribcage, Rounded Deltoid Shoulders, Collar & Webbing)
        const torso = new THREE.Group();
        torso.position.set(0, 0.82, 0);

        const pelvis = new THREE.Mesh(new THREE.SphereGeometry(0.19, 14, 12), oliveDrabMat);
        pelvis.scale.set(1.12, 0.72, 0.82);
        pelvis.position.y = 0.04;
        torso.add(pelvis);

        // Contoured M1943 Field Jacket Waist & Upper Chest
        const waist = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.175, 0.24, 16), coatMat);
        waist.scale.set(1.14, 1, 0.80);
        waist.position.y = 0.18;
        waist.castShadow = true;
        torso.add(waist);

        const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.235, 0.20, 0.34, 16), coatMat);
        chest.scale.set(1.18, 1, 0.82);
        chest.position.y = 0.44;
        chest.castShadow = true;
        torso.add(chest);

        // Rounded Human Deltoid Shoulders (Eliminates any blocky silhouette!)
        for (let side = -1; side <= 1; side += 2) {
            const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.095, 12, 10), coatMat);
            shoulder.scale.set(1.1, 0.95, 0.95);
            shoulder.position.set(side * 0.24, 0.56, 0);
            torso.add(shoulder);
        }

        // Cartridge Belt & 3D Ammo Pouches around waist + Mk 2 Pineapple Grenade clipped to chest suspender
        const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.208, 0.208, 0.075, 16), webbingMat);
        belt.scale.set(1.15, 1, 0.83);
        belt.position.y = 0.12;
        torso.add(belt);

        const chestGrenade = new THREE.Mesh(new THREE.SphereGeometry(0.036, 8, 8), helmetMat);
        chestGrenade.scale.set(0.85, 1.25, 0.85);
        chestGrenade.position.set(-0.12, 0.46, 0.18);
        torso.add(chestGrenade);

        // Sculpted M1928 Musette Field Pack + Rolled Blanket on Back
        const backpack = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), webbingMat);
        backpack.scale.set(1.15, 1.25, 0.68);
        backpack.position.set(0, 0.43, -0.19);
        torso.add(backpack);

        // 3. Sculpted Human Neck, Jawline, Nose, Eyes & M1 Steel Pot Helmet
        const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.078, 0.12, 12), skinMat);
        neck.position.set(0, 0.65, 0.01);
        torso.add(neck);

        const headGroup = new THREE.Group();
        headGroup.position.set(0, 0.77, 0.02);

        // Cranium + Contoured Jaw/Chin
        const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.128, 16, 14), skinMat);
        cranium.scale.set(0.94, 1.08, 1.02);
        headGroup.add(cranium);

        const jaw = new THREE.Mesh(new THREE.SphereGeometry(0.095, 12, 10), skinMat);
        jaw.scale.set(0.92, 0.85, 0.95);
        jaw.position.set(0, -0.055, 0.025);
        headGroup.add(jaw);

        // Human Nose Bridge & Eyes
        const nose = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.055, 6), skinMat);
        nose.rotation.x = Math.PI / 2 - 0.2;
        nose.position.set(0, -0.01, 0.13);
        headGroup.add(nose);

        for (let e = -1; e <= 1; e += 2) {
            const eye = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 8), darkHairMat);
            eye.position.set(e * 0.042, 0.015, 0.115);
            headGroup.add(eye);
        }

        // Authentic US M1 Steel Pot Helmet with Chinstrap
        const helmet = new THREE.Mesh(
            new THREE.SphereGeometry(0.162, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.58),
            helmetMat
        );
        helmet.scale.set(0.98, 1.0, 1.08);
        helmet.position.set(0, 0.025, -0.005);
        helmet.rotation.x = -0.14;
        helmet.castShadow = true;
        headGroup.add(helmet);

        torso.add(headGroup);

        // 4. Articulated Human Arms (Upper Arm -> Elbow Joint -> Forearm -> Hands) & Weapon Rig
        const weaponGroup = new THREE.Group();
        weaponGroup.position.set(0.17, 0.48, 0.14);

        const rightUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.056, 0.28, 12), coatMat);
        rightUpperArm.rotation.x = Math.PI / 2.5;
        rightUpperArm.position.set(0.05, 0.0, 0.08);
        weaponGroup.add(rightUpperArm);

        const rightForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.054, 0.045, 0.25, 12), coatMat);
        rightForearm.rotation.x = Math.PI / 2.1;
        rightForearm.position.set(0.02, -0.04, 0.24);
        weaponGroup.add(rightForearm);

        const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.044, 10, 10), skinMat);
        rightHand.position.set(0.01, -0.04, 0.34);
        weaponGroup.add(rightHand);

        const leftUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.066, 0.055, 0.30, 12), coatMat);
        leftUpperArm.rotation.x = Math.PI / 2.3;
        leftUpperArm.rotation.z = -0.42;
        leftUpperArm.position.set(-0.26, 0.01, 0.14);
        weaponGroup.add(leftUpperArm);

        const leftForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.044, 0.26, 12), coatMat);
        leftForearm.rotation.x = Math.PI / 2.0;
        leftForearm.rotation.z = -0.22;
        leftForearm.position.set(-0.12, -0.02, 0.34);
        weaponGroup.add(leftForearm);

        const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.044, 10, 10), skinMat);
        leftHand.position.set(-0.04, -0.02, 0.46);
        weaponGroup.add(leftHand);

        if (role === 'HEAVY_MG') {
            // BELT-FED BROWNING M1919A4 .30 CAL HEAVY MACHINE GUN (Perforated Barrel Shroud, Receiver, Bipod & Brass Ammo Belt!)
            const receiverBox = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.13, 0.42), gunSteelMat);
            receiverBox.position.set(0, 0.03, 0.20);
            weaponGroup.add(receiverBox);

            // Perforated cylindrical barrel cooling jacket
            const shroud = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.62, 14), gunSteelMat);
            shroud.rotation.x = Math.PI / 2;
            shroud.position.set(0, 0.04, 0.64);
            weaponGroup.add(shroud);

            const flashHider = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.018, 0.12, 10), gunSteelMat);
            flashHider.rotation.x = Math.PI / 2;
            flashHider.position.set(0, 0.04, 0.98);
            weaponGroup.add(flashHider);

            // Deployed Front Folding Bipod Legs
            for (let b = -1; b <= 1; b += 2) {
                const bipodLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.34, 8), gunSteelMat);
                bipodLeg.position.set(b * 0.09, -0.11, 0.82);
                bipodLeg.rotation.z = b * 0.32;
                weaponGroup.add(bipodLeg);
            }

            // Side-Mounted Olive Drab .30 Cal Ammo Can
            const ammoBox = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 0.24), helmetMat);
            ammoBox.position.set(-0.15, -0.03, 0.22);
            weaponGroup.add(ammoBox);

            // Draped Gleaming Brass Cartridge Belt (12 Linked .30-06 Brass Rounds feeding into the receiver!)
            for (let c = 0; c < 12; c++) {
                const t = c / 11;
                const cartridge = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.011, 0.075, 8), brassMat);
                cartridge.rotation.x = Math.PI / 2;
                // Smooth catenary curve from ammo box (-0.15, -0.02) up into the receiver feed tray (-0.04, 0.06)
                const cx = -0.15 + t * 0.11;
                const cy = -0.02 + Math.sin(t * Math.PI) * 0.09 + t * 0.07;
                const cz = 0.17 + (c % 2) * 0.012;
                cartridge.position.set(cx, cy, cz);
                weaponGroup.add(cartridge);
            }
        } else if (role === 'BAZOOKA') {
            // Detailed M1A1 60mm Rocket Launcher with Shoulder Stock, Sight & Blast Cone
            const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 1.45, 14), bazookaMat);
            tube.rotation.x = Math.PI / 2;
            tube.position.set(0.06, 0.16, 0.12);
            weaponGroup.add(tube);

            const rearCone = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.052, 0.18, 12), bazookaMat);
            rearCone.rotation.x = Math.PI / 2;
            rearCone.position.set(0.06, 0.16, -0.58);
            weaponGroup.add(rearCone);

            const gripStock = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.24, 8), gunWoodMat);
            gripStock.position.set(0.06, 0.04, 0.18);
            weaponGroup.add(gripStock);
        } else if (role === 'MG') {
            // Browning M1918A2 BAR Automatic Rifle with Bipod & Box Magazine
            const receiver = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.045, 0.52, 12), gunSteelMat);
            receiver.rotation.x = Math.PI / 2;
            receiver.position.set(0, 0.02, 0.18);
            weaponGroup.add(receiver);

            const mag = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.14, 0.08), gunSteelMat);
            mag.position.set(0, -0.06, 0.24);
            weaponGroup.add(mag);

            const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.78, 10), gunSteelMat);
            barrel.rotation.x = Math.PI / 2;
            barrel.position.set(0, 0.03, 0.58);
            weaponGroup.add(barrel);
        } else {
            // M1 Garand .30-06 Semi-Automatic Rifle
            const stock = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.048, 0.56, 12), gunWoodMat);
            stock.rotation.x = Math.PI / 2;
            stock.position.set(0, 0.0, 0.15);
            weaponGroup.add(stock);

            const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.02, 0.64, 10), gunSteelMat);
            barrel.rotation.x = Math.PI / 2;
            barrel.position.set(0, 0.025, 0.54);
            weaponGroup.add(barrel);
        }

        torso.add(weaponGroup);
        group.add(torso);

        return {
            group,
            leftLeg,
            rightLeg,
            torso,
            head: headGroup,
            helmet,
            weaponGroup
        };
    }

    // Spawn a US Army Platoon (Includes 1 Belt-Fed Heavy MG Soldier, Bazooka Teams, BAR Gunners & Riflemen at Long Range!)
    function spawnPlatoonAtZone(scene, zone, coverNodes, windowNodes, tank) {
        zone.spawned = true;

        // 1 Dedicated Belt-Fed Heavy MG Soldier ('HEAVY_MG') in every platoon!
        const roles = ['HEAVY_MG', 'BAZOOKA', 'MG', 'RIFLE', 'BAZOOKA', 'RIFLE', 'MG', 'RIFLE', 'BAZOOKA', 'RIFLE'];

        // 1. Find available 2nd floor balconies near this sector
        const nearbyWindows = windowNodes
            .filter(wn => !wn.occupiedBy && (!wn.parentPanel || !wn.parentPanel.destroyed) &&
                          Math.hypot(wn.x - zone.x, wn.z - zone.z) < 68)
            .sort((a, b) => Math.hypot(a.x - zone.x, a.z - zone.z) - Math.hypot(b.x - zone.x, b.z - zone.z));

        // 2. Find safe ground-level sandbag cover positions
        const nearbyCovers = coverNodes
            .filter(cn => !cn.occupiedBy && Math.hypot(cn.coverPos.x - zone.x, cn.coverPos.z - zone.z) < 65)
            .sort((a, b) => Math.hypot(a.coverPos.x - zone.x, a.coverPos.z - zone.z) - Math.hypot(b.coverPos.x - zone.x, b.coverPos.z - zone.z));

        let winIdx = 0;
        let covIdx = 0;

        roles.forEach((role, i) => {
            // Keep HEAVY_MG on ground sandbag emplacement or balcony overlooking street
            const useWindow = (i % 2 === 1 && winIdx < nearbyWindows.length);
            const meshParts = createSoldierMesh(role);

            if (useWindow) {
                const winNode = nearbyWindows[winIdx++];
                winNode.occupiedBy = true;

                meshParts.group.position.set(winNode.x, winNode.y, winNode.z);
                scene.add(meshParts.group);

                const solObj = {
                    role,
                    hp: 100,
                    hasGrenade: true,
                    zoneId: zone.id,
                    zoneName: zone.name,
                    meshParts,
                    x: winNode.x,
                    y: winNode.y,
                    z: winNode.z,
                    vy: 0,
                    isWindowGarrison: true,
                    windowNode: winNode,
                    coverNode: null,
                    alive: true,
                    fallingFromBuilding: false,
                    fallProgress: 0,
                    state: 'WINDOW_GARRISON',
                    stateTimer: 0.6 + Math.random() * 1.2,
                    fireCooldown: 0.8 + Math.random() * 1.4,
                    burstRemaining: (role === 'HEAVY_MG') ? 14 : ((role === 'MG') ? 8 : 3),
                    shotsFiredInClip: 0,
                    animPhase: Math.random() * 10
                };
                if (winNode.parentPanel) {
                    winNode.parentPanel.garrisonSoldier = solObj;
                }
                soldiers.push(solObj);
            } else {
                const assignedCover = nearbyCovers[covIdx++] || null;
                if (assignedCover) assignedCover.occupiedBy = true;

                const sx = assignedCover ? assignedCover.coverPos.x : (zone.x + (Math.random() - 0.5) * 16);
                const sz = assignedCover ? assignedCover.coverPos.z : (zone.z + (Math.random() - 0.5) * 16);

                meshParts.group.position.set(sx, 0, sz);
                scene.add(meshParts.group);

                soldiers.push({
                    role,
                    hp: 100,
                    hasGrenade: true,
                    zoneId: zone.id,
                    zoneName: zone.name,
                    meshParts,
                    x: sx,
                    y: 0,
                    z: sz,
                    vy: 0,
                    isWindowGarrison: false,
                    windowNode: null,
                    coverNode: assignedCover,
                    alive: true,
                    fallingFromBuilding: false,
                    fallProgress: 0,
                    state: 'SCRAMBLE_TO_COVER',
                    stateTimer: Math.random() * 1.2,
                    fireCooldown: 1.0 + Math.random() * 1.5,
                    burstRemaining: (role === 'HEAVY_MG') ? 14 : 0,
                    shotsFiredInClip: 0,
                    animPhase: Math.random() * 10
                });
            }
        });

        // 3D Spatialized American Soldier Voice Shout from the Platoon Leader!
        const leaderSoldier = soldiers[soldiers.length - 1];
        if (leaderSoldier) {
            SoundEngine.shoutAmericanCommand3D(leaderSoldier, tank, 'contact_tiger');
        }

        if (window.HUD) {
            window.HUD.triggerPlatoonBanner(zone.name);
        }
    }

    // Spawns reinforcement platoon at realistic long combat distance (115m ahead) so they never pop in right in front of the tank!
    function spawnImmediateAmbushAhead(scene, tank, coverNodes) {
        const dist = 115;
        const azX = Math.max(-195, Math.min(195, tank.x + Math.sin(tank.hullYaw) * dist));
        const azZ = Math.max(-195, Math.min(195, tank.z + Math.cos(tank.hullYaw) * dist));
        const customZone = {
            id: 'dynamic_' + Date.now(),
            name: 'Forward Avenue & Upper Balconies (115m Ahead)',
            x: azX,
            z: azZ,
            spawned: false
        };
        spawnPlatoonAtZone(scene, customZone, coverNodes, CityWorld.windowGarrisonNodes, tank);
    }

    // Throws 1 WW2 Mk 2 Fragmentation / Anti-Tank Grenade when the King Tiger gets within 32m!
    function throwEnemyGrenade(scene, soldier, tank) {
        soldier.hasGrenade = false; // Strictly max 1 grenade per soldier!

        const startPos = new THREE.Vector3(soldier.x, soldier.y + 1.45, soldier.z);
        const targetX = tank.x + (Math.random() - 0.5) * 1.8;
        const targetZ = tank.z + (Math.random() - 0.5) * 1.8;
        const dx = targetX - startPos.x;
        const dz = targetZ - startPos.z;
        const flightTime = Math.max(0.85, Math.min(1.65, Math.hypot(dx, dz) / 17.5));
        const gravity = 16.5;

        const vx = dx / flightTime;
        const vz = dz / flightTime;
        const vy = ((1.1 - startPos.y) + 0.5 * gravity * flightTime * flightTime) / flightTime;

        SoundEngine.shoutAmericanCommand3D(soldier, tank, 'bazooka_up');
        if (window.HUD) {
            window.HUD.pushCombatLog('WARNING: US Infantry threw a Mk 2 Fragmentation Grenade at close range!', 'warn');
        }

        // 3D Ribbed Olive-Drab Mk 2 "Pineapple" Grenade Mesh with Lever & Fuse Spark
        const grenGroup = new THREE.Group();
        const body = new THREE.Mesh(new THREE.DodecahedronGeometry(0.085, 1), helmetMat);
        body.scale.set(0.85, 1.25, 0.85);
        grenGroup.add(body);

        const fuseSpark = new THREE.Mesh(
            new THREE.SphereGeometry(0.045, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xffbb33 })
        );
        fuseSpark.position.set(0, 0.11, 0);
        grenGroup.add(fuseSpark);

        grenGroup.position.copy(startPos);
        scene.add(grenGroup);

        projectiles.push({
            type: 'ENEMY_GRENADE',
            mesh: grenGroup,
            pos: startPos,
            vel: new THREE.Vector3(vx, vy, vz),
            gravity: gravity,
            life: flightTime + 0.35
        });
    }

    function updateCombat(scene, tank, dt, colliders, destructibles, ambushZones, coverNodes, cameraShakeCb) {
        // 0. Update Battlefield Gravity Cascade Wall Destruction Physics
        if (CityWorld.updateDestructionPhysics) {
            CityWorld.updateDestructionPhysics(scene, dt);
        }

        // 1. Check Long-Range Ambush Sector Triggers (130m-145m so platoons are deployed well ahead!)
        for (let i = 0; i < ambushZones.length; i++) {
            const z = ambushZones[i];
            if (!z.spawned && Math.hypot(tank.x - z.x, tank.z - z.z) < z.radius) {
                spawnPlatoonAtZone(scene, z, coverNodes, CityWorld.windowGarrisonNodes, tank);
            }
        }

        // 2. Update Each US Soldier AI (Ground Sandbag Cover + Solid 2nd Floor Balconies)
        let activeEnemiesCount = 0;

        for (let i = soldiers.length - 1; i >= 0; i--) {
            const s = soldiers[i];
            if (s.shoutTimer && s.shoutTimer > 0) {
                s.shoutTimer = Math.max(0, s.shoutTimer - dt);
            }
            if (!s.alive) {
                if (s.y > 0.05) {
                    s.vy -= 24.0 * dt;
                    s.y = Math.max(0.05, s.y + s.vy * dt);
                    s.meshParts.group.position.y = s.y;
                    s.meshParts.group.rotation.z += 4.5 * dt;
                }
                if (s.fallProgress < 1.0) {
                    s.fallProgress = Math.min(1.0, s.fallProgress + dt * 3.8);
                    s.meshParts.group.rotation.x = -(Math.PI / 2) * s.fallProgress;
                }
                continue;
            }

            // If balcony was destroyed underneath this soldier, make him fall and perish on impact!
            if (s.fallingFromBuilding) {
                s.vy -= 24.0 * dt;
                s.y += s.vy * dt;
                s.meshParts.group.position.y = s.y;
                s.meshParts.group.rotation.x += 3.2 * dt;
                if (s.y <= 0.15) {
                    s.y = 0.05;
                    eliminateSoldier(s, true);
                }
                continue;
            }

            activeEnemiesCount++;
            const dx = tank.x - s.x;
            const dz = tank.z - s.z;
            const distToTank = Math.hypot(dx, dz);
            const angleToTank = Math.atan2(dx, dz);

            // Periodic 3D spatialized American Soldier shouts from this soldier's exact 3D coordinates!
            if (distToTank < 105 && Math.random() < 0.0022) {
                SoundEngine.shoutAmericanCommand3D(s, tank, s.role === 'BAZOOKA' ? 'bazooka_up' : null);
            }

            // Close-Range Grenade Throw! Each soldier can throw 1 grenade if the King Tiger gets within 32m!
            if (s.hasGrenade && distToTank < 32 && distToTank > 6 && !tank.destroyed && Math.random() < 0.012) {
                throwEnemyGrenade(scene, s, tank);
            }

            // A. Soldiers on 2nd Floor Wrought-Iron Balconies!
            if (s.isWindowGarrison) {
                s.meshParts.group.rotation.y = angleToTank;
                // Aim weapon downward toward the tank on the street below
                const pitchDown = Math.atan2(s.y - 1.2, distToTank);
                s.meshParts.weaponGroup.rotation.x = pitchDown;

                if (distToTank < 120 && !tank.destroyed) {
                    s.fireCooldown -= dt;
                    if (s.fireCooldown <= 0) {
                        if (s.role === 'BAZOOKA') {
                            fireEnemyBazooka(scene, s, tank);
                            s.fireCooldown = 4.8 + Math.random() * 1.8;
                        } else if (s.role === 'HEAVY_MG' || s.role === 'MG') {
                            fireEnemySmallArms(scene, s, tank, true);
                            s.fireCooldown = (s.role === 'HEAVY_MG') ? 0.095 : 0.14;
                            s.burstRemaining--;
                            if (s.burstRemaining <= 0) {
                                s.burstRemaining = (s.role === 'HEAVY_MG') ? 14 : 8;
                                s.fireCooldown = 1.6;
                            }
                        } else {
                            fireEnemySmallArms(scene, s, tank, false);
                            s.fireCooldown = 0.65;
                        }
                    }
                }
                continue;
            }

            // B. Street-Level Soldiers (With Sandbag Barrier Repulsion so they NEVER clip inside barriers!)
            for (let d = 0; d < destructibles.length; d++) {
                const bar = destructibles[d];
                const bdx = s.x - bar.x;
                const bdz = s.z - bar.z;
                const bdist = Math.hypot(bdx, bdz);
                const minSep = bar.radius + 0.65;
                if (bdist < minSep && bdist > 0.001) {
                    s.x += (bdx / bdist) * (minSep - bdist);
                    s.z += (bdz / bdist) * (minSep - bdist);
                }
            }

            if (s.state === 'SCRAMBLE_TO_COVER') {
                const targetX = s.coverNode ? s.coverNode.coverPos.x : s.x;
                const targetZ = s.coverNode ? s.coverNode.coverPos.z : s.z;
                const cdx = targetX - s.x;
                const cdz = targetZ - s.z;
                const cdist = Math.hypot(cdx, cdz);

                if (cdist > 0.55) {
                    const sprintSpeed = 5.2;
                    s.x += (cdx / cdist) * sprintSpeed * dt;
                    s.z += (cdz / cdist) * sprintSpeed * dt;
                    s.meshParts.group.position.set(s.x, 0, s.z);
                    s.meshParts.group.rotation.y = Math.atan2(cdx, cdz);

                    s.animPhase += dt * 13.0;
                    s.meshParts.leftLeg.rotation.x = Math.sin(s.animPhase) * 0.72;
                    s.meshParts.rightLeg.rotation.x = -Math.sin(s.animPhase) * 0.72;
                    s.meshParts.torso.rotation.x = 0.22;
                } else {
                    s.state = 'IN_COVER';
                    s.stateTimer = 0.8 + Math.random() * 1.5;
                }
            } else if (s.state === 'IN_COVER') {
                s.meshParts.group.position.set(s.x, -0.22, s.z);
                s.meshParts.group.rotation.y = angleToTank;
                s.meshParts.leftLeg.rotation.x = 0.52;
                s.meshParts.rightLeg.rotation.x = -0.52;
                s.meshParts.torso.rotation.x = 0.28;

                s.stateTimer -= dt;
                if (s.stateTimer <= 0 && distToTank < 115 && !tank.destroyed) {
                    s.state = 'PEEK_AND_FIRE';
                    s.stateTimer = (s.role === 'BAZOOKA') ? 2.4 : (1.8 + Math.random() * 1.4);
                    s.burstRemaining = (s.role === 'HEAVY_MG') ? 14 : ((s.role === 'MG') ? 8 : (s.role === 'RIFLE' ? 4 : 1));
                    s.fireCooldown = (s.role === 'BAZOOKA') ? 1.05 : 0.25;
                }
            } else if (s.state === 'PEEK_AND_FIRE') {
                if (s.coverNode) {
                    s.x += (s.coverNode.peekPos.x - s.x) * Math.min(1, dt * 6);
                    s.z += (s.coverNode.peekPos.z - s.z) * Math.min(1, dt * 6);
                }
                s.meshParts.group.position.set(s.x, 0, s.z);
                s.meshParts.group.rotation.y = angleToTank;
                s.meshParts.torso.rotation.x = 0.08;

                s.fireCooldown -= dt;
                if (s.fireCooldown <= 0 && s.burstRemaining > 0 && !tank.destroyed) {
                    s.burstRemaining--;
                    if (s.role === 'BAZOOKA') {
                        fireEnemyBazooka(scene, s, tank);
                        s.fireCooldown = 4.5;
                    } else if (s.role === 'HEAVY_MG' || s.role === 'MG') {
                        fireEnemySmallArms(scene, s, tank, true);
                        s.fireCooldown = (s.role === 'HEAVY_MG') ? 0.095 : 0.13;
                    } else {
                        fireEnemySmallArms(scene, s, tank, false);
                        s.fireCooldown = 0.48;
                    }
                }

                s.stateTimer -= dt;
                if (s.stateTimer <= 0 || s.burstRemaining <= 0) {
                    if (s.coverNode) {
                        s.x = s.coverNode.coverPos.x;
                        s.z = s.coverNode.coverPos.z;
                    }
                    s.state = 'IN_COVER';
                    s.stateTimer = (s.role === 'BAZOOKA') ? 4.0 : (1.3 + Math.random() * 1.6);
                }
            }
        }

        // 3. Update All Active Projectiles & Dynamic Building Destruction
        updateProjectiles(scene, tank, dt, colliders, destructibles, cameraShakeCb);

        // 4. Update Soft Radial Volumetric Particles & Tumbling Masonry Debris
        updateParticlesAndDebris(scene, dt);

        return {
            activeEnemiesCount,
            soldiersEliminated
        };
    }

    function fireTank88mm(scene, tank, cameraShakeCb) {
        if (tank.destroyed || tank.reloadTimer > 0) return false;

        tank.reloadTimer = tank.reloadDuration;
        tank.barrelRecoil = 0.65;

        tank.pitchVel += Math.cos(tank.turretRelYaw) * 0.45;
        tank.rollVel += Math.sin(tank.turretRelYaw) * 0.36;

        if (cameraShakeCb) cameraShakeCb(0.68);
        SoundEngine.playCannon88mm();

        const muzzlePos = new THREE.Vector3();
        tank.muzzleNode.getWorldPosition(muzzlePos);

        const sightPos = new THREE.Vector3();
        tank.gunPivot.getWorldPosition(sightPos);
        const dir = muzzlePos.clone().sub(sightPos).normalize();

        spawnMuzzleBlast88mm(scene, muzzlePos, dir);

        const shellGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.5, 10);
        shellGeo.rotateX(Math.PI / 2);
        const shellColor = (tank.selectedAmmo === 'HE') ? 0xffb833 : 0xff4422;
        const shellMesh = new THREE.Mesh(shellGeo, new THREE.MeshBasicMaterial({ color: shellColor }));
        shellMesh.position.copy(muzzlePos);
        shellMesh.lookAt(muzzlePos.clone().add(dir));
        scene.add(shellMesh);

        const muzzleVelocity = (tank.selectedAmmo === 'AP') ? 170.0 : 145.0;
        projectiles.push({
            type: 'TANK_88MM',
            ammoType: tank.selectedAmmo,
            mesh: shellMesh,
            pos: muzzlePos.clone(),
            vel: dir.multiplyScalar(muzzleVelocity),
            gravity: 5.2,
            life: 4.0
        });

        return true;
    }

    function fireTankMG34(scene, tank, cameraShakeCb) {
        if (tank.destroyed || tank.mgOverheated) return false;

        tank.mgHeat = Math.min(100, tank.mgHeat + 2.2);
        if (tank.mgHeat >= 100) {
            tank.mgOverheated = true;
            if (window.HUD) window.HUD.pushCombatLog('GUNNER: Coaxial MG barrel hot! Changing barrel...', 'warn');
        }

        if (cameraShakeCb) cameraShakeCb(0.045);
        SoundEngine.playMG34Shot();

        const coaxPos = new THREE.Vector3();
        tank.coaxMuzzleNode.getWorldPosition(coaxPos);

        const sightPos = new THREE.Vector3();
        tank.gunPivot.getWorldPosition(sightPos);
        // Align coaxial MG precisely with the main gun barrel & optical reticle (including full upward pitch to balconies!)
        const baseDir = tank.muzzleNode.getWorldPosition(new THREE.Vector3()).sub(sightPos).normalize();

        baseDir.x += (Math.random() - 0.5) * 0.008;
        baseDir.y += (Math.random() - 0.5) * 0.008;
        baseDir.z += (Math.random() - 0.5) * 0.008;
        baseDir.normalize();

        spawnPointFlash(scene, coaxPos, 0xffaa33, 1.8, 0.05);

        const tracerGeo = new THREE.CylinderGeometry(0.024, 0.024, 1.35, 6);
        tracerGeo.rotateX(Math.PI / 2);
        const tracerMesh = new THREE.Mesh(tracerGeo, new THREE.MeshBasicMaterial({ color: 0xffe877 }));
        tracerMesh.position.copy(coaxPos);
        tracerMesh.lookAt(coaxPos.clone().add(baseDir));
        scene.add(tracerMesh);

        projectiles.push({
            type: 'TANK_MG34',
            mesh: tracerMesh,
            pos: coaxPos.clone(),
            vel: baseDir.multiplyScalar(165.0),
            gravity: 1.8, // Flat, high-velocity 7.92x57mm trajectory so aiming at 2nd-floor balconies hits dead-on!
            life: 2.4
        });

        return true;
    }

    function fireEnemySmallArms(scene, soldier, tank, isMG) {
        const startPos = new THREE.Vector3(soldier.x, soldier.y + 1.25, soldier.z);
        const aimPos = new THREE.Vector3(
            tank.x + (Math.random() - 0.5) * 2.3,
            1.15 + Math.random() * 1.3,
            tank.z + (Math.random() - 0.5) * 3.0
        );
        const dir = aimPos.sub(startPos).normalize();

        soldier.shotsFiredInClip = (soldier.shotsFiredInClip || 0) + 1;
        const isGarandPing = (!isMG && soldier.shotsFiredInClip % 8 === 0);
        SoundEngine.playEnemyGunshot3D(soldier.x, soldier.y + 1.3, soldier.z, isMG, isGarandPing);

        spawnPointFlash(scene, startPos.clone().add(dir.clone().multiplyScalar(0.65)), 0xffaa44, 1.4, 0.05);

        const tracerGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.85, 6);
        tracerGeo.rotateX(Math.PI / 2);
        const tracerMesh = new THREE.Mesh(tracerGeo, new THREE.MeshBasicMaterial({
            color: isMG ? 0xff5533 : 0xffcc66
        }));
        tracerMesh.position.copy(startPos);
        tracerMesh.lookAt(startPos.clone().add(dir));
        scene.add(tracerMesh);

        projectiles.push({
            type: 'ENEMY_BULLET',
            mesh: tracerMesh,
            pos: startPos,
            vel: dir.multiplyScalar(118.0),
            gravity: 1.5,
            life: 1.8
        });
    }

    function fireEnemyBazooka(scene, soldier, tank) {
        const startPos = new THREE.Vector3(soldier.x, soldier.y + 1.38, soldier.z);
        const aimPos = new THREE.Vector3(
            tank.x + (Math.random() - 0.5) * 1.6,
            1.35 + (Math.random() - 0.5) * 0.5,
            tank.z + (Math.random() - 0.5) * 2.0
        );
        const dir = aimPos.sub(startPos).normalize();

        SoundEngine.playBazookaLaunch3D(soldier.x, soldier.y + 1.4, soldier.z);

        for (let b = 0; b < 7; b++) {
            spawnSmokePuff(
                scene,
                startPos.x - dir.x * 0.9 + (Math.random() - 0.5) * 0.5,
                startPos.y + (Math.random() - 0.5) * 0.3,
                startPos.z - dir.z * 0.9 + (Math.random() - 0.5) * 0.5,
                0.85,
                0xe2e0d8,
                1.3
            );
        }

        const rocketGroup = new THREE.Group();
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.55, 10), bazookaMat);
        body.rotation.x = Math.PI / 2;
        rocketGroup.add(body);
        const motorGlow = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff8822 }));
        motorGlow.position.set(0, 0, -0.3);
        rocketGroup.add(motorGlow);

        rocketGroup.position.copy(startPos);
        rocketGroup.lookAt(startPos.clone().add(dir));
        scene.add(rocketGroup);

        projectiles.push({
            type: 'ENEMY_BAZOOKA',
            fromElevatedWindow: soldier.isWindowGarrison,
            mesh: rocketGroup,
            pos: startPos,
            vel: dir.multiplyScalar(58.0),
            gravity: 2.0,
            life: 3.5
        });
    }

    // Helper to spawn physics-driven brick, stone & timber splinters from a destroyed wall block
    function spawnBrickDebrisBurst(scene, bx, by, bz, bw, bh, bd) {
        const stoneMat = new THREE.MeshStandardMaterial({ color: 0x6c655b, roughness: 0.88 });
        const brickMat = new THREE.MeshStandardMaterial({ color: 0x623426, roughness: 0.9 });
        for (let i = 0; i < 6; i++) {
            const isBrick = (i % 2 === 0);
            const chunk = new THREE.Mesh(
                isBrick
                    ? new THREE.BoxGeometry(0.38, 0.24, 0.52)
                    : new THREE.DodecahedronGeometry(0.28 + Math.random() * 0.22, 0),
                isBrick ? brickMat : stoneMat
            );
            chunk.position.set(
                bx + (Math.random() - 0.5) * bw,
                by + (Math.random() - 0.5) * bh,
                bz + (Math.random() - 0.5) * bd
            );
            scene.add(chunk);
            debrisChunks.push({
                mesh: chunk,
                vel: new THREE.Vector3(
                    (Math.random() - 0.5) * 15,
                    3.5 + Math.random() * 10,
                    (Math.random() - 0.5) * 15
                ),
                rotVel: new THREE.Vector3(Math.random() * 8, Math.random() * 8, Math.random() * 8),
                life: 3.2 + Math.random() * 1.4
            });
        }
    }

    function updateProjectiles(scene, tank, dt, colliders, destructibles, cameraShakeCb) {
        const bricks = CityWorld.destructibleBricks || [];

        for (let i = projectiles.length - 1; i >= 0; i--) {
            const p = projectiles[i];
            p.life -= dt;
            if (p.life <= 0) {
                if (p.type === 'ENEMY_BAZOOKA') {
                    detonateBazookaWarhead(scene, p.pos, cameraShakeCb, false);
                } else if (p.type === 'ENEMY_GRENADE') {
                    detonateGrenadeWarhead(scene, p.pos, tank, cameraShakeCb);
                }
                scene.remove(p.mesh);
                projectiles.splice(i, 1);
                continue;
            }

            if (p.type === 'ENEMY_BAZOOKA') {
                spawnSmokePuff(scene, p.pos.x, p.pos.y, p.pos.z, 0.45, 0xdcdad2, 0.9);
            } else if (p.type === 'ENEMY_GRENADE') {
                p.mesh.rotation.x += 9.0 * dt;
                p.mesh.rotation.z += 7.0 * dt;
                if (Math.random() < 0.65) {
                    spawnSmokePuff(scene, p.pos.x, p.pos.y, p.pos.z, 0.18, 0xd5d2c8, 0.45);
                }
            } else if (p.type === 'TANK_88MM' && Math.random() < 0.7) {
                spawnSmokePuff(scene, p.pos.x, p.pos.y, p.pos.z, 0.28, 0xa8a298, 0.65);
            }

            p.vel.y -= p.gravity * dt;
            const nextPos = p.pos.clone().addScaledVector(p.vel, dt);

            let hit = false;
            let hitPos = nextPos.clone();

            // 1. Check Player Projectile Hitting US Soldiers FIRST (Both Street & 2nd-Floor Balconies!)
            // Uses 5-step swept ray-segment interpolation so high-velocity MG bullets NEVER step past a soldier or get blocked by the wall behind a balcony!
            if (p.type === 'TANK_88MM' || p.type === 'TANK_MG34') {
                const hitRadius = (p.type === 'TANK_88MM') ? 1.45 : 1.15;
                const subSteps = 5;
                for (let step = 1; step <= subSteps && !hit; step++) {
                    const t = step / subSteps;
                    const sx = p.pos.x + (nextPos.x - p.pos.x) * t;
                    const sy = p.pos.y + (nextPos.y - p.pos.y) * t;
                    const sz = p.pos.z + (nextPos.z - p.pos.z) * t;

                    for (let s = 0; s < soldiers.length; s++) {
                        const sol = soldiers[s];
                        if (sol.alive &&
                            Math.hypot(sx - sol.x, sz - sol.z) < hitRadius &&
                            sy >= sol.y - 0.35 && sy <= sol.y + 2.15) {
                            hit = true;
                            hitPos.set(sx, sy, sz);
                            if (p.type === 'TANK_MG34') {
                                sol.hp = (sol.hp || 100) - 65; // 1-2 coaxial 7.92mm hits reliably kill any soldier!
                                spawnBulletImpactSparks(scene, hitPos, 6);
                                if (sol.hp <= 0 || sy >= sol.y + 1.4) {
                                    eliminateSoldier(sol, true);
                                    if (window.HUD) {
                                        window.HUD.pushCombatLog(
                                            `MG34 COAXIAL: Eliminated US ${sol.role} ${sol.isWindowGarrison ? 'on 2nd-floor balcony' : 'in street'}!`,
                                            'good'
                                        );
                                    }
                                }
                            } else {
                                eliminateSoldier(sol, true);
                            }
                            break;
                        }
                    }
                }
            }

            // 2. Check Ground Hit
            if (!hit && nextPos.y <= 0.08) {
                hit = true;
                hitPos.y = 0.08;
            }

            // 3. Check Destructible Cellular Building Masonry Bricks (`destructibleBricks`)
            if (!hit && (p.type === 'TANK_88MM' || p.type === 'TANK_MG34' || p.type === 'ENEMY_BAZOOKA')) {
                for (let b = 0; b < bricks.length; b++) {
                    const brick = bricks[b];
                    if (!brick.destroyed &&
                        Math.abs(nextPos.x - brick.x) <= brick.bw * 0.55 &&
                        Math.abs(nextPos.y - brick.y) <= brick.bh * 0.55 &&
                        Math.abs(nextPos.z - brick.z) <= brick.bd * 0.55) {
                        hit = true;
                        hitPos.copy(nextPos);
                        break;
                    }
                }
            }

            // 4. Check Inner Building Core Colliders
            if (!hit) {
                for (let c = 0; c < colliders.length; c++) {
                    const col = colliders[c];
                    if (nextPos.x >= col.minX + 0.6 && nextPos.x <= col.maxX - 0.6 &&
                        nextPos.z >= col.minZ + 0.6 && nextPos.z <= col.maxZ - 0.6 &&
                        nextPos.y <= col.h) {
                        hit = true;
                        break;
                    }
                }
            }

            // 5. Check Enemy Bullet, Bazooka Rocket, or Thrown Grenade Hitting the King Tiger!
            if (!hit && !tank.destroyed && (p.type === 'ENEMY_BULLET' || p.type === 'ENEMY_BAZOOKA' || p.type === 'ENEMY_GRENADE')) {
                const dx = nextPos.x - tank.x;
                const dz = nextPos.z - tank.z;
                if (Math.hypot(dx, dz) < 2.75 && nextPos.y >= 0.15 && nextPos.y <= 3.2) {
                    hit = true;
                    if (p.type === 'ENEMY_GRENADE') {
                        detonateGrenadeWarhead(scene, hitPos, tank, cameraShakeCb);
                    } else {
                        handleHitOnKingTiger(scene, tank, p, hitPos, cameraShakeCb);
                    }
                }
            }

            if (hit) {
                if (p.type === 'TANK_88MM') {
                    detonate88mmShell(scene, hitPos, p.ammoType, destructibles, cameraShakeCb);
                } else if (p.type === 'TANK_MG34') {
                    spawnBulletImpactSparks(scene, hitPos, 5);
                } else if (p.type === 'ENEMY_BAZOOKA') {
                    // When a Bazooka rocket misses the tank and hits the ground or a building, create a medium-sized explosion!
                    detonateBazookaWarhead(scene, hitPos, cameraShakeCb, false);
                } else if (p.type === 'ENEMY_GRENADE') {
                    detonateGrenadeWarhead(scene, hitPos, tank, cameraShakeCb);
                }
                scene.remove(p.mesh);
                projectiles.splice(i, 1);
            } else {
                p.pos.copy(nextPos);
                p.mesh.position.copy(p.pos);
            }
        }
    }

    // Detonates a US Soldier's Thrown Mk 2 Fragmentation Grenade!
    function detonateGrenadeWarhead(scene, pos, tank, cameraShakeCb) {
        SoundEngine.playExplosion(0.75, false);
        spawnPointFlash(scene, pos, 0xff9922, 4.2, 0.22);
        spawnBulletImpactSparks(scene, pos, 16);

        for (let i = 0; i < 12; i++) {
            spawnSmokePuff(
                scene,
                pos.x + (Math.random() - 0.5) * 1.8,
                pos.y + Math.random() * 1.4,
                pos.z + (Math.random() - 0.5) * 1.8,
                1.8,
                i < 4 ? 0xff7711 : 0x2f2c28,
                1.4
            );
        }

        const distToTank = Math.hypot(pos.x - tank.x, pos.z - tank.z);
        if (distToTank < 5.2 && !tank.destroyed) {
            const dmg = Math.round(55 * (1 - distToTank / 6.5));
            tank.hullHealth = Math.max(0, tank.hullHealth - dmg);
            if (cameraShakeCb) cameraShakeCb(0.42);
            if (window.HUD) {
                window.HUD.pushCombatLog(
                    `GRENADE BLAST: US Mk 2 grenade detonated against hull/tracks! (-${dmg} HP)`,
                    'danger'
                );
                window.HUD.triggerArmorHitFlash('deflected');
            }
        }
    }

    // Evaluates Armor Angle, Tank Health Bar Reduction & Specific Subsystem Failures!
    function handleHitOnKingTiger(scene, tank, proj, hitPos, cameraShakeCb) {
        if (proj.type === 'ENEMY_BULLET') {
            tank.ricochetsCount++;
            tank.hullHealth = Math.max(0, tank.hullHealth - 1.2); // Minor chip/vision block wear
            SoundEngine.playArmorRicochet();
            spawnBulletImpactSparks(scene, hitPos, 4);
            return;
        }

        if (proj.type === 'ENEMY_BAZOOKA') {
            const toRocket = new THREE.Vector2(hitPos.x - tank.x, hitPos.z - tank.z).normalize();
            const tankFwd = new THREE.Vector2(Math.sin(tank.hullYaw), Math.cos(tank.hullYaw));
            const dot = toRocket.dot(tankFwd); // > 0.48 = Front Glacis; < -0.45 = Rear Engine Deck; else Side Armor

            detonateBazookaWarhead(scene, hitPos, cameraShakeCb, true);
            SoundEngine.playExplosion(1.2, true);

            tank.pitchVel += (Math.random() - 0.5) * 0.6;
            tank.rollVel += (Math.random() - 0.5) * 0.7;
            if (cameraShakeCb) cameraShakeCb(0.88);

            if (dot > 0.48 && !proj.fromElevatedWindow) {
                tank.ricochetsCount++;
                tank.hullHealth = Math.max(0, tank.hullHealth - 55);
                if (Math.random() < 0.35) {
                    tank.opticsCracked = true;
                    triggerSubsystemWarning(
                        'OPTICS FRACTURED',
                        'M1A1 Bazooka blast cracked TZF 9d Gunner Sight lens! Hold [R] to replace block.'
                    );
                } else if (window.HUD) {
                    window.HUD.pushCombatLog(
                        'FRONT GLACIS: 150mm sloped armor deflected Bazooka HEAT jet! (-55 HP concussion)',
                        'good'
                    );
                    window.HUD.triggerArmorHitFlash('deflected');
                }
            } else if (dot < -0.42 || proj.fromElevatedWindow) {
                tank.hitsTaken++;
                tank.hullHealth = Math.max(0, tank.hullHealth - 220);
                SoundEngine.playSubsystemAlarm();

                if (Math.random() < 0.55) {
                    tank.fuelLeak = true;
                    triggerSubsystemWarning(
                        'CRITICAL: FUEL TANK RUPTURED (FUEL LEAK & FIRE!)',
                        'Bazooka penetrated rear deck! Burning diesel leaking (-6 HP/sec) — Hold [R] to seal & extinguish!'
                    );
                } else {
                    tank.engineDamaged = true;
                    triggerSubsystemWarning(
                        'CRITICAL: MAYBACH HL230 V12 ENGINE DAMAGED!',
                        'Bazooka struck engine bay! Power output reduced by 58% & pouring oil smoke — Hold [R] to repair!'
                    );
                }
                if (window.HUD) window.HUD.triggerArmorHitFlash('penetrated');
            } else {
                tank.hitsTaken++;
                tank.hullHealth = Math.max(0, tank.hullHealth - 185);
                SoundEngine.playSubsystemAlarm();

                const roll = Math.random();
                if (roll < 0.45) {
                    if (Math.random() < 0.5) tank.leftTrackIntact = false;
                    else tank.rightTrackIntact = false;
                    triggerSubsystemWarning(
                        'CRITICAL: STEEL TRACK LINK BLOWN OFF!',
                        'Bazooka HEAT warhead severed side track! Tank steering crippled — Hold [R] to repair track!'
                    );
                } else if (roll < 0.8) {
                    tank.turretRingDamaged = true;
                    triggerSubsystemWarning(
                        'WARNING: TURRET HYDRAULIC DRIVE DAMAGED!',
                        'Side turret hit knocked out hydraulic traverse motor! Hand-crank speed (-72%) — Hold [R] to repair!'
                    );
                } else {
                    tank.fuelLeak = true;
                    triggerSubsystemWarning(
                        'CRITICAL: SPONSON FUEL LINE LEAKING!',
                        'Side armor penetration ruptured fuel line! Fire burning hull — Hold [R] to extinguish!'
                    );
                }
                if (window.HUD) window.HUD.triggerArmorHitFlash('penetrated');
            }
        }
    }

    function triggerSubsystemWarning(title, detail) {
        if (window.HUD) {
            window.HUD.pushCombatLog(`${title}: ${detail}`, 'danger');
            window.HUD.showSubsystemAlertPopup(title, detail);
        }
    }

    function detonate88mmShell(scene, pos, ammoType, destructibles, cameraShakeCb) {
        const isHE = (ammoType === 'HE');
        const blastRadius = isHE ? 11.0 : 5.5;

        SoundEngine.playExplosion(isHE ? 1.4 : 0.95, false);
        if (cameraShakeCb) cameraShakeCb(isHE ? 0.48 : 0.25);

        spawnPointFlash(scene, pos.clone().add(new THREE.Vector3(0, 1.2, 0)), 0xff7722, isHE ? 7.0 : 3.8, 0.3);

        // Battlefield-Style Dynamic Destruction: Carve a hole at the exact impact coordinate (pos) on ANY building wall!
        if (CityWorld.carveBuildingDestructionHole) {
            const holeRadius = isHE ? 4.4 : 3.4;
            CityWorld.carveBuildingDestructionHole(scene, pos, holeRadius, (bx, by, bz, bw, bh, bd) => {
                spawnBrickDebrisBurst(scene, bx, by, bz, bw, bh, bd);
            });
        }

        // Expanding Shockwave Ring
        const ringGeo = new THREE.RingGeometry(0.4, 1.2, 28);
        ringGeo.rotateX(-Math.PI / 2);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0xffaa44,
            transparent: true,
            opacity: 0.85,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.set(pos.x, Math.max(0.15, pos.y), pos.z);
        scene.add(ring);
        particles.push({
            mesh: ring,
            type: 'SHOCKWAVE',
            maxScale: isHE ? 10.0 : 4.8,
            life: 0.45,
            maxLife: 0.45
        });

        const smokeCount = isHE ? 24 : 12;
        for (let i = 0; i < smokeCount; i++) {
            const isFire = i < 8;
            spawnSmokePuff(
                scene,
                pos.x + (Math.random() - 0.5) * 3.5,
                pos.y + Math.random() * 2.0,
                pos.z + (Math.random() - 0.5) * 3.5,
                isFire ? 2.2 : (2.8 + Math.random() * 2.2),
                isFire ? 0xff6611 : 0x262421,
                isFire ? 0.6 : 2.6
            );
        }

        // Destroy Street Sandbag Barriers within Blast Radius
        for (let d = destructibles.length - 1; d >= 0; d--) {
            const item = destructibles[d];
            if (Math.hypot(pos.x - item.x, pos.z - item.z) < blastRadius) {
                scene.remove(item.mesh);
                destructibles.splice(d, 1);
            }
        }

        // Neutralize US Soldiers (Both Ground & Upper Balconies) within 3D Blast Radius
        let killsThisShell = 0;
        for (let s = 0; s < soldiers.length; s++) {
            const sol = soldiers[s];
            if (sol.alive &&
                Math.hypot(pos.x - sol.x, pos.z - sol.z) < blastRadius &&
                Math.abs(pos.y - sol.y) < blastRadius * 0.85) {
                eliminateSoldier(sol, true);
                killsThisShell++;
            }
        }

        if (killsThisShell > 0 && window.HUD) {
            window.HUD.pushCombatLog(
                `8.8cm KwK 43: ${ammoType} shell eliminated ${killsThisShell} US soldiers!`,
                'good'
            );
        }
    }

    // Medium-Sized High-Explosive Detonation whenever a Bazooka Rocket hits the ground, a building, or the tank!
    function detonateBazookaWarhead(scene, pos, cameraShakeCb, isDirectTankHit = false) {
        if (!isDirectTankHit) {
            SoundEngine.playExplosion(0.88, false);
            if (cameraShakeCb) cameraShakeCb(0.28);
            // Carve a localized hole if the missed Bazooka rocket struck a building wall!
            if (CityWorld.carveBuildingDestructionHole) {
                CityWorld.carveBuildingDestructionHole(scene, pos, 3.1, (bx, by, bz, bw, bh, bd) => {
                    spawnBrickDebrisBurst(scene, bx, by, bz, bw, bh, bd);
                });
            }
        }

        spawnPointFlash(scene, pos.clone().add(new THREE.Vector3(0, 0.5, 0)), 0xff7711, 5.2, 0.26);
        spawnBulletImpactSparks(scene, pos, 18);

        // Medium Expanding Shockwave Ring where the Bazooka rocket landed
        const ringGeo = new THREE.RingGeometry(0.3, 0.9, 24);
        ringGeo.rotateX(-Math.PI / 2);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0xff9933,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.set(pos.x, Math.max(0.14, pos.y), pos.z);
        scene.add(ring);
        particles.push({
            mesh: ring,
            type: 'SHOCKWAVE',
            maxScale: 5.4,
            life: 0.36,
            maxLife: 0.36
        });

        // 16 Fire & Dark Smoke Plumes
        for (let i = 0; i < 16; i++) {
            const isFire = i < 6;
            spawnSmokePuff(
                scene,
                pos.x + (Math.random() - 0.5) * 2.2,
                pos.y + Math.random() * 1.6,
                pos.z + (Math.random() - 0.5) * 2.2,
                isFire ? 1.9 : 2.3,
                isFire ? 0xff6600 : 0x2d2a26,
                isFire ? 0.55 : 1.9
            );
        }

        // 10 Flying Dirt/Stone Debris Chunks from the medium explosion
        spawnBrickDebrisBurst(scene, pos.x, Math.max(0.3, pos.y), pos.z, 1.2, 0.8, 1.2);
    }

    function eliminateSoldier(sol, launchOutOfWindow = false) {
        if (!sol.alive) return;
        sol.alive = false;
        sol.fallProgress = 0;
        if (sol.isWindowGarrison && launchOutOfWindow) {
            sol.vy = 3.5; // Launches out of the shattered window to fall onto the street!
            sol.x += sol.windowNode.faceDir * 1.8;
            sol.meshParts.group.position.x = sol.x;
        }
        soldiersEliminated++;
    }

    function spawnMuzzleBlast88mm(scene, muzzlePos, dir) {
        spawnPointFlash(scene, muzzlePos, 0xff9922, 8.0, 0.15);

        const rightVec = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
        for (let i = 0; i < 16; i++) {
            const sideSign = (i % 2 === 0) ? 1 : -1;
            const jetVel = (i < 10)
                ? rightVec.clone().multiplyScalar(sideSign * (6 + Math.random() * 7))
                : dir.clone().multiplyScalar(7 + Math.random() * 9);

            spawnSmokePuff(
                scene,
                muzzlePos.x,
                muzzlePos.y,
                muzzlePos.z,
                1.6 + Math.random() * 0.9,
                i < 5 ? 0xffaa33 : 0xc8c2b6,
                1.2,
                jetVel
            );
        }
    }

    // Uses Soft Radial Glow Sprites for Sparks (NEVER square boxes!)
    function spawnBulletImpactSparks(scene, pos, count) {
        const softTex = GameTextures.getSoftParticleTexture();
        for (let i = 0; i < count; i++) {
            const mat = new THREE.SpriteMaterial({
                map: softTex,
                color: 0xffd255,
                transparent: true,
                blending: THREE.AdditiveBlending
            });
            const sp = new THREE.Sprite(mat);
            sp.scale.set(0.32, 0.32, 0.32);
            sp.position.copy(pos);
            scene.add(sp);
            particles.push({
                mesh: sp,
                type: 'SPARK',
                vel: new THREE.Vector3(
                    (Math.random() - 0.5) * 15,
                    2 + Math.random() * 9,
                    (Math.random() - 0.5) * 15
                ),
                life: 0.24 + Math.random() * 0.18,
                maxLife: 0.42
            });
        }
    }

    // Uses Soft Volumetric Smoke Sprite (NEVER hard geometric spheres!)
    function spawnSmokePuff(scene, x, y, z, scaleSize, colorHex, duration = 1.6, customVel = null) {
        const smokeTex = GameTextures.getSmokeSpriteTexture();
        const mat = new THREE.SpriteMaterial({
            map: smokeTex,
            color: colorHex,
            transparent: true,
            opacity: 0.72,
            depthWrite: false
        });
        const sprite = new THREE.Sprite(mat);
        sprite.position.set(x, y, z);
        sprite.scale.set(scaleSize, scaleSize, scaleSize);
        scene.add(sprite);

        particles.push({
            mesh: sprite,
            type: 'SMOKE',
            baseScale: scaleSize,
            vel: customVel || new THREE.Vector3((Math.random() - 0.5) * 1.5, 1.6 + Math.random() * 2.2, (Math.random() - 0.5) * 1.5),
            life: duration,
            maxLife: duration
        });
    }

    function spawnPointFlash(scene, pos, colorHex, intensity, duration) {
        const light = new THREE.PointLight(colorHex, intensity, 30);
        light.position.copy(pos);
        scene.add(light);
        flashLights.push({ light, life: duration, maxLife: duration });
    }

    function updateParticlesAndDebris(scene, dt) {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.life -= dt;
            if (p.life <= 0) {
                scene.remove(p.mesh);
                particles.splice(i, 1);
                continue;
            }
            const ratio = p.life / p.maxLife;
            if (p.type === 'SHOCKWAVE') {
                const s = 1 + (1 - ratio) * p.maxScale;
                p.mesh.scale.set(s, s, s);
                p.mesh.material.opacity = ratio * 0.8;
            } else if (p.type === 'SMOKE') {
                p.mesh.position.addScaledVector(p.vel, dt);
                const s = p.baseScale * (1 + (1 - ratio) * 1.65);
                p.mesh.scale.set(s, s, s);
                p.mesh.material.opacity = ratio * 0.68;
            } else if (p.type === 'SPARK') {
                p.vel.y -= 18 * dt;
                p.mesh.position.addScaledVector(p.vel, dt);
                p.mesh.material.opacity = ratio;
            }
        }

        for (let i = debrisChunks.length - 1; i >= 0; i--) {
            const d = debrisChunks[i];
            d.life -= dt;
            if (d.life <= 0) {
                scene.remove(d.mesh);
                debrisChunks.splice(i, 1);
                continue;
            }
            d.vel.y -= 24 * dt;
            d.mesh.position.addScaledVector(d.vel, dt);
            d.mesh.rotation.x += d.rotVel.x * dt;
            d.mesh.rotation.y += d.rotVel.y * dt;
            if (d.mesh.position.y < 0.18) {
                d.mesh.position.y = 0.18;
                d.vel.y *= -0.35;
                d.vel.x *= 0.6;
                d.vel.z *= 0.6;
            }
        }

        for (let i = flashLights.length - 1; i >= 0; i--) {
            const fl = flashLights[i];
            fl.life -= dt;
            if (fl.life <= 0) {
                scene.remove(fl.light);
                flashLights.splice(i, 1);
            } else {
                fl.light.intensity *= 0.82;
            }
        }
    }

    return {
        soldiers,
        updateCombat,
        fireTank88mm,
        fireTankMG34,
        spawnSmokePuff,
        spawnImmediateAmbushAhead,
        detonate88mmShell
    };
})();
