import { useRef, useEffect } from 'react';
import * as THREE from 'three';

const DNAAnimation = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(90, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.01, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    mountRef.current.appendChild(renderer.domElement);

    camera.position.z = 60;

    const red = 0xC70039;
    const blue = 0x0c25d8;
    const white = 0xFFFFFF;

    const tubeGeometry = new THREE.CylinderGeometry(0.3, 0.3, 6, 32);
    const ballGeometry = new THREE.SphereGeometry(0.8, 32, 32);
    
    const redMaterial = new THREE.MeshBasicMaterial({ color: red });
    const blueMaterial = new THREE.MeshBasicMaterial({ color: blue });
    const whiteMaterial = new THREE.MeshBasicMaterial({ color: white });

    const dna = new THREE.Object3D();
    const holder = new THREE.Object3D();

    for (let i = 0; i <= 33; i++) {
        const blueTube = new THREE.Mesh(tubeGeometry, blueMaterial);
        blueTube.rotation.z = 90 * Math.PI / 180;
        blueTube.position.x = -3;

        const redTube = new THREE.Mesh(tubeGeometry, redMaterial);
        redTube.rotation.z = 90 * Math.PI / 180;
        redTube.position.x = 3;

        const ballRight = new THREE.Mesh(ballGeometry, whiteMaterial);
        ballRight.position.x = 6;
        
        const ballLeft = new THREE.Mesh(ballGeometry, whiteMaterial);
        ballLeft.position.x = -6;

        const row = new THREE.Object3D();
        row.add(blueTube);
        row.add(redTube);
        row.add(ballRight);
        row.add(ballLeft);

        row.position.y = i * 2;
        row.rotation.y = 10 * i * Math.PI / 180;

        dna.add(row);
    }

    dna.position.y = -33; // Center the DNA strand
    holder.add(dna);
    scene.add(holder);

    const animate = () => {
      requestAnimationFrame(animate);
      holder.rotation.x += 0.01;
      holder.rotation.y += 0.015;
      renderer.render(scene, camera);
    };

    animate();

    const currentMount = mountRef.current;
    
    const handleResize = () => {
        if (currentMount) {
            camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (currentMount) {
        currentMount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} style={{ width: '100%', height: '250px' }} />;
};

export default DNAAnimation; 