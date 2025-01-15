import React, { useEffect, useRef } from 'react';
import Nebula from 'three-nebula';
import { SpriteRenderer, Emitter, Rate, Span, Position, Mass, Radius, Life, Body, RadialVelocity, Color } from 'three-nebula';
import * as THREE from 'three';

const ParticleSystem = ({ scene }) => {
  const nebulaRef = useRef(null);

  useEffect(() => {
    const createNebula = async () => {
      const particleTexture = new THREE.TextureLoader().load('https://raw.githubusercontent.com/wellb3tz/theQuickandtheDead/main/frontend/media/particle.png');
      const particleMaterial = new THREE.SpriteMaterial({ map: particleTexture });

      const emitter = new Emitter();
      emitter
        .setRate(new Rate(new Span(10, 20), new Span(0.01)))
        .addInitializers([
          new Position(new THREE.Vector3(0, 0, 0)),
          new Mass(1),
          new Radius(0.1, 0.5),
          new Life(1, 2),
          new Body(particleMaterial),
          new RadialVelocity(50, new THREE.Vector3(0, 1, 0), 180)
        ])
        .addBehaviours([
          new Color(new THREE.Color(0xff0000), new THREE.Color(0x000000)),
          new Radius(0.5, 0.1)
        ]);

      const nebula = new Nebula();
      nebula.addEmitter(emitter);
      nebula.addRenderer(new SpriteRenderer(scene, THREE));

      nebulaRef.current = nebula;
    };

    createNebula();

    return () => {
      if (nebulaRef.current) {
        nebulaRef.current.destroy();
      }
    };
  }, [scene]);

  return null;
};

export default ParticleSystem;