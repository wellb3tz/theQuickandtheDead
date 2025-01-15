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
  const frameDuration = 50; // Duration of each frame in milliseconds

  useEffect(() => {
    const createNebula = async () => {
      const particleMaterial = new THREE.PointsMaterial({
        color: 0xff0000,
        size: 0.5, // Increase the size of the particles
        sizeAttenuation: true,
      });

      const emitter = new Emitter();
      emitter
        .setRate(new Rate(new Span(50, 100), new Span(0.01))) // Increase the quantity of particles
        .addInitializers([
          new Position(new THREE.Vector3(0, 0, 0)),
          new Mass(1),
          new Radius(0.5, 1), // Increase the radius of the particles
          new Life(1, 2),
          new Body(particleMaterial),
          new RadialVelocity(50, new THREE.Vector3(0, 1, 0), 180)
        ])
        .addBehaviours([
          new Color(new THREE.Color(0xff0000), new THREE.Color(0x000000)),
          new Radius(1, 0.5) // Increase the radius of the particles
        ]);

      const nebula = new Nebula();
      nebula.addEmitter(emitter);
      nebula.addRenderer(new SpriteRenderer(scene, THREE));

      nebulaRef.current = nebula;
      emitterRef.current = emitter;

      console.log('Particle system initialized', emitter);
    };

    createNebula();

    const textureLoader = new THREE.TextureLoader();
    const frames = [];

    for (let i = 0; i < totalFrames; i++) {
      frames.push(textureLoader.load(`https://raw.githubusercontent.com/wellb3tz/theQuickandtheDead/main/frontend/media/frame${i}.png`)); // Replace with the actual URL of your frames
    }

    frameTextures.current = frames;

    const spriteMaterial = new THREE.SpriteMaterial({ map: frames[0] });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(2, 2, 1); // Adjust the size of the sprite
    sprite.visible = false; // Initially hide the sprite

    scene.add(sprite);
    spriteRef.current = sprite;

    return () => {
      if (nebulaRef.current) {
        nebulaRef.current.destroy();
      }
      scene.remove(sprite);
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
            spriteRef.current.material.map = frameTextures.current[currentFrame.current];
            currentFrame.current++;
            setTimeout(animateSprite, frameDuration);
          } else {
            spriteRef.current.visible = false;
          }
        };

        animateSprite();
      }
    }
  }));

  return null;
});

export default ParticleSystem;