// ============================================================================
// HIGH-DETAIL PBR TEXTURES (EUROPEAN FACADES, KING TIGER STEEL & SOFT SPRITES)
// ============================================================================

window.GameTextures = (function () {
    const cache = {};

    function createCanvas(w, h) {
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        return c;
    }

    // 1. Soft Circular Radial Particle Sprite (Zero square snowflakes/particles!)
    function getSoftParticleTexture() {
        if (cache.softParticle) return cache.softParticle;
        const c = createCanvas(128, 128);
        const ctx = c.getContext('2d');
        const grad = ctx.createRadialGradient(64, 64, 2, 64, 64, 60);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
        grad.addColorStop(0.35, 'rgba(245, 245, 245, 0.75)');
        grad.addColorStop(0.7, 'rgba(220, 220, 220, 0.25)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(64, 64, 62, 0, Math.PI * 2);
        ctx.fill();

        const tex = new THREE.CanvasTexture(c);
        cache.softParticle = tex;
        return tex;
    }

    // 2. Volumetric Smoke & Fire Billow Sprite
    function getSmokeSpriteTexture() {
        if (cache.smokeSprite) return cache.smokeSprite;
        const c = createCanvas(256, 256);
        const ctx = c.getContext('2d');

        for (let i = 0; i < 9; i++) {
            const ox = 128 + (Math.sin(i * 2.1) * 32);
            const oy = 128 + (Math.cos(i * 1.7) * 32);
            const r = 68 + (i % 3) * 14;
            const g = ctx.createRadialGradient(ox, oy, 4, ox, oy, r);
            g.addColorStop(0, 'rgba(255,255,255,0.38)');
            g.addColorStop(0.6, 'rgba(210,210,210,0.16)');
            g.addColorStop(1, 'rgba(180,180,180,0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(ox, oy, r, 0, Math.PI * 2);
            ctx.fill();
        }

        const tex = new THREE.CanvasTexture(c);
        cache.smokeSprite = tex;
        return tex;
    }

    // 3. Authentic Weathered King Tiger Rolled Homogeneous Steel & 1944 Ambush Camouflage
    function getKingTigerCamo() {
        if (cache.camo) return cache.camo;
        const c = createCanvas(1024, 1024);
        const ctx = c.getContext('2d');

        // Base Weathered Dunkelgelb (Dark Ochre Steel)
        ctx.fillStyle = '#8b794b';
        ctx.fillRect(0, 0, 1024, 1024);

        // Rotbraun (Red-Brown) irregular Ardennes/Aachen camo bands
        ctx.fillStyle = '#4e2c1e';
        for (let i = 0; i < 28; i++) {
            ctx.beginPath();
            const x = (Math.sin(i * 73.1) * 0.5 + 0.5) * 1024;
            const y = (Math.cos(i * 41.7) * 0.5 + 0.5) * 1024;
            ctx.ellipse(x, y, 125 + (i % 3) * 50, 78 + (i % 4) * 36, i * 0.6, 0, Math.PI * 2);
            ctx.fill();
        }

        // Olivgrün (Dark Olive Green) irregular bands
        ctx.fillStyle = '#384428';
        for (let i = 0; i < 28; i++) {
            ctx.beginPath();
            const x = (Math.cos(i * 29.3) * 0.5 + 0.5) * 1024;
            const y = (Math.sin(i * 91.5) * 0.5 + 0.5) * 1024;
            ctx.ellipse(x, y, 115 + (i % 4) * 45, 82 + (i % 3) * 35, -i * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Hinterhalt-Tarnung (Ambush Dots)
        const dotColors = ['#8b794b', '#384428', '#4e2c1e'];
        for (let i = 0; i < 750; i++) {
            ctx.fillStyle = dotColors[i % 3];
            const x = ((i * 197.5) % 1024);
            const y = ((i * 353.1) % 1024);
            ctx.beginPath();
            ctx.arc(x, y, 5 + (i % 5), 0, Math.PI * 2);
            ctx.fill();
        }

        // Fine Zimmerit Anti-Magnetic Paste Ridges + Gunmetal Chipped Edges & Oil Grime
        for (let y = 0; y < 1024; y += 5) {
            ctx.fillStyle = (y % 10 === 0) ? 'rgba(10,9,8,0.22)' : 'rgba(240,230,205,0.05)';
            ctx.fillRect(0, y, 1024, 2);
        }

        // Dark metallic wear and rain grime streaks
        for (let i = 0; i < 90; i++) {
            const sx = (i * 89) % 1024;
            const grad = ctx.createLinearGradient(sx, 0, sx, 1024);
            grad.addColorStop(0, 'rgba(20,18,15,0.0)');
            grad.addColorStop(0.5, 'rgba(20,18,15,0.18)');
            grad.addColorStop(1, 'rgba(28,22,15,0.32)');
            ctx.fillStyle = grad;
            ctx.fillRect(sx, 0, 8, 1024);
        }

        const tex = new THREE.CanvasTexture(c);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        cache.camo = tex;
        return tex;
    }

    // 4. Turret Side Decal ("332" + Balkenkreuz on Ambush Camo)
    function getTurretDecal() {
        if (cache.decal) return cache.decal;
        const c = createCanvas(512, 256);
        const ctx = c.getContext('2d');
        ctx.drawImage(getKingTigerCamo().image, 0, 0, 512, 256);

        const cx = 135, cy = 128, s = 32;
        ctx.fillStyle = '#ece8dc';
        ctx.fillRect(cx - s, cy - 10, s * 2, 20);
        ctx.fillRect(cx - 10, cy - s, 20, s * 2);
        ctx.fillStyle = '#141414';
        ctx.fillRect(cx - s, cy - 6, s * 2, 12);
        ctx.fillRect(cx - 6, cy - s, 12, s * 2);

        ctx.font = 'bold 84px "Impact", "Arial Black", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#efeadd';
        ctx.fillStyle = '#8f1d14';
        ctx.strokeText('332', 325, 130);
        ctx.fillText('332', 325, 130);

        const tex = new THREE.CanvasTexture(c);
        cache.decal = tex;
        return tex;
    }

    // 5. Steel Track Links Texture
    function getTrackTexture() {
        if (cache.track) return cache.track;
        const c = createCanvas(256, 512);
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#181614';
        ctx.fillRect(0, 0, 256, 512);

        for (let y = 0; y < 512; y += 28) {
            ctx.fillStyle = '#38342e';
            ctx.fillRect(6, y + 3, 244, 20);
            ctx.fillStyle = '#5c554b';
            ctx.fillRect(10, y + 6, 236, 6);
            ctx.fillStyle = '#221e19';
            ctx.fillRect(46, y + 3, 22, 20);
            ctx.fillRect(188, y + 3, 22, 20);
        }

        const tex = new THREE.CanvasTexture(c);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(1, 12);
        cache.track = tex;
        return tex;
    }

    // 6. Wet European Cobblestone & Mud Street Texture
    function getCobblestoneTexture() {
        if (cache.cobble) return cache.cobble;
        const c = createCanvas(1024, 1024);
        const ctx = c.getContext('2d');

        ctx.fillStyle = '#23211e';
        ctx.fillRect(0, 0, 1024, 1024);

        const rows = 32;
        const cols = 24;
        const cellH = 1024 / rows;
        const cellW = 1024 / cols;

        for (let r = 0; r < rows; r++) {
            const offset = (r % 2) * (cellW * 0.5);
            for (let col = -1; col <= cols; col++) {
                const x = col * cellW + offset;
                const y = r * cellH;
                const shade = 54 + ((r * 19 + col * 37) % 30);
                const warm = (r * col) % 8;
                ctx.fillStyle = `rgb(${shade + warm}, ${shade + 2}, ${shade - 3})`;
                ctx.fillRect(x + 2, y + 2, cellW - 4, cellH - 4);
            }
        }

        for (let i = 0; i < 48; i++) {
            const mx = (Math.sin(i * 19.7) * 0.5 + 0.5) * 1024;
            const my = (Math.cos(i * 47.3) * 0.5 + 0.5) * 1024;
            const grad = ctx.createRadialGradient(mx, my, 10, mx, my, 95 + (i % 60));
            grad.addColorStop(0, 'rgba(36, 30, 22, 0.82)');
            grad.addColorStop(1, 'rgba(36, 30, 22, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(mx, my, 150, 0, Math.PI * 2);
            ctx.fill();
        }

        const tex = new THREE.CanvasTexture(c);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(38, 38);
        cache.cobble = tex;
        return tex;
    }

    // 7. Classic Detailed Multi-Story European Building Facade (Storefronts, Shutters, Soot & Brickwork)
    function getBuildingFacadeMaterial(variant = 0) {
        const key = 'facade_mat_' + variant;
        if (cache[key]) return cache[key];

        const c = createCanvas(1024, 1024);
        const ctx = c.getContext('2d');

        const palettes = [
            { wall: '#877d6e', groundStone: '#635c51', brick: '#613326', trim: '#4f483e', signBg: '#243028', signText: 'BOULANGERIE • TABAC' },
            { wall: '#787b74', groundStone: '#585a55', brick: '#572f25', trim: '#42443f', signBg: '#36221e', signText: 'HOTEL CONTINENTAL' },
            { wall: '#8c7662', groundStone: '#665749', brick: '#683424', trim: '#524438', signBg: '#1f2836', signText: 'APOTHEKE • PHARMACIE' },
            { wall: '#7d7365', groundStone: '#595248', brick: '#5b3124', trim: '#474139', signBg: '#2e2a1f', signText: 'CAFÉ DE LA CATHÉDRALE' }
        ];
        const pal = palettes[variant % palettes.length];

        ctx.fillStyle = pal.wall;
        ctx.fillRect(0, 0, 1024, 1024);

        // Ground floor rusticated stone blocks
        ctx.fillStyle = pal.groundStone;
        ctx.fillRect(0, 720, 1024, 304);
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        for (let y = 720; y < 1024; y += 28) {
            ctx.fillRect(0, y, 1024, 3);
        }

        // Exposed damaged red brick patches
        for (let i = 0; i < 22; i++) {
            const bx = ((i * 173) % 920) + 40;
            const by = ((i * 229) % 880) + 40;
            const rx = 45 + (i % 45);
            const ry = 30 + (i % 35);
            ctx.fillStyle = pal.brick;
            ctx.beginPath();
            ctx.ellipse(bx, by, rx, ry, (i % 5) * 0.4, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'rgba(30,18,14,0.5)';
            for (let my = by - ry; my < by + ry; my += 10) {
                ctx.fillRect(bx - rx * 0.7, my, rx * 1.4, 2);
            }
        }

        // Horizontal stone cornices / ledges
        ctx.fillStyle = pal.trim;
        ctx.fillRect(0, 0, 1024, 24);
        ctx.fillRect(0, 350, 1024, 20);
        ctx.fillRect(0, 705, 1024, 24);

        // Vintage European Storefront Signboard
        ctx.fillStyle = pal.signBg;
        ctx.fillRect(140, 728, 744, 46);
        ctx.strokeStyle = '#c4b082';
        ctx.lineWidth = 3;
        ctx.strokeRect(144, 732, 736, 38);
        ctx.fillStyle = '#e6d8b8';
        ctx.font = 'bold 26px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText(pal.signText, 512, 760);

        // 2 Upper Floors of Tall European Windows with Pediments, Shutters & Fire Scorch Marks
        for (let floor = 0; floor < 2; floor++) {
            const wy = 75 + floor * 345;
            for (let w = 0; w < 4; w++) {
                const wx = 82 + w * 236;

                const soot = ctx.createLinearGradient(wx, wy - 55, wx, wy + 15);
                soot.addColorStop(0, 'rgba(10,10,10,0)');
                soot.addColorStop(1, 'rgba(12,11,10,0.82)');
                ctx.fillStyle = soot;
                ctx.fillRect(wx - 15, wy - 55, 136, 70);

                ctx.fillStyle = '#4a453c';
                ctx.fillRect(wx - 10, wy - 14, 126, 208);
                ctx.fillRect(wx - 16, wy - 24, 138, 12);

                ctx.fillStyle = '#2d362a';
                ctx.fillRect(wx - 34, wy - 6, 24, 192);
                ctx.fillRect(wx + 116, wy - 6, 24, 192);

                ctx.fillStyle = '#0d0c0b';
                ctx.fillRect(wx, wy, 106, 184);

                ctx.strokeStyle = '#3b352d';
                ctx.lineWidth = 5;
                ctx.strokeRect(wx + 3, wy + 3, 100, 178);
                ctx.beginPath();
                ctx.moveTo(wx + 53, wy);
                ctx.lineTo(wx + 53, wy + 184);
                ctx.moveTo(wx, wy + 76);
                ctx.lineTo(wx + 106, wy + 76);
                ctx.stroke();
            }
        }

        // Ground-floor Arched Windows & Heavy Timber Entryway
        for (let w = 0; w < 4; w++) {
            const wx = 82 + w * 236;
            const wy = 795;
            ctx.fillStyle = '#3b3730';
            ctx.fillRect(wx - 8, wy - 8, 122, 215);
            ctx.fillStyle = (w === 1) ? '#261b14' : '#11100f';
            ctx.fillRect(wx, wy, 106, 200);
            ctx.strokeStyle = '#473e33';
            ctx.lineWidth = 4;
            ctx.strokeRect(wx + 4, wy + 4, 98, 192);
        }

        const tex = new THREE.CanvasTexture(c);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;

        const mat = new THREE.MeshStandardMaterial({
            map: tex,
            bumpMap: tex,
            bumpScale: 0.08,
            roughness: 0.86,
            metalness: 0.06
        });

        cache[key] = mat;
        return mat;
    }

    function getMasonryMaterial(variant = 0) {
        return getBuildingFacadeMaterial(variant);
    }

    function getChurchStoneMaterial() {
        if (cache.churchMat) return cache.churchMat;
        const c = createCanvas(1024, 1024);
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#5a554c';
        ctx.fillRect(0, 0, 1024, 1024);

        for (let y = 0; y < 1024; y += 32) {
            const offset = (y / 32) % 2 === 0 ? 0 : 32;
            for (let x = -32; x < 1024; x += 64) {
                const v = 72 + ((x * 13 + y * 29) % 28);
                ctx.fillStyle = `rgb(${v}, ${v - 2}, ${v - 6})`;
                ctx.fillRect(x + offset + 2, y + 2, 60, 28);
            }
        }

        for (let w = 0; w < 3; w++) {
            const wx = 170 + w * 340;
            const wy = 240;
            ctx.fillStyle = '#141311';
            ctx.beginPath();
            ctx.moveTo(wx - 60, wy + 420);
            ctx.lineTo(wx - 60, wy + 90);
            ctx.quadraticCurveTo(wx - 60, wy - 30, wx, wy - 90);
            ctx.quadraticCurveTo(wx + 60, wy - 30, wx + 60, wy + 90);
            ctx.lineTo(wx + 60, wy + 420);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = '#38342e';
            ctx.lineWidth = 8;
            ctx.stroke();
        }

        const tex = new THREE.CanvasTexture(c);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        const mat = new THREE.MeshStandardMaterial({
            map: tex,
            bumpMap: tex,
            bumpScale: 0.12,
            roughness: 0.9,
            metalness: 0.05
        });
        cache.churchMat = mat;
        return mat;
    }

    function getSlateRoofMaterial() {
        if (cache.roofMat) return cache.roofMat;
        const c = createCanvas(512, 512);
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#292c30';
        ctx.fillRect(0, 0, 512, 512);
        for (let y = 0; y < 512; y += 16) {
            ctx.fillStyle = (y % 32 === 0) ? '#32363c' : '#222529';
            ctx.fillRect(0, y, 512, 14);
        }
        const tex = new THREE.CanvasTexture(c);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        const mat = new THREE.MeshStandardMaterial({
            map: tex,
            bumpMap: tex,
            bumpScale: 0.06,
            roughness: 0.82
        });
        cache.roofMat = mat;
        return mat;
    }

    return {
        getSoftParticleTexture,
        getSmokeSpriteTexture,
        getKingTigerCamo,
        getTurretDecal,
        getTrackTexture,
        getCobblestoneTexture,
        getBuildingFacadeMaterial,
        getMasonryMaterial,
        getChurchStoneMaterial,
        getSlateRoofMaterial
    };
})();
