import React, { useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as CANNON from 'cannon';
import '../styles/western-theme.css';
import hitSound1 from '../sounds/hit1.mp3';
import hitSound2 from '../sounds/hit2.mp3';
import hitSound3 from '../sounds/hit3.mp3';
import hitSound4 from '../sounds/hit4.mp3';
import hitSound5 from '../sounds/hit5.mp3';
import hitSound6 from '../sounds/hit6.mp3';
import hitSound7 from '../sounds/hit7.mp3';
import hitSound8 from '../sounds/hit8.mp3';
import hitSound9 from '../sounds/hit9.mp3';
import hitSound10 from '../sounds/hit10.mp3';
import hitSound11 from '../sounds/hit11.mp3';
import hitSound12 from '../sounds/hit12.mp3';
import skullIcon from '../images/skull.png'; // Import the skull icon image
import ParticleSystem from './ParticleSystem'; // Import the ParticleSystem component

const hitSounds = [
  hitSound1, hitSound2, hitSound3, hitSound4, hitSound5, hitSound6,
  hitSound7, hitSound8, hitSound9, hitSound10, hitSound11, hitSound12
];

const Wasteland = ({ volume }) => {
  const mountRef = useRef(null);
  const cameraRef = useRef(null);
  const [remainingBandits, setRemainingBandits] = useState(5);
  const banditsRef = useRef([]);
  const banditBodiesRef = useRef([]);
  const hitboxesRef = useRef([]);
  const skullIconsRef = useRef([]);
  const hitBanditsRef = useRef(new Set());
  const history = useHistory();
  const particleSystemRef = useRef(null);
  const sceneRef = useRef(new THREE.Scene()); // Define the scene variable

  useEffect(() => {
    const scene = sceneRef.current; // Use the scene variable
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    cameraRef.current = camera;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true; // Enable shadow maps
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Enable damping (inertia)
    controls.dampingFactor = 0.25; // Damping factor
    controls.screenSpacePanning = false; // Disable panning
    controls.enableZoom = true; // Enable zooming
    controls.enablePan = true; // Enable panning

    const world = new CANNON.World();
    world.gravity.set(0, -25, 0); // Set gravity

    const groundBody = new CANNON.Body({
      mass: 0, // Mass of 0 makes the body static
      shape: new CANNON.Plane(),
    });
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    world.addBody(groundBody);

    // Load floor texture
    const textureLoader = new THREE.TextureLoader();
    const floorTexture = textureLoader.load('https://raw.githubusercontent.com/wellb3tz/theQuickandtheDead/main/frontend/media/soil2.png');
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(1, 1); // Use the texture without scaling

    const floorMaterial = new THREE.MeshBasicMaterial({ map: floorTexture });
    const floorGeometry = new THREE.PlaneGeometry(10, 10); // Smaller floor area
    const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true; // Enable shadows for the floor
    scene.add(floorMesh);

    // Load skybox
    const skyboxTexture = textureLoader.load('https://raw.githubusercontent.com/wellb3tz/theQuickandtheDead/main/frontend/media/skybox_desert1.png', () => {
      const rt = new THREE.WebGLCubeRenderTarget(skyboxTexture.image.height);
      rt.fromEquirectangularTexture(renderer, skyboxTexture);
      scene.background = rt.texture;
    });

    const loader = new GLTFLoader();

    // Load bandit model
    loader.load('https://raw.githubusercontent.com/wellb3tz/theQuickandtheDead/main/frontend/media/bandit1.glb', (gltf) => {
      for (let i = 0; i < 5; i++) {
        const bandit = gltf.scene.clone();
        bandit.position.set(Math.random() * 10 - 5, 0, Math.random() * 10 - 5);
        bandit.traverse((node) => {
          if (node.isMesh) {
            node.castShadow = true; // Enable shadows for the bandit model
          }
        });
        scene.add(bandit);
        banditsRef.current.push(bandit);

        const banditBody = new CANNON.Body({
          mass: 1, // Mass of 1 makes the body dynamic
          shape: new CANNON.Box(new CANNON.Vec3(0.5, 1, 0.5)), // Adjust the shape to match the bandit model
          position: new CANNON.Vec3(bandit.position.x, bandit.position.y + 1, bandit.position.z), // Ensure the bandit stands on the ground
        });
        world.addBody(banditBody);
        banditBodiesRef.current.push(banditBody);

        // Create hitbox
        const hitboxGeometry = new THREE.BoxGeometry(1, 2, 1); // Adjust the size to match the bandit model
        const hitboxMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true, visible: false }); // Invisible hitbox
        const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
        hitbox.position.copy(bandit.position);
        scene.add(hitbox);
        hitboxesRef.current.push(hitbox);
      }
    });

    // Add sunlight
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 10, 5);
    light.castShadow = true; // Enable shadows for the light
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 50;
    scene.add(light);

    // Add walls to create a narrow passage
    const wallTexture = textureLoader.load('https://raw.githubusercontent.com/wellb3tz/theQuickandtheDead/main/frontend/media/rocky_wall.jpg'); // Replace with the actual URL of your rocky wall texture
    wallTexture.wrapS = THREE.RepeatWrapping;
    wallTexture.wrapT = THREE.RepeatWrapping;
    wallTexture.repeat.set(1, 1);

    const wallMaterial = new THREE.MeshBasicMaterial({ map: wallTexture });
    const wallHeight = 10;
    const wallThickness = 0.5;

    const wallGeometry = new THREE.PlaneGeometry(10, wallHeight);

    const wall1 = new THREE.Mesh(wallGeometry, wallMaterial);
    wall1.position.set(0, wallHeight / 2, -5);
    wall1.rotation.y = Math.PI;
    scene.add(wall1);

    const wall2 = new THREE.Mesh(wallGeometry, wallMaterial);
    wall2.position.set(0, wallHeight / 2, 5);
    scene.add(wall2);

    const wall3 = new THREE.Mesh(wallGeometry, wallMaterial);
    wall3.position.set(-5, wallHeight / 2, 0);
    wall3.rotation.y = Math.PI / 2;
    scene.add(wall3);

    const wall4 = new THREE.Mesh(wallGeometry, wallMaterial);
    wall4.position.set(5, wallHeight / 2, 0);
    wall4.rotation.y = -Math.PI / 2;
    scene.add(wall4);

    camera.position.z = 5;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseClick = (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(hitboxesRef.current);

      if (intersects.length > 0) {
        const hitbox = intersects[0].object;
        const intersectionPoint = intersects[0].point; // Get the exact intersection point
        const index = hitboxesRef.current.indexOf(hitbox);
        if (index !== -1) {
          const banditBody = banditBodiesRef.current[index];
          const force = new CANNON.Vec3(mouse.x * 10, 5, mouse.y * 10); // Apply force based on mouse position
          banditBody.applyImpulse(force, banditBody.position);

          // Play random hit sound
          const randomHitSound = hitSounds[Math.floor(Math.random() * hitSounds.length)];
          const hitAudio = new Audio(randomHitSound);
          hitAudio.volume = volume; // Set volume
          hitAudio.play();

          // Display skull icon above the bandit if it's the first hit
          if (!hitBanditsRef.current.has(index)) {
            const skullIconSprite = createSkullIcon(banditBody.position);
            scene.add(skullIconSprite);
            skullIconsRef.current.push({ sprite: skullIconSprite, banditIndex: index });
            hitBanditsRef.current.add(index);

            // Update remaining bandits count
            setRemainingBandits((prevCount) => prevCount - 1);
          }

          // Trigger particle system
          if (particleSystemRef.current) {
            console.log('Triggering particle system at position', intersectionPoint);
            particleSystemRef.current.triggerParticles(intersectionPoint);
          }
        }
      }
    };

    const createSkullIcon = (position) => {
      const spriteMap = new THREE.TextureLoader().load(skullIcon);
      const spriteMaterial = new THREE.SpriteMaterial({ map: spriteMap });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.position.set(position.x, position.y + 2, position.z); // Position above the bandit
      sprite.scale.set(0.5, 0.5, 0.5); // Adjust the size of the skull icon
      return sprite;
    };

    const applyCameraShake = () => {
      const shakeIntensity = 0.1;
      const shakeDuration = 100; // in milliseconds

      const originalPosition = camera.position.clone();
      const shake = () => {
        camera.position.x = originalPosition.x + (Math.random() - 0.5) * shakeIntensity;
        camera.position.y = originalPosition.y + (Math.random() - 0.5) * shakeIntensity;
        camera.position.z = originalPosition.z + (Math.random() - 0.5) * shakeIntensity;
      };

      const resetCameraPosition = () => {
        camera.position.copy(originalPosition);
      };

      shake();
      setTimeout(resetCameraPosition, shakeDuration);
    };

    window.addEventListener('click', onMouseClick);

    const animate = () => {
      requestAnimationFrame(animate);

      world.step(1 / 60);

      banditsRef.current.forEach((bandit, index) => {
        const banditBody = banditBodiesRef.current[index];
        bandit.position.copy(banditBody.position);
        bandit.quaternion.copy(banditBody.quaternion);

        const hitbox = hitboxesRef.current[index];
        hitbox.position.copy(bandit.position);
        hitbox.quaternion.copy(bandit.quaternion);
      });

      // Update skull icon positions
      skullIconsRef.current.forEach(({ sprite, banditIndex }) => {
        const banditBody = banditBodiesRef.current[banditIndex];
        sprite.position.set(banditBody.position.x, banditBody.position.y + 2, banditBody.position.z);
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
  }, [volume]);

  const handleLeaveArea = () => {
    history.push('/looting');
  };

  return (
    <div ref={mountRef} className="wasteland-container">
      <ParticleSystem ref={particleSystemRef} scene={sceneRef.current} />
      {remainingBandits === 0 && (
        <button onClick={handleLeaveArea} className="leave-area-button">
          Leave area
        </button>
      )}
    </div>
  );
};

export default Wasteland;