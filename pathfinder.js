const row = 25;
const col = 75;
let board = [];

const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth-2*canvas.offsetLeft;
const nodeLen = canvas.width/col;
canvas.height = nodeLen*row;

let xStart, yStart, xEnd, yEnd; // x, y is index
let canvasImg; // blank canvas snapshot
let img = new Image();

main();

function main(){
    console.log("Row", row, "\nCol", col, "\nCanvas widdth", canvas.width, "\nnodeLen", nodeLen);

    let intervalID = []; // array pass by reference to clearInterval outside of func
    let timeoutID = [];
    let requestID = []; // array pass by reference to cancelAnimationFrame outside of func
    let running = {bool:false}; // pass by reference (to stop animation)
    let algo = "dijks";
    let path = [];

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
    document.getElementById("reset").addEventListener("click", () => {
        // clear all animation before reset
        for(let id of timeoutID){
            clearTimeout(id);
        }
        clearInterval(intervalID);
        cancelAnimationFrame(requestID);
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
        mazeBtn.textContent = "Recursive backtracker";
        mazeBtn.appendChild(arrowImg.cloneNode(true));
        mazeList.classList.toggle("show");
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
            createWall(x, y);
            canvas.onmousemove = (e) => {
                const [x, y] = getMousePos(e);
                createWall(x, y);
            }
        }
    });
    canvas.addEventListener("mousemove", (e) => highlightNode(e));
    canvas.addEventListener("mouseup", () => {
        canvas.onmousemove = null;
    });
    canvas.addEventListener("dblclick", (e) => {
        const [x, y] = getMousePos(e);
        if(board[x][y].property === "wall"){
            board[x][y].property = null;
            reDrawNode;
        }
    });
    canvas.addEventListener("mouseout", () => {
        reDrawNode();
        canvas.onmousemove = null
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
    // clear board and re draw
    function reDrawNode(){
        if(running.bool) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        img.src = canvasImg;
        ctx.lineWidth = 1;
        for(let i of board){
            for(let node of i){
                switch(node.property){
                    case "start":
                        ctx.fillStyle = "green";
                        ctx.fillRect(node.x, node.y, nodeLen, nodeLen);
                        break;
                    case "end":
                        ctx.fillStyle = "red";
                        ctx.fillRect(node.x, node.y, nodeLen, nodeLen);
                        break;
                    case "wall":
                        ctx.fillStyle = "darkgray";
                        ctx.fillRect(node.x, node.y, nodeLen-1, nodeLen-1);
                }
            }
        }
    }
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
    xStart = 1, yStart = 1, xEnd = col-2, yEnd = row-2;
    board[xStart][yStart].property = "start";
    ctx.fillStyle = "green";
    ctx.fillRect(board[xStart][yStart].x, board[xStart][yStart].y, nodeLen, nodeLen);

    board[xEnd][yEnd].property = "end"
    ctx.fillStyle = "red";
    ctx.fillRect(board[xEnd][yEnd].x, board[xEnd][yEnd].y, nodeLen, nodeLen);
}

// Update x, y index of mouse on board[]
function getMousePos(event){
    let x = Math.floor(event.offsetX / nodeLen);
    let y = Math.floor(event.offsetY / nodeLen);

    if(x > col-1) x = col-1;
    if(y > row-1) y = row-1;
    return [x, y];
}

function createWall(x, y){
    if(board[x][y].property === null){ //|| rightClick.bool === false
        board[x][y].property = "wall";

        ctx.fillStyle = "darkgray";
        ctx.fillRect(board[x][y].x, board[x][y].y, nodeLen-1, nodeLen-1);
    }
}

function updateNode(){ // update start and end xy coordinate
    for(let i=0; i < col; i++){
        for(let j=0; j < row; j++){
            if(board[i][j].property === "start"){
                xStart = i;
                yStart = j;
            }
            if(board[i][j].property === "end"){
                xEnd = i;
                yEnd = j;
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

async function aStarAlgo(intervalID, heuristic=true){
    const nodes = [];
    if(heuristic){
        for(let i=0; i < col; i++){
            nodes[i] = [];
            for(let j=0; j < row; j++){
                nodes[i][j] = { // xPath yPath store previous node index to backtrack
                    dist: Number.POSITIVE_INFINITY, // dist from start
                    distToEnd: Math.abs(xEnd - i) + Math.abs(yEnd - j), // absolute dist from this to end (heuristic)
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
        let x = node.x;
        let y = node.y;
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
    
    let x = xStart;
    let y = yStart;
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
        const node = getMinNode(nodes);
        if(node != null){
            neighbor = getNeighbor(node);
            node.visited = true;
            x = node.x;
            y = node.y;
        }
        for(let i=0; i < neighbor.length; i++){
            let xNb = neighbor[i].x;
            let yNb = neighbor[i].y;
            let newDist = node.dist + nodes[xNb][yNb].weight;
            if(newDist < nodes[xNb][yNb].dist){
                nodes[xNb][yNb].dist = node.dist + nodes[xNb][yNb].weight;
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
                ctx.fillStyle = "rgba(255, 215, 0, 0.2)";
                ctx.fillRect(board[xNb][yNb].x, board[xNb][yNb].y, nodeLen, nodeLen);
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
    ctx.moveTo(board[xStart][yStart].x + nodeLen/2, board[xStart][yStart].y + nodeLen/2);              
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
    let density = 4; // lower denser but not < 1
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
    let speed = 10;
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
            ctx.fillStyle = "darkgray";
            ctx.fillRect(drawPos[i].x, drawPos[i].y, len, len);
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
    
//     let x = xStart;
//     let y = yStart;
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