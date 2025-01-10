import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import BackButton from './BackButton';
import '../styles/western-theme.css';

const Wasteland = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    const loader = new GLTFLoader();
    const bandits = [];

    // Load bandit model
    loader.load('/path/to/bandit/model.glb', (gltf) => {
      for (let i = 0; i < 5; i++) {
        const bandit = gltf.scene.clone();
        bandit.position.set(Math.random() * 10 - 5, 0, Math.random() * 10 - 5);
        scene.add(bandit);
        bandits.push(bandit);
      }
    });

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 5, 5).normalize();
    scene.add(light);

    camera.position.z = 5;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseClick = (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(bandits);

      if (intersects.length > 0) {
        const bandit = intersects[0].object;
        scene.remove(bandit);
      }
    };

    window.addEventListener('click', onMouseClick);

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('click', onMouseClick);
      mountRef.current.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="container">
      <BackButton />
      <h2>It all can end here.</h2>
      <div ref={mountRef} className="wasteland-container"></div>
    </div>
  );
};

export default Wasteland;