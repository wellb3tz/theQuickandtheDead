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
  const [remainingBandits, setRemainingBandits] = useState(1);
  const banditsRef = useRef([]);
  const banditBodiesRef = useRef([]);
  const hitboxesRef = useRef([]);
  const skullIconsRef = useRef([]);
  const hitBanditsRef = useRef(new Set());
  const history = useHistory();
  const particleSystemRef = useRef(null);
  const sceneRef = useRef(new THREE.Scene());

  useEffect(() => {
    const scene = sceneRef.current; // Use the scene variable
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    cameraRef.current = camera;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true; // Enable shadow maps
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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
    const floorTexture = textureLoader.load('https://raw.githubusercontent.com/wellb3tz/theQuickandtheDead/main/frontend/media/soil3.png');
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(1, 1); // Single texture

    // Create a larger transparent mesh
    const extendedFloorGeometry = new THREE.PlaneGeometry(100, 100, 32, 32);
    const extendedFloorMaterial = new THREE.ShaderMaterial({
      uniforms: {
        center: { value: new THREE.Vector2(0, 0) },
        radius: { value: 50.0 },
        floorTexture: { value: floorTexture }
      },
      vertexShader: `
        varying vec2 vUv;
        varying float vDistance;

        void main() {
          vUv = uv; // Simple UV mapping without scaling
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vDistance = length(worldPosition.xz);
          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
      fragmentShader: `
        uniform float radius;
        uniform sampler2D floorTexture;
        varying vec2 vUv;
        varying float vDistance;

        void main() {
          vec4 color = texture2D(floorTexture, vUv);
          float alpha = 1.0 - smoothstep(radius * 0.5, radius, vDistance);
          gl_FragColor = vec4(color.rgb, color.a * alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    });
    const extendedFloorMesh = new THREE.Mesh(extendedFloorGeometry, extendedFloorMaterial);
    extendedFloorMesh.rotation.x = -Math.PI / 2;
    extendedFloorMesh.receiveShadow = true; // Enable shadows for the extended floor
    scene.add(extendedFloorMesh);

    // Load skybox
    const skyboxTexture = textureLoader.load('https://raw.githubusercontent.com/wellb3tz/theQuickandtheDead/main/frontend/media/skybox_desert1.png', () => {
      const rt = new THREE.WebGLCubeRenderTarget(skyboxTexture.image.height);
      rt.fromEquirectangularTexture(renderer, skyboxTexture);
      scene.background = rt.texture;
    });

    const loader = new GLTFLoader();

    // Load bandit model with proper rotation and scale
    loader.load('https://raw.githubusercontent.com/wellb3tz/theQuickandtheDead/alternative/frontend/media/40backup.glb', (gltf) => {
      console.log('Loading model with corrected orientation:', gltf.scene);
      
      // Clone the scene for our single bandit
      const bandit = gltf.scene.clone();
      
      // Fix position, scale and rotation
      bandit.position.set(0, 0, 0); // At ground level
      bandit.scale.set(1, 1, 1); // Reset to normal scale
      bandit.rotation.set(0, 0, 0); // Reset rotation
      
      // Ensure all parts are visible and fix transparency issues
      bandit.traverse((node) => {
        node.visible = true;
        
        // Fix see-through mesh materials
        if (node.isMesh && node.material) {
          // Create new material to fix transparency issues
          const newMaterial = new THREE.MeshStandardMaterial({
            color: node.material.color || 0x333333,
            map: node.material.map,
            normalMap: node.material.normalMap,
            roughness: node.material.roughness || 0.7,
            metalness: node.material.metalness || 0.3,
            transparent: false,
            opacity: 1.0,
            side: THREE.DoubleSide, // Render both sides to fix surface issues
            depthTest: true,
            depthWrite: true,
            flatShading: false, // Use smooth shading
            polygonOffset: true,
            polygonOffsetFactor: 0,
            polygonOffsetUnits: 0
          });
          
          // Apply the material
          node.material = newMaterial;
          node.material.needsUpdate = true;
          
          // Fix normals if they're causing issues
          if (node.geometry) {
            node.geometry.computeVertexNormals();
            node.geometry.computeBoundingSphere();
            node.geometry.computeBoundingBox();
            node.geometry.attributes.position.needsUpdate = true;
            if (node.geometry.attributes.normal) {
              node.geometry.attributes.normal.needsUpdate = true;
            }
          }
          
          // Enable shadows
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });
      
      // Add to scene
      scene.add(bandit);
      banditsRef.current.push(bandit);
      
      // Create physics body and hitbox
      const banditBody = new CANNON.Body({
        mass: 0,
        shape: new CANNON.Box(new CANNON.Vec3(0.5, 1, 0.5)),
        position: new CANNON.Vec3(bandit.position.x, bandit.position.y, bandit.position.z),
      });
      world.addBody(banditBody);
      banditBodiesRef.current.push(banditBody);
      
      // Create visible hitbox for collision detection
      const hitboxGeometry = new THREE.BoxGeometry(1, 2, 1);
      const hitboxMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        wireframe: true,
        visible: true // Make hitbox visible
      });
      const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
      
      // Raise hitbox position to match the visual position of the bandit
      hitbox.position.set(bandit.position.x, bandit.position.y + 1, bandit.position.z);
      
      scene.add(hitbox);
      hitboxesRef.current.push(hitbox);
      
      // Also update the physics body position to match the hitbox
      banditBody.position.set(bandit.position.x, bandit.position.y + 1, bandit.position.z);
    },
    (progress) => {
      console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
    },
    (error) => {
      console.error('Error loading model:', error);
    });
    
    // Helper function to log hierarchy
    function logHierarchy(object, indent = '') {
      console.log(indent + '└─ ' + object.name + ' [' + object.type + ']');
      object.children.forEach(child => {
        logHierarchy(child, indent + '  ');
      });
    }

    // Add sunlight
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(10, 10, 10);
    light.castShadow = true; // Enable shadows for the light
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 500;
    light.shadow.camera.left = -50;
    light.shadow.camera.right = 50;
    light.shadow.camera.top = 50;
    light.shadow.camera.bottom = -50;
    scene.add(light);

    // Add helpers for debugging
    const lightHelper = new THREE.DirectionalLightHelper(light);
    scene.add(lightHelper);

    const shadowCameraHelper = new THREE.CameraHelper(light.shadow.camera);
    scene.add(shadowCameraHelper);

    // Position camera to better view the scene
    camera.position.set(3, 3, 5);
    controls.target.set(0, 0, 0);
    controls.update();

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
          // Remove force application (no ragdolling)
          // const banditBody = banditBodiesRef.current[index];
          // const force = new CANNON.Vec3(mouse.x * 10, 5, mouse.y * 10);
          // banditBody.applyImpulse(force, banditBody.position);

          // Play random hit sound
          const randomHitSound = hitSounds[Math.floor(Math.random() * hitSounds.length)];
          const hitAudio = new Audio(randomHitSound);
          hitAudio.volume = volume; // Set volume
          hitAudio.play();

          // Display skull icon above the bandit if it's the first hit
          if (!hitBanditsRef.current.has(index)) {
            const banditBody = banditBodiesRef.current[index];
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
      const spriteMaterial = new THREE.SpriteMaterial({ 
        map: spriteMap,
        transparent: true,
        alphaTest: 0.5,
        depthTest: true,
        depthWrite: false,
        blending: THREE.NormalBlending
      });
      const sprite = new THREE.Sprite(spriteMaterial);
      // Position skull above the bandit
      sprite.position.set(position.x, position.y + 2, position.z);
      sprite.scale.set(0.5, 0.5, 0.5);
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