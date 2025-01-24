import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import Nebula from 'three-nebula';
import { SpriteRenderer, Emitter, Rate, Span, Position, Mass, Radius, Life, Body, RadialVelocity, Color } from 'three-nebula';
import * as THREE from 'three';

const ParticleSystem = forwardRef(({ scene }, ref) => {
  const nebulaRef = useRef(null);
  const emitterRef = useRef(null);
  const spriteRef = useRef(null);
  const frameTextures = useRef([]);
  const currentFrame = useRef(0);
  const totalFrames = 30; // Adjust this to the number of frames you have
  const frameDuration = 40; // Duration of each frame in milliseconds

  useEffect(() => {
    const createNebula = async () => {
      // Load frame textures
      const textureLoader = new THREE.TextureLoader();
      const frames = [];
      for (let i = 1; i < totalFrames; i++) {
        frames.push(textureLoader.load(`https://raw.githubusercontent.com/wellb3tz/theQuickandtheDead/main/frontend/media/frame${i}.png`));
      }
      frameTextures.current = frames;

      const emitter = new Emitter();
      emitter
        .setRate(new Rate(new Span(50, 100), new Span(0.01)))
        .addInitializers([
          new Position(new THREE.Vector3(0, 0, 0)),
          new Mass(1),
          new Radius(0.5, 1),
          new Life(1, 2),
          new Body(new THREE.SpriteMaterial({ map: frames[0] })),
          new RadialVelocity(50, new THREE.Vector3(0, 1, 0), 180)
        ]);

      const nebula = new Nebula();
      nebula.addEmitter(emitter);
      nebula.addRenderer(new SpriteRenderer(scene, THREE));

      nebulaRef.current = nebula;
      emitterRef.current = emitter;

      console.log('Particle system initialized', emitter);
    };

    createNebula();

    return () => {
      if (nebulaRef.current) {
        nebulaRef.current.destroy();
      }
    };
  }, [scene]);

  useImperativeHandle(ref, () => ({
    triggerParticles(position) {
      if (emitterRef.current) {
        console.log('Triggering particles at position', position);
        emitterRef.current.position.copy(position);
        emitterRef.current.emit();
      }
      if (spriteRef.current) {
        console.log('Displaying blood splatter at position', position);
        spriteRef.current.position.copy(position);
        spriteRef.current.visible = true;
        currentFrame.current = 0;

        const animateSprite = () => {
          if (currentFrame.current < totalFrames) {
            if (spriteRef.current && frameTextures.current[currentFrame.current]) {
              spriteRef.current.material.map = frameTextures.current[currentFrame.current];
              spriteRef.current.material.needsUpdate = true; // Force material update
              currentFrame.current++;
              setTimeout(animateSprite, frameDuration);
            }
          } else {
            if (spriteRef.current) {
              spriteRef.current.visible = false;
            }
          }
        };

        animateSprite();
      }
    }
  }));

  return null;
});

const createParticle = (frames) => {
  const spriteMaterial = new THREE.SpriteMaterial({ 
    map: frames[0],
    transparent: false,  // Disable transparency
    depthTest: true,    // Enable depth testing
    depthWrite: true    // Enable depth writing
  });

  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(1, 1, 1);  // Adjust scale if needed
  return sprite;
};

export default ParticleSystem;