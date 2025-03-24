import * as THREE from 'three';
import { CameraSettings } from '@/hooks/use-camera-settings';

// Setup Three.js scene for fisheye dewarping
export function setupThreeJsScene(
  canvas: HTMLCanvasElement,
  videoElement: HTMLVideoElement,
  container: HTMLDivElement,
  isDewarpEnabled: boolean
) {
  // Scene setup
  const scene = new THREE.Scene();
  
  // Camera setup
  const camera = new THREE.PerspectiveCamera(
    75, 
    container.clientWidth / container.clientHeight, 
    0.1, 
    1000
  );
  camera.position.z = 0.1;
  
  // Renderer setup
  const renderer = new THREE.WebGLRenderer({ 
    canvas,
    antialias: true,
    alpha: true
  });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  
  // Create video texture
  const videoTexture = new THREE.VideoTexture(videoElement);
  videoTexture.minFilter = THREE.LinearFilter;
  videoTexture.magFilter = THREE.LinearFilter;
  videoTexture.format = THREE.RGBFormat;
  
  // Create shader material for post-processing effects
  const shaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
      tDiffuse: { value: videoTexture },
      brightness: { value: 0.0 },
      contrast: { value: 0.0 },
      saturation: { value: 0.0 },
      isNightMode: { value: 0.0 },
      isBWMode: { value: 0.0 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float brightness;
      uniform float contrast;
      uniform float saturation;
      uniform float isNightMode;
      uniform float isBWMode;
      
      varying vec2 vUv;
      
      void main() {
        vec4 texColor = texture2D(tDiffuse, vUv);
        
        // Apply brightness
        texColor.rgb += brightness;
        
        // Apply contrast
        texColor.rgb = (texColor.rgb - 0.5) * (contrast + 1.0) + 0.5;
        
        // Apply saturation
        float intensity = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
        texColor.rgb = mix(vec3(intensity), texColor.rgb, saturation + 1.0);
        
        // Apply black and white effect
        if (isBWMode > 0.5) {
          float gray = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
          texColor.rgb = vec3(gray);
        }
        
        // Apply night mode effect
        if (isNightMode > 0.5) {
          texColor.rgb = vec3(0.0, texColor.g * 1.5, 0.0);
        }
        
        gl_FragColor = texColor;
      }
    `
  });
  
  // Create sphere geometry for 360 view
  const sphereGeometry = new THREE.SphereGeometry(500, 60, 40);
  sphereGeometry.scale(-1, 1, 1); // Invert to view from inside
  
  // Create sphere mesh
  const sphere = new THREE.Mesh(sphereGeometry, shaderMaterial);
  scene.add(sphere);
  
  // Add orbit controls for panning
  let isDragging = false;
  let previousMousePosition = { x: 0, y: 0 };
  let rotationSpeed = 0.5;
  let targetRotationX = 0;
  let targetRotationY = 0;
  
  canvas.addEventListener('mousedown', (event) => {
    isDragging = true;
    previousMousePosition = {
      x: event.clientX,
      y: event.clientY
    };
  });
  
  canvas.addEventListener('mousemove', (event) => {
    if (isDragging) {
      const deltaMove = {
        x: event.clientX - previousMousePosition.x,
        y: event.clientY - previousMousePosition.y
      };
      
      targetRotationY += deltaMove.x * 0.01 * rotationSpeed;
      targetRotationX += deltaMove.y * 0.01 * rotationSpeed;
      
      // Limit vertical rotation
      targetRotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, targetRotationX));
      
      previousMousePosition = {
        x: event.clientX,
        y: event.clientY
      };
    }
  });
  
  canvas.addEventListener('mouseup', () => {
    isDragging = false;
  });
  
  canvas.addEventListener('mouseleave', () => {
    isDragging = false;
  });
  
  // Touch controls for mobile
  canvas.addEventListener('touchstart', (event) => {
    if (event.touches.length === 1) {
      isDragging = true;
      previousMousePosition = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY
      };
      event.preventDefault();
    }
  });
  
  canvas.addEventListener('touchmove', (event) => {
    if (isDragging && event.touches.length === 1) {
      const deltaMove = {
        x: event.touches[0].clientX - previousMousePosition.x,
        y: event.touches[0].clientY - previousMousePosition.y
      };
      
      targetRotationY += deltaMove.x * 0.01 * rotationSpeed;
      targetRotationX += deltaMove.y * 0.01 * rotationSpeed;
      
      // Limit vertical rotation
      targetRotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, targetRotationX));
      
      previousMousePosition = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY
      };
      
      event.preventDefault();
    }
  });
  
  canvas.addEventListener('touchend', () => {
    isDragging = false;
  });
  
  // Define zoom functions
  let zoomLevel = 1;
  const zoomIn = () => {
    zoomLevel = Math.min(zoomLevel * 1.2, 3);
    camera.fov = 75 / zoomLevel;
    camera.updateProjectionMatrix();
  };
  
  const zoomOut = () => {
    zoomLevel = Math.max(zoomLevel / 1.2, 0.5);
    camera.fov = 75 / zoomLevel;
    camera.updateProjectionMatrix();
  };
  
  // Setup animation loop
  const render = () => {
    if (!isDewarpEnabled) {
      // Apply smooth rotation
      sphere.rotation.x += (targetRotationX - sphere.rotation.x) * 0.1;
      sphere.rotation.y += (targetRotationY - sphere.rotation.y) * 0.1;
    }
    
    renderer.render(scene, camera);
  };
  
  // Handle resize
  const handleResize = (width: number, height: number) => {
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  };
  
  // Dispose resources
  const dispose = () => {
    sphereGeometry.dispose();
    shaderMaterial.dispose();
    renderer.dispose();
  };
  
  return {
    render,
    handleResize,
    dispose,
    zoomIn,
    zoomOut,
    // Expose objects for external updates
    scene,
    camera,
    material: shaderMaterial
  };
}

// Update scene based on camera settings
export function updateScene(sceneObj: any, settings: CameraSettings) {
  if (!sceneObj || !sceneObj.material) return;
  
  // Update shader uniforms
  if (sceneObj.material.uniforms) {
    sceneObj.material.uniforms.brightness.value = settings.brightness;
    sceneObj.material.uniforms.contrast.value = settings.contrast;
    sceneObj.material.uniforms.saturation.value = settings.saturation;
    sceneObj.material.uniforms.isNightMode.value = settings.isNightModeEnabled ? 1.0 : 0.0;
    sceneObj.material.uniforms.isBWMode.value = settings.isBWModeEnabled ? 1.0 : 0.0;
  }
  
  // Handle view mode changes
  switch (settings.viewMode) {
    case "360":
      // Full 360° view - default sphere
      sceneObj.camera.fov = 75;
      sceneObj.camera.updateProjectionMatrix();
      break;
    case "180":
      // 180° half-panorama
      sceneObj.camera.fov = 120;
      sceneObj.camera.updateProjectionMatrix();
      break;
    case "quad":
      // Quadrant split view - adjust camera angle
      sceneObj.camera.fov = 45;
      sceneObj.camera.updateProjectionMatrix();
      break;
    case "vr":
      // VR side-by-side
      sceneObj.camera.fov = 90;
      sceneObj.camera.updateProjectionMatrix();
      break;
  }
}
