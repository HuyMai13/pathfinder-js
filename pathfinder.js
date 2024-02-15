const row = 30;
const col = 80;
let board = [];

const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth-2*(canvas.offsetLeft+10);
const nodeLen = canvas.width/col;
canvas.height = nodeLen*row+1;

let start = {x:null, y:null};
let end = {x:null, y:null};
let payload = {x:null, y:null};
let canvasImg; // blank canvas snapshot
let img = new Image();

main();

function main(){
    console.log("Row", row, "\nCol", col, "\nCanvas width", canvas.width, "\nnodeLen", nodeLen);

    let intervalID = []; // array pass by reference to clearInterval outside of func
    let timeoutID = [];
    let requestID = []; // array pass by reference to cancelAnimationFrame outside of func
    let running = {bool:false}; // boolean for running animation (pass by reference to modify inside of func)
    let algo = "dijks";
    let path = [];  // path to draw

    const algoBtn = document.getElementById("algo-btn");
    const mazeBtn = document.getElementById("maze-btn");
    const algoList = document.getElementById("algo");
    const mazeList = document.getElementById("maze");
    let arrowImg = document.createElement('img');
    arrowImg.src = document.getElementById("arrow-down").src;

    resetBoard();
    document.getElementById("overlay").addEventListener("click", () => {
        document.getElementById("overlay").classList.add("off");
        document.getElementById("tutorial").classList.add("off");
    });
    document.getElementById("info").addEventListener("click", () => {
        document.getElementById("overlay").classList.remove("off");
        document.getElementById("tutorial").classList.remove("off");
    });
    document.getElementById("reset").addEventListener("click", () => {
        // clear all animation before reset
        for(let id of timeoutID){
            clearTimeout(id);
        }
        clearInterval(intervalID);
        for(req of requestID) cancelAnimationFrame(req);
        setRunning(running, false);
        resetBoard();
    });

    // ALGORITHM BUTTON LISTENER
    document.getElementById("algo-btn").addEventListener("click", () => algoList.classList.toggle("show"));
    document.getElementById("algo-dijks").addEventListener("click", () => {
        algoBtn.textContent = "Dijkstra's Algorithm";
        algo = "dijks";
        algoBtn.appendChild(arrowImg.cloneNode(true));
        algoList.classList.toggle("show");
    });
    document.getElementById("algo-astar").addEventListener("click", () => {
        algoBtn.textContent = "A* Algorithm";
        algo = "astar";
        algoBtn.appendChild(arrowImg.cloneNode(true));
        algoList.classList.toggle("show");
    });
    // MAZE BUTTON LISTENER
    document.getElementById("maze-btn").addEventListener("click", () => mazeList.classList.toggle("show"));
    document.getElementById("recursive").addEventListener("click", () => {
        setRunning(running, true);
        updateNode();
        mazeBtn.textContent = "Recursive backtracker";
        mazeBtn.appendChild(arrowImg.cloneNode(true));
        mazeList.classList.toggle("show");
        recursiveBacktracker(requestID, running);
    });
    document.getElementById("random").addEventListener("click", () => {
        setRunning(running, true);
        mazeBtn.textContent = "Random wall";
        mazeBtn.appendChild(arrowImg.cloneNode(true));
        mazeList.classList.toggle("show");
        genRandMaze(requestID, running);
    });

    // RUN PATHFINDER LISTENER
    document.getElementById("run").addEventListener("click", async () => {
        if(!running.bool){
            setRunning(running, true);
            updateNode();
            if(algo === "dijks"){
                path = await aStarAlgo(intervalID, false);
            } else if(algo === "astar"){    // if-else prevent astar to run during await
                path = await aStarAlgo(intervalID);
            }
            drawPath(path, 25, timeoutID);
        }
    });
    document.getElementById("clear").addEventListener("click", () => {
        if(!running.bool){
            for(let i of board){
                for(let node of i){
                    if(node.property == "wall"){
                        node.property = null;
                    }
                }
            }
            reDrawNode();
        }
    });
    
    // CANVAS LISTENERS
    canvas.addEventListener("mousedown", (e) => {
        if(running.bool) return;
        const [x, y] = getMousePos(e);
        let xTemp = x, yTemp = y;
        // check if drag
        if(board[x][y].property !== null && board[x][y].property !== "wall"){
            let property = board[x][y].property;

            canvas.onmousemove = (e) => {
                const [x, y] = getMousePos(e);
                if(board[x][y].property === null){
                    board[x][y].property = property;
                    if(x != xTemp || y != yTemp){
                        board[xTemp][yTemp].property = null;
                        xTemp = x;
                        yTemp = y;
                    }
                    //reDrawNode(); // redundancy for when highlightNode fail
                }
            }
        } else { // or draw wall
            swapPropWall(x, y);
            reDrawNode();
            let [xCur, yCur] = getMousePos(e);
            canvas.onmousemove = (e) => {
                const [x, y] = getMousePos(e);
                if(x == xCur && y == yCur) return;
                swapPropWall(x, y);
                xCur = x;
                yCur = y;
                reDrawNode();
            }
        }
    });
    canvas.addEventListener("mousemove", (e) => highlightNode(e));
    canvas.addEventListener("mouseup", () => canvas.onmousemove = null);
    canvas.addEventListener("dblclick", (e) => {
        const [x, y] = getMousePos(e);
        
    });
    canvas.addEventListener("mouseout", () => {
        if(running.bool) return;
        reDrawNode();
        canvas.onmousemove = null;
    });

    function highlightNode(e){
        if(running.bool) return;
        reDrawNode();
        const [x, y] = getMousePos(e);
        ctx.lineWidth = nodeLen/5;
        ctx.strokeRect(board[x][y].x, board[x][y].y, nodeLen, nodeLen);
    }
}

