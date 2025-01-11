import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as CANNON from 'cannon';
import '../styles/western-theme.css';

const Wasteland = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Enable damping (inertia)
    controls.dampingFactor = 0.25; // Damping factor
    controls.screenSpacePanning = false; // Disable panning
    controls.enableZoom = true; // Enable zooming
    controls.enablePan = true; // Enable panning

    const world = new CANNON.World();
    world.gravity.set(0, -9.82, 0); // Set gravity

    const groundBody = new CANNON.Body({
      mass: 0, // Mass of 0 makes the body static
      shape: new CANNON.Plane(),
    });
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    world.addBody(groundBody);

    // Load floor texture
    const textureLoader = new THREE.TextureLoader();
    const floorTexture = textureLoader.load('https://github.com/wellb3tz/theQuickandtheDead/blob/6c8af1b2d8c37bc7d98bfa6fbc6978e756932a73/frontend/media/soil4k.png');
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(10, 10);

    const floorMaterial = new THREE.MeshBasicMaterial({ map: floorTexture });
    const floorGeometry = new THREE.PlaneGeometry(100, 100);
    const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
    floorMesh.rotation.x = -Math.PI / 2;
    scene.add(floorMesh);

    const loader = new GLTFLoader();
    const bandits = [];
    const banditBodies = [];

    // Load bandit model
    loader.load('https://github.com/wellb3tz/theQuickandtheDead/blob/6c8af1b2d8c37bc7d98bfa6fbc6978e756932a73/frontend/media/bandit1.glb', (gltf) => {
      for (let i = 0; i < 5; i++) {
        const bandit = gltf.scene.clone();
        bandit.position.set(Math.random() * 10 - 5, 0, Math.random() * 10 - 5);
        scene.add(bandit);
        bandits.push(bandit);

        const banditBody = new CANNON.Body({
          mass: 1, // Mass of 1 makes the body dynamic
          shape: new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5)),
          position: new CANNON.Vec3(bandit.position.x, bandit.position.y, bandit.position.z),
        });
        world.addBody(banditBody);
        banditBodies.push(banditBody);
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
        const index = bandits.indexOf(bandit);
        if (index !== -1) {
          const banditBody = banditBodies[index];
          banditBody.applyImpulse(new CANNON.Vec3(0, 5, 0), banditBody.position);
        }
      }
    };

    window.addEventListener('click', onMouseClick);

    const animate = () => {
      requestAnimationFrame(animate);

      world.step(1 / 60);

      bandits.forEach((bandit, index) => {
        const banditBody = banditBodies[index];
        bandit.position.copy(banditBody.position);
        bandit.quaternion.copy(banditBody.quaternion);
      });

      // Prevent camera from going underground
      if (camera.position.y < 1) {
        camera.position.y = 1;
      }

      controls.update(); // Update controls
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('click', onMouseClick);
      mountRef.current.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="wasteland-container"></div>;
};

export default Wasteland;