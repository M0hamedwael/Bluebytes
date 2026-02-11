const PATH = '../../assets/';
const SOILS = ['soil1', 'soil2', 'soil3']; 
const CROPS = ['crop1.png', 'crop2.png', 'crop3.png', 'crop4.png', 'crop5.png'];
const music =
    dpcument.getElementById(bg-music);
document.addElementListener("click", () => {
    ,usic.volume =0.3;
                           music.play();
}, { once" true});
// --- LEVEL CONFIGURATION (Difficulty Scaling) ---
const LEVELS = [
    { name: "Level 1: Garden Starter", rows: 6, cols: 8, plants: 3, rocks: 0 },
    { name: "Level 2: Rocky Terrain", rows: 8, cols: 10, plants: 6, rocks: 4 },
    { name: "Level 3: The Maze", rows: 9, cols: 12, plants: 9, rocks: 12 }
];

let currentLevelIdx = 0;
let grid = [];   
let tankPos = {r:0, c:0};
let pipesUsed = 0;
let optimalPipes = 0; 
let ROWS, COLS, PLANT_COUNT, ROCK_COUNT;

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;

    if (type === 'place') { 
        osc.type = 'sine'; osc.frequency.setValueAtTime(300, now); osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);
        gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 0.15); osc.start(now); osc.stop(now + 0.15);
    } 
    else if (type === 'remove') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(400, now); osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
        gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 0.1); osc.start(now); osc.stop(now + 0.1);
    }
    else if (type === 'water') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(400 + Math.random()*200, now); osc.frequency.linearRampToValueAtTime(200, now + 0.1);
        gain.gain.setValueAtTime(0.05, now); gain.gain.linearRampToValueAtTime(0, now + 0.1); osc.start(now); osc.stop(now + 0.1);
    }
    else if (type === 'win') {
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, i) => {
            let o = audioCtx.createOscillator(); let g = audioCtx.createGain(); o.connect(g); g.connect(audioCtx.destination);
            o.type = 'sine'; o.frequency.value = freq; g.gain.setValueAtTime(0.05, now + i*0.15); g.gain.exponentialRampToValueAtTime(0.001, now + 2); o.start(now + i*0.15); o.stop(now + 2);
        });
    }
    else if (type === 'fail') {
        osc.type = 'triangle'; osc.frequency.setValueAtTime(150, now); osc.frequency.linearRampToValueAtTime(100, now + 0.5); gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 0.5); osc.start(now); osc.stop(now + 0.5);
    }
}

function init(levelIndex = 0) {
    if (levelIndex >= LEVELS.length) levelIndex = 0;
    currentLevelIdx = levelIndex;
    const config = LEVELS[currentLevelIdx];
    
    ROWS = config.rows;
    COLS = config.cols;
    PLANT_COUNT = config.plants;
    ROCK_COUNT = config.rocks;

    document.getElementById('level-title').innerText = config.name;

    const board = document.getElementById('game-board');
    board.style.gridTemplateColumns = `repeat(${COLS}, 64px)`;
    board.style.gridTemplateRows = `repeat(${ROWS}, 64px)`;
    board.innerHTML = '';
    
    grid = [];
    pipesUsed = 0;
    
    for(let r=0; r<ROWS; r++) {
        let row = [];
        for(let c=0; c<COLS; c++) {
            let soilName = SOILS[Math.floor(Math.random() * SOILS.length)];
            let tile = document.createElement('div');
            tile.className = 'tile';
            tile.id = `t-${r}-${c}`;
            tile.onclick = () => clickTile(r, c);

            let lSoil = document.createElement('div'); lSoil.className = 'layer-soil'; lSoil.style.backgroundImage = `url('${PATH}${soilName}.png')`;
            let lObj = document.createElement('div'); lObj.className = 'layer-object';
            let lCrop = document.createElement('div'); lCrop.className = 'layer-crop';

            tile.append(lSoil, lObj, lCrop);
            board.appendChild(tile);
            row.push({ r, c, type: 'empty', soil: soilName });
        }
        grid.push(row);
    }

    place('tank', 1);
    place('hole', 1);
    place('plant', PLANT_COUNT);
    place('rock', ROCK_COUNT); // Place obstacles

    optimalPipes = calculateOptimalPipes();
    updateVisuals();
    updateScoreUI();
    
    document.getElementById('modal-overlay').classList.add('hidden');
    document.getElementById('status-text').innerText = "Ready";
}

