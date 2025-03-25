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
  const skullIconsRef = useRef([]);
  const hitBanditsRef = useRef(new Set());
  const history = useHistory();
  const particleSystemRef = useRef(null);
  const sceneRef = useRef(new THREE.Scene());

  // Create references for physics objects and their wireframes
  const physicsObjectsRef = useRef([]);
  const physicsWireframesRef = useRef([]);
  // Add new ref to track which bandit each physics object belongs to
  const banditPartsRef = useRef({});

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
      
      // Create array to hold mesh data
      const meshes = [];
      
      // First pass: collect all meshes
      bandit.traverse((node) => {
        node.visible = true;
        
        if (node.isMesh) {
          // Store mesh information with absolute world positions
          const worldPosition = new THREE.Vector3();
          const worldQuaternion = new THREE.Quaternion();
          const worldScale = new THREE.Vector3();
          
          // Get the mesh's world transform
          node.updateMatrixWorld(true);
          node.matrixWorld.decompose(worldPosition, worldQuaternion, worldScale);
          
          meshes.push({
            mesh: node,
            name: node.name || `mesh_${meshes.length}`,
            position: worldPosition,
            quaternion: worldQuaternion,
            scale: worldScale
          });
          
          // Fix materials
          if (node.material) {
            const newMaterial = new THREE.MeshStandardMaterial({
              color: node.material.color || 0x333333,
              map: node.material.map,
              normalMap: node.material.normalMap,
              roughness: node.material.roughness || 0.7,
              metalness: node.material.metalness || 0.3,
              transparent: false,
              opacity: 1.0,
              side: THREE.DoubleSide,
              depthTest: true,
              depthWrite: true,
              flatShading: false,
              polygonOffset: true,
              polygonOffsetFactor: 0,
              polygonOffsetUnits: 0
            });
            
            node.material = newMaterial;
            node.material.needsUpdate = true;
          }
          
          // Enable shadows
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });
      
      console.log(`Found ${meshes.length} meshes in the model`);
      
      // Add the model to the scene
      scene.add(bandit);
      banditsRef.current.push(bandit);
      
      // Second pass: create physics objects for each mesh
      meshes.forEach((meshData, meshIndex) => {
        const { mesh, name, position, quaternion, scale } = meshData;
        
        // Skip creating physics for the main bandit_mesh as requested
        if (name.includes('bandit_mesh') || name.includes('Armature')) {
          console.log(`Skipping physics for ${name} as requested`);
          return;
        }
        
        // Get the actual geometry of the mesh
        const geometry = mesh.geometry;
        
        // Declare shape variable at the beginning
        let shape;
        
        // Try to create a more accurate physics shape for the mesh
        if (geometry.attributes && geometry.attributes.position && geometry.index) {
          try {
            // Get vertices from geometry
            const positions = geometry.attributes.position.array;
            const indices = geometry.index.array;
            
            // Create arrays for CANNON.js trimesh
            const vertices = [];
            
            // Extract unique vertices
            for (let i = 0; i < positions.length; i += 3) {
              vertices.push(
                positions[i] * scale.x,
                positions[i + 1] * scale.y,
                positions[i + 2] * scale.z
              );
            }
            
            // Create a trimesh shape (most accurate representation)
            shape = new CANNON.Trimesh(vertices, indices);
            console.log(`Created trimesh physics for ${name} with ${vertices.length/3} vertices`);
            
          } catch (error) {
            console.error(`Error creating trimesh for ${name}:`, error);
            // Fall back to box if trimesh fails
            createBoxShape();
          }
        } else if (geometry.attributes && geometry.attributes.position) {
          // For geometries without indices, we can try to create a convex hull
          try {
            // Use a fitted box based on actual vertices
            const positions = geometry.attributes.position.array;
            const vertices = [];
            
            // Extract vertices
            for (let i = 0; i < positions.length; i += 3) {
              vertices.push(
                new THREE.Vector3(
                  positions[i] * scale.x,
                  positions[i + 1] * scale.y,
                  positions[i + 2] * scale.z
                )
              );
            }
            
            // Calculate bounds
            let minX = Infinity, maxX = -Infinity;
            let minY = Infinity, maxY = -Infinity;
            let minZ = Infinity, maxZ = -Infinity;
            
            for (const vertex of vertices) {
              minX = Math.min(minX, vertex.x);
              maxX = Math.max(maxX, vertex.x);
              minY = Math.min(minY, vertex.y);
              maxY = Math.max(maxY, vertex.y);
              minZ = Math.min(minZ, vertex.z);
              maxZ = Math.max(maxZ, vertex.z);
            }
            
            // Create a box shape precisely fitted to the vertices
            const halfExtents = new CANNON.Vec3(
              (maxX - minX) / 2,
              (maxY - minY) / 2,
              (maxZ - minZ) / 2
            );
            
            shape = new CANNON.Box(halfExtents);
            console.log(`Created fitted box physics for ${name}`);
            
          } catch (error) {
            console.error(`Error creating fitted box for ${name}:`, error);
            createBoxShape();
          }
        } else {
          // Fallback for geometries without position attributes
          createBoxShape();
        }
        
        // Helper function to create a simple box shape
        function createBoxShape() {
          const size = new THREE.Vector3();
          geometry.computeBoundingBox();
          geometry.boundingBox.getSize(size);
          const halfExtents = new CANNON.Vec3(
            (size.x * scale.x) / 2,
            (size.y * scale.y) / 2,
            (size.z * scale.z) / 2
          );
          shape = new CANNON.Box(halfExtents);
          console.log(`Created simple box physics for ${name}`);
        }
        
        // Create physics body at the exact world position of the mesh
        const body = new CANNON.Body({
          mass: 0, // Static body
          position: new CANNON.Vec3(
            position.x, 
            position.y, 
            position.z
          ),
          quaternion: new CANNON.Quaternion(
            quaternion.x, 
            quaternion.y, 
            quaternion.z, 
            quaternion.w
          )
        });
        
        // We don't need to apply extra position offset since we're using world positions directly
        
        // Add the shape to the body
        body.addShape(shape);
        
        // Add physics body to the world
        world.addBody(body);
        
        // Store body with its name and bandit ID
        const physicsIndex = physicsObjectsRef.current.length;
        physicsObjectsRef.current.push({
          name: name,
          body: body,
          mesh: mesh,
          banditId: 0  // All parts belong to the same bandit (ID 0)
        });
        
        // Store which bandit this physics object belongs to
        banditPartsRef.current[physicsIndex] = 0;
        
        // Create a wireframe to visualize the physics body (green)
        let wireframeMesh;
        
        if (shape instanceof CANNON.Trimesh) {
          // For trimesh shapes, create a wireframe from the original geometry
          const wireframeGeometry = new THREE.WireframeGeometry(geometry);
          
          const wireframeMaterial = new THREE.LineBasicMaterial({
            color: 0x00ff00, // Green color
            transparent: true, 
            opacity: 0.7,
            linewidth: 1
          });
          
          wireframeMesh = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
          
          // Apply the same transformations as the original mesh
          wireframeMesh.position.copy(position);
          wireframeMesh.quaternion.copy(quaternion);
          wireframeMesh.scale.copy(scale);
          
        } else if (shape instanceof CANNON.ConvexPolyhedron) {
          // This code path won't be reached anymore, but keeping it for reference
          const wireframeGeometry = new THREE.BufferGeometry();
          const vertices = [];
          
          // Create lines for each edge of the convex hull
          for (let i = 0; i < shape.faces.length; i++) {
            const face = shape.faces[i];
            // For each face, create a loop of edges
            for (let j = 0; j < face.length; j++) {
              const edge = [face[j], face[(j + 1) % face.length]];
              // Add the vertices of the edge
              vertices.push(
                shape.vertices[edge[0]].x,
                shape.vertices[edge[0]].y,
                shape.vertices[edge[0]].z,
                shape.vertices[edge[1]].x,
                shape.vertices[edge[1]].y,
                shape.vertices[edge[1]].z
              );
            }
          }
          
          // Create the wireframe geometry from vertices
          wireframeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
          
          // Create a line segments material and mesh
          const wireframeMaterial = new THREE.LineBasicMaterial({
            color: 0x00ff00, // Green color
            transparent: true,
            opacity: 0.7,
            linewidth: 1
          });
          
          wireframeMesh = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
        } else if (shape instanceof CANNON.Box) {
          // For box shapes, use a standard box wireframe
          const wireframeGeometry = new THREE.BoxGeometry(
            shape.halfExtents.x * 2,
            shape.halfExtents.y * 2,
            shape.halfExtents.z * 2
          );
          
          const wireframeMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00, // Green color
            wireframe: true,
            transparent: true,
            opacity: 0.5
          });
          
          wireframeMesh = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
          
          // Position wireframe exactly where the physics body is
          wireframeMesh.position.copy(position);
          wireframeMesh.quaternion.copy(quaternion);
        } else if (shape instanceof CANNON.Sphere) {
          // For sphere shapes, use a standard sphere wireframe
          const wireframeGeometry = new THREE.SphereGeometry(shape.radius, 16, 16);
          
          const wireframeMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00, // Green color
            wireframe: true,
            transparent: true,
            opacity: 0.5
          });
          
          wireframeMesh = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
          wireframeMesh.position.copy(position);
          wireframeMesh.quaternion.copy(quaternion);
        }
        
        // Store name for reference
        wireframeMesh.userData.name = name;
        wireframeMesh.userData.banditId = 0; // Store bandit ID in wireframe
        
        // Add wireframe to scene
        scene.add(wireframeMesh);
        physicsWireframesRef.current.push(wireframeMesh);
        
        console.log(`Created physics object for ${name}`);
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
      // Set raycaster precision to ensure accurate hit detection
      raycaster.params.Line.threshold = 0.1; // Smaller threshold for more precise line detection
      raycaster.params.Mesh.threshold = 0.01; // More precise mesh detection
      const mouse = new THREE.Vector2();
      
      // Add a visual ray helper to debug hit detection
      const rayDirection = new THREE.Vector3();
      const rayOrigin = new THREE.Vector3();
      const rayLength = 100;
      const rayHelper = new THREE.ArrowHelper(
        rayDirection,
        rayOrigin,
        rayLength,
        0xff0000 // Red color
      );
      scene.add(rayHelper);

      const onMouseClick = (event) => {
        // Update mouse coordinates for raycaster - normalized device coordinates (-1 to +1)
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Set raycaster from camera
        raycaster.setFromCamera(mouse, camera);
        
        // Update ray helper for visualization
        rayOrigin.copy(raycaster.ray.origin);
        rayDirection.copy(raycaster.ray.direction);
        rayHelper.position.copy(rayOrigin);
        rayHelper.setDirection(rayDirection);
        
        // Only check hits on physics wireframes, not on the bandit mesh
        const wireframeIntersects = raycaster.intersectObjects(physicsWireframesRef.current);
        
        // Filter wireframe intersections by distance - only consider hits within a reasonable range
        const validWireframeIntersects = wireframeIntersects.filter(intersect => {
          // Only consider hits within a reasonable distance (adjust 20 as needed)
          return intersect.distance < 20;
        });
        
        // Debug output to console
        if (validWireframeIntersects.length > 0) {
          const hit = validWireframeIntersects[0];
          console.log(`Hit at distance: ${hit.distance.toFixed(2)}, object: ${hit.object.userData.name || 'unnamed'}`);
        }
        
        if (validWireframeIntersects.length > 0) {
          const intersect = validWireframeIntersects[0];
          const intersectionPoint = intersect.point; // Get the exact intersection point
          
          const wireframe = intersect.object;
          const index = physicsWireframesRef.current.indexOf(wireframe);
          
          if (index !== -1) {
            const physicsObj = physicsObjectsRef.current[index];
            const banditId = banditPartsRef.current[index];
            
            // Play random hit sound
            const randomHitSound = hitSounds[Math.floor(Math.random() * hitSounds.length)];
            const hitAudio = new Audio(randomHitSound);
            hitAudio.volume = volume; // Set volume
            hitAudio.play();

            // Only show skull icon and decrease counter if this bandit hasn't been hit before
            if (!hitBanditsRef.current.has(banditId)) {
              // Find the central position of the bandit
              const bandit = banditsRef.current[0];
              const banditPosition = new THREE.Vector3();
              bandit.getWorldPosition(banditPosition);
              
              // Create skull icon at the bandit's position
              const skullIconSprite = createSkullIcon(banditPosition);
              scene.add(skullIconSprite);
              
              // Store with banditId instead of index
              skullIconsRef.current.push({ sprite: skullIconSprite, banditId: banditId });
              
              // Mark this bandit as hit
              hitBanditsRef.current.add(banditId);

              // Update remaining bandits count
              setRemainingBandits((prevCount) => prevCount - 1);
            }

            // Trigger particle system at the exact hit point
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
        // Position skull above the bandit - increased height from 2 to 3
        sprite.position.set(position.x, position.y + 3, position.z);
        // Reduced scale from 0.5 to 0.3
        sprite.scale.set(0.3, 0.3, 0.3);
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
        
        // Update physics wireframes to match physics bodies
        if (physicsObjectsRef.current.length > 0) {
          physicsObjectsRef.current.forEach((physicsObj, index) => {
            const { body, name, mesh } = physicsObj;
            const wireframe = physicsWireframesRef.current[index];
            
            if (wireframe && body) {
              // For trimesh shapes, we don't need to update the position
              // since they're already correctly positioned
              if (body.shapes[0] instanceof CANNON.Trimesh) {
                // For trimesh wireframes, we only need to update if the body moved
                // which shouldn't happen for static bodies, but just in case
                if (body.position.x !== wireframe.position.x ||
                    body.position.y !== wireframe.position.y ||
                    body.position.z !== wireframe.position.z) {
                  wireframe.position.copy(new THREE.Vector3(
                    body.position.x,
                    body.position.y,
                    body.position.z
                  ));
                  
                  wireframe.quaternion.copy(new THREE.Quaternion(
                    body.quaternion.x,
                    body.quaternion.y,
                    body.quaternion.z,
                    body.quaternion.w
                  ));
                }
              } else {
                // For box and sphere wireframes, always update
                wireframe.position.copy(new THREE.Vector3(
                  body.position.x,
                  body.position.y,
                  body.position.z
                ));
                
                wireframe.quaternion.copy(new THREE.Quaternion(
                  body.quaternion.x,
                  body.quaternion.y,
                  body.quaternion.z,
                  body.quaternion.w
                ));
              }
            }
          });
        }
        
        // Update skull icon positions - now using banditId reference
        skullIconsRef.current.forEach(({ sprite, banditId }) => {
          // Find the bandit this skull belongs to
          const bandit = banditsRef.current[banditId];
          if (bandit) {
            // Get world position of bandit
            const banditPosition = new THREE.Vector3();
            bandit.getWorldPosition(banditPosition);
            // Update skull position to follow bandit - increased height from 2 to 3
            sprite.position.set(banditPosition.x, banditPosition.y + 3, banditPosition.z);
          }
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
    },
    (progress) => {
      console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
    },
    (error) => {
      console.error('Error loading model:', error);
    });
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