function resetBoard(){  
    board = [];
    ctx.reset();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    ctx.lineWidth = .25;
    // Init 2d board array
    for(let i=0; i < col; i++){
        board[i] = [];
        for(let j=0; j < row; j++){
            board[i][j] = {
                x: i*nodeLen,
                y: j*nodeLen,
                property: null
            }
            ctx.strokeRect(i*nodeLen, j*nodeLen, nodeLen, nodeLen);
        }
    }

    canvasImg = canvas.toDataURL();
    // Start and End point
    start.x = 1;
    start.y = 1;
    end.x = col-2;
    end.y = row-2;
    board[start.x][start.y].property = "start";
    ctx.fillStyle = "green";
    ctx.fillRect(board[start.x][start.y].x, board[start.x][start.y].y, nodeLen, nodeLen);

    board[end.x][end.y].property = "end"
    ctx.fillStyle = "red";
    ctx.fillRect(board[end.x][end.y].x, board[end.x][end.y].y, nodeLen, nodeLen);
}

// clear board and re draw
function reDrawNode(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    img.src = canvasImg;
    ctx.lineWidth = 1;
    for(let i of board){
        for(let node of i){
            switch(node.property){
                case "start":
                    fillNode(node.x, node.y, nodeLen, "green");
                    break;
                case "end":
                    fillNode(node.x, node.y, nodeLen, "red");
                    break;
                case "wall":
                    fillNode(node.x, node.y, nodeLen, "darkgray");
            }
        }
    }
}

// Update x, y index of mouse on board[]
function getMousePos(event){
    let x = Math.floor(event.offsetX / nodeLen);
    let y = Math.floor(event.offsetY / nodeLen);

    if(x > col-1) x = col-1;
    if(y > row-1) y = row-1;
    return [x, y];
}

function swapPropWall(x, y){
    if(board[x][y].property == null){
        board[x][y].property = "wall";
    } else if(board[x][y].property == "wall"){
        board[x][y].property = null;
    }
}

function updateNode(){ // update start and end xy coordinate
    for(let i=0; i < col; i++){
        for(let j=0; j < row; j++){
            if(board[i][j].property === "start"){
                start.x = i;
                start.y = j;
            }
            if(board[i][j].property === "end"){
                end.x = i;
                end.y = j;
            }
        }
    }
}

function setRunning(running, bool){
    if(running.bool != bool){
        running.bool = bool;
        document.getElementById("run").classList.toggle("grayout");
        document.getElementById("clear").classList.toggle("grayout");
    }
}