function place(type, count) {
    let placed = 0;
    let attempts = 0;
    while(placed < count && attempts < 1000) {
        attempts++;
        let r = Math.floor(Math.random() * ROWS);
        let c = Math.floor(Math.random() * COLS);
        
        // Don't place anything on top of existing items
        if(grid[r][c].type === 'empty') {
            
            // Special Rule: Don't place rocks directly next to the tank (prevents instant blocking)
            if(type === 'rock') {
                if(Math.abs(r - tankPos.r) + Math.abs(c - tankPos.c) < 2) continue;
            }

            grid[r][c].type = type;
            let tile = document.getElementById(`t-${r}-${c}`);
            
            if(type === 'tank') {
                tankPos = {r,c};
                tile.querySelector('.layer-object').classList.add('shape-tank');
            } else if (type === 'hole') {
                tile.querySelector('.layer-object').classList.add('shape-hole');
            } else if (type === 'rock') {
                tile.querySelector('.layer-object').classList.add('shape-rock');
            } else if (type === 'plant') {
                let img = CROPS[Math.floor(Math.random() * CROPS.length)];
                tile.querySelector('.layer-crop').style.backgroundImage = `url('${PATH}${img}')`;
            }
            placed++;
        }
    }
}

// --- NEW SMART AI (BFS Pathfinding) ---
// This calculates the TRUE shortest path around rocks
function calculateOptimalPipes() {
    let targets = [];
    for(let r=0; r<ROWS; r++) {
        for(let c=0; c<COLS; c++) {
            if(grid[r][c].type === 'plant') targets.push({r,c, connected:false});
        }
    }
    
    // The network starts with the tank
    let connectedNodes = [{r: tankPos.r, c: tankPos.c}];
    let totalPipesNeeded = 0;

    // Helper: BFS to find distance from "start" to "end" avoiding rocks
    function getDistance(start, end) {
        let q = [{r: start.r, c: start.c, dist: 0}];
        let visited = new Set([`${start.r},${start.c}`]);
        
        while(q.length > 0) {
            let curr = q.shift();
            if(curr.r === end.r && curr.c === end.c) return curr.dist;

            [[0,1], [0,-1], [1,0], [-1,0]].forEach(d => {
                let nr = curr.r + d[0], nc = curr.c + d[1];
                if(nr>=0 && nr<ROWS && nc>=0 && nc<COLS) {
                    let type = grid[nr][nc].type;
                    let key = `${nr},${nc}`;
                    // Can pass through Empty, Pipe, or the Target Plant itself
                    // Cannot pass through Rock, Tank, Hole (unless it's the start)
                    if(!visited.has(key)) {
                        if (type === 'empty' || type === 'pipe' || (nr === end.r && nc === end.c)) {
                            visited.add(key);
                            q.push({r: nr, c: nc, dist: curr.dist + 1});
                        }
                    }
                }
            });
        }
        return Infinity; // Path blocked
    }

    // Connect closest plant one by one
    while(targets.some(t => !t.connected)) {
        let minAddedPipes = Infinity;
        let bestTargetIdx = -1;

        // Compare every unconnected plant to every node in our existing network
        for(let i=0; i<targets.length; i++) {
            if(targets[i].connected) continue;
            
            // We want the shortest distance from ANY part of the current pipe network
            // But to save performance, we just check distance from Tank + other Plants
            // (Approximation for performance, essentially Prim's algorithm)
            for(let node of connectedNodes) {
                let d = getDistance(node, targets[i]);
                if(d < minAddedPipes) {
                    minAddedPipes = d;
                    bestTargetIdx = i;
                }
            }
        }

        if(bestTargetIdx !== -1 && minAddedPipes !== Infinity) {
            // Subtract 1 because the plant itself doesn't need a pipe on top of it
            totalPipesNeeded += Math.max(0, minAddedPipes - 1);
            targets[bestTargetIdx].connected = true;
            connectedNodes.push(targets[bestTargetIdx]);
        } else {
            // Impossible to reach a plant
            break;
        }
    }
    return totalPipesNeeded;
}

