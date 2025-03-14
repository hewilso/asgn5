import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { GUI } from 'lil-gui';

function main() {
    const canvas = document.querySelector('#c');
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
    renderer.shadowMap.enabled = true;

    const scene = new THREE.Scene();

    const fov = 45;
    const aspect = 2;
    const near = 0.1;
    const far = 100;
    const perspectiveCamera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    perspectiveCamera.position.set(0, 10, 20);

    const left = -1;
    const right = 1;
    const top = 1;
    const bottom = -1;
    const orthoNear = 5;
    const orthoFar = 50;
    const orthographicCamera = new THREE.OrthographicCamera(left, right, top, bottom, orthoNear, orthoFar);
    orthographicCamera.zoom = 0.1;
    orthographicCamera.position.set(10, 10, 10);
    orthographicCamera.lookAt(0, 0, 0);
    orthographicCamera.updateProjectionMatrix();

    const perspectiveControls = new OrbitControls(perspectiveCamera, canvas);
    perspectiveControls.enableDamping = true;
    perspectiveControls.dampingFactor = 0.05;
    perspectiveControls.screenSpacePanning = false;

    const orthoControls = new OrbitControls(orthographicCamera, canvas);
    orthoControls.enableDamping = true;
    orthoControls.dampingFactor = 0.05;
    orthoControls.screenSpacePanning = true;
    orthoControls.minZoom = 0.1;
    orthoControls.maxZoom = 2;

    scene.background = new THREE.Color(0xAAAAAA);
    const cubeTextureLoader = new THREE.CubeTextureLoader();
    const skyboxTexture = cubeTextureLoader.load([
        'resources/skybox/right.jpg',
        'resources/skybox/left.jpg',
        'resources/skybox/top.jpg',
        'resources/skybox/bottom.jpg',
        'resources/skybox/front.jpg',
        'resources/skybox/back.jpg',
    ]);
    scene.background = skyboxTexture;

    {
        const skyColor = 0xB1E1FF;
        const groundColor = 0xB97A20;
        const intensity = 0.2;
        const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
        scene.add(light);
    }

    {
        const color = 0xFFFFFF;
        const intensity = 1;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(5, 10, 2);
        light.castShadow = true;
        light.shadow.mapSize.width = 2048;
        light.shadow.mapSize.height = 2048;
        const d = 15;
        light.shadow.camera.left = -d;
        light.shadow.camera.right = d;
        light.shadow.camera.top = d;
        light.shadow.camera.bottom = -d;
        light.shadow.camera.near = 1;
        light.shadow.camera.far = 50;
        scene.add(light);
    }

    {
        const color = 0xFFAA00;
        const intensity = 100;
        const distance = 30;
        const decay = 1;
        const pointLight = new THREE.PointLight(color, intensity, distance, decay);
        pointLight.position.set(10, 10, 10);
        pointLight.castShadow = false;
        const pointLightHelper = new THREE.PointLightHelper(pointLight, 1);
        scene.add(pointLightHelper);
        const pillarGeometry = new THREE.CylinderGeometry(0.5, 0.5, 10, 32);
        const pillarMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
        const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
        pillar.position.set(pointLight.position.x, 5, pointLight.position.z);
        pillar.castShadow = true;
        pillar.receiveShadow = true;
        scene.add(pillar);
        scene.add(pointLight);
    }

    {
        const color = 0xA00FAA;
        const intensity = 90;
        const distance = 30;
        const angle = Math.PI / 4;
        const penumbra = 0.5;
        const decay = 1;
        const spotlight = new THREE.SpotLight(color, intensity, distance, angle, penumbra, decay);
        spotlight.position.set(-10, 15, 0);
        spotlight.castShadow = true;
        const spotlightTarget = new THREE.Object3D();
        spotlightTarget.position.set(0, 0, 0);
        spotlight.target = spotlightTarget;
        scene.add(spotlight);
        scene.add(spotlightTarget);
    }

    {
        const planeSize = 40;
        const loader = new THREE.TextureLoader();
        const texture = loader.load('resources/images/grass.png');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.magFilter = THREE.NearestFilter;
        const repeats = planeSize / 2;
        texture.repeat.set(repeats, repeats);
        const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize);
        const planeMat = new THREE.MeshPhongMaterial({
            map: texture,
            side: THREE.DoubleSide,
        });
        const mesh = new THREE.Mesh(planeGeo, planeMat);
        mesh.rotation.x = Math.PI * -.5;
        mesh.receiveShadow = true;
        scene.add(mesh);
    }

    {
        const mtlLoader = new MTLLoader();
        mtlLoader.load('resources/Obj/oldWall.mtl', (mtl) => {
            mtl.preload();
            const objLoader = new OBJLoader();
            objLoader.setMaterials(mtl);
            objLoader.load('resources/Obj/oldWall.obj', (root) => {
                root.traverse((node) => {
                    if (node.isMesh) {
                        node.castShadow = true;
                        node.receiveShadow = true;
                    }
                });
                const box = new THREE.Box3().setFromObject(root);
                const boxSize = box.getSize(new THREE.Vector3()).length();
                const boxCenter = box.getCenter(new THREE.Vector3());
                root.position.x = -boxCenter.x;
                root.position.y = -boxCenter.y + boxSize * 0.2;
                root.position.z = -boxCenter.z;
                scene.add(root);
            });
        });
    }

    const cubeLoader = new THREE.TextureLoader();
    const materials = [
        new THREE.MeshBasicMaterial({ map: cubeLoader.load('resources/images/eye.jpg') }),
        new THREE.MeshBasicMaterial({ map: cubeLoader.load('resources/images/eye.jpg') }),
        new THREE.MeshBasicMaterial({ map: cubeLoader.load('resources/images/eye.jpg') }),
        new THREE.MeshBasicMaterial({ map: cubeLoader.load('resources/images/eye.jpg') }),
        new THREE.MeshBasicMaterial({ map: cubeLoader.load('resources/images/eye.jpg') }),
        new THREE.MeshBasicMaterial({ map: cubeLoader.load('resources/images/eye.jpg') }),
    ];

    function makeInstance(geometry, materials, x) {
        const cube = new THREE.Mesh(geometry, materials);
        scene.add(cube);
        cube.position.x = x;
        cube.position.y = 1;
        return cube;
    }

    const cubeGroup = new THREE.Group();
    const cube1 = makeInstance(new THREE.BoxGeometry(1, 1, 1), materials, 0, 0, 0);
    const cube2 = makeInstance(new THREE.BoxGeometry(1, 1, 1), materials, 2, 0, 0);
    const cube3 = makeInstance(new THREE.BoxGeometry(1, 1, 1), materials, -2, 0, 0);
    cubeGroup.add(cube1);
    cubeGroup.add(cube2);
    cubeGroup.add(cube3);
    cubeGroup.position.set(0, 10, 0);
    scene.add(cubeGroup);

    const treeGroup = new THREE.Group();

    function createTree(x, z) {
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.3, 5, 32),
            new THREE.MeshPhongMaterial({ color: 0x8B4513 })
        );
        trunk.position.set(x, 2.5, z);
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        treeGroup.add(trunk);
        const leaves = new THREE.Mesh(
            new THREE.SphereGeometry(2, 32, 32),
            new THREE.MeshPhongMaterial({ color: 0x228B22 })
        );
        leaves.position.set(x, 6, z);
        leaves.castShadow = true;
        leaves.receiveShadow = true;
        treeGroup.add(leaves);
    }

    createTree(-19.5, -19.5);
    createTree(-19.5, 19.5);
    createTree(19.5, -19.5);
    createTree(19.5, 19.5);
    scene.add(treeGroup);

    const staircaseGroup = new THREE.Group();
    const stepWidth = 4;
    const stepHeight = 0.5;
    const stepDepth = 1;
    const numSteps = 10;
    const railingHeight = 5;
    const railingRadius = 0.1;

    for (let i = 0; i < numSteps; i++) {
        const step = new THREE.Mesh(
            new THREE.BoxGeometry(stepWidth, stepHeight, stepDepth),
            new THREE.MeshPhongMaterial({ color: 0x808080 })
        );
        step.position.set(0, i * stepHeight, i * stepDepth);
        step.castShadow = true;
        step.receiveShadow = true;
        staircaseGroup.add(step);
    }

    const railingOffset = stepWidth / 2;
    for (let i = 0; i < 2; i++) {
        const railing = new THREE.Mesh(
            new THREE.CylinderGeometry(railingRadius, railingRadius, railingHeight, 32),
            new THREE.MeshPhongMaterial({ color: 0x8B4513 })
        );
        railing.position.set(i === 0 ? -railingOffset : railingOffset, railingHeight / 2, 9.3);
        railing.castShadow = true;
        railing.receiveShadow = true;
        staircaseGroup.add(railing);
    }

    staircaseGroup.position.set(10, 0, -10);
    scene.add(staircaseGroup);

    const doorGroup = new THREE.Group();
    const doorWidth = 2;
    const doorHeight = 4;
    const doorThickness = 0.2;
    const doorFrameWidth = 0.2;
    const doorFrameDepth = 0.2;

    const doorFrame = new THREE.Mesh(
        new THREE.BoxGeometry(doorWidth + doorFrameWidth * 2, doorHeight, doorFrameDepth),
        new THREE.MeshPhongMaterial({ color: 0x8B4513 })
    );
    doorFrame.position.set(0, doorHeight / 2, 0);
    doorFrame.castShadow = true;
    doorFrame.receiveShadow = true;
    doorGroup.add(doorFrame);

    const door = new THREE.Mesh(
        new THREE.BoxGeometry(doorWidth, doorHeight, doorThickness),
        new THREE.MeshPhongMaterial({ color: 0x654321 })
    );
    door.position.set(0, doorHeight / 2, doorFrameDepth / 2 + doorThickness / 2);
    door.castShadow = true;
    door.receiveShadow = true;
    doorGroup.add(door);

    const staircaseEndZ = (numSteps - 1) * stepDepth;
    doorGroup.position.set(10, 4.5, -0.5);
    scene.add(doorGroup);

    function resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            renderer.setSize(width, height, false);
            perspectiveCamera.aspect = width / height;
            perspectiveCamera.updateProjectionMatrix();
            const aspect = width / height;
            orthographicCamera.left = -aspect;
            orthographicCamera.right = aspect;
            orthographicCamera.top = 1;
            orthographicCamera.bottom = -1;
            orthographicCamera.updateProjectionMatrix();
        }
        return needResize;
    }

    function render(time) {
        if (resizeRendererToDisplaySize(renderer)) {
            const canvas = renderer.domElement;
            perspectiveCamera.aspect = canvas.clientWidth / canvas.clientHeight;
            perspectiveCamera.updateProjectionMatrix();
        }
        cubeGroup.children.forEach((cube, ndx) => {
            time *= 0.01;
            const speed = 1 + ndx * 0.1;
            const rot = time * speed;
            cube.rotation.x = rot;
            cube.rotation.y = rot;
        });

        perspectiveControls.update();
        orthoControls.update();

        renderer.setViewport(0, 0, canvas.width / 2, canvas.height);
        renderer.setScissor(0, 0, canvas.width / 2, canvas.height);
        renderer.setScissorTest(true);
        renderer.render(scene, perspectiveCamera);

        renderer.setViewport(canvas.width / 2, 0, canvas.width / 2, canvas.height);
        renderer.setScissor(canvas.width / 2, 0, canvas.width / 2, canvas.height);
        renderer.setScissorTest(true);
        renderer.render(scene, orthographicCamera);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

main();