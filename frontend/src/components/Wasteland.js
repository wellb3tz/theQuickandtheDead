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
  const [remainingBandits, setRemainingBandits] = useState(1); // Changed from 5
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

    // Load bandit model
    loader.load('https://raw.githubusercontent.com/wellb3tz/theQuickandtheDead/main/frontend/media/50backup.glb', (gltf) => {
      for (let i = 0; i < 1; i++) { // Single bandit
        const bandit = gltf.scene.clone();

        // Initialize ragdoll physics for the band's skeleton
        const bonePhysicsMap = createRagdollForSkinnedMesh(bandit, world, scene);
        bandit.userData.bonePhysicsMap = bonePhysicsMap;
        if(bonePhysicsMap.size === 0) {
          console.warn('No skinned mesh found in the model!');
        }

        // Use the first bone as the main physics body for positioning the bandit
        const skinnedMesh = bandit.getObjectByProperty('type', 'SkinnedMesh');
        if (skinnedMesh && skinnedMesh.skeleton && skinnedMesh.skeleton.bones.length > 0) {
          const rootBone = skinnedMesh.skeleton.bones[0];
          if (bonePhysicsMap.has(rootBone.name)) {
            banditBodiesRef.current.push(bonePhysicsMap.get(rootBone.name).body);
          }
        }

        bandit.position.set(Math.random() * 10 - 5, 0, Math.random() * 10 - 5);
        bandit.traverse((node) => {
          if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
            node.material.shadowSide = THREE.FrontSide;
          }
        });
        scene.add(bandit);
        banditsRef.current.push(bandit);
        
        // ...any additional bandit hitbox or physics code...
      }
    });

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
      const spriteMaterial = new THREE.SpriteMaterial({ 
        map: spriteMap,
        transparent: true,
        alphaTest: 0.5,
        depthTest: true,
        depthWrite: false,
        blending: THREE.NormalBlending
      });
      const sprite = new THREE.Sprite(spriteMaterial);
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

    const debugSkeletonBones = (object) => {
      object.traverse((child) => {
          if (child.isSkinnedMesh) {
              console.log(`Skeleton bones for ${child.name}:`);
              child.skeleton.bones.forEach((bone) => {
                  console.log(`Bone: ${bone.name}, Position: ${bone.position}`);
              });
          }
      });
    };

    const createRagdollForSkinnedMesh = (model, world, scene) => {
      const bonePhysicsMap = new Map();
      const redMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    
      // Traverse the model to search for skinned meshes and process their skeletons
      model.traverse((child) => {
        if (child.isSkinnedMesh && child.skeleton) {
          child.skeleton.bones.forEach((bone) => {
            // Retrieve the bone's world position
            const boneWorldPos = new THREE.Vector3();
            bone.getWorldPosition(boneWorldPos);
    
            // Estimate bone size using distance to its children
            let boneSize = 0.1; // default size
            if (bone.children.length > 0) {
              let maxDistance = 0;
              bone.children.forEach((childBone) => {
                const childPos = new THREE.Vector3();
                childBone.getWorldPosition(childPos);
                maxDistance = Math.max(maxDistance, boneWorldPos.distanceTo(childPos));
              });
              boneSize = maxDistance > 0 ? maxDistance : 0.1;
            }
    
            // Define box dimensions based on estimated bone size
            const boxWidth = boneSize;
            const boxHeight = boneSize;
            const boxDepth = boneSize;
            const halfExtents = new CANNON.Vec3(boxWidth / 2, boxHeight / 2, boxDepth / 2);
            const boxShape = new CANNON.Box(halfExtents);
    
            // Set mass proportional to the volume (tunable)
            const mass = Math.pow(boneSize, 3);
    
            const body = new CANNON.Body({
              mass: mass,
              position: new CANNON.Vec3(boneWorldPos.x, boneWorldPos.y, boneWorldPos.z),
              shape: boxShape,
            });
            world.addBody(body);
    
            // Create a visible debug box with calculated dimensions
            const boxGeometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
            const debugMesh = new THREE.Mesh(boxGeometry, redMaterial);
            debugMesh.position.copy(boneWorldPos);
            scene.add(debugMesh);
    
            bonePhysicsMap.set(bone.name, { body, debugMesh, bone });
          });
        }
      });
    
      // Create basic constraints between parent and child bones
      bonePhysicsMap.forEach((childObj) => {
        const boneParent = childObj.bone.parent;
        if (boneParent && bonePhysicsMap.has(boneParent.name)) {
          const parentObj = bonePhysicsMap.get(boneParent.name);
          const childPos = new THREE.Vector3();
          childObj.bone.getWorldPosition(childPos);
          const parentPos = new THREE.Vector3();
          boneParent.getWorldPosition(parentPos);
    
          // Calculate pivot points; adjust these offsets for fine-tuning if needed
          const pivotA = new CANNON.Vec3(
            childPos.x - parentPos.x,
            childPos.y - parentPos.y,
            childPos.z - parentPos.z
          );
          const pivotB = new CANNON.Vec3(0, 0, 0); // Child's local center
    
          const constraint = new CANNON.PointToPointConstraint(
            parentObj.body,
            pivotA,
            childObj.body,
            pivotB
          );
          world.addConstraint(constraint);
        }
      });
    
      return bonePhysicsMap;
    };

    window.addEventListener('click', onMouseClick);

    const animate = () => {
      requestAnimationFrame(animate);
      world.step(1 / 60);
    
      // Update bandit overall transform from main physics body
      banditsRef.current.forEach((bandit, index) => {
        const banditBody = banditBodiesRef.current[index];
        if (banditBody) {
          bandit.position.copy(banditBody.position);
          bandit.quaternion.copy(banditBody.quaternion);
        }
    
        // Update hitbox if available (existing code)
        const hitbox = hitboxesRef.current[index];
        if (hitbox) {
          hitbox.position.copy(bandit.position);
          hitbox.quaternion.copy(bandit.quaternion);
        }
    
        // Update each bone using its physics object
        const bonePhysicsMap = bandit.userData.bonePhysicsMap;
        if (bonePhysicsMap) {
          bonePhysicsMap.forEach((obj) => {
            // Update debug box transform
            obj.debugMesh.position.set(obj.body.position.x, obj.body.position.y, obj.body.position.z);
            obj.debugMesh.quaternion.set(
              obj.body.quaternion.x,
              obj.body.quaternion.y,
              obj.body.quaternion.z,
              obj.body.quaternion.w
            );
            // Update bone local position: convert physics world pos to parent's local position
            if (obj.bone.parent) {
              // Update parent's world matrix before converting
              obj.bone.parent.updateMatrixWorld();
              const localPos = obj.bone.parent.worldToLocal(
                new THREE.Vector3(obj.body.position.x, obj.body.position.y, obj.body.position.z)
              );
              obj.bone.position.copy(localPos);
              // Copy the quaternion directly – you might need to adjust this further for a natural rotation
              obj.bone.quaternion.copy(obj.body.quaternion);
            } else {
              obj.bone.position.set(obj.body.position.x, obj.body.position.y, obj.body.position.z);
              obj.bone.quaternion.copy(obj.body.quaternion);
            }
          });
        }
      });
    
      // Update skull icon positions (existing code)
      skullIconsRef.current.forEach(({ sprite, banditIndex }) => {
        const banditBody = banditBodiesRef.current[banditIndex];
        sprite.position.set(banditBody.position.x, banditBody.position.y + 2, banditBody.position.z);
      });
    
      if (camera.position.y < 1) {
        camera.position.y = 1;
      }
    
      controls.update();
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