function clickTile(r, c) {
    let cell = grid[r][c];
    
    // Block interaction with Rocks, Tank, Hole, Plants
    if(cell.type !== 'empty' && cell.type !== 'pipe') return;

    let obj = document.getElementById(`t-${r}-${c}`).querySelector('.layer-object');
    obj.classList.remove('pop-in');
    void obj.offsetWidth;
    obj.classList.add('pop-in');

    if(cell.type === 'empty') {
        cell.type = 'pipe';
        pipesUsed++; 
        playSound('place');
    } else if(cell.type === 'pipe') {
        cell.type = 'empty';
        pipesUsed--; 
        playSound('remove');
    }
    
    updateVisuals();
    updateScoreUI();
}

function updateScoreUI() {
    document.getElementById('score-used').innerText = pipesUsed;
    let efficiency = 100;
    
    // Simple visual cap logic
    if (pipesUsed > optimalPipes) {
        let diff = pipesUsed - optimalPipes;
        efficiency = Math.max(0, 100 - (diff * 5)); // Lose 5% per extra pipe
    }
    
    let bar = document.getElementById('efficiency-fill');
    bar.style.width = efficiency + "%";
    
    if(efficiency >= 75) bar.style.background = "#3498db";
    else if(efficiency >= 40) bar.style.background = "#f1c40f";
    else bar.style.background = "#e74c3c";
}

function updateVisuals() {
    const dirs = { n:[-1,0], e:[0,1], s:[1,0], w:[0,-1] };
    
    function addJoint(obj) {
        let joint = document.createElement('div');
        joint.className = 'joint';
        obj.appendChild(joint);
    }

    for(let r=0; r<ROWS; r++) {
        for(let c=0; c<COLS; c++) {
            let cell = grid[r][c];
            let tile = document.getElementById(`t-${r}-${c}`);
            let obj = tile.querySelector('.layer-object');
            let soilLayer = tile.querySelector('.layer-soil');
            
            // Rocks are dry
            if(cell.type === 'rock') continue;

            let shouldBeWet = false;
            if(['pipe', 'tank', 'hole'].includes(cell.type)) shouldBeWet = true;
            else if(cell.type === 'plant') {
                for(let d of Object.values(dirs)) {
                    let nr = r+d[0], nc = c+d[1];
                    if(nr>=0 && nr<ROWS && nc>=0 && nc<COLS) {
                        if(['pipe','tank','hole'].includes(grid[nr][nc].type)) {
                            shouldBeWet = true; break; 
                        }
                    }
                }
            }
            soilLayer.style.backgroundImage = shouldBeWet ? `url('${PATH}${cell.soil}wet.png')` : `url('${PATH}${cell.soil}.png')`;
            
            if (!['tank','hole','rock'].includes(cell.type)) {
                obj.className = 'layer-object'; obj.innerHTML = ''; 
            }
            
            if (['empty','plant','tank','hole','rock'].includes(cell.type)) continue;

            let conns = [];
            for(let [k,d] of Object.entries(dirs)) {
                let nr = r+d[0], nc = c+d[1];
                if(nr>=0 && nr<ROWS && nc>=0 && nc<COLS) {
                    // Pipes connect to: Pipes, Tanks, Holes, Plants
                    // Pipes do NOT connect to: Rocks
                    if(['pipe','tank','hole', 'plant'].includes(grid[nr][nc].type)) conns.push(k);
                }
            }

            if(cell.type === 'pipe') {
                if(conns.length === 4) {
                    obj.classList.add('shape-cross'); addJoint(obj);
                }
                else if(conns.length === 3) {
                    obj.classList.add('shape-t'); addJoint(obj);
                    if(!conns.includes('n')) obj.classList.add('rot-0');
                    else if(!conns.includes('e')) obj.classList.add('rot-90');
                    else if(!conns.includes('s')) obj.classList.add('rot-180');
                    else if(!conns.includes('w')) obj.classList.add('rot-270');
                }
                else if(conns.length === 2 && !((conns.includes('n') && conns.includes('s')) || (conns.includes('e') && conns.includes('w')))) {
                    obj.classList.add('shape-corner'); addJoint(obj);
                    if(conns.includes('n') && conns.includes('e')) obj.classList.add('rot-0');
                    else if(conns.includes('e') && conns.includes('s')) obj.classList.add('rot-90');
                    else if(conns.includes('s') && conns.includes('w')) obj.classList.add('rot-180');
                    else if(conns.includes('w') && conns.includes('n')) obj.classList.add('rot-270');
                }
                else {
                    obj.classList.add('shape-straight');
                    if(conns.includes('e') || conns.includes('w')) obj.classList.add('rot-90');
                    else obj.classList.add('rot-0');
                }
            }
        }
    }
}

