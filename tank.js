// ============================================================================
// BLUEPRINT-ACCURATE PANZERKAMPFWAGEN TIGER AUSF. B "KÖNIGSTIGER" (SD.KFZ. 182)
// ============================================================================

window.KingTigerTank = (function () {
    // Helper to build a precision 3D trapezoidal/sloped welded armor hull or Henschel turret mesh
    function createLoftedArmorMesh(bottomLoop, topLoop, yBottom, yTop, material) {
        const positions = [];
        const uvs = [];
        const n = bottomLoop.length;

        function pushQuad(p0, p1, p2, p3, uScale = 1, vScale = 1) {
            positions.push(
                p0[0], p0[1], p0[2],
                p1[0], p1[1], p1[2],
                p2[0], p2[1], p2[2],

                p0[0], p0[1], p0[2],
                p2[0], p2[1], p2[2],
                p3[0], p3[1], p3[2]
            );
            uvs.push(
                0, 0,
                uScale, 0,
                uScale, vScale,

                0, 0,
                uScale, vScale,
                0, vScale
            );
        }

        // Sloped Side & Front/Rear Armor Plates
        for (let i = 0; i < n; i++) {
            const next = (i + 1) % n;
            const b0 = [bottomLoop[i][0], yBottom, bottomLoop[i][1]];
            const b1 = [bottomLoop[next][0], yBottom, bottomLoop[next][1]];
            const t1 = [topLoop[next][0], yTop, topLoop[next][1]];
            const t0 = [topLoop[i][0], yTop, topLoop[i][1]];
            pushQuad(b0, b1, t1, t0, 1.0, 1.0);
        }

        // Roof Plate (Triangulated fan from center)
        let cx = 0, cz = 0;
        topLoop.forEach(p => { cx += p[0]; cz += p[1]; });
        cx /= n; cz /= n;
        for (let i = 0; i < n; i++) {
            const next = (i + 1) % n;
            positions.push(
                cx, yTop, cz,
                topLoop[i][0], yTop, topLoop[i][1],
                topLoop[next][0], yTop, topLoop[next][1]
            );
            uvs.push(0.5, 0.5, 0, 1, 1, 1);
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geo.computeVertexNormals();
        const mesh = new THREE.Mesh(geo, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
    }

    function createTank(scene) {
        const camoTex = GameTextures.getKingTigerCamo();
        const decalTex = GameTextures.getTurretDecal();
        const trackTexLeft = GameTextures.getTrackTexture().clone();
        const trackTexRight = GameTextures.getTrackTexture().clone();
        trackTexLeft.needsUpdate = true;
        trackTexRight.needsUpdate = true;

        const armorMat = new THREE.MeshStandardMaterial({
            map: camoTex,
            bumpMap: camoTex,
            bumpScale: 0.04,
            roughness: 0.66,
            metalness: 0.42
        });

        const turretDecalMat = new THREE.MeshStandardMaterial({
            map: decalTex,
            bumpMap: camoTex,
            bumpScale: 0.03,
            roughness: 0.66,
            metalness: 0.42
        });

        const darkSteelMat = new THREE.MeshStandardMaterial({
            color: 0x22201d,
            roughness: 0.48,
            metalness: 0.85
        });

        const gunSteelMat = new THREE.MeshStandardMaterial({
            color: 0x2e2d29,
            roughness: 0.42,
            metalness: 0.88
        });

        const boreBlackMat = new THREE.MeshBasicMaterial({ color: 0x050505 });

        const wheelMat = new THREE.MeshStandardMaterial({
            map: camoTex,
            color: 0x827452,
            roughness: 0.76,
            metalness: 0.45
        });

        const trackMatLeft = new THREE.MeshStandardMaterial({
            map: trackTexLeft,
            bumpMap: trackTexLeft,
            bumpScale: 0.06,
            roughness: 0.8,
            metalness: 0.58
        });

        const trackMatRight = new THREE.MeshStandardMaterial({
            map: trackTexRight,
            bumpMap: trackTexRight,
            bumpScale: 0.06,
            roughness: 0.8,
            metalness: 0.58
        });

        const root = new THREE.Group();
        root.position.set(0, 0, -148);

        const hullGroup = new THREE.Group();
        root.add(hullGroup);

        // --------------------------------------------------------------------
        // 1. BLUEPRINT KING TIGER SLOPED WELDED HULL (LOWER TUB + UPPER SPONSON)
        // --------------------------------------------------------------------
        // Lower Armored Hull Tub (Belly y=0.45m to Nose/Fender Line y=1.24m)
        const lowerBottomLoop = [
            [-1.32,  2.95], [ 1.32,  2.95], // Lower nose chin
            [ 1.32, -3.25], [-1.32, -3.25]  // Lower rear hull
        ];
        const lowerTopLoop = [
            [-1.68,  3.96], [ 1.68,  3.96], // Sharp 50-deg front glacis nose ridge!
            [ 1.68, -3.55], [-1.68, -3.55]  // Rear fender line
        ];
        hullGroup.add(createLoftedArmorMesh(lowerBottomLoop, lowerTopLoop, 0.45, 1.24, armorMat));

        // Upper Sloped Sponson & 150mm 50-deg Upper Frontal Glacis (y=1.24m to Hull Roof y=1.98m)
        const upperBottomLoop = [
            [-1.74,  3.96], [ 1.74,  3.96], // Crisp razor nose seam
            [ 1.76,  1.20], [ 1.74, -3.55],
            [-1.74, -3.55], [-1.76,  1.20]
        ];
        const upperTopLoop = [
            [-1.42,  2.52], [ 1.42,  2.52], // 150mm 50-degree sloped upper glacis top edge!
            [ 1.48,  1.00], [ 1.44, -3.15], // 25-degree inward sloped side sponsons!
            [-1.44, -3.15], [-1.48,  1.00]
        ];
        hullGroup.add(createLoftedArmorMesh(upperBottomLoop, upperTopLoop, 1.24, 1.98, armorMat));

        // Sectional Side Mudguards / Schürzen Fenders overhanging the 800mm tracks
        for (let s = 0; s < 5; s++) {
            const zSeg = -2.65 + s * 1.34;
            const segL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.44, 1.28), armorMat);
            segL.position.set(-1.81, 1.15, zSeg);
            segL.rotation.z = 0.25;
            segL.castShadow = true;
            hullGroup.add(segL);

            const segR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.44, 1.28), armorMat);
            segR.position.set(1.81, 1.15, zSeg);
            segR.rotation.z = -0.25;
            segR.castShadow = true;
            hullGroup.add(segR);
        }

        // Front Ribbed Track Fenders
        for (let side = -1; side <= 1; side += 2) {
            const fFender = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.1, 0.75), armorMat);
            fFender.position.set(side * 1.45, 1.22, 3.65);
            fFender.rotation.x = 0.35;
            hullGroup.add(fFender);

            // Heavy U-Shaped Front Tow Shackles on Nose
            const shackle = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.045, 8, 14), darkSteelMat);
            shackle.position.set(side * 1.18, 1.18, 4.02);
            shackle.rotation.y = Math.PI / 2;
            hullGroup.add(shackle);
        }

        // Bow Kugelblende (Cast Ball-Mount 7.92mm MG34) & Driver's Periscope Hood on Upper Glacis
        const kugelblende = new THREE.Mesh(new THREE.SphereGeometry(0.23, 16, 16), darkSteelMat);
        kugelblende.position.set(-0.82, 1.62, 3.18);
        hullGroup.add(kugelblende);

        const hullMgBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.03, 0.68, 10), gunSteelMat);
        hullMgBarrel.rotation.x = Math.PI / 2;
        hullMgBarrel.position.set(-0.82, 1.62, 3.5);
        hullGroup.add(hullMgBarrel);

        const driverHood = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.16, 0.28), darkSteelMat);
        driverHood.position.set(0.82, 2.01, 2.55);
        hullGroup.add(driverHood);

        // Bosch Armored Headlight on Center Bow
        const boschLight = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.18, 12), darkSteelMat);
        boschLight.rotation.x = Math.PI / 2;
        boschLight.position.set(0.0, 1.98, 2.75);
        hullGroup.add(boschLight);

        // Rear Engine Deck Armored Radiator Grilles, Jack & Twin Vertical Cast Exhaust Stacks
        for (let g = -1; g <= 1; g += 2) {
            const fanGrille = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.54, 0.06, 20), darkSteelMat);
            fanGrille.position.set(g * 0.65, 2.01, -2.05);
            hullGroup.add(fanGrille);
        }

        const exhaustL = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 1.05, 14), darkSteelMat);
        exhaustL.position.set(-0.56, 1.28, -3.52);
        exhaustL.rotation.x = -0.22;
        hullGroup.add(exhaustL);

        const exhaustR = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 1.05, 14), darkSteelMat);
        exhaustR.position.set(0.56, 1.28, -3.52);
        exhaustR.rotation.x = -0.22;
        hullGroup.add(exhaustR);

        // --------------------------------------------------------------------
        // 2. 800MM WIDE STEEL BATTLE TRACKS & 18 OVERLAPPING SCHACHTELLAUFWERK WHEELS
        // --------------------------------------------------------------------
        function createCurvedTrackLoop(mat, xPos) {
            const trackGrp = new THREE.Group();
            trackGrp.position.set(xPos, 0, 0);

            const mainBand = new THREE.Mesh(new THREE.BoxGeometry(0.80, 0.94, 6.45), mat);
            mainBand.position.set(0, 0.50, 0.05);
            mainBand.castShadow = true;
            mainBand.receiveShadow = true;
            trackGrp.add(mainBand);

            const endGeo = new THREE.CylinderGeometry(0.47, 0.47, 0.80, 18);
            endGeo.rotateZ(Math.PI / 2);
            const frontWrap = new THREE.Mesh(endGeo, mat);
            frontWrap.position.set(0, 0.56, 3.28);
            trackGrp.add(frontWrap);

            const rearWrap = new THREE.Mesh(endGeo, mat);
            rearWrap.position.set(0, 0.54, -3.18);
            trackGrp.add(rearWrap);

            return trackGrp;
        }

        hullGroup.add(createCurvedTrackLoop(trackMatLeft, 1.45));
        hullGroup.add(createCurvedTrackLoop(trackMatRight, -1.45));

        const wheelsLeft = [];
        const wheelsRight = [];
        const wheelGeo = new THREE.CylinderGeometry(0.43, 0.43, 0.22, 20);
        wheelGeo.rotateZ(Math.PI / 2);
        const hubGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.28, 12);
        hubGeo.rotateZ(Math.PI / 2);

        for (let i = 0; i < 9; i++) {
            const zPos = -2.75 + i * 0.68;
            const xStagger = (i % 2 === 0) ? 0.15 : 0.02;

            const wL = new THREE.Group();
            wL.position.set(1.52 + xStagger, 0.45, zPos);
            wL.add(new THREE.Mesh(wheelGeo, wheelMat));
            wL.add(new THREE.Mesh(hubGeo, darkSteelMat));
            hullGroup.add(wL);
            wheelsLeft.push(wL);

            const wR = new THREE.Group();
            wR.position.set(-1.52 - xStagger, 0.45, zPos);
            wR.add(new THREE.Mesh(wheelGeo, wheelMat));
            wR.add(new THREE.Mesh(hubGeo, darkSteelMat));
            hullGroup.add(wR);
            wheelsRight.push(wR);
        }

        // --------------------------------------------------------------------
        // 3. AUTHENTIC HENSCHEL PRODUCTION TURRET (SLOPED HEXAGONAL WELDED ARMOR)
        // --------------------------------------------------------------------
        const turretGroup = new THREE.Group();
        turretGroup.position.set(0, 1.98, 0.22);
        hullGroup.add(turretGroup);

        // Base loop of Henschel Turret (Narrow 185mm front face, flared angled cheeks, long rear ammo bustle)
        const tBotLoop = [
            [-0.84,  1.92], [ 0.84,  1.92], // Narrow 185mm front turret plate
            [ 1.26,  0.55],                 // Flared right cheek
            [ 1.14, -1.95], [-1.14, -1.95], // Long overhanging rear bustle
            [-1.26,  0.55]                  // Flared left cheek
        ];
        // Top roof loop (25-degree inward sloped sides & 10-degree sloped front)
        const tTopLoop = [
            [-0.72,  1.74], [ 0.72,  1.74],
            [ 0.98,  0.48],
            [ 0.90, -1.78], [-0.90, -1.78],
            [-0.98,  0.48]
        ];
        turretGroup.add(createLoftedArmorMesh(tBotLoop, tTopLoop, 0.0, 1.02, armorMat));

        // Crisp Sloped Side Decal Plates ("332" + Balkenkreuz) Mounted Flush on Left & Right Henschel Cheeks
        for (let side = -1; side <= 1; side += 2) {
            const decalPlate = new THREE.Mesh(new THREE.PlaneGeometry(2.15, 0.86), turretDecalMat);
            decalPlate.position.set(side * 1.08, 0.52, -0.55);
            decalPlate.rotation.y = side * (Math.PI / 2 - 0.05);
            decalPlate.rotation.z = -side * 0.24; // Matches 25-deg Henschel side slope!
            turretGroup.add(decalPlate);

            // Spare Steel Track Links Hung on Brackets along Turret Sides
            for (let t = 0; t < 3; t++) {
                const spLink = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.42, 0.48), darkSteelMat);
                spLink.position.set(side * 1.12, 0.48, -1.25 + t * 0.68);
                spLink.rotation.z = -side * 0.24;
                turretGroup.add(spLink);
            }
        }

        // Commander's Armored Cupola with Periscope Ring & AA MG34 Mount (Left Turret Roof)
        const cupola = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 0.32, 18), armorMat);
        cupola.position.set(0.48, 1.14, -0.38);
        cupola.castShadow = true;
        turretGroup.add(cupola);

        const cupolaHatch = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.07, 16), darkSteelMat);
        cupolaHatch.position.set(0.48, 1.32, -0.38);
        turretGroup.add(cupolaHatch);

        // Loader's Hatch on Right Turret Roof
        const loaderHatch = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.08, 0.62), darkSteelMat);
        loaderHatch.position.set(-0.42, 1.04, 0.15);
        turretGroup.add(loaderHatch);

        // --------------------------------------------------------------------
        // 4. SAUKOPFBLENDE (PIG'S HEAD MANTLET) & 8.8 CM KWK 43 L/71 BARREL
        // --------------------------------------------------------------------
        const gunPivot = new THREE.Group();
        gunPivot.position.set(0, 0.52, 1.84);
        turretGroup.add(gunPivot);

        // Sculpted Cast Saukopfblende Mantlet with Armored Collar Flange
        const mantletPts = [
            new THREE.Vector2(0.56, -0.05),
            new THREE.Vector2(0.54,  0.22),
            new THREE.Vector2(0.44,  0.55),
            new THREE.Vector2(0.30,  0.88),
            new THREE.Vector2(0.20,  1.05)
        ];
        const mantletGeo = new THREE.LatheGeometry(mantletPts, 22);
        mantletGeo.rotateX(Math.PI / 2);
        const mantlet = new THREE.Mesh(mantletGeo, armorMat);
        mantlet.castShadow = true;
        gunPivot.add(mantlet);

        // Coaxial 7.92mm MG34 Barrel & TZF 9d Gunner Sight Port in Mantlet
        const coaxBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.03, 0.78, 10), gunSteelMat);
        coaxBarrel.rotation.x = Math.PI / 2;
        coaxBarrel.position.set(-0.36, 0.04, 0.58);
        gunPivot.add(coaxBarrel);

        // Recoiling 8.8 cm KwK 43 L/71 Two-Stage Long Barrel & Perforated Double-Baffle Muzzle Brake
        const barrelGroup = new THREE.Group();
        gunPivot.add(barrelGroup);

        const barrelPts = [
            new THREE.Vector2(0.175, 0.4),
            new THREE.Vector2(0.168, 2.35), // Thick first-stage recuperator tube
            new THREE.Vector2(0.135, 2.48), // Stepped collar transition
            new THREE.Vector2(0.112, 6.25), // Long high-velocity L/71 tube
            new THREE.Vector2(0.205, 6.38), // Muzzle brake first baffle
            new THREE.Vector2(0.155, 6.55), // Side gas vent cutout
            new THREE.Vector2(0.205, 6.72), // Muzzle brake second baffle
            new THREE.Vector2(0.165, 6.88)
        ];
        const barrelLatheGeo = new THREE.LatheGeometry(barrelPts, 24);
        barrelLatheGeo.rotateX(Math.PI / 2);
        const barrelMesh = new THREE.Mesh(barrelLatheGeo, armorMat);
        barrelMesh.castShadow = true;
        barrelGroup.add(barrelMesh);

        // Dark Side Vent Baffles on Muzzle Brake for Authentic Realism
        const ventMat = new THREE.MeshBasicMaterial({ color: 0x090909 });
        const ventBlock = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.24), ventMat);
        ventBlock.position.set(0, 0, 6.56);
        barrelGroup.add(ventBlock);

        const boreHole = new THREE.Mesh(new THREE.CircleGeometry(0.098, 14), boreBlackMat);
        boreHole.position.set(0, 0, 6.89);
        barrelGroup.add(boreHole);

        const muzzleNode = new THREE.Object3D();
        muzzleNode.position.set(0, 0, 6.92);
        barrelGroup.add(muzzleNode);

        const coaxMuzzleNode = new THREE.Object3D();
        coaxMuzzleNode.position.set(-0.36, 0.04, 0.96);
        gunPivot.add(coaxMuzzleNode);

        const gunnerSightNode = new THREE.Object3D();
        gunnerSightNode.position.set(0.40, 0.12, 1.05);
        gunPivot.add(gunnerSightNode);

        const commanderSightNode = new THREE.Object3D();
        commanderSightNode.position.set(0.48, 1.50, -0.38);
        turretGroup.add(commanderSightNode);

        scene.add(root);

        return {
            root,
            hullGroup,
            turretGroup,
            gunPivot,
            barrelGroup,
            muzzleNode,
            coaxMuzzleNode,
            gunnerSightNode,
            commanderSightNode,
            trackTexLeft,
            trackTexRight,
            wheelsLeft,
            wheelsRight,

            x: 0,
            z: -148,
            hullYaw: 0,
            speed: 0,
            maxSpeedFwd: 10.2,
            maxSpeedRev: -4.5,
            gear: 'N',
            rpmRatio: 0.15,

            pitch: 0,
            pitchVel: 0,
            roll: 0,
            rollVel: 0,

            turretRelYaw: 0,
            gunPitch: 0,
            targetWorldYaw: 0,
            targetGunPitch: 0,
            turretTraverseSpeed: 0.58,
            gunElevateSpeed: 0.45,

            selectedAmmo: 'HE',
            reloadTimer: 0,
            reloadDuration: 6.0,
            barrelRecoil: 0,
            mgHeat: 0,
            mgOverheated: false,

            maxHealth: 1000,
            hullHealth: 1000,
            destroyed: false,
            turretBlownVel: new THREE.Vector3(0, 0, 0),
            turretBlownRot: new THREE.Vector3(0, 0, 0),

            leftTrackIntact: true,
            rightTrackIntact: true,
            engineDamaged: false,
            fuelLeak: false,
            turretRingDamaged: false,
            opticsCracked: false,
            repairTimer: 0,
            fuelLeakTimer: 0,

            hitsTaken: 0,
            ricochetsCount: 0
        };
    }

    function triggerCatastrophicDestruction(scene, tank, spawnExplosionEffects) {
        if (tank.destroyed) return;
        tank.destroyed = true;
        tank.hullHealth = 0;
        tank.speed = 0;

        tank.turretBlownVel.set((Math.random() - 0.5) * 4.5, 13.5, (Math.random() - 0.5) * 4.5);
        tank.turretBlownRot.set(2.4, 1.8, 3.1);

        SoundEngine.playExplosion(1.8, true);
        if (spawnExplosionEffects) {
            spawnExplosionEffects(new THREE.Vector3(tank.x, 2.2, tank.z));
        }

        const goModal = document.getElementById('destroyed-modal');
        if (goModal) {
            setTimeout(() => {
                goModal.style.display = 'flex';
                if (document.pointerLockElement) document.exitPointerLock();
            }, 2600);
        }
    }

    function resetTankState(tank) {
        tank.destroyed = false;
        tank.hullHealth = tank.maxHealth;
        tank.leftTrackIntact = true;
        tank.rightTrackIntact = true;
        tank.engineDamaged = false;
        tank.fuelLeak = false;
        tank.turretRingDamaged = false;
        tank.opticsCracked = false;
        tank.repairTimer = 0;
        tank.speed = 0;
        tank.turretGroup.position.set(0, 1.98, 0.22);
        tank.turretGroup.rotation.set(0, tank.turretRelYaw, 0);
        const goModal = document.getElementById('destroyed-modal');
        if (goModal) goModal.style.display = 'none';
    }

    function updateTank(scene, tank, dt, keys, spawnExhaustSmoke, onCrushObstacle, spawnExplosionEffects) {
        if (tank.hullHealth <= 0 && !tank.destroyed) {
            triggerCatastrophicDestruction(scene, tank, spawnExplosionEffects);
        }

        if (tank.destroyed) {
            if (tank.turretGroup.position.y > 0.55 || tank.turretBlownVel.y > 0) {
                tank.turretBlownVel.y -= 22.0 * dt;
                tank.turretGroup.position.addScaledVector(tank.turretBlownVel, dt);
                tank.turretGroup.rotation.x += tank.turretBlownRot.x * dt;
                tank.turretGroup.rotation.y += tank.turretBlownRot.y * dt;
                tank.turretGroup.rotation.z += tank.turretBlownRot.z * dt;
                if (tank.turretGroup.position.y < 0.55) {
                    tank.turretGroup.position.y = 0.55;
                    tank.turretBlownVel.multiplyScalar(0.25);
                    tank.turretBlownRot.multiplyScalar(0.2);
                }
            }
            if (spawnExhaustSmoke && Math.random() < 0.85) {
                spawnExhaustSmoke(
                    tank.x + (Math.random() - 0.5) * 1.8,
                    2.1,
                    tank.z + (Math.random() - 0.5) * 1.8,
                    1.2,
                    Math.random() < 0.4 ? 0xff5511 : 0x161514
                );
            }
            SoundEngine.updateTankAudio(0, 0, 0, false);
            return;
        }

        if (tank.fuelLeak) {
            tank.hullHealth = Math.max(0, tank.hullHealth - 6.0 * dt);
            tank.fuelLeakTimer += dt;
            if (tank.fuelLeakTimer > 0.35 && spawnExhaustSmoke) {
                tank.fuelLeakTimer = 0;
                const rearX = tank.x - Math.sin(tank.hullYaw) * 3.4;
                const rearZ = tank.z - Math.cos(tank.hullYaw) * 3.4;
                spawnExhaustSmoke(rearX, 0.35, rearZ, 0.9, 0xff6611);
            }
        }

        if (tank.engineDamaged && spawnExhaustSmoke && Math.random() < 0.5) {
            const rearX = tank.x - Math.sin(tank.hullYaw) * 2.5 + (Math.random() - 0.5);
            const rearZ = tank.z - Math.cos(tank.hullYaw) * 2.5 + (Math.random() - 0.5);
            spawnExhaustSmoke(rearX, 2.05, rearZ, 0.9, 0x1a1917);
        }

        const hasAnyDamage = !tank.leftTrackIntact || !tank.rightTrackIntact ||
                             tank.engineDamaged || tank.fuelLeak || tank.turretRingDamaged;
        if (hasAnyDamage) {
            if (keys['KeyR']) {
                tank.repairTimer += dt;
                if (tank.repairTimer >= 3.5) {
                    tank.leftTrackIntact = true;
                    tank.rightTrackIntact = true;
                    tank.engineDamaged = false;
                    tank.fuelLeak = false;
                    tank.turretRingDamaged = false;
                    tank.opticsCracked = false;
                    tank.repairTimer = 0;
                    if (window.HUD) {
                        window.HUD.pushCombatLog('CREW: Field repairs completed! Fuel leak sealed, engine & tracks operational.', 'good');
                    }
                }
            } else {
                tank.repairTimer = Math.max(0, tank.repairTimer - dt * 0.5);
            }
        }

        let mobilityFactor = 1.0;
        if (!tank.leftTrackIntact || !tank.rightTrackIntact) mobilityFactor *= 0.22;
        if (tank.engineDamaged) mobilityFactor *= 0.42;

        let throttle = 0;
        if (keys['KeyW'] || keys['ArrowUp']) throttle = 1;
        if (keys['KeyS'] || keys['ArrowDown']) throttle = -1;

        let turnInput = 0;
        if (keys['KeyA'] || keys['ArrowLeft']) turnInput += 1;
        if (keys['KeyD'] || keys['ArrowRight']) turnInput -= 1;

        if (!tank.leftTrackIntact && Math.abs(throttle) > 0) turnInput += 0.7;
        if (!tank.rightTrackIntact && Math.abs(throttle) > 0) turnInput -= 0.7;

        if (throttle > 0) {
            const accel = (tank.speed < 0 ? 8.0 : 3.8) * mobilityFactor;
            tank.speed = Math.min(tank.maxSpeedFwd * mobilityFactor, tank.speed + accel * dt);
            tank.pitchVel -= 0.16 * dt;
        } else if (throttle < 0) {
            const decel = (tank.speed > 0 ? 9.0 : 2.8) * mobilityFactor;
            tank.speed = Math.max(tank.maxSpeedRev * mobilityFactor, tank.speed - decel * dt);
            tank.pitchVel += 0.18 * dt;
        } else {
            if (Math.abs(tank.speed) < 0.08) {
                tank.speed = 0;
            } else {
                tank.speed -= Math.sign(tank.speed) * 2.5 * dt;
            }
        }

        const turnRate = (Math.abs(tank.speed) < 0.4 ? 0.56 : 0.65) * (tank.leftTrackIntact && tank.rightTrackIntact ? 1.0 : 0.35);
        const steerDir = (tank.speed < -0.2) ? -turnInput : turnInput;
        tank.hullYaw += steerDir * turnRate * dt;

        const absSpd = Math.abs(tank.speed);
        if (absSpd < 0.1 && throttle === 0 && turnInput === 0) {
            tank.gear = 'N';
            tank.rpmRatio = 0.15;
        } else if (tank.speed < -0.1) {
            tank.gear = 'R1';
            tank.rpmRatio = 0.35 + (absSpd / Math.abs(tank.maxSpeedRev)) * 0.55;
        } else {
            const gearNum = Math.min(8, Math.max(1, Math.ceil((absSpd / tank.maxSpeedFwd) * 8)));
            tank.gear = 'G' + gearNum;
            const withinGear = ((absSpd / tank.maxSpeedFwd) * 8) % 1;
            tank.rpmRatio = 0.32 + withinGear * 0.58 + (Math.abs(turnInput) * 0.18);
        }

        const dirX = Math.sin(tank.hullYaw);
        const dirZ = Math.cos(tank.hullYaw);
        const nextX = tank.x + dirX * tank.speed * dt;
        const nextZ = tank.z + dirZ * tank.speed * dt;

        const resolved = CityWorld.resolveTankMovement(scene, nextX, nextZ, 2.55, onCrushObstacle);
        tank.x = resolved.x;
        tank.z = resolved.z;
        if (resolved.scrapedWall) {
            tank.speed *= 0.85;
        }

        tank.root.position.set(tank.x, 0, tank.z);
        tank.root.rotation.y = tank.hullYaw;

        const leftTrackSpeed = tank.speed - steerDir * 2.2;
        const rightTrackSpeed = tank.speed + steerDir * 2.2;
        tank.trackTexLeft.offset.y -= leftTrackSpeed * dt * 0.45;
        tank.trackTexRight.offset.y -= rightTrackSpeed * dt * 0.45;

        tank.wheelsLeft.forEach(w => { w.rotation.x += leftTrackSpeed * dt * 1.8; });
        tank.wheelsRight.forEach(w => { w.rotation.x += rightTrackSpeed * dt * 1.8; });

        if (absSpd > 0.2) {
            tank.pitchVel += Math.sin(performance.now() * 0.018) * 0.012 * (absSpd / 9.0);
            tank.rollVel += Math.cos(performance.now() * 0.014) * 0.01 * (absSpd / 9.0);
        }
        const springK = 28.0;
        const damping = 6.2;
        tank.pitchVel += (-springK * tank.pitch - damping * tank.pitchVel) * dt;
        tank.rollVel += (-springK * tank.roll - damping * tank.rollVel) * dt;
        tank.pitch += tank.pitchVel * dt;
        tank.roll += tank.rollVel * dt;

        tank.hullGroup.rotation.x = tank.pitch;
        tank.hullGroup.rotation.z = tank.roll;

        const activeTraverseSpeed = tank.turretRingDamaged ? (tank.turretTraverseSpeed * 0.28) : tank.turretTraverseSpeed;
        let desiredRelYaw = tank.targetWorldYaw - tank.hullYaw;
        while (desiredRelYaw > Math.PI) desiredRelYaw -= Math.PI * 2;
        while (desiredRelYaw < -Math.PI) desiredRelYaw += Math.PI * 2;

        let yawDiff = desiredRelYaw - tank.turretRelYaw;
        while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
        while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;

        const maxStepYaw = activeTraverseSpeed * dt;
        let actualTurnRate = 0;
        if (Math.abs(yawDiff) <= maxStepYaw) {
            tank.turretRelYaw = desiredRelYaw;
        } else {
            const step = Math.sign(yawDiff) * maxStepYaw;
            tank.turretRelYaw += step;
            actualTurnRate = step / dt;
        }
        tank.turretGroup.rotation.y = tank.turretRelYaw;

        const clampedTargetPitch = Math.max(-0.14, Math.min(0.32, tank.targetGunPitch));
        const pitchDiff = clampedTargetPitch - tank.gunPitch;
        const maxStepPitch = tank.gunElevateSpeed * dt;
        if (Math.abs(pitchDiff) <= maxStepPitch) {
            tank.gunPitch = clampedTargetPitch;
        } else {
            tank.gunPitch += Math.sign(pitchDiff) * maxStepPitch;
        }
        tank.gunPivot.rotation.x = -tank.gunPitch;

        if (tank.barrelRecoil > 0) {
            tank.barrelRecoil = Math.max(0, tank.barrelRecoil - dt * 1.45);
            tank.barrelGroup.position.z = -tank.barrelRecoil;
        }

        if (tank.reloadTimer > 0) {
            tank.reloadTimer = Math.max(0, tank.reloadTimer - dt);
        }

        if (tank.mgHeat > 0) {
            tank.mgHeat = Math.max(0, tank.mgHeat - dt * (tank.mgOverheated ? 28 : 22));
            if (tank.mgOverheated && tank.mgHeat <= 5) {
                tank.mgOverheated = false;
            }
        }

        if (spawnExhaustSmoke && Math.random() < (0.25 + tank.rpmRatio * 0.5)) {
            const exX = tank.x - Math.sin(tank.hullYaw) * 3.5 + (Math.random() - 0.5) * 0.9;
            const exZ = tank.z - Math.cos(tank.hullYaw) * 3.5 + (Math.random() - 0.5) * 0.9;
            spawnExhaustSmoke(exX, 1.55, exZ, tank.rpmRatio * 0.4 + 0.25, 0x3a3835);
        }

        SoundEngine.updateTankAudio(tank.rpmRatio, absSpd / tank.maxSpeedFwd, actualTurnRate, tank.engineDamaged);
    }

    return {
        createTank,
        updateTank,
        resetTankState,
        triggerCatastrophicDestruction
    };
})();
