// ============================================================================
// MAIN SIMULATOR LOOP, SOFT SNOW/ASH PARTICLES, HEALTH BAR & SUBSYSTEM ALERTS
// ============================================================================

window.HUD = {
    pushCombatLog(msg, level = 'info') {
        const container = document.getElementById('combat-log');
        if (!container) return;
        const item = document.createElement('div');
        item.className = `log-entry log-${level}`;
        const timeStr = new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' });
        item.innerHTML = `<span class="log-time">[${timeStr}]</span> ${msg}`;
        container.prepend(item);
        while (container.children.length > 6) {
            container.removeChild(container.lastChild);
        }
    },

    triggerPlatoonBanner(sectorName) {
        const banner = document.getElementById('ambush-banner');
        const sub = document.getElementById('ambush-sector-name');
        if (!banner || !sub) return;
        sub.textContent = `SECTOR: ${sectorName.toUpperCase()} — US PLATOON IN STREET & 2ND FLOOR WINDOWS!`;
        banner.classList.add('active');
        setTimeout(() => banner.classList.remove('active'), 5200);
    },

    showSubsystemAlertPopup(title, detail) {
        const box = document.getElementById('subsystem-alert-popup');
        const tEl = document.getElementById('subsystem-alert-title');
        const dEl = document.getElementById('subsystem-alert-detail');
        if (!box || !tEl || !dEl) return;
        tEl.textContent = `⚠ ${title}`;
        dEl.textContent = detail;
        box.classList.add('active');
        clearTimeout(box._hideTimer);
        box._hideTimer = setTimeout(() => box.classList.remove('active'), 5500);
    },

    triggerArmorHitFlash(type) {
        const overlay = document.getElementById('damage-vignette');
        if (!overlay) return;
        overlay.className = type === 'penetrated' ? 'flash-red' : 'flash-amber';
        setTimeout(() => { overlay.className = ''; }, 650);
    }
};

