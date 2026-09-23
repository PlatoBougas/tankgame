// ============================================================================
// 3D HRTF SPATIAL WW2 AUDIO ENGINE (CONVOLUTION REVERB, REAL MALE VOICES & MG ACOUSTICS)
// ============================================================================

window.SoundEngine = (function () {
    let ctx = null;
    let engineOsc1 = null;
    let engineOsc2 = null;
    let engineGain = null;
    let trackNoiseNode = null;
    let trackFilter = null;
    let trackGain = null;
    let turretOsc = null;
    let turretGain = null;
    let noiseBuffer = null;
    let urbanReverbNode = null;
    let distortionCurve = null;
    let decodedVoices = {};
    let decodedWeapons = {};
    let voiceKeys = [];
    let initialized = false;
    let muted = false;
    let lastVoiceTime = 0;

    function decodeBase64ToBuffer(b64, callback) {
        try {
            const binStr = atob(b64);
            const len = binStr.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) bytes[i] = binStr.charCodeAt(i);
            ctx.decodeAudioData(bytes.buffer.slice(0), (audioBuf) => {
                if (callback) callback(audioBuf);
            });
        } catch (e) {
            console.warn("Audio decode error:", e);
        }
    }

    function makeDistortionCurve(amount = 35) {
        const nSamples = 44100;
        const curve = new Float32Array(nSamples);
        for (let i = 0; i < nSamples; ++i) {
            const x = (i * 2) / nSamples - 1;
            curve[i] = ((3 + amount) * x * 20 * (Math.PI / 180)) / (Math.PI + amount * Math.abs(x));
        }
        return curve;
    }

    function init() {
        if (initialized) {
            if (ctx && ctx.state === 'suspended') ctx.resume();
            return;
        }
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        ctx = new AudioCtx();
        distortionCurve = makeDistortionCurve(45);

        const sampleRate = ctx.sampleRate;
        noiseBuffer = ctx.createBuffer(1, sampleRate * 3.5, sampleRate);
        const data = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < data.length; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.997 * b0 + white * 0.029;
            b1 = 0.985 * b1 + white * 0.032;
            b2 = 0.950 * b2 + white * 0.048;
            data[i] = (b0 + b1 + b2 + white * 0.24) * 1.85;
        }

        // Stereo Urban Street Canyon Impulse Response (ConvolverNode for realistic WW2 city echoes)
        const reverbLen = Math.floor(sampleRate * 1.45);
        const impulse = ctx.createBuffer(2, reverbLen, sampleRate);
        for (let ch = 0; ch < 2; ch++) {
            const chData = impulse.getChannelData(ch);
            for (let i = 0; i < reverbLen; i++) {
                const early = (i === Math.floor(sampleRate * 0.045) || i === Math.floor(sampleRate * 0.095)) ? 0.65 : 1.0;
                chData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / reverbLen, 2.8) * early * 0.32;
            }
        }
        urbanReverbNode = ctx.createConvolver();
        urbanReverbNode.buffer = impulse;
        const reverbGain = ctx.createGain();
        reverbGain.gain.value = 0.34;
        urbanReverbNode.connect(reverbGain);
        reverbGain.connect(ctx.destination);

        // 1. Decode REAL Recorded WW2 American Soldier Voice Actors (window.REAL_US_VOICE_CLIPS)
        if (Array.isArray(window.REAL_US_VOICE_CLIPS)) {
            window.REAL_US_VOICE_CLIPS.forEach((item, idx) => {
                const key = String(idx);
                decodeBase64ToBuffer(item.b64, (audioBuf) => {
                    decodedVoices[key] = {
                        buffer: audioBuf,
                        text: item.text
                    };
                    voiceKeys = Object.keys(decodedVoices);
                });
            });
        }

        // 2. Decode REAL Recorded WW2 Machine Guns, Rifles, Bazooka & Cannon (window.REAL_WW2_WEAPON_SFX)
        if (window.REAL_WW2_WEAPON_SFX) {
            Object.keys(window.REAL_WW2_WEAPON_SFX).forEach(wKey => {
                decodeBase64ToBuffer(window.REAL_WW2_WEAPON_SFX[wKey], (audioBuf) => {
                    decodedWeapons[wKey] = audioBuf;
                });
            });
        }

        // 3. Maybach HL230 P30 V12 Tank Engine (23-Liter V12 Petrol Rumble)
        engineOsc1 = ctx.createOscillator();
        engineOsc2 = ctx.createOscillator();
        engineOsc1.type = 'sawtooth';
        engineOsc2.type = 'triangle';
        engineOsc1.frequency.value = 34;
        engineOsc2.frequency.value = 68;

        const engineFilter = ctx.createBiquadFilter();
        engineFilter.type = 'lowpass';
        engineFilter.frequency.value = 145;

        engineGain = ctx.createGain();
        engineGain.gain.value = 0.12;

        engineOsc1.connect(engineFilter);
        engineOsc2.connect(engineFilter);
        engineFilter.connect(engineGain);
        engineGain.connect(ctx.destination);
        engineOsc1.start();
        engineOsc2.start();

        // 4. Heavy Steel Battle Track Link Clatter
        trackNoiseNode = ctx.createBufferSource();
        trackNoiseNode.buffer = noiseBuffer;
        trackNoiseNode.loop = true;

        trackFilter = ctx.createBiquadFilter();
        trackFilter.type = 'bandpass';
        trackFilter.frequency.value = 420;
        trackFilter.Q.value = 3.2;

        trackGain = ctx.createGain();
        trackGain.gain.value = 0.0;

        trackNoiseNode.connect(trackFilter);
        trackFilter.connect(trackGain);
        trackGain.connect(ctx.destination);
        trackNoiseNode.start();

        // 5. Hydraulic Turret Traverse Motor
        turretOsc = ctx.createOscillator();
        turretOsc.type = 'sine';
        turretOsc.frequency.value = 185;
        turretGain = ctx.createGain();
        turretGain.gain.value = 0.0;
        turretOsc.connect(turretGain);
        turretGain.connect(ctx.destination);
        turretOsc.start();

        initialized = true;
    }

    // Updates Web Audio 3D Listener Position & Orientation to match the Player's Camera in 3D Space!
    function updateListener3D(camPos, camForward, camUp) {
        if (!initialized || !ctx || !ctx.listener) return;
        const l = ctx.listener;
        if (l.positionX) {
            const now = ctx.currentTime;
            l.positionX.setValueAtTime(camPos.x, now);
            l.positionY.setValueAtTime(camPos.y, now);
            l.positionZ.setValueAtTime(camPos.z, now);
            l.forwardX.setValueAtTime(camForward.x, now);
            l.forwardY.setValueAtTime(camForward.y, now);
            l.forwardZ.setValueAtTime(camForward.z, now);
            l.upX.setValueAtTime(camUp.x, now);
            l.upY.setValueAtTime(camUp.y, now);
            l.upZ.setValueAtTime(camUp.z, now);
        } else if (l.setPosition) {
            l.setPosition(camPos.x, camPos.y, camPos.z);
            l.setOrientation(camForward.x, camForward.y, camForward.z, camUp.x, camUp.y, camUp.z);
        }
    }

    // Creates a 3D HRTF Spatial PannerNode at exact World Coordinates (x, y, z)
    function create3DPanner(x, y, z, refDist = 14, maxDist = 200) {
        const panner = ctx.createPanner();
        panner.panningModel = 'HRTF';
        panner.distanceModel = 'inverse';
        panner.refDistance = refDist;
        panner.maxDistance = maxDist;
        panner.rolloffFactor = 1.15;
        if (panner.positionX) {
            panner.positionX.setValueAtTime(x, ctx.currentTime);
            panner.positionY.setValueAtTime(y, ctx.currentTime);
            panner.positionZ.setValueAtTime(z, ctx.currentTime);
        } else {
            panner.setPosition(x, y, z);
        }
        return panner;
    }

    function updateTankAudio(rpmRatio, speedRatio, turretTurningSpeed, engineDamaged = false) {
        if (!initialized || muted) return;
        const now = ctx.currentTime;

        const sputter = engineDamaged ? (Math.sin(now * 28) * 6) : 0;
        const baseFreq = 31 + rpmRatio * 50 + sputter;
        engineOsc1.frequency.setTargetAtTime(baseFreq, now, 0.06);
        engineOsc2.frequency.setTargetAtTime(baseFreq * 2.02, now, 0.06);
        engineGain.gain.setTargetAtTime(0.10 + rpmRatio * 0.11, now, 0.08);

        const clankMod = Math.abs(Math.sin(now * (14 + speedRatio * 36))) * 0.5 + 0.5;
        trackFilter.frequency.setTargetAtTime(320 + speedRatio * 550, now, 0.05);
        trackGain.gain.setTargetAtTime(Math.min(0.14, speedRatio * 0.14 * clankMod), now, 0.04);

        const traverseAmt = Math.min(1, Math.abs(turretTurningSpeed) * 35);
        turretOsc.frequency.setTargetAtTime(165 + traverseAmt * 95, now, 0.05);
        turretGain.gain.setTargetAtTime(traverseAmt * 0.04, now, 0.05);
    }

    // REAL Recorded 8.8 cm KwK 43 L/71 Cannon Blast + Shell Ejection Clank
    function playCannon88mm() {
        if (!initialized || muted) return;
        const now = ctx.currentTime;

        // 1. Play Real Recorded WW2 Heavy Cannon Detonation (`cannon88` + `explode1`)
        if (decodedWeapons.cannon88) {
            const realCannon = ctx.createBufferSource();
            realCannon.buffer = decodedWeapons.cannon88;
            realCannon.playbackRate.value = 0.88 + Math.random() * 0.06;
            const cg = ctx.createGain();
            cg.gain.value = 1.25;
            realCannon.connect(cg);
            cg.connect(ctx.destination);
            if (urbanReverbNode) cg.connect(urbanReverbNode);
            realCannon.start(now);
        }
        if (decodedWeapons.explode1) {
            const realBoom = ctx.createBufferSource();
            realBoom.buffer = decodedWeapons.explode1;
            realBoom.playbackRate.value = 0.78;
            const bg = ctx.createGain();
            bg.gain.value = 0.85;
            realBoom.connect(bg);
            bg.connect(ctx.destination);
            realBoom.start(now + 0.02);
        }

        // 2. Sub-bass 88mm Breech Shockwave
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(125, now);
        subOsc.frequency.exponentialRampToValueAtTime(20, now + 0.85);
        subGain.gain.setValueAtTime(0.85, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.95);
        subOsc.connect(subGain);
        subGain.connect(ctx.destination);
        subOsc.start(now);
        subOsc.stop(now + 1.0);

        // 3. Brass Shell Casing Ejection & Breech Block Clank
        setTimeout(() => {
            playMetallicClank(680, 0.22);
            setTimeout(() => playMetallicClank(1340, 0.18), 220);
        }, 700);
    }

    function playMetallicClank(freq, vol) {
        if (!initialized || muted) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'square';
        osc2.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        osc2.frequency.setValueAtTime(freq * 1.49, now);
        g.gain.setValueAtTime(vol, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.21);
        osc.connect(g);
        osc2.connect(g);
        g.connect(ctx.destination);
        osc.start(now);
        osc2.start(now);
        osc.stop(now + 0.22);
        osc2.stop(now + 0.22);
    }

    let lastRicochetTime = 0;

    // Distinct, Heavy Single-Shot German 7.92mm Tank Coaxial Machine Gun (`tiger_mg1`, `tiger_mg2`, `tiger_mg3`)
    function playMG34Shot() {
        if (!initialized || muted) return;
        const now = ctx.currentTime;

        // Layer the heavy belt-fed single-shot transient (`tiger_mg3` / `tiger_mg1`) with crisp 7.92mm Mauser bolt snap (`tiger_mg2`)
        const primaryBuf = decodedWeapons.tiger_mg3 || decodedWeapons.tiger_mg1;
        const snapBuf = decodedWeapons.tiger_mg2 || decodedWeapons.tiger_mg1;

        if (primaryBuf) {
            const src = ctx.createBufferSource();
            src.buffer = primaryBuf;
            // Deeper pitch (0.86 - 0.92) for a heavy armored turret coaxial mount sound distinct from infantry MGs
            src.playbackRate.value = 0.86 + Math.random() * 0.06;
            const g = ctx.createGain();
            g.gain.value = 0.68;
            src.connect(g);
            g.connect(ctx.destination);
            if (urbanReverbNode) g.connect(urbanReverbNode);
            src.start(now);
        }
        if (snapBuf) {
            const snapSrc = ctx.createBufferSource();
            snapSrc.buffer = snapBuf;
            snapSrc.playbackRate.value = 0.94 + Math.random() * 0.06;
            const sg = ctx.createGain();
            sg.gain.value = 0.42;
            snapSrc.connect(sg);
            sg.connect(ctx.destination);
            snapSrc.start(now);
        }
    }

    // 3D Spatialized REAL Recorded US Browning M1919A4 .30 Cal MG, BAR, Thompson & M1 Garand Rifle!
    function playEnemyGunshot3D(soldierX, soldierY, soldierZ, isHeavyMG = false, isGarandPing = false) {
        if (!initialized || muted) return;
        const now = ctx.currentTime;

        const panner = create3DPanner(soldierX, soldierY, soldierZ, 16, 200);
        panner.connect(ctx.destination);
        if (urbanReverbNode) panner.connect(urbanReverbNode);

        let weaponBuf = null;
        if (isHeavyMG) {
            // Alternate between real Browning M1919A4 .30 Cal (`mg30cal`), Archive.org `browning_burst`, and `bar`
            const r = Math.random();
            if (r < 0.55 && decodedWeapons.mg30cal) weaponBuf = decodedWeapons.mg30cal;
            else if (r < 0.80 && decodedWeapons.browning_burst) weaponBuf = decodedWeapons.browning_burst;
            else weaponBuf = decodedWeapons.bar || decodedWeapons.mg30cal;
        } else {
            // Riflemen & SMG troopers fire real M1 Garand (`garand`), M1918 BAR (`bar`), or Thompson (`thompson`)
            const r = Math.random();
            if (r < 0.50 && decodedWeapons.garand) weaponBuf = decodedWeapons.garand;
            else if (r < 0.78 && decodedWeapons.thompson) weaponBuf = decodedWeapons.thompson;
            else weaponBuf = decodedWeapons.bar || decodedWeapons.garand;
        }

        if (weaponBuf) {
            const src = ctx.createBufferSource();
            src.buffer = weaponBuf;
            src.playbackRate.value = 0.95 + Math.random() * 0.10;
            const g = ctx.createGain();
            g.gain.value = isHeavyMG ? 1.15 : 0.95;
            src.connect(g);
            g.connect(panner);
            src.start(now, 0, Math.min(weaponBuf.duration, isHeavyMG ? 0.35 : 0.45));
        }

        // Real Recorded M1 Garand En-Bloc Steel Clip Ejection "PING!" at Soldier's 3D Position
        if (isGarandPing && decodedWeapons.garand_ping) {
            const pingSrc = ctx.createBufferSource();
            pingSrc.buffer = decodedWeapons.garand_ping;
            pingSrc.playbackRate.value = 0.98 + Math.random() * 0.05;
            const pg = ctx.createGain();
            pg.gain.value = 0.95;
            pingSrc.connect(pg);
            pg.connect(panner);
            pingSrc.start(now + 0.08);
        }
    }

    // 3D HRTF Spatialized REAL Recorded WW2 American Soldier Voice Shouts!
    function shoutAmericanCommand3D(soldier, tank, preferredKey = null) {
        if (!initialized || muted || !soldier) return;
        const nowMs = performance.now();
        if (nowMs - lastVoiceTime < 3200) return;
        lastVoiceTime = nowMs;

        const availableKeys = Object.keys(decodedVoices);
        if (availableKeys.length === 0) return;

        // Select context-appropriate real WW2 US soldier recording
        let candidateIndices = [];
        if (preferredKey === 'contact_tiger') {
            candidateIndices = ['0', '1', '5', '15']; // "TIGER TANK AHEAD!", "ENEMY ARMOR AHEAD!", "TAKE COVER!"
        } else if (preferredKey === 'bazooka_up' || soldier.role === 'BAZOOKA') {
            candidateIndices = ['2', '3', '4', '19']; // "GET THAT BAZOOKA UP HERE!", "HIT IT WITH THE BAZOOKA!"
        } else if (soldier.role === 'MG_GUNNER') {
            candidateIndices = ['6', '7', '8', '14']; // "MOVE UP THAT .30 CAL MG!", "LAY DOWN COVERING FIRE!"
        } else {
            candidateIndices = availableKeys;
        }

        const validCandidates = candidateIndices.filter(k => decodedVoices[k] && decodedVoices[k].buffer);
        const chosenKey = validCandidates.length > 0
            ? validCandidates[Math.floor(Math.random() * validCandidates.length)]
            : availableKeys[Math.floor(Math.random() * availableKeys.length)];

        const entry = decodedVoices[chosenKey];
        if (!entry || !entry.buffer) return;

        const dist = Math.hypot(tank.x - soldier.x, tank.z - soldier.z);
        if (dist > 140) return;

        // Attach 3D world-space visual callout marker directly onto the shouting soldier!
        soldier.shoutText = entry.text.toUpperCase();
        soldier.shoutTimer = 3.5;

        // Calculate relative bearing direction (e.g., "LEFT FLANK • 2ND FLOOR BALCONY • 38m")
        const dx = soldier.x - tank.x;
        const dz = soldier.z - tank.z;
        const worldAngle = Math.atan2(dx, dz);
        let relDeg = ((worldAngle - tank.targetWorldYaw) * 180 / Math.PI) % 360;
        if (relDeg > 180) relDeg -= 360;
        if (relDeg < -180) relDeg += 360;

        let dirLabel = 'AHEAD';
        if (relDeg > 25 && relDeg <= 115) dirLabel = 'LEFT FLANK';
        else if (relDeg < -25 && relDeg >= -115) dirLabel = 'RIGHT FLANK';
        else if (Math.abs(relDeg) > 115) dirLabel = 'REAR';

        const heightLabel = soldier.y > 2.5 ? '2ND FLOOR BALCONY' : 'STREET RUBBLE';
        if (window.HUD) {
            window.HUD.pushCombatLog(
                `US GI [${dirLabel} • ${heightLabel} • ${Math.round(dist)}m]: "${entry.text}"`,
                'warn'
            );
        }

        // Route the Real Recorded American Male Soldier AudioBuffer through a 3D HRTF PannerNode at (soldier.x, soldier.y, soldier.z)
        const src = ctx.createBufferSource();
        src.buffer = entry.buffer;
        // Subtle natural pitch variance (0.97 - 1.03) so each soldier in the squad has distinct vocal timbre without ever sounding unnatural
        src.playbackRate.value = 0.97 + (Math.abs(Math.round(soldier.x * 7 + soldier.z * 13)) % 7) * 0.01;

        // Distance Lowpass Filter (farther soldiers sound naturally attenuated by urban streets)
        const distFilter = ctx.createBiquadFilter();
        distFilter.type = 'lowpass';
        distFilter.frequency.value = Math.max(1400, 5200 - dist * 25);

        const panner = create3DPanner(soldier.x, soldier.y + 1.5, soldier.z, 20, 175);
        const masterGain = ctx.createGain();
        masterGain.gain.value = 1.65;

        src.connect(distFilter);
        distFilter.connect(panner);
        panner.connect(masterGain);
        masterGain.connect(ctx.destination);
        if (urbanReverbNode) masterGain.connect(urbanReverbNode);

        src.start(ctx.currentTime);
    }

    // REAL Recorded Steel Armor Bullet Deflection & Ricochet (Subtle, Not Loud!)
    function playArmorRicochet() {
        if (!initialized || muted) return;
        const nowMs = performance.now();
        // Prevent overlapping loudness when multiple bullets strike the hull at once
        if (nowMs - lastRicochetTime < 120) return;
        lastRicochetTime = nowMs;

        const now = ctx.currentTime;

        // 1. Real Recorded Bullet Impact on Solid Steel Armor (`metal_solid_impact_bullet1..4.wav`)
        const deflectPool = [
            decodedWeapons.metal_deflect1,
            decodedWeapons.metal_deflect2,
            decodedWeapons.metal_deflect3,
            decodedWeapons.metal_deflect4
        ].filter(Boolean);

        if (deflectPool.length > 0) {
            const dBuf = deflectPool[Math.floor(Math.random() * deflectPool.length)];
            const dSrc = ctx.createBufferSource();
            dSrc.buffer = dBuf;
            dSrc.playbackRate.value = 0.92 + Math.random() * 0.16;
            const dGain = ctx.createGain();
            // Subtle, crisp metallic deflection impact (not loud!)
            dGain.gain.value = 0.17;
            dSrc.connect(dGain);
            dGain.connect(ctx.destination);
            dSrc.start(now);
        }

        // 2. Real Recorded Bullet Ricochet Whine (`ric1.wav`, `ric2.wav`, `ric4.wav`, `ric3.wav`, `ric5.wav`)
        if (Math.random() < 0.68) {
            const ricPool = [
                decodedWeapons.ricochet1,
                decodedWeapons.ricochet2,
                decodedWeapons.ricochet3,
                decodedWeapons.ricochet4,
                decodedWeapons.ricochet5
            ].filter(Boolean);

            if (ricPool.length > 0) {
                const rBuf = ricPool[Math.floor(Math.random() * ricPool.length)];
                const rSrc = ctx.createBufferSource();
                rSrc.buffer = rBuf;
                rSrc.playbackRate.value = 0.94 + Math.random() * 0.14;
                const rGain = ctx.createGain();
                // Subtle ricochet zing (not loud!)
                rGain.gain.value = 0.12;
                rSrc.connect(rGain);
                rGain.connect(ctx.destination);
                if (urbanReverbNode) rGain.connect(urbanReverbNode);
                rSrc.start(now + 0.015);
            }
        }
    }

    // REAL Recorded US M1A1 Bazooka Rocket Launch in 3D Space!
    function playBazookaLaunch3D(x, y, z) {
        if (!initialized || muted) return;
        const now = ctx.currentTime;
        const panner = create3DPanner(x, y, z, 18, 190);
        panner.connect(ctx.destination);
        if (urbanReverbNode) panner.connect(urbanReverbNode);

        if (decodedWeapons.bazooka) {
            const src = ctx.createBufferSource();
            src.buffer = decodedWeapons.bazooka;
            src.playbackRate.value = 0.96 + Math.random() * 0.08;
            const g = ctx.createGain();
            g.gain.value = 1.25;
            src.connect(g);
            g.connect(panner);
            src.start(now);
        } else {
            const src = ctx.createBufferSource();
            src.buffer = noiseBuffer;
            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(580, now);
            filter.frequency.exponentialRampToValueAtTime(1750, now + 0.48);
            const g = ctx.createGain();
            g.gain.setValueAtTime(0.65, now);
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.58);
            src.connect(filter);
            filter.connect(g);
            g.connect(panner);
            src.start(now);
            src.stop(now + 0.6);
        }
    }

    function playSubsystemAlarm() {
        if (!initialized || muted) return;
        const now = ctx.currentTime;
        for (let i = 0; i < 3; i++) {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(640, now + i * 0.22);
            osc.frequency.setValueAtTime(480, now + i * 0.22 + 0.1);
            g.gain.setValueAtTime(0.18, now + i * 0.22);
            g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.22 + 0.19);
            osc.connect(g);
            g.connect(ctx.destination);
            osc.start(now + i * 0.22);
            osc.stop(now + i * 0.22 + 0.2);
        }
    }

    // REAL Recorded WW2 High-Explosive Detonation (`explode1`, `explode2`, `mortar_hit`)
    function playExplosion(intensity = 1.0, isArmorHit = false) {
        if (!initialized || muted) return;
        const now = ctx.currentTime;

        const expCandidates = [decodedWeapons.explode1, decodedWeapons.explode2, decodedWeapons.mortar_hit].filter(Boolean);
        if (expCandidates.length > 0) {
            const chosenBuf = expCandidates[Math.floor(Math.random() * expCandidates.length)];
            const src = ctx.createBufferSource();
            src.buffer = chosenBuf;
            src.playbackRate.value = 0.88 + Math.random() * 0.16;
            const g = ctx.createGain();
            g.gain.value = Math.min(1.35, 0.95 * intensity);
            src.connect(g);
            g.connect(ctx.destination);
            if (urbanReverbNode) g.connect(urbanReverbNode);
            src.start(now);
        }

        if (isArmorHit) {
            playMetallicClank(230, 0.6);
            const ring = ctx.createOscillator();
            const ringG = ctx.createGain();
            ring.type = 'sine';
            ring.frequency.setValueAtTime(3650, now);
            ringG.gain.setValueAtTime(0.09, now);
            ringG.gain.exponentialRampToValueAtTime(0.0005, now + 2.5);
            ring.connect(ringG);
            ringG.connect(ctx.destination);
            ring.start(now);
            ring.stop(now + 2.55);
        }
    }

    function toggleMute() {
        muted = !muted;
        if (initialized && engineGain && trackGain && turretGain) {
            if (muted) {
                engineGain.gain.setValueAtTime(0, ctx.currentTime);
                trackGain.gain.setValueAtTime(0, ctx.currentTime);
                turretGain.gain.setValueAtTime(0, ctx.currentTime);
            }
        }
        return muted;
    }

    return {
        init,
        updateListener3D,
        updateTankAudio,
        playCannon88mm,
        playMG34Shot,
        playEnemyGunshot3D,
        shoutAmericanCommand3D,
        playArmorRicochet,
        playBazookaLaunch3D,
        playSubsystemAlarm,
        playExplosion,
        toggleMute
    };
})();
