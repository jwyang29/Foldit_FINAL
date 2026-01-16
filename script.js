document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

// =========================================================
// [설정] 티처블 머신 모델 URL (본인 URL로 변경 필수!)
// =========================================================
const TM_URL = "https://teachablemachine.withgoogle.com/models/YOUR_MODEL_ID/"; 

// 카테고리별 정답 매핑
const CAT_RULES = {
    'fruit': ['Apple', 'Banana', 'Orange'], 
    'animal': ['Cat', 'Dog', 'Bird']
};

// 가이드라인 멘트
const GUIDES = {
    'fruit': "🍎 가이드: 사과 또는 바나나를 접어 보세요.",
    'animal': "🦊 가이드: 새 또는 고양이를 접어 보세요."
};

let classifier;
let currentCategory = null; 

// 1. 초기화
async function initApp() {
    const container = document.getElementById('animation-container');
    const typingTxt = document.getElementById('typing-text');
    const landing = document.getElementById('landing');
    const mainPage = document.getElementById('main-page');
    const wrapper = document.getElementById('typing-wrapper');
    const delay = (ms) => new Promise(res => setTimeout(res, ms));

    // 랜딩 애니메이션
    await delay(700); container.classList.add('expanded');
    await delay(500);
    const slogan = "Fold what you want, make it yours";
    for (let char of slogan) { typingTxt.textContent += char; await delay(45); }
    await delay(500); wrapper.style.opacity = '0';
    await delay(300); container.classList.remove('expanded');
    await delay(700); container.classList.add('orange-mode');
    await delay(1200); landing.style.opacity = '0';
    
    setTimeout(() => {
        landing.style.display = 'none';
        mainPage.style.display = 'block';
        setTimeout(() => {
            mainPage.style.opacity = '1';
            document.body.style.overflowY = 'auto';
            showTab(1); 
            initHero3D(); 
            preloadModel(); 
        }, 50);
    }, 800);
}

// 2. 모델 로드
function preloadModel() {
    console.log("AI Loading...");
    classifier = ml5.imageClassifier(TM_URL + 'model.json', () => {
        console.log("AI Loaded!");
    });
}

// 3. 탭 전환
function showTab(num) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => {
        c.classList.remove('active'); 
        c.style.display = 'none';
    });
    
    document.querySelectorAll('.tab-btn')[num-1].classList.add('active');
    const activeContent = document.querySelectorAll('.tab-content')[num-1];
    activeContent.style.display = 'block';
    setTimeout(() => activeContent.classList.add('active'), 10);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// [NEW] 데모 스텝으로 이동 & 스크롤
function goToDemoStep(stepNum) {
    // 1. DEMO UI 탭(2번) 활성화
    showTab(2);

    // 2. 탭이 렌더링될 시간을 아주 잠깐 준 뒤 스크롤 이동
    setTimeout(() => {
        const targetId = `demo-step-${stepNum}`;
        const targetElement = document.getElementById(targetId);

        if (targetElement) {
            targetElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
        }
    }, 100);
}

// 4. 카테고리 선택
function selectCategory(cat) {
    currentCategory = cat;
    
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`cat-${cat}`).classList.add('active');
    
    const step2 = document.getElementById('step-2-box');
    step2.classList.remove('disabled');
    document.getElementById('ai-img-upload').disabled = false;
    
    const guideEl = document.getElementById('guide-text');
    if (GUIDES[cat]) { guideEl.innerText = GUIDES[cat]; }

    document.getElementById('ai-target-image').style.display = 'none';
    document.getElementById('ai-result-overlay').style.display = 'none';
    document.getElementById('upload-placeholder').style.display = 'block';
}

// 5. 이미지 업로드
function handleAIUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const imgEl = document.getElementById('ai-target-image');
    const reader = new FileReader();
    
    reader.onload = function(e) {
        imgEl.src = e.target.result;
        imgEl.style.display = 'block';
        document.getElementById('upload-placeholder').style.display = 'none';
        
        document.getElementById('loading-spinner').style.display = 'block';
        document.getElementById('ai-result-overlay').style.display = 'none';
        
        setTimeout(() => classifyImage(imgEl), 500);
    };
    reader.readAsDataURL(file);
}

