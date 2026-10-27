export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  rotation: number;
  vRot: number;
  shape: 'rect' | 'circle' | 'coin' | 'sparkle' | 'star';
}

export class ParticleSystem {
  particles: Particle[] = [];
  width: number;
  height: number;

  constructor(width = 512, height = 2400) {
    this.width = width;
    this.height = height;
  }

  resize(w: number, h: number) {
    this.width = w;
    this.height = h;
  }

  clear() {
    this.particles = [];
  }

  triggerConfetti(originX: number, originY: number, count = 40) {
    const colors = ['#FF1744', '#FF9100', '#FFEA00', '#00E676', '#00E5FF', '#D500F9', '#FF4081'];
    for (let i = 0; i < count; i++) {
      const angle = (Math.random() * Math.PI) - Math.PI / 2 + (Math.random() - 0.5) * 1.2;
      const speed = Math.random() * 8 + 3;
      this.particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1),
        vy: -Math.sin(Math.abs(angle)) * speed - Math.random() * 4,
        size: Math.random() * 8 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        life: 0,
        maxLife: Math.random() * 60 + 50,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.25,
        shape: Math.random() > 0.4 ? 'rect' : 'circle',
      });
    }
  }

  triggerCoinFountain(originX: number, originY: number, count = 30) {
    const goldTones = ['#FFD700', '#FFC107', '#FFA000', '#FFE082'];
    for (let i = 0; i < count; i++) {
      const angle = (Math.random() - 0.5) * Math.PI * 0.8 - Math.PI / 2;
      const speed = Math.random() * 9 + 5;
      this.particles.push({
        x: originX + (Math.random() - 0.5) * 80,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 10 + 10,
        color: goldTones[Math.floor(Math.random() * goldTones.length)],
        alpha: 1,
        life: 0,
        maxLife: Math.random() * 50 + 40,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.3,
        shape: 'coin',
      });
    }
  }

  triggerSuperChatFlare(originX: number, originY: number, count = 35) {
    const flareColors = ['#FFF59D', '#FFE082', '#FFD54F', '#FFCA28', '#FFFFFF'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 2;
      this.particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 8 + 4,
        color: flareColors[Math.floor(Math.random() * flareColors.length)],
        alpha: 1,
        life: 0,
        maxLife: Math.random() * 45 + 30,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.1,
        shape: 'star',
      });
    }
  }

  triggerFlameAura(originX: number, originY: number, count = 30) {
    const flameColors = ['#FF3D00', '#FF9100', '#FFEA00', '#FF1744'];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: originX + (Math.random() - 0.5) * 160,
        y: originY + (Math.random() - 0.5) * 30,
        vx: (Math.random() - 0.5) * 2,
        vy: -Math.random() * 6 - 3,
        size: Math.random() * 9 + 4,
        color: flameColors[Math.floor(Math.random() * flameColors.length)],
        alpha: 1,
        life: 0,
        maxLife: Math.random() * 35 + 25,
        rotation: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 0.2,
        shape: 'circle',
      });
    }
  }

  triggerCyberGlitch(originX: number, originY: number, count = 25) {
    const cyberColors = ['#00E5FF', '#D500F9', '#76FF03', '#FFFFFF'];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: originX + (Math.random() - 0.5) * 200,
        y: originY + (Math.random() - 0.5) * 60,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 12 + 4,
        color: cyberColors[Math.floor(Math.random() * cyberColors.length)],
        alpha: 1,
        life: 0,
        maxLife: Math.random() * 20 + 10,
        rotation: 0,
        vRot: 0,
        shape: 'rect',
      });
    }
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life++;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.vRot;

      // Gravity for coin and confetti
      if (p.shape === 'coin' || p.shape === 'rect') {
        p.vy += 0.25;
      }

      // Air drag
      p.vx *= 0.98;

      p.alpha = Math.max(0, 1 - p.life / p.maxLife);

      if (p.life >= p.maxLife || p.y > this.height + 50) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    if (this.particles.length === 0) return;

    ctx.save();
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      if (p.shape === 'rect') {
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else if (p.shape === 'circle') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'coin') {
        // Golden Coin
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 0.7, p.size * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#B78103';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Inner detail
        ctx.fillStyle = '#B78103';
        ctx.font = `bold ${Math.floor(p.size * 0.5)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', 0, 0);
      } else if (p.shape === 'star') {
        // 4-point sparkle star
        ctx.fillStyle = p.color;
        ctx.beginPath();
        const r = p.size;
        ctx.moveTo(0, -r);
        ctx.quadraticCurveTo(0, 0, r, 0);
        ctx.quadraticCurveTo(0, 0, 0, r);
        ctx.quadraticCurveTo(0, 0, -r, 0);
        ctx.quadraticCurveTo(0, 0, 0, -r);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();
  }
}
