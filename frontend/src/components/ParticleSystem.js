import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import Nebula from 'three-nebula';
import { SpriteRenderer, Emitter, Rate, Span, Position, Mass, Radius, Life, Body, RadialVelocity, Color } from 'three-nebula';
import * as THREE from 'three';

const ParticleSystem = forwardRef(({ scene }, ref) => {
  const nebulaRef = useRef(null);
  const emitterRef = useRef(null);

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
    }
  }));

  return null;
});

export default ParticleSystem;