(function () {
    let scene, camera, renderer;
    let tank;
    let isStarted = false;
    let isPointerLocked = false;

    let viewMode = '3RD';
    let gunnerZoom = 2.5;
    let cameraYaw = 0;
    let cameraPitch = 0.04;
    let cameraShake = 0;

    const keys = {};
    let mouseDownLeft = false;
    let mouseDownRight = false;
    let mgFireTimer = 0;

    let ashSystem;

    function initSimulator() {
        const container = document.getElementById('canvas-container');

        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x484b4d);
        scene.fog = new THREE.FogExp2(0x484b4d, 0.005);

        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.15, 450);

        renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.08;
        container.appendChild(renderer.domElement);

        const hemiLight = new THREE.HemisphereLight(0x98a0a8, 0x3a342b, 0.85);
        scene.add(hemiLight);

        const dirLight = new THREE.DirectionalLight(0xffe4c4, 1.48);
        dirLight.position.set(90, 125, -75);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.near = 10;
        dirLight.shadow.camera.far = 340;
        const d = 150;
        dirLight.shadow.camera.left = -d;
        dirLight.shadow.camera.right = d;
        dirLight.shadow.camera.top = d;
        dirLight.shadow.camera.bottom = -d;
        dirLight.shadow.bias = -0.0005;
        scene.add(dirLight);

        // Build Destructible WW2 European City & Open 2nd/3rd Floor Windows
        CityWorld.buildWorld(scene);

        // Build High-Fidelity Sculpted King Tiger (#332)
        tank = KingTigerTank.createTank(scene);

        // Create Soft Circular Radial Snow/Ash Particles (ZERO square pixels!)
        createSoftSnowAndAshParticles();

        // Spawn Initial US Platoon Ahead
        CombatSystem.updateCombat(
            scene, tank, 0.016,
            CityWorld.colliders, CityWorld.destructibles,
            CityWorld.ambushZones, CityWorld.coverNodes,
            triggerCameraShake
        );

        setupEventListeners();
        updateViewModeUI();

        let lastTime = performance.now();
        function animate(now) {
            requestAnimationFrame(animate);
            const dt = Math.min(0.05, (now - lastTime) / 1000);
            lastTime = now;

            if (isStarted) {
                stepSimulation(dt, now);
            }
            renderer.render(scene, camera);
        }
        requestAnimationFrame(animate);
    }

    // Soft Circular Radial Particles (Fixes the square snowflake bug completely!)
    function createSoftSnowAndAshParticles() {
        const count = 650;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 220;
            positions[i * 3 + 1] = Math.random() * 36;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 220;
        }
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const softCircleTex = GameTextures.getSoftParticleTexture();
        const mat = new THREE.PointsMaterial({
            map: softCircleTex,
            color: 0xe6e2da,
            size: 0.48,
            transparent: true,
            opacity: 0.72,
            depthWrite: false,
            alphaTest: 0.02
        });
        ashSystem = new THREE.Points(geo, mat);
        scene.add(ashSystem);
    }

    function triggerCameraShake(amount) {
        cameraShake = Math.min(1.3, cameraShake + amount);
    }

    function stepSimulation(dt, now) {
        tank.targetWorldYaw = cameraYaw;
        tank.targetGunPitch = cameraPitch;

        KingTigerTank.updateTank(
            scene,
            tank,
            dt,
            keys,
            (ex, ey, ez, scaleAmt, colorHex) => {
                CombatSystem.spawnSmokePuff(scene, ex, ey, ez, scaleAmt || 0.45, colorHex || 0x3a3835, 1.2);
            },
            (crushX, crushZ) => {
                SoundEngine.playExplosion(0.45, false);
                triggerCameraShake(0.18);
                for (let i = 0; i < 6; i++) {
                    CombatSystem.spawnSmokePuff(
                        scene,
                        crushX + (Math.random() - 0.5) * 2.2,
                        0.6 + Math.random() * 0.8,
                        crushZ + (Math.random() - 0.5) * 2.2,
                        1.4,
                        0x6b5d4d,
                        1.4
                    );
                }
            },
            (cookOffPos) => {
                // Catastrophic Tank Explosion when Health Bar runs out!
                viewMode = '3RD';
                updateViewModeUI();
                triggerCameraShake(1.3);
                CombatSystem.detonate88mmShell(scene, cookOffPos, 'HE', CityWorld.destructibles, triggerCameraShake);
            }
        );

        if (!tank.destroyed) {
            if (mouseDownLeft || keys['Space']) {
                CombatSystem.fireTank88mm(scene, tank, triggerCameraShake);
            }
            if (mouseDownRight || keys['KeyF']) {
                mgFireTimer -= dt;
                if (mgFireTimer <= 0) {
                    CombatSystem.fireTankMG34(scene, tank, triggerCameraShake);
                    mgFireTimer = 0.072;
                }
            } else {
                mgFireTimer = 0;
            }
        }

        CityWorld.burningFires.forEach(bf => {
            bf.light.intensity = 2.0 + Math.sin(now * 0.015 + bf.phase) * 0.65;
            if (Math.random() < 0.35) {
                CombatSystem.spawnSmokePuff(
                    scene,
                    bf.x + (Math.random() - 0.5) * 1.4,
                    bf.y + Math.random() * 0.8,
                    bf.z + (Math.random() - 0.5) * 1.4,
                    1.45,
                    Math.random() < 0.25 ? 0xff6611 : 0x1c1b19,
                    2.6
                );
            }
        });

        if (ashSystem) {
            const posAttr = ashSystem.geometry.attributes.position;
            for (let i = 0; i < posAttr.count; i++) {
                let py = posAttr.getY(i) - dt * 1.35;
                let px = posAttr.getX(i) + Math.sin(now * 0.0012 + i) * dt * 0.65;
                if (py < 0.2) py = 34;
                posAttr.setY(i, py);
                posAttr.setX(i, px);
            }
            ashSystem.position.set(tank.x, 0, tank.z);
            posAttr.needsUpdate = true;
        }

        const combatStats = CombatSystem.updateCombat(
            scene,
            tank,
            dt,
            CityWorld.colliders,
            CityWorld.destructibles,
            CityWorld.ambushZones,
            CityWorld.coverNodes,
            triggerCameraShake
        );

        updateCameraAndReticles(dt);
        updateHUD(combatStats);
        drawTacticalMinimap();
    }

    function updateCameraAndReticles(dt) {
        if (cameraShake > 0) {
            cameraShake = Math.max(0, cameraShake - dt * 2.8);
        }
        const shakeX = (Math.random() - 0.5) * cameraShake * 0.22;
        const shakeY = (Math.random() - 0.5) * cameraShake * 0.22;

        const boreReticleEl = document.getElementById('bore-reticle-3rd');

        if (viewMode === '3RD' || tank.destroyed) {
            camera.fov = 58;
            camera.updateProjectionMatrix();

            const orbitDist = tank.destroyed ? 14.5 : 11.2;
            const orbitHeight = tank.destroyed ? 5.8 : 4.25;
            const targetPivot = new THREE.Vector3(tank.x, 2.55, tank.z);

            const camX = targetPivot.x - Math.sin(cameraYaw) * Math.cos(cameraPitch) * orbitDist;
            const camY = Math.max(1.2, targetPivot.y + orbitHeight - Math.sin(cameraPitch) * 5.5);
            const camZ = targetPivot.z - Math.cos(cameraYaw) * Math.cos(cameraPitch) * orbitDist;

            camera.position.set(camX + shakeX, camY + shakeY, camZ);

            const lookTarget = tank.destroyed
                ? new THREE.Vector3(tank.x, 2.0, tank.z)
                : new THREE.Vector3(
                    targetPivot.x + Math.sin(cameraYaw) * 65,
                    targetPivot.y + Math.sin(cameraPitch) * 65,
                    targetPivot.z + Math.cos(cameraYaw) * 65
                );
            camera.lookAt(lookTarget);

            if (boreReticleEl && !tank.destroyed) {
                const muzzleWorld = new THREE.Vector3();
                const pivotWorld = new THREE.Vector3();
                tank.muzzleNode.getWorldPosition(muzzleWorld);
                tank.gunPivot.getWorldPosition(pivotWorld);
                const gunDir = muzzleWorld.clone().sub(pivotWorld).normalize();
                const aimPoint3D = muzzleWorld.clone().addScaledVector(gunDir, 65);

                const projected = aimPoint3D.project(camera);
                if (projected.z < 1.0) {
                    const sx = (projected.x * 0.5 + 0.5) * window.innerWidth;
                    const sy = (-projected.y * 0.5 + 0.5) * window.innerHeight;
                    boreReticleEl.style.display = 'block';
                    boreReticleEl.style.left = `${sx}px`;
                    boreReticleEl.style.top = `${sy}px`;
                } else {
                    boreReticleEl.style.display = 'none';
                }
            } else if (boreReticleEl) {
                boreReticleEl.style.display = 'none';
            }
        } else if (viewMode === 'FPV_GUNNER') {
            camera.fov = (gunnerZoom === 6.0) ? 14 : 30;
            camera.updateProjectionMatrix();

            const sightWorldPos = new THREE.Vector3();
            tank.gunnerSightNode.getWorldPosition(sightWorldPos);
            camera.position.copy(sightWorldPos).add(new THREE.Vector3(shakeX * 0.35, shakeY * 0.35, 0));

            const muzzleWorld = new THREE.Vector3();
            const pivotWorld = new THREE.Vector3();
            tank.muzzleNode.getWorldPosition(muzzleWorld);
            tank.gunPivot.getWorldPosition(pivotWorld);
            const gunDir = muzzleWorld.sub(pivotWorld).normalize();

            camera.lookAt(sightWorldPos.clone().addScaledVector(gunDir, 100));
            if (boreReticleEl) boreReticleEl.style.display = 'none';
        } else if (viewMode === 'FPV_COMMANDER') {
            camera.fov = 50;
            camera.updateProjectionMatrix();

            const cupPos = new THREE.Vector3();
            tank.commanderSightNode.getWorldPosition(cupPos);
            camera.position.copy(cupPos).add(new THREE.Vector3(shakeX * 0.4, shakeY * 0.4, 0));

            const lookTarget = new THREE.Vector3(
                cupPos.x + Math.sin(cameraYaw) * 80,
                cupPos.y + Math.sin(cameraPitch) * 80,
                cupPos.z + Math.cos(cameraYaw) * 80
            );
            camera.lookAt(lookTarget);
            if (boreReticleEl) boreReticleEl.style.display = 'none';
        }

        // Sync 3D HRTF Audio Listener with Camera Position & Orientation
        const camForward = new THREE.Vector3();
        camera.getWorldDirection(camForward);
        SoundEngine.updateListener3D(camera.position, camForward, camera.up);

        // Project 3D World-Space Soldier Shout Marker so you can tell WHO & WHAT DIRECTION is shouting!
        const shoutEl = document.getElementById('world-shout-marker');
        if (shoutEl) {
            let activeShouter = null;
            for (let i = 0; i < CombatSystem.soldiers.length; i++) {
                const s = CombatSystem.soldiers[i];
                if (s.alive && s.shoutTimer > 0) {
                    activeShouter = s;
                    break;
                }
            }
            if (activeShouter) {
                const headWorld = new THREE.Vector3(activeShouter.x, activeShouter.y + 2.35, activeShouter.z);
                const dist = Math.round(headWorld.distanceTo(camera.position));
                const proj = headWorld.clone().project(camera);

                if (proj.z < 1.0 && Math.abs(proj.x) <= 0.96 && Math.abs(proj.y) <= 0.92) {
                    const sx = (proj.x * 0.5 + 0.5) * window.innerWidth;
                    const sy = (-proj.y * 0.5 + 0.5) * window.innerHeight;
                    shoutEl.style.display = 'block';
                    shoutEl.style.left = `${sx}px`;
                    shoutEl.style.top = `${sy}px`;
                    shoutEl.innerHTML = `🔊 <strong>US ${activeShouter.role} (${dist}m)</strong>: "${activeShouter.shoutText}"`;
                } else {
                    // Off-screen directional edge pointer so player knows which way to turn turret!
                    const dx = activeShouter.x - tank.x;
                    const dz = activeShouter.z - tank.z;
                    const worldAngle = Math.atan2(dx, dz);
                    let relAngle = worldAngle - cameraYaw;
                    while (relAngle > Math.PI) relAngle -= Math.PI * 2;
                    while (relAngle < -Math.PI) relAngle += Math.PI * 2;
                    const edgeX = window.innerWidth * 0.5 - Math.sin(relAngle) * (window.innerWidth * 0.38);
                    const edgeY = window.innerHeight * 0.25;
                    const arrow = relAngle > 0 ? '⬅ LEFT' : 'RIGHT ➡';
                    shoutEl.style.display = 'block';
                    shoutEl.style.left = `${edgeX}px`;
                    shoutEl.style.top = `${edgeY}px`;
                    shoutEl.innerHTML = `🔊 <strong>[${arrow} • ${dist}m] US ${activeShouter.role}</strong>: "${activeShouter.shoutText}"`;
                }
            } else {
                shoutEl.style.display = 'none';
            }
        }
    }

    function drawTacticalMinimap() {
        const canvas = document.getElementById('radar-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        const cx = w / 2;
        const cy = h / 2;
        const scale = 0.82;

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = 'rgba(16, 18, 15, 0.92)';
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = 'rgba(180, 195, 165, 0.16)';
        ctx.lineWidth = 1;
        [30, 60].forEach(r => {
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.stroke();
        });

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(cameraYaw - Math.PI);

        ctx.fillStyle = 'rgba(120, 112, 98, 0.65)';
        ctx.strokeStyle = 'rgba(190, 175, 145, 0.4)';
        for (let i = 0; i < CityWorld.colliders.length; i++) {
            const c = CityWorld.colliders[i];
            const rx = (c.minX - tank.x) * scale;
            const rz = (c.minZ - tank.z) * scale;
            const rw = (c.maxX - c.minX) * scale;
            const rd = (c.maxZ - c.minZ) * scale;
            if (Math.abs(rx) < 95 && Math.abs(rz) < 95) {
                ctx.fillRect(rx, rz, rw, rd);
                ctx.strokeRect(rx, rz, rw, rd);
            }
        }

        for (let i = 0; i < CombatSystem.soldiers.length; i++) {
            const s = CombatSystem.soldiers[i];
            if (!s.alive) continue;
            const sx = (s.x - tank.x) * scale;
            const sz = (s.z - tank.z) * scale;
            if (Math.hypot(sx, sz) < 76) {
                ctx.fillStyle = (s.role === 'BAZOOKA') ? '#ffaa22' : '#ff4d42';
                ctx.beginPath();
                ctx.arc(sx, sz, (s.role === 'BAZOOKA') ? 4.2 : 2.8, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.save();
        ctx.rotate(-tank.hullYaw);
        ctx.fillStyle = '#7cd67c';
        ctx.fillRect(-4, -6, 8, 12);
        ctx.restore();
        ctx.restore();

        ctx.strokeStyle = 'rgba(102, 255, 102, 0.45)';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx - 22, cy - 58);
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + 22, cy - 58);
        ctx.stroke();
    }

    function toggleViewMode(explicitMode) {
        if (tank && tank.destroyed) return;
        if (explicitMode) {
            viewMode = explicitMode;
        } else {
            viewMode = (viewMode === '3RD') ? 'FPV_GUNNER' : '3RD';
        }
        updateViewModeUI();
    }

    function updateViewModeUI() {
        const fpvOverlay = document.getElementById('tzf9d-optics-overlay');
        const commanderOverlay = document.getElementById('commander-periscope-overlay');
        const thirdPersonCrosshair = document.getElementById('aim-cursor-3rd');
        const boreReticleEl = document.getElementById('bore-reticle-3rd');
        const badgeEl = document.getElementById('view-mode-badge');
        const zoomBadgeEl = document.getElementById('optics-zoom-label');

        if (viewMode === 'FPV_GUNNER') {
            fpvOverlay.style.display = 'flex';
            commanderOverlay.style.display = 'none';
            thirdPersonCrosshair.style.display = 'none';
            if (boreReticleEl) boreReticleEl.style.display = 'none';
            badgeEl.textContent = `FPV: TZF 9d GUNNER OPTICS (${gunnerZoom.toFixed(1)}x)`;
            if (zoomBadgeEl) zoomBadgeEl.textContent = `MAGNIFICATION: ${gunnerZoom.toFixed(1)}x [SHIFT TO TOGGLE]`;
        } else if (viewMode === 'FPV_COMMANDER') {
            fpvOverlay.style.display = 'none';
            commanderOverlay.style.display = 'block';
            thirdPersonCrosshair.style.display = 'block';
            badgeEl.textContent = 'FPV: COMMANDER CUPOLA VIEW';
        } else {
            fpvOverlay.style.display = 'none';
            commanderOverlay.style.display = 'none';
            thirdPersonCrosshair.style.display = 'block';
            badgeEl.textContent = '3RD PERSON EXTERIOR VIEW';
        }
    }

    function updateHUD(combatStats) {
        const kmh = Math.round(Math.abs(tank.speed) * 3.6);
        document.getElementById('hud-speed').textContent = kmh;
        document.getElementById('hud-gear').textContent = tank.gear;
        document.getElementById('hud-rpm-bar').style.width = `${Math.round(tank.rpmRatio * 100)}%`;

        // Prominent Tank Health Bar Update
        const hpPct = Math.max(0, Math.round((tank.hullHealth / tank.maxHealth) * 100));
        const hpFillEl = document.getElementById('tank-health-fill');
        const hpTextEl = document.getElementById('tank-health-text');
        if (hpFillEl && hpTextEl) {
            hpFillEl.style.width = `${hpPct}%`;
            hpFillEl.style.background = hpPct > 55
                ? 'linear-gradient(90deg, #3c9d42, #67d66d)'
                : hpPct > 25
                    ? 'linear-gradient(90deg, #c77c1e, #f2b046)'
                    : 'linear-gradient(90deg, #9e1b16, #ff473d)';
            hpTextEl.textContent = `${Math.ceil(tank.hullHealth)} / ${tank.maxHealth} HP (${hpPct}%)`;
        }

        document.getElementById('hud-hull-hp').textContent = `${hpPct}%`;
        document.getElementById('hud-ricochets').textContent = tank.ricochetsCount;

        // Subsystem Status Badges (Engine, Fuel Tank, Turret Hydraulics, Tracks)
        updateBadge('badge-engine', tank.engineDamaged ? 'ENGINE: DAMAGED (-58%)' : 'ENGINE: OK', tank.engineDamaged);
        updateBadge('badge-fuel', tank.fuelLeak ? 'FUEL: LEAKING & ON FIRE!' : 'FUEL TANK: SEALED', tank.fuelLeak);
        updateBadge('badge-turret', tank.turretRingDamaged ? 'TURRET: HYDRAULIC JAM' : 'TURRET RING: OK', tank.turretRingDamaged);
        const tracksBroken = !tank.leftTrackIntact || !tank.rightTrackIntact;
        updateBadge('badge-tracks', tracksBroken ? 'TRACKS: SEVERED!' : 'TRACKS: OPERATIONAL', tracksBroken);

        const repairStrip = document.getElementById('repair-prompt-strip');
        const hasAnyDamage = tracksBroken || tank.engineDamaged || tank.fuelLeak || tank.turretRingDamaged;
        if (repairStrip) {
            if (hasAnyDamage && !tank.destroyed) {
                const repPct = Math.round((tank.repairTimer / 3.5) * 100);
                repairStrip.style.display = 'block';
                repairStrip.textContent = `🔧 HOLD [R] TO REPAIR SUBSYSTEMS & EXTINGUISH FUEL FIRE (${repPct}%)`;
            } else {
                repairStrip.style.display = 'none';
            }
        }

        const turretDeg = (-tank.turretRelYaw * 180) / Math.PI;
        const schematicTurret = document.getElementById('svg-tank-turret');
        if (schematicTurret) {
            schematicTurret.setAttribute('transform', `rotate(${turretDeg} 50 55)`);
        }

        const reloadBar = document.getElementById('hud-reload-bar');
        const reloadText = document.getElementById('hud-reload-text');
        if (tank.reloadTimer <= 0) {
            reloadBar.style.width = '100%';
            reloadBar.style.backgroundColor = '#5cb85c';
            reloadText.textContent = `8.8cm KwK 43 READY [${tank.selectedAmmo}]`;
        } else {
            const pct = ((tank.reloadDuration - tank.reloadTimer) / tank.reloadDuration) * 100;
            reloadBar.style.width = `${pct}%`;
            reloadBar.style.backgroundColor = '#e69528';
            reloadText.textContent = `LOADING ${tank.selectedAmmo}... ${tank.reloadTimer.toFixed(1)}s`;
        }

        const mgBar = document.getElementById('hud-mg-bar');
        mgBar.style.width = `${tank.mgHeat}%`;
        mgBar.style.backgroundColor = tank.mgOverheated ? '#d9534f' : '#f0ad4e';

        let bearingDeg = Math.round(((cameraYaw * 180 / Math.PI) % 360 + 360) % 360);
        const cardinals = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        const card = cardinals[Math.round(bearingDeg / 45) % 8];
        document.getElementById('compass-bearing').textContent = `${String(bearingDeg).padStart(3, '0')}° ${card}`;

        document.getElementById('hud-active-enemies').textContent = combatStats.activeEnemiesCount;
        document.getElementById('hud-kills').textContent = combatStats.soldiersEliminated;
    }

    function updateBadge(id, text, isCrit) {
        const el = document.getElementById(id);
        if (!el) return;
        el.textContent = text;
        el.className = isCrit ? 'sys-badge crit' : 'sys-badge ok';
    }

    function setupEventListeners() {
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        window.addEventListener('keydown', (e) => {
            keys[e.code] = true;

            if (e.code === 'Enter' && tank && tank.destroyed) {
                KingTigerTank.resetTankState(tank);
                return;
            }

            if (e.code === 'KeyV' || e.code === 'KeyC') {
                toggleViewMode();
            } else if (e.code === 'KeyB') {
                toggleViewMode(viewMode === 'FPV_COMMANDER' ? '3RD' : 'FPV_COMMANDER');
            } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
                if (viewMode === 'FPV_GUNNER') {
                    gunnerZoom = (gunnerZoom === 2.5) ? 6.0 : 2.5;
                    updateViewModeUI();
                } else {
                    toggleViewMode('FPV_GUNNER');
                }
            } else if (e.code === 'Digit1') {
                selectAmmo('HE');
            } else if (e.code === 'Digit2') {
                selectAmmo('AP');
            } else if (e.code === 'KeyP') {
                CombatSystem.spawnImmediateAmbushAhead(scene, tank, CityWorld.coverNodes);
            } else if (e.code === 'KeyM') {
                const muted = SoundEngine.toggleMute();
                window.HUD.pushCombatLog(muted ? 'AUDIO: Muted' : 'AUDIO: Unmuted', 'info');
            }
        });

        window.addEventListener('keyup', (e) => {
            keys[e.code] = false;
        });

        const canvasEl = renderer.domElement;
        canvasEl.addEventListener('mousedown', (e) => {
            if (!isStarted || (tank && tank.destroyed)) return;
            SoundEngine.init();
            if (!isPointerLocked && document.pointerLockElement !== canvasEl) {
                canvasEl.requestPointerLock();
            }
            if (e.button === 0) mouseDownLeft = true;
            if (e.button === 2) mouseDownRight = true;
        });

        window.addEventListener('mouseup', (e) => {
            if (e.button === 0) mouseDownLeft = false;
            if (e.button === 2) mouseDownRight = false;
        });

        window.addEventListener('contextmenu', (e) => e.preventDefault());

        document.addEventListener('pointerlockchange', () => {
            isPointerLocked = (document.pointerLockElement === canvasEl);
        });

        window.addEventListener('mousemove', (e) => {
            if (!isStarted) return;
            if (isPointerLocked || e.buttons > 0) {
                const sensitivity = (viewMode === 'FPV_GUNNER' && gunnerZoom === 6.0) ? 0.0008 : 0.0022;
                cameraYaw -= e.movementX * sensitivity;
                cameraPitch = Math.max(-0.14, Math.min(0.32, cameraPitch - e.movementY * sensitivity));
            }
        });

        window.addEventListener('wheel', (e) => {
            if (viewMode === 'FPV_GUNNER') {
                gunnerZoom = (e.deltaY < 0) ? 6.0 : 2.5;
                updateViewModeUI();
            }
        });

        document.getElementById('btn-deploy').addEventListener('click', () => {
            SoundEngine.init();
            isStarted = true;
            document.getElementById('start-modal').style.display = 'none';
            canvasEl.requestPointerLock();
            window.HUD.pushCombatLog(
                'KOMMANDANT: King Tiger #332 deployed. Watch the 2nd-floor windows for US Bazooka teams!',
                'info'
            );
        });

        const btnRedeploy = document.getElementById('btn-redeploy');
        if (btnRedeploy) {
            btnRedeploy.addEventListener('click', () => {
                KingTigerTank.resetTankState(tank);
                canvasEl.requestPointerLock();
            });
        }

        document.getElementById('btn-toggle-view').addEventListener('click', () => {
            toggleViewMode();
        });

        document.getElementById('btn-spawn-platoon').addEventListener('click', () => {
            CombatSystem.spawnImmediateAmbushAhead(scene, tank, CityWorld.coverNodes);
        });

        document.getElementById('ammo-he').addEventListener('click', () => selectAmmo('HE'));
        document.getElementById('ammo-ap').addEventListener('click', () => selectAmmo('AP'));
    }

    function selectAmmo(type) {
        if (!tank || tank.selectedAmmo === type) return;
        tank.selectedAmmo = type;
        document.getElementById('ammo-he').classList.toggle('active', type === 'HE');
        document.getElementById('ammo-ap').classList.toggle('active', type === 'AP');
        window.HUD.pushCombatLog(
            type === 'HE'
                ? 'LOADER: Next round Sprgr. 43 (88mm High Explosive — Shatters Building Windows & Walls)!'
                : 'LOADER: Next round PzGr. 39/43 (88mm Armor-Piercing Cap Ballistic Cap)!',
            'info'
        );
    }

    window.addEventListener('DOMContentLoaded', initSimulator);
})();