async function aStarAlgo(intervalID, heuristic=true, randStep=false){
    const nodes = [];
    if(heuristic){
        for(let i=0; i < col; i++){
            nodes[i] = [];
            for(let j=0; j < row; j++){
                nodes[i][j] = { // xPath yPath store previous node index to backtrack
                    dist: Number.POSITIVE_INFINITY, // dist from start
                    distToEnd: Math.abs(end.x - i) + Math.abs(end.y - j), // absolute dist from this to end (heuristic)
                    visited : false,
                    x: i,
                    y: j,
                    xPath: undefined,   // previous node x coordinate
                    yPath: undefined,   // previous node y coordinate
                    weight: 1,
                    fill: false
                }
            }
        }
    } else {
        for(let i=0; i < col; i++){
            nodes[i] = [];
            for(let j=0; j < row; j++){
                nodes[i][j] = { // xPath yPath store previous node index to backtrack
                    dist: Number.POSITIVE_INFINITY, // dist from start
                    distToEnd: 0,   // no heuristic = dijkstra's algorithm
                    visited : false,
                    x: i,
                    y: j,
                    xPath: undefined,   // previous node x coordinate
                    yPath: undefined,   // previous node y coordinate
                    weight: 1,
                    fill: false
                }
            }
        }
    }

    // get neighbor node from x, y (top, left, bot, right) if possible
    function getNeighbor(node){
        const neighbor = [];
        const x = node.x;
        const y = node.y;
        if((x + 1) < col && nodes[x+1][y].visited === false){
            if(board[x+1][y].property === null || board[x+1][y].property === "end"){
                neighbor.push(nodes[x+1][y]);
            }
        }
        if((y + 1) < row && nodes[x][y+1].visited === false){
            if(board[x][y+1].property === null || board[x][y+1].property === "end"){
                neighbor.push(nodes[x][y+1]);
            }
        }
        if(x > 0 && nodes[x-1][y].visited === false){
            if(board[x-1][y].property === null || board[x-1][y].property === "end"){
                neighbor.push(nodes[x-1][y]);
            }
        }
        if(y > 0 && nodes[x][y-1].visited === false){
            if(board[x][y-1].property === null || board[x][y-1].property === "end"){
                neighbor.push(nodes[x][y-1]);
            }
        }
        return neighbor;
    }

    // find node with min distance
    function getMinNode(nodesArr){
        let min = Number.POSITIVE_INFINITY;
        let minDistToEnd = 0;
        let minNode = null;

        for(let i=0; i < col; i++){
            for(let j=0; j < row; j++){
                if(nodesArr[i][j].visited === false){
                    let totalDist = nodesArr[i][j].dist + nodesArr[i][j].distToEnd;
                    // find min dist node and prioritize node closer to end
                    if(totalDist < min || (totalDist == min && nodesArr[i][j].distToEnd < minDistToEnd)){
                        min = totalDist;
                        minNode = nodesArr[i][j];
                        minDistToEnd = nodesArr[i][j].distToEnd;
                    }
                }
            }
        }
        return minNode;
    }
    
    let x = start.x;
    let y = start.y;
    nodes[x][y].dist = 0;
    nodes[x][y].fill = true;
    let neighbor = getNeighbor(nodes[x][y]);
    let path = [];

    return new Promise((resolve, reject) => {
        intervalID[0] = setInterval(async () => { // run astar on interval
            if(x == null || y == null){
                clearInterval(intervalID);
                resolve(path);
            }
            path = runAStar();
        }, 5);
    });

    function runAStar(){
        const curNode = getMinNode(nodes);
        if(curNode != null){
            neighbor = getNeighbor(curNode);
            curNode.visited = true;
            x = curNode.x;
            y = curNode.y;
        }
        for(let i=0; i < neighbor.length; i++){
            let xNb = neighbor[i].x;
            let yNb = neighbor[i].y;
            let newDist = curNode.dist + nodes[xNb][yNb].weight;
            if(newDist < nodes[xNb][yNb].dist){
                nodes[xNb][yNb].dist = curNode.dist + nodes[xNb][yNb].weight;
                nodes[xNb][yNb].xPath = x;
                nodes[xNb][yNb].yPath = y;
            }
            if(board[xNb][yNb].property === "end"){                
                // trace back from end to start
                const path = [];
                while(board[xNb][yNb].property !== "start"){                    
                    path.unshift([xNb, yNb]);
                    xTemp = xNb;
                    xNb = nodes[xNb][yNb].xPath;
                    yNb = nodes[xTemp][yNb].yPath;
                }
                x = null;
                y = null;
                return path;
            }
            if(nodes[xNb][yNb].fill === false){
                fillNode(board[xNb][yNb].x, board[xNb][yNb].y, nodeLen, "rgba(255, 215, 0, 0.2)");
                nodes[xNb][yNb].fill = true;
            }
        }
    }
}

function drawLine(x, y){
    ctx.lineTo(board[x][y].x + nodeLen/2, board[x][y].y + nodeLen/2);
    ctx.stroke();
}