// 6. 분류 실행
function classifyImage(imgElement) {
    if (!classifier) {
        alert("AI Model loading... Wait a sec.");
        return;
    }

    classifier.classify(imgElement, (error, results) => {
        document.getElementById('loading-spinner').style.display = 'none';

        if (error) { console.error(error); return; }

        const topResult = results[0];
        const label = topResult.label; 
        const confidence = (topResult.confidence * 100).toFixed(1);
        const allowedList = CAT_RULES[currentCategory]; 
        
        const overlay = document.getElementById('ai-result-overlay');
        const labelDiv = document.getElementById('result-label');
        const barDiv = document.getElementById('result-bar');
        const percentDiv = document.getElementById('result-percent');

        overlay.style.display = 'block';

        if (allowedList && allowedList.includes(label)) {
            labelDiv.innerHTML = `It's a <b>${label}</b>!`;
            labelDiv.style.color = "#00ffcc";
            barDiv.style.backgroundColor = "#00ffcc";
        } else {
            if(label === 'Background') labelDiv.innerHTML = "No Object Detected";
            else labelDiv.innerHTML = `Warning: Looks like <b>${label}</b>,<br>not a ${currentCategory}.`;
            
            labelDiv.style.color = "#ff3366";
            barDiv.style.backgroundColor = "#ff3366";
        }

        barDiv.style.width = confidence + "%";
        percentDiv.innerText = confidence + "%";
    });
}

// 3D 배경
function initHero3D() {
    const container = document.getElementById('hero-3d-bg');
    if (!container) return;
    const width = container.clientWidth; const height = container.clientHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.z = 5;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5); dirLight.position.set(5, 5, 5); scene.add(dirLight);
    const loader = new THREE.GLTFLoader(); const group = new THREE.Group(); scene.add(group);

    const loadGLB = (file, x, y, z, scaleFactor) => {
        loader.load(file, (gltf) => {
            const model = gltf.scene;
            const box = new THREE.Box3().setFromObject(model);
            const size = new THREE.Vector3(); box.getSize(size);
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = (1.5 / maxDim) * scaleFactor; 
            model.scale.set(scale, scale, scale);
            const center = new THREE.Vector3(); box.getCenter(center);
            model.position.sub(center.multiplyScalar(scale)); 
            const wrapper = new THREE.Object3D();
            wrapper.add(model); wrapper.position.set(x, y, z);
            model.traverse((child) => {
                if (child.isMesh) {
                    child.material = new THREE.MeshLambertMaterial({ color: 0x999999 });
                    child.castShadow = false; child.receiveShadow = false;
                }
            });
            wrapper.userData = {
                rotSpeedX: (Math.random() - 0.5) * 0.005, rotSpeedY: (Math.random() - 0.5) * 0.01 + 0.002,
                floatSpeed: Math.random() * 0.02 + 0.01, floatOffset: Math.random() * 100
            };
            group.add(wrapper);
        }, undefined, (err) => { console.error(`Error loading ${file}:`, err); });
    };

    loadGLB('car.glb', -3.2, 0.7, -1.0, 1.5); 
    loadGLB('sofa.glb', 3.5, -0.5, -1.5, 1.2); 
    loadGLB('plant.glb', 1.8, 1.8, -2.0, 0.7); 
    loadGLB('cup.glb', -3.3, -1.2, -1.3, 0.5); 

    const animate = () => {
        requestAnimationFrame(animate);
        const time = Date.now() * 0.001;
        group.children.forEach(wrapper => {
            const ud = wrapper.userData;
            wrapper.rotation.x += ud.rotSpeedX; wrapper.rotation.y += ud.rotSpeedY;
            wrapper.position.y += Math.sin(time * 2 + ud.floatOffset) * 0.001;
        });
        renderer.render(scene, camera);
    };
    animate();
    window.addEventListener('resize', () => {
        const w = container.clientWidth; const h = container.clientHeight;
        camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h);
    });
}