document.getElementById('submit-btn').onclick = async () => {
    let queue = [tankPos];
    let visited = new Set([`${tankPos.r},${tankPos.c}`]);
    let watered = 0;

    document.getElementById('status-text').innerText = "Flowing...";
    playSound('place');

    while(queue.length > 0) {
        let curr = queue.shift();
        let tile = document.getElementById(`t-${curr.r}-${curr.c}`);
        
        if(grid[curr.r][curr.c].type !== 'plant') {
            tile.querySelector('.layer-object').classList.add('flowing');
        } else {
             tile.querySelector('.layer-crop').classList.add('wet-plant');
        }

        playSound('water');
        await new Promise(r => setTimeout(r, 60));

        const dirs = [[0,1], [0,-1], [1,0], [-1,0]];
        for(let d of dirs) {
            let nr = curr.r + d[0], nc = curr.c + d[1];
            if(nr>=0 && nr<ROWS && nc>=0 && nc<COLS) {
                let cell = grid[nr][nc];
                let key = `${nr},${nc}`;
                
                // Water flows through Pipes, Plants, Holes
                // Water BLOCKED by Rocks and Empty soil
                if(!visited.has(key) && ['pipe','plant','hole'].includes(cell.type)) {
                    visited.add(key);
                    queue.push({r:nr, c:nc});
                    if(cell.type === 'plant') watered++;
                }
            }
        }
    }

    setTimeout(() => {
        let overlay = document.getElementById('modal-overlay');
        let card = document.querySelector('.modal-card');
        
        overlay.classList.remove('hidden');
        
        let efficiency = 100;
        if(pipesUsed > optimalPipes) {
            let diff = pipesUsed - optimalPipes;
            efficiency = Math.max(0, 100 - (diff * 5));
        }

        let isSuccess = (watered >= PLANT_COUNT);

        if(isSuccess) {
            playSound('win');
            card.className = 'modal-card success';
            
            // Default: Restart at Level 1 (Index 0)
            let btnText = "Play Again";
            let btnAction = `init(0)`; 
            
            // If there is a next level, go there
            if(currentLevelIdx < LEVELS.length - 1) {
                btnText = "Next Level >";
                btnAction = `init(${currentLevelIdx + 1})`;
            }

            card.innerHTML = `
                <div class="modal-header">
                    <div class="floating-icon">✔</div>
                    <h1>Mission Success!</h1>
                </div>
                <div class="modal-img-container" style="background-image: url('${PATH}happy_farm.png'); background-color: #dff9fb;"></div>
                <div class="modal-body">
                    <p>Plants dont need more water they need the right amount! Efficiency: ${efficiency}%.</p>
                    <button class="modal-btn" onclick="${btnAction}">${btnText}</button>
                </div>
            `;
        } else {
            playSound('fail');
            card.className = 'modal-card fail';
            card.innerHTML = `
                <div class="modal-header">
                    <div class="floating-icon">!</div>
                    <h1>Mission Failed!</h1>
                </div>
                <div class="modal-img-container" style="background-image: url('${PATH}sad_farm.png'); background-color: #fadbd8;"></div>
                <div class="modal-body">
                    <p>Plants dont need more water they need the right amount, Not all plants received water.</p>
                    <button class="modal-btn" onclick="init(${currentLevelIdx})">Try Again</button>
                </div>
            `;
        }
    }, 600);
};

// Start game
init(0);