function drawPath(path, delay, timeout){ // path, timeout array
    ctx.moveTo(board[start.x][start.y].x + nodeLen/2, board[start.x][start.y].y + nodeLen/2);              
    ctx.lineWidth = nodeLen / 6;
    ctx.strokeStyle = "white";
    
    let i = 0;
    for(p of path){
        timeout.push(setTimeout(drawLine, i*delay, p[0], p[1]));
        i++;
    }
}

function genRandMaze(requestID, runBool){
    let wall = [];
    let density = 3; // lower denser but not < 1
    const halfLen = Math.floor(nodeLen/2);

    for(let i=0; i < col; i++){
        for(let j=0; j < row; j++){
            if(board[i][j].property == null && Math.floor(Math.random()*(density+1)) == 1){
                wall.push({
                    x: board[i][j].x,
                    y: board[i][j].y
                });
                board[i][j].property = "wall";
            }
        }
    }

    let randWall = [];
    let drawPos = [];
    let speed = 1;
    while(wall.length){
        let w = wall.splice(Math.floor(Math.random()*wall.length), 1)[0]; // get random node
        if(w == null) continue;
        randWall.push(w);
        drawPos.push({
            x: w.x + halfLen,
            y: w.y + halfLen
        });
    }
    
    draw();

    function draw(){
        if(!randWall.length){
            setRunning(runBool, false);
            return;
        }
        if(randWall.length < speed) speed = randWall.length;
        for(let i=0; i < speed; i++){
            let len = (randWall[i].x + halfLen - drawPos[i].x)*2;
            fillNode(drawPos[i].x, drawPos[i].y, len, "darkgray");
            drawPos[i].x--;
            drawPos[i].y--;
        }
        if(drawPos[0].x < randWall[0].x){
            for(let i=0; i < speed; i++){
                drawPos.shift();
                randWall.shift();
            }
            speed+=(speed/(density+1));
        }
        requestID[0] = window.requestAnimationFrame(draw);
    }
}

function recursiveBacktracker(requestID, runBool){
    for(const col of board){
        for(node of col){
            if(node.property == null){
                node.property = "wall";
            }
        }
    }

    function getRandNeighbor(node){
        if(node == null) return [null, null];
        let neighbor = [];
        const [x, y] = node;

        if((x + 2) < col && board[x+2][y].property == "wall") neighbor.push(0);
        if((y + 2) < row && board[x][y+2].property == "wall") neighbor.push(1);
        if(x > 1 && board[x-2][y].property == "wall") neighbor.push(2);
        if(y > 1 && board[x][y-2].property == "wall") neighbor.push(3);

        if(!neighbor.length) return [null, null];
        const dir = neighbor[Math.floor(Math.random()*neighbor.length)];
        neighbor = [];

        if(dir == 0) neighbor.push([x+1, y], [x+2, y]);
        if(dir == 1) neighbor.push([x, y+1], [x, y+2]);
        if(dir == 2) neighbor.push([x-1, y], [x-2, y]);
        if(dir == 3) neighbor.push([x, y-1], [x, y-2]);
        return neighbor;
    }

    let stack = [[start.x, start.y]];
    let frame = 0;
    let skipFrame = 1;

    draw();
    function draw(){
        if(frame > 0){ // skip frame to hit target fps
            frame--;
            requestID[0] = window.requestAnimationFrame(draw);
            return;
        }

        let curNode = stack.at(-1);
        let [firstNode, nextNode] = getRandNeighbor(curNode);
        if(firstNode == null){  // backtrack
            if(stack.length < 2){
                reDrawNode();
                setRunning(runBool, false);
                return;
            }
            let [x1, y1] = stack.pop();
            let [x2, y2] = stack.pop();

            reDrawNode();
            if(board[x2][y2].property == null){
                fillNode(board[x1][y1].x, board[x1][y1].y, nodeLen, "rgba(255, 215, 0, .5)");
                fillNode(board[x2][y2].x, board[x2][y2].y, nodeLen, "rgba(255, 215, 0, 1)");
            }
            frame+=skipFrame;
            requestID[1] = window.requestAnimationFrame(draw);
            return;
        }

        let [x1, y1] = firstNode;
        let [x2, y2] = nextNode;
        if(board[x1][y1].property == "wall") board[x1][y1].property = null;
        if(board[x2][y2].property == "wall") board[x2][y2].property = null;
        stack.push(firstNode, nextNode);

        reDrawNode();
        fillNode(board[x1][y1].x, board[x1][y1].y, nodeLen, "rgba(255, 215, 0, .5)");
        fillNode(board[x2][y2].x, board[x2][y2].y, nodeLen, "rgba(255, 215, 0, 1)");
        frame+=skipFrame;
        requestID[2] = window.requestAnimationFrame(draw);
    }
}

function fillNode(x, y, len, color){
    ctx.fillStyle = color;
    ctx.fillRect(x, y, len, len);
}
///////////////////// OLD DIJKSTRA FUNCTION //////////////////////
// async function dijkstraAlgo(intervalID){
//     const node = [];
//     for(let i=0; i < col; i++){
//         node[i] = [];
//         for(let j=0; j < row; j++){
//             node[i][j] = { // xPath yPath store previous node index to backtrack
//                 dist: Number.POSITIVE_INFINITY, // dist from start
//                 visited : false,
//                 xPath: undefined,   // previous node x coordinate
//                 yPath: undefined,   // previous node y coordinate
//                 weight: 1,
//                 fill: false
//             }
//         }
//     }

//     // get neighbor node from x, y (top, left, bot, right) if possible
//     function getNeighbor(x, y){
//         const neighbor = [];
//         if((x + 1) < col && node[x+1][y].visited === false){
//             if(board[x+1][y].property === null || board[x+1][y].property === "end"){
//                 neighbor.push([x+1, y]);
//             }
//         }
//         if((y + 1) < row && node[x][y+1].visited === false){
//             if(board[x][y+1].property === null || board[x][y+1].property === "end"){
//                 neighbor.push([x, y+1]);
//             }
//         }
//         if(x > 0 && node[x-1][y].visited === false){
//             if(board[x-1][y].property === null || board[x-1][y].property === "end"){
//                 neighbor.push([x-1, y]);
//             }
//         }
//         if(y > 0 && node[x][y-1].visited === false){
//             if(board[x][y-1].property === null || board[x][y-1].property === "end"){
//                 neighbor.push([x, y-1]);
//             }
//         }
//         return neighbor;
//     }

//     // find node with min distance
//     function getMinNode(node){
//         let x = null;
//         let y = null;
//         let min = Number.POSITIVE_INFINITY;

//         for(let i=0; i < col; i++){
//             for(let j=0; j < row; j++){
//                 if(node[i][j].dist < min && node[i][j].visited === false){
//                     min = node[i][j].dist;
//                     x = i;
//                     y = j;
//                 }
//             }
//         }
//         return [x, y];
//     }
    
//     let x = start.x;
//     let y = start.y;
//     node[x][y].dist = 0;
//     let neighbor = getNeighbor(x, y);
//     let path = [];

//     return new Promise((resolve, reject) => {
//         intervalID[0] = setInterval(() => { // run dijkstra on interval
//             if(x == null || y == null){
//                 clearInterval(intervalID);
//                 if(path == null){
//                     throw "path null";
//                 } else {
//                     resolve(path);
//                 }
//             }
//             path = runDijkstra();
//         }, 5);
//     }).catch((err) => {
//         console.error(err);
//     });

//     function runDijkstra(){
//         const [xm, ym] = getMinNode(node);
//         x = xm;
//         y = ym;
//         if(x != null || y != null){
//             neighbor = getNeighbor(x, y);
//             node[x][y].visited = true;
//         }

//         for(let i=0; i < neighbor.length; i++){
//             let [xNeighbor, yNeighbor] = neighbor[i];
//             let newDist = node[x][y].dist + node[xNeighbor][yNeighbor].weight;
//             if(newDist < node[xNeighbor][yNeighbor].dist){
//                 node[xNeighbor][yNeighbor].dist = newDist;
//                 node[xNeighbor][yNeighbor].xPath = x;
//                 node[xNeighbor][yNeighbor].yPath = y;
//             }

//             if(board[xNeighbor][yNeighbor].property === "end"){                
//                 // trace back from end to start
//                 const path = [];
//                 while(board[xNeighbor][yNeighbor].property !== "start"){                    
//                     path.unshift([xNeighbor, yNeighbor]);
//                     xTemp = xNeighbor;
//                     xNeighbor = node[xNeighbor][yNeighbor].xPath;
//                     yNeighbor = node[xTemp][yNeighbor].yPath;
//                 }
//                 x = null;
//                 y = null;
//                 return path;
//             }

//             if(node[xNeighbor][yNeighbor].fill === false){
//                 ctx.fillStyle = "rgba(255, 215, 0, 0.2)";
//                 ctx.fillRect(board[xNeighbor][yNeighbor].x, board[xNeighbor][yNeighbor].y, nodeLen, nodeLen);
//             }
//             node[xNeighbor][yNeighbor].fill = true;
//         }
//     }
// }