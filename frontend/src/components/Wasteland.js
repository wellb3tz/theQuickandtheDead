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
      sceneRef.current.updateMatrixWorld(true);
      const mouse = new THREE.Vector2();
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      
      const raycaster = new THREE.Raycaster();
      raycaster.near = 0.1;
      raycaster.far = 1000;
      raycaster.setFromCamera(mouse, cameraRef.current);
      
      const intersects = raycaster.intersectObjects(sceneRef.current.children, true);
      if (intersects.length > 0) {
        const intersect = intersects[0];
        console.log("Hit object:", intersect.object.name, intersect.object.userData);
        
        if (intersect.object.userData.bonePhysics) {
          const { body } = intersect.object.userData.bonePhysics;
          const impulse = new CANNON.Vec3(100, 100, 100); // increased impulse
          body.applyImpulse(impulse, body.position);
          console.log("Applied impulse:", impulse);
          
          // Additional effects:
          const skullSprite = createSkullIcon(intersect.point || body.position);
          sceneRef.current.add(skullSprite);
          skullIconsRef.current.push({ sprite: skullSprite, banditIndex: 0 });
          
          const randomIndex = Math.floor(Math.random() * hitSounds.length);
          const audio = new Audio(hitSounds[randomIndex]);
          audio.play();
          
          applyCameraShake();
        }
      }
    };
    
    window.addEventListener('pointerdown', onMouseClick);

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
      const redMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
      
      // Traverse the model for skinned meshes
      model.traverse((child) => {
        if (child.isSkinnedMesh && child.skeleton) {
          child.skeleton.bones.forEach((bone) => {
            const boneWorldPos = new THREE.Vector3();
            bone.getWorldPosition(boneWorldPos);
      
            // Estimate default bone size based on children distance if any are available.
            let boneSize = 0.1;
            if (bone.children.length > 0) {
              let maxDistance = 0;
              bone.children.forEach((childBone) => {
                const childPos = new THREE.Vector3();
                childBone.getWorldPosition(childPos);
                maxDistance = Math.max(maxDistance, boneWorldPos.distanceTo(childPos));
              });
              boneSize = maxDistance > 0 ? maxDistance : 0.1;
            }

            // Define custom settings for known bones with separate x, y, z multipliers.
            const boneSettings = {
              'Hips':           { mass: 5, xMultiplier: 1.0, yMultiplier: 1.0, zMultiplier: 1.0 },
              'RightUpperLeg':  { mass: 5,  xMultiplier: 0.8, yMultiplier: 0.9, zMultiplier: 0.8 },
              'RightLowerLeg':  { mass: 4,  xMultiplier: 0.7, yMultiplier: 0.8, zMultiplier: 0.7 },
              'RightFoot':      { mass: 2,  xMultiplier: 0.5, yMultiplier: 0.4, zMultiplier: 0.6 },
              'LeftUpperLeg':   { mass: 5,  xMultiplier: 0.8, yMultiplier: 0.9, zMultiplier: 0.8 },
              'LeftLowerLeg':   { mass: 4,  xMultiplier: 0.7, yMultiplier: 0.8, zMultiplier: 0.7 },
              'LeftFoot':       { mass: 2,  xMultiplier: 0.5, yMultiplier: 0.4, zMultiplier: 0.6 },
              'Chest':          { mass: 7,  xMultiplier: 1.0, yMultiplier: 1.0, zMultiplier: 1.0 },
              'Head':           { mass: 3,  xMultiplier: 0.8, yMultiplier: 0.8, zMultiplier: 0.8 },
              'RightUpperArm':  { mass: 2,  xMultiplier: 0.6, yMultiplier: 0.5, zMultiplier: 0.6 },
              'RightElbow':     { mass: 1.5,xMultiplier: 0.5, yMultiplier: 0.4, zMultiplier: 0.5 },
              'RightHand':      { mass: 1,  xMultiplier: 0.4, yMultiplier: 0.3, zMultiplier: 0.4 },
              'LeftUpperArm':   { mass: 2,  xMultiplier: 0.6, yMultiplier: 0.5, zMultiplier: 0.6 },
              'LeftElbow':      { mass: 1.5,xMultiplier: 0.5, yMultiplier: 0.4, zMultiplier: 0.5 },
              'LeftHand':       { mass: 1,  xMultiplier: 1, yMultiplier: 0.3, zMultiplier: 0.4 },
            };

            // Get the settings for the current bone, or use default values.
            const settings = boneSettings[bone.name] || { mass: Math.pow(boneSize, 3), xMultiplier: 1, yMultiplier: 1, zMultiplier: 1 };

            const boxWidth  = boneSize * settings.xMultiplier;
            const boxHeight = boneSize * settings.yMultiplier;
            const boxDepth  = boneSize * settings.zMultiplier;
            const halfExtents = new CANNON.Vec3(boxWidth / 2, boxHeight / 2, boxDepth / 2);
            const boxShape = new CANNON.Box(halfExtents);

            // New: active from the start
            const body = new CANNON.Body({
              mass: settings.mass, // use the intended mass
              position: new CANNON.Vec3(boneWorldPos.x, boneWorldPos.y, boneWorldPos.z),
              shape: boxShape,
            });
            body.angularDamping = 0.8;
            world.addBody(body);

            const boxGeometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
            const debugMesh = new THREE.Mesh(boxGeometry, redMaterial);
            debugMesh.position.copy(boneWorldPos);
            debugMesh.userData.bonePhysics = { body, bone, bandit: model };
            bonePhysicsMap.set(bone.name, { body, debugMesh, bone });
            scene.add(debugMesh);

            bonePhysicsMap.set(bone.name, { body, debugMesh, bone });

            // Inside your bone loop in createRagdollForSkinnedMesh
            const initialMatrix = bone.matrixWorld.clone();
            bone.userData.initialMatrix = initialMatrix;
          });
        }
      });
      
      // Create constraints between parent and child bones (unchanged)
      bonePhysicsMap.forEach((childObj) => {
        const boneParent = childObj.bone.parent;
        if (boneParent && bonePhysicsMap.has(boneParent.name)) {
          const parentObj = bonePhysicsMap.get(boneParent.name);
          const childPos = new THREE.Vector3();
          childObj.bone.getWorldPosition(childPos);
          const parentPos = new THREE.Vector3();
          boneParent.getWorldPosition(parentPos);
      
          const pivotA = new CANNON.Vec3(
            childPos.x - parentPos.x,
            childPos.y - parentPos.y,
            childPos.z - parentPos.z
          );
          const pivotB = new CANNON.Vec3(0, 0, 0);
      
          const constraint = new CANNON.PointToPointConstraint(
            parentObj.body,
            pivotA,
            childObj.body,
            pivotB,
            1e4 // lowered maximum force for more flexibility
          );
          world.addConstraint(constraint);
        }
      });
      
      // Store the entire bonePhysicsMap on the bandit
      model.userData.bonePhysicsMap = bonePhysicsMap;

      return bonePhysicsMap;
    };

    // Add this helper function inside your useEffect (or in the same scope as onMouseClick)
    const unfreezeRagdoll = (bonePhysicsMap) => {
      bonePhysicsMap.forEach((obj) => {
        if (obj.body.frozen) {
          obj.body.mass = obj.body.initialMass; // restore intended mass
          obj.body.updateMassProperties();
          obj.body.frozen = false;
        }
      });
    };

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
            // Update debug mesh regardless for visualization.
            obj.debugMesh.position.copy(obj.body.position);
            obj.debugMesh.quaternion.copy(obj.body.quaternion);
            
            // Only update the bone from physics if it has been unfrozen
            if (!obj.body.frozen) {
              if (obj.bone.parent) {
                obj.bone.parent.updateMatrixWorld();
                const localPos = obj.bone.parent.worldToLocal(
                  new THREE.Vector3(obj.body.position.x, obj.body.position.y, obj.body.position.z)
                );
                obj.bone.position.copy(localPos);
                obj.bone.quaternion.copy(obj.body.quaternion);
              } else {
                obj.bone.position.set(obj.body.position.x, obj.body.position.y, obj.body.position.z);
                obj.bone.quaternion.copy(obj.body.quaternion);
              }
            } else {
              // While frozen, restore the bone's initial transform so the mesh doesn't appear deformed.
              if (obj.bone.userData.initialMatrix) {
                obj.bone.matrix.copy(obj.bone.userData.initialMatrix);
                obj.bone.matrix.decompose(obj.bone.position, obj.bone.quaternion, obj.bone.scale);
              }
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
      window.removeEventListener('pointerdown', onMouseClick);
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