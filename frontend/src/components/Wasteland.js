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
  // Move ragdollActive ref to component level
  const ragdollActive = useRef(false);

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
    world.gravity.set(0, -50, 0); // Increase gravity for more dramatic falls
    world.broadphase = new CANNON.NaiveBroadphase(); // Set broadphase
    world.solver.iterations = 10; // More iterations for better stability
    world.defaultContactMaterial.contactEquationStiffness = 1e6;
    world.defaultContactMaterial.contactEquationRelaxation = 3;

    const groundBody = new CANNON.Body({
      mass: 0, // Mass of 0 makes the body static
      shape: new CANNON.Plane(),
      collisionFilterGroup: 1,
      collisionFilterMask: 1
    });
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    world.addBody(groundBody);
    
    // Add collision detection and response
    world.addEventListener('beginContact', function(event) {
      console.log('Collision detected', event);
      // Optional: Add impact sounds or visual effects here
    });

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
      
      // Debug function to log mesh and physics object positions
      const logPositions = (meshName) => {
        let meshPos, bodyPos;
        
        // Find the mesh in the bandit model
        bandit.traverse(node => {
          if (node.isMesh && node.name === meshName) {
            const worldPos = new THREE.Vector3();
            node.getWorldPosition(worldPos);
            meshPos = worldPos;
          }
        });
        
        // Find corresponding physics body
        physicsObjectsRef.current.forEach(obj => {
          if (obj.name === meshName) {
            bodyPos = new THREE.Vector3(
              obj.body.position.x,
              obj.body.position.y,
              obj.body.position.z
            );
          }
        });
        
        if (meshPos && bodyPos) {
          console.log(`${meshName} positions - Mesh: (${meshPos.x.toFixed(3)}, ${meshPos.y.toFixed(3)}, ${meshPos.z.toFixed(3)}) | Physics: (${bodyPos.x.toFixed(3)}, ${bodyPos.y.toFixed(3)}, ${bodyPos.z.toFixed(3)})`);
          console.log(`Distance between mesh and physics: ${meshPos.distanceTo(bodyPos).toFixed(3)}`);
        }
      };
      
      // Add a helper function to establish joint constraints between physics bodies
      const createJoint = (bodyA, bodyB, pivotA, pivotB, axisA, axisB, maxAngle) => {
        // Create a constraint between two bodies
        const constraint = new CANNON.ConeTwistConstraint(bodyA, bodyB, {
          pivotA: pivotA ? new CANNON.Vec3(pivotA.x, pivotA.y, pivotA.z) : new CANNON.Vec3(0, 0, 0),
          pivotB: pivotB ? new CANNON.Vec3(pivotB.x, pivotB.y, pivotB.z) : new CANNON.Vec3(0, 0, 0),
          axisA: axisA ? new CANNON.Vec3(axisA.x, axisA.y, axisA.z) : new CANNON.Vec3(1, 0, 0),
          axisB: axisB ? new CANNON.Vec3(axisB.x, axisB.y, axisB.z) : new CANNON.Vec3(1, 0, 0),
          angle: maxAngle || Math.PI / 8,
          twistAngle: Math.PI / 4,
          maxForce: 50 // Limit the maximum force to prevent joint explosion
        });
        
        // These make constraints more stable
        constraint.collideConnected = false;
        
        world.addConstraint(constraint);
        console.log("Created joint constraint:", constraint);
        return constraint;
      };
      
      // Create a map to store physics bodies by name for joint creation
      const physicsBodyMap = {};
      const jointConstraints = [];

      // Add a helper function to check for physics bodies that are in the same position
      const findOverlappingBodies = () => {
        const overlaps = [];
        
        // For each body, check if any other bodies are at the same position
        for (let i = 0; i < physicsObjectsRef.current.length; i++) {
          const bodyA = physicsObjectsRef.current[i].body;
          
          for (let j = i + 1; j < physicsObjectsRef.current.length; j++) {
            const bodyB = physicsObjectsRef.current[j].body;
            
            // Calculate distance between bodies
            const distance = Math.sqrt(
              Math.pow(bodyA.position.x - bodyB.position.x, 2) +
              Math.pow(bodyA.position.y - bodyB.position.y, 2) +
              Math.pow(bodyA.position.z - bodyB.position.z, 2)
            );
            
            // If they're too close, record the overlap
            if (distance < 0.001) {
              overlaps.push({
                bodyA: physicsObjectsRef.current[i].name,
                bodyB: physicsObjectsRef.current[j].name,
                distance: distance
              });
              
              console.warn(`Bodies ${physicsObjectsRef.current[i].name} and ${physicsObjectsRef.current[j].name} are overlapping (distance: ${distance.toFixed(6)})`);
              
              // Move one of the bodies slightly to prevent physics explosion
              bodyB.position.x += 0.01;
              bodyB.position.y += 0.01;
              bodyB.position.z += 0.01;
            }
          }
        }
        
        return overlaps;
      };

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
        
        // Determine mass based on body part
        // Start with static bodies (mass=0), we'll make them dynamic when hit
        let mass = 0;
        // Store original physics properties to use when activating ragdoll
        const originalProperties = {
          position: new CANNON.Vec3(position.x, position.y, position.z),
          quaternion: new CANNON.Quaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w)
        };
        
        // Create physics body at the exact world position of the mesh
        const body = new CANNON.Body({
          mass: mass, // Initially static
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
          ),
          linearDamping: 0.01, // Add damping for smoother physics
          angularDamping: 0.01,
          fixedRotation: false, // Allow rotation
          collisionFilterGroup: 1, // Main collision group
          collisionFilterMask: 1 // Can collide with self
        });
        
        // Add the shape to the body
        body.addShape(shape);
        
        // Add physics body to the world
        world.addBody(body);
        
        // Store the body in our map for joint creation
        physicsBodyMap[name] = {
          body: body,
          originalProperties: originalProperties,
          shape: shape
        };
        
        // Store body with its name and bandit ID
        const physicsIndex = physicsObjectsRef.current.length;
        physicsObjectsRef.current.push({
          name: name,
          body: body,
          mesh: mesh,
          banditId: 0,  // All parts belong to the same bandit (ID 0)
          originalProperties: originalProperties
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
      
      // After all physics bodies are created, establish joints between connected body parts
      // This will create a hierarchy of connected body parts
      const setupJoints = () => {
        // Try to set up joints between body parts based on naming conventions
        // This is an example - you may need to adjust based on the actual model structure
        
        // Helper function to find connected body parts
        const findConnectedParts = () => {
          const connections = [];
          
          // Get all physics body names
          const bodyNames = Object.keys(physicsBodyMap);
          console.log("Available body parts for joints:", bodyNames);
          
          // For body parts that don't follow the naming pattern, use a different strategy
          // Check for parts that are close to each other in space
          for (let i = 0; i < bodyNames.length; i++) {
            const partA = bodyNames[i];
            
            for (let j = i + 1; j < bodyNames.length; j++) {
              const partB = bodyNames[j];
              
              // Calculate distance between parts
              const posA = physicsBodyMap[partA].body.position;
              const posB = physicsBodyMap[partB].body.position;
              
              const distance = Math.sqrt(
                Math.pow(posA.x - posB.x, 2) +
                Math.pow(posA.y - posB.y, 2) +
                Math.pow(posA.z - posB.z, 2)
              );
              
              console.log(`Distance between ${partA} and ${partB}: ${distance.toFixed(3)}`);
              
              // If they're close, assume they should be connected
              if (distance < 0.5) { // Increased distance threshold
                console.log(`Creating connection between ${partA} and ${partB} (distance: ${distance.toFixed(3)})`);
                // Create a connection with default values
                connections.push({
                  partA: partA,
                  partB: partB,
                  // Create pivot points halfway between parts
                  pivotA: { 
                    x: (posB.x - posA.x) / 2, 
                    y: (posB.y - posA.y) / 2, 
                    z: (posB.z - posA.z) / 2 
                  },
                  pivotB: { 
                    x: (posA.x - posB.x) / 2, 
                    y: (posA.y - posB.y) / 2, 
                    z: (posA.z - posB.z) / 2 
                  },
                  angle: Math.PI / 3 // More flexibility in joints
                });
              }
            }
          }
          
          return connections;
        };
        
        // Find and create all joint connections
        const connections = findConnectedParts();
        console.log(`Setting up ${connections.length} joints between body parts`);
        
        // For each connection, create the actual joint constraint
        connections.forEach(conn => {
          if (physicsBodyMap[conn.partA] && physicsBodyMap[conn.partB]) {
            console.log(`Creating joint between ${conn.partA} and ${conn.partB}`);
            
            const bodyA = physicsBodyMap[conn.partA].body;
            const bodyB = physicsBodyMap[conn.partB].body;
            
            const joint = createJoint(
              bodyA, 
              bodyB,
              conn.pivotA,
              conn.pivotB,
              null, // Use default axis
              null,
              conn.angle
            );
            
            jointConstraints.push(joint);
          }
        });
      };
      
      // Try to set up joints (may need adjustment based on your model)
      setupJoints();
      
      // Fix initial mesh positions to match physics bodies
      const alignMeshesWithPhysics = () => {
        console.log("Aligning mesh positions with physics bodies...");
        
        // Create a map from mesh names to physics bodies
        const nameToPhysics = {};
        physicsObjectsRef.current.forEach(obj => {
          if (obj.name) {
            nameToPhysics[obj.name] = obj;
          }
        });
        
        // Traverse the model and update mesh positions to match physics
        bandit.traverse(node => {
          if (node.isMesh && nameToPhysics[node.name]) {
            const physicsObj = nameToPhysics[node.name];
            const body = physicsObj.body;
            
            // Get the world matrix of the parent
            const parentWorldMatrix = new THREE.Matrix4();
            if (node.parent) {
              node.parent.updateWorldMatrix(true, false);
              parentWorldMatrix.copy(node.parent.matrixWorld);
            }
            
            // Calculate what the local position should be to match the physics body
            const bodyWorldPos = new THREE.Vector3(
              body.position.x,
              body.position.y,
              body.position.z
            );
            
            // Convert world position to local position relative to parent
            const parentWorldMatrixInverse = new THREE.Matrix4().copy(parentWorldMatrix).invert();
            const localPos = bodyWorldPos.clone().applyMatrix4(parentWorldMatrixInverse);
            
            // Set the node's local position
            node.position.copy(localPos);
            
            // Do the same for rotation (quaternion)
            const bodyWorldQuat = new THREE.Quaternion(
              body.quaternion.x,
              body.quaternion.y,
              body.quaternion.z,
              body.quaternion.w
            );
            
            // Get parent world rotation
            const parentWorldQuat = new THREE.Quaternion();
            parentWorldMatrix.decompose(new THREE.Vector3(), parentWorldQuat, new THREE.Vector3());
            
            // Calculate local rotation
            const parentWorldQuatInverse = parentWorldQuat.clone().invert();
            const localQuat = bodyWorldQuat.clone().premultiply(parentWorldQuatInverse);
            
            // Set node's local rotation
            node.quaternion.copy(localQuat);
            
            console.log(`Aligned mesh ${node.name} with physics body`);
          }
        });
        
        // Update the world matrices of the model
        bandit.updateWorldMatrix(true, true);
        
        // Validate alignment
        Object.keys(nameToPhysics).forEach(name => {
          logPositions(name);
        });
      };
      
      // Call the alignment function
      alignMeshesWithPhysics();
      
      // Alternative simplified approach if the above doesn't work
      const directlyAlignWithPhysics = () => {
        console.log("Applying direct position alignment...");
        
        physicsObjectsRef.current.forEach(physicsObj => {
          const { body, mesh, name } = physicsObj;
          
          if (mesh) {
            // Move mesh directly to physics body position (world space)
            const worldPos = new THREE.Vector3(
              body.position.x,
              body.position.y,
              body.position.z
            );
            
            // First remove from parent to avoid transformation issues
            const originalParent = mesh.parent;
            if (originalParent) {
              mesh.removeFromParent();
              scene.add(mesh);
            }
            
            // Set position and rotation directly
            mesh.position.copy(worldPos);
            mesh.quaternion.set(
              body.quaternion.x,
              body.quaternion.y,
              body.quaternion.z,
              body.quaternion.w
            );
            
            console.log(`Directly positioned mesh ${name}`);
          }
        });
      };
      
      // If the first approach doesn't work, try this one
      setTimeout(directlyAlignWithPhysics, 100);
      
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
      
      // Function to activate ragdoll physics
      const activateRagdoll = () => {
        if (ragdollActive.current) return; // Already activated
        
        console.log('Activating ragdoll physics!');
        ragdollActive.current = true;
        
        // Check for overlapping bodies and fix them
        const overlaps = findOverlappingBodies();
        if (overlaps.length > 0) {
          console.warn(`Fixed ${overlaps.length} overlapping body pairs to prevent physics explosion`);
        }
        
        // Detach meshes from hierarchy to allow independent movement
        // This is critical - we need to remove parent-child relationships
        // so each mesh can be independently moved by physics
        const meshesToDetach = [];
        
        banditsRef.current.forEach(bandit => {
          // First collect all meshes to avoid modifying hierarchy during traversal
          bandit.traverse(node => {
            if (node.isMesh && node !== bandit) {
              meshesToDetach.push(node);
            }
          });
          
          // Now detach meshes from hierarchy
          meshesToDetach.forEach(mesh => {
            // Save current world position and rotation
            const worldPosition = new THREE.Vector3();
            const worldQuaternion = new THREE.Quaternion();
            mesh.getWorldPosition(worldPosition);
            mesh.getWorldQuaternion(worldQuaternion);
            
            // Remove from parent and add directly to scene
            mesh.removeFromParent();
            mesh.position.copy(worldPosition);
            mesh.quaternion.copy(worldQuaternion);
            scene.add(mesh);
            
            console.log(`Detached mesh ${mesh.name} from hierarchy`);
            
            // Find corresponding physics body and update position to match mesh
            physicsObjectsRef.current.forEach(physicsObj => {
              if (physicsObj.mesh === mesh) {
                physicsObj.body.position.set(
                  worldPosition.x,
                  worldPosition.y,
                  worldPosition.z
                );
                physicsObj.body.quaternion.set(
                  worldQuaternion.x,
                  worldQuaternion.y,
                  worldQuaternion.z,
                  worldQuaternion.w
                );
              }
            });
          });
        });
        
        // Temporarily remove constraints to prevent binding issues
        jointConstraints.forEach(constraint => {
          world.removeConstraint(constraint);
        });
        
        // For each physics body, make it dynamic by setting mass > 0
        physicsObjectsRef.current.forEach((physicsObj, index) => {
          const { body, name } = physicsObj;
          
          // Apply mass based on body part size (approximate)
          let mass = 1; // Default mass
          
          if (name.includes('head')) {
            mass = 2;
          } else if (name.includes('torso')) {
            mass = 5;
          } else if (name.includes('arm')) {
            mass = 1.5;
          } else if (name.includes('leg')) {
            mass = 2;
          }
          
          console.log(`Setting mass of ${name} to ${mass}`);
          
          // Set mass to make body dynamic - ensure this works by setting directly
          body.type = CANNON.Body.DYNAMIC;
          body.mass = mass;
          body.updateMassProperties();
          
          // Add MUCH gentler initial forces - dramatically reduced from previous values
          const randomForce = new CANNON.Vec3(
            (Math.random() - 0.5) * 5, // Reduced from 500 to 5
            (Math.random() - 0.5) * 5,
            (Math.random() - 0.5) * 5
          );
          
          // Apply gentle force at center of mass
          body.applyLocalForce(randomForce, new CANNON.Vec3(0, 0, 0));
          
          // Apply a mild downward force - reduced from -300 to -10
          body.applyLocalForce(new CANNON.Vec3(0, -10, 0), new CANNON.Vec3(0, 0, 0));
          
          // Wake up the body (needed for static->dynamic transition)
          body.wakeUp();
          
          // Ensure body isn't frozen
          body.sleepState = 0;
          body.allowSleep = false;
          
          console.log(`Activated physics body for ${name} with mass ${mass}`);
        });
        
        // Re-add constraints after making bodies dynamic
        setTimeout(() => {
          jointConstraints.forEach(constraint => {
            world.addConstraint(constraint);
          });
          console.log("Re-added joint constraints");
        }, 50); // Short delay to allow bodies to start moving
        
        // Apply a camera shake effect
        applyCameraShake();
        
        // Apply a gentler initial impulse to all bodies - reduced from -300 to -5
        physicsObjectsRef.current.forEach((physicsObj, index) => {
          const { body } = physicsObj;
          const impulse = new CANNON.Vec3(
            (Math.random() - 0.5) * 1,
            -5, // Reduced from -300 to -5
            (Math.random() - 0.5) * 1
          );
          body.applyImpulse(impulse, new CANNON.Vec3(0, 0, 0));
        });
        
        console.log("Applied gentle initial falling impulses to all bodies");
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
              
              // Activate ragdoll physics on first hit
              activateRagdoll();
            } else if (!ragdollActive.current) {
              // If bandit was already hit but ragdoll not active yet, activate it
              activateRagdoll();
            } else {
              // Apply an impulse force at the hit point for additional physics effect
              const impulseStrength = 5; // Reduced from 10 for more natural movement
              
              // The impulse should point in the direction of the ray (from camera to hit point)
              const impulse = new CANNON.Vec3(
                rayDirection.x * impulseStrength,
                rayDirection.y * impulseStrength,
                rayDirection.z * impulseStrength
              );
              
              // Apply impulse at hit point relative to body center
              const relativePoint = new CANNON.Vec3(
                intersectionPoint.x - physicsObj.body.position.x,
                intersectionPoint.y - physicsObj.body.position.y,
                intersectionPoint.z - physicsObj.body.position.z
              );
              
              // Log the impulse for debugging
              console.log(`Applying impulse of strength ${impulseStrength} at relative point:`, 
                relativePoint.x.toFixed(2), 
                relativePoint.y.toFixed(2), 
                relativePoint.z.toFixed(2)
              );
              
              physicsObj.body.applyImpulse(impulse, relativePoint);
              
              // Apply a smaller impulse to connected bodies for chain reaction effect
              physicsObjectsRef.current.forEach((connectedObj) => {
                if (connectedObj !== physicsObj) {
                  const distance = Math.sqrt(
                    Math.pow(connectedObj.body.position.x - physicsObj.body.position.x, 2) +
                    Math.pow(connectedObj.body.position.y - physicsObj.body.position.y, 2) +
                    Math.pow(connectedObj.body.position.z - physicsObj.body.position.z, 2)
                  );
                  
                  // Only affect nearby bodies
                  if (distance < 0.5) {
                    const weakerImpulse = new CANNON.Vec3(
                      impulse.x * 0.3, // 30% of original force
                      impulse.y * 0.3,
                      impulse.z * 0.3
                    );
                    
                    connectedObj.body.applyImpulse(weakerImpulse, new CANNON.Vec3(0, 0, 0));
                  }
                }
              });
            }

            // Trigger particle system at the exact hit point
            if (particleSystemRef.current) {
              console.log('Triggering particle system at position', intersectionPoint);
              particleSystemRef.current.triggerParticles(intersectionPoint);
            }
          }
        }
      };

      window.addEventListener('click', onMouseClick);

      const animate = () => {
        requestAnimationFrame(animate);

        // Step the world with a smaller time step for more stable physics
        world.step(1 / 120);
        
        // Debug: Report number of dynamic vs static bodies
        if (ragdollActive.current) {
          let dynamicCount = 0;
          let staticCount = 0;
          
          physicsObjectsRef.current.forEach(physicsObj => {
            if (physicsObj.body.mass > 0) dynamicCount++;
            else staticCount++;
          });
          
          // Only log occasionally to avoid flooding console
          if (Math.random() < 0.01) {
            console.log(`Physics bodies: ${dynamicCount} dynamic, ${staticCount} static`);
          }
        }
        
        // Update physics wireframes to match physics bodies
        if (physicsObjectsRef.current.length > 0) {
          physicsObjectsRef.current.forEach((physicsObj, index) => {
            const { body, name, mesh } = physicsObj;
            const wireframe = physicsWireframesRef.current[index];
            
            if (wireframe && body) {
              // Always update wireframe position and rotation to match body
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
              
              // Update the corresponding mesh directly if it exists
              if (mesh) {
                mesh.position.copy(wireframe.position);
                mesh.quaternion.copy(wireframe.quaternion);
              }
              
              // Debug: Log if a body is still static after activation
              if (ragdollActive.current && body.mass === 0) {
                console.warn(`Body ${name} is still static after ragdoll activation!`);
                // Force it to be dynamic
                body.type = CANNON.Body.DYNAMIC;
                body.mass = 1;
                body.updateMassProperties();
                body.wakeUp();
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