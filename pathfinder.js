const row = 20;
const col = 50;
let board = [];

const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
canvas.width = Math.floor(window.innerWidth-canvas.offsetLeft);
const nodeLen = Math.floor(canvas.width / col);
canvas.height = nodeLen*row;

let xStart, yStart, xEnd, yEnd = row-1; // x, y is index
let canvasImg; // blank canvas snapshot
let img = new Image();

function runPathfinder(){
    let intervalID = []; // array pass by reference to clearInterval outside of function
    let timeout = [];
    let runningPath = false;

    resetBoard();
    document.getElementById("reset").addEventListener("click", () => {
        // clear all animation before reset
        for(let id of timeout){
            clearTimeout(id);
        }
        clearInterval(intervalID[0]);
        runningPath = false;

        resetBoard();
    });
    canvas.addEventListener("mousedown", (e) => {
        if(runningPath){
            return;
        }
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
                    reDrawNode(); // redundancy for when highlightNode fail
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

    canvas.addEventListener("mousemove", (e) => {
        if(!runningPath){
            highlightNode(e);
        }
    });
    canvas.addEventListener("mouseup", () => canvas.onmousemove = null);
    canvas.addEventListener("mouseout", () => canvas.onmousemove = null);
    document.getElementById("clear").addEventListener("click", () => {
        if(!runningPath){
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
    document.getElementById("dijkstra").addEventListener("click", async () => {
        if(!runningPath){
            runningPath = true;
            updateStart();
            path = await dijkstraAlgo(intervalID);
            drawPath(path, 25, timeout);
        }
    });
}

function resetBoard(){  
    board = [];
    ctx.reset();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    ctx.lineWidth = 1;
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

// clear board and re draw
function reDrawNode(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    img.src = canvasImg;
    ctx.lineWidth = 1;
    for(let i of board){
        for(let node of i){
            prop = node.property;
            switch(prop) {
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
                    ctx.fillRect(node.x, node.y, nodeLen, nodeLen);
            }
        }
    }
}

function highlightNode(e){
    reDrawNode();
    const [x, y] = getMousePos(e);
    ctx.lineWidth = nodeLen/5;
    ctx.strokeRect(board[x][y].x, board[x][y].y, nodeLen, nodeLen);
}

function createWall(x, y){
    if(board[x][y].property === null){
        board[x][y].property = "wall";

        ctx.fillStyle = "darkgray";
        ctx.fillRect(board[x][y].x, board[x][y].y, nodeLen, nodeLen);
    }
}

function updateStart(){
    for(let i=0; i < col; i++){
        for(let j=0; j < row; j++){
            if(board[i][j].property === "start"){
                xStart = i;
                yStart = j;
                return;
            }
        }
    }
}

async function dijkstraAlgo(intervalID){
    const node = [];
    for(let i=0; i < col; i++){
        node[i] = [];
        for(let j=0; j < row; j++){
            node[i][j] = { // xPath yPath store previous node index to backtrack
                dist: Number.POSITIVE_INFINITY,
                visited : false,
                xPath: undefined,
                yPath: undefined,
                weight: 1,
                fill: false
            }
        }
    }

    // get neighbor node from x, y (top, left, bottom, right) if possible
    function getNeighbor(x, y){
        const neighbor = [];
        if((x + 1) < col && node[x+1][y].visited === false){
            if(board[x+1][y].property === null || board[x+1][y].property === "end"){
                neighbor.push([x+1, y]);
            }
        }
        if((y + 1) < row && node[x][y+1].visited === false){
            if(board[x][y+1].property === null || board[x][y+1].property === "end"){
                neighbor.push([x, y+1]);
            }
        }
        if(x > 0 && node[x-1][y].visited === false){
            if(board[x-1][y].property === null || board[x-1][y].property === "end"){
                neighbor.push([x-1, y]);
            }
        }
        if(y > 0 && node[x][y-1].visited === false){
            if(board[x][y-1].property === null || board[x][y-1].property === "end"){
                neighbor.push([x, y-1]);
            }
        }
        return neighbor;
    }

    // find node with min distance
    function getMinNode(node){
        let x = null;
        let y = null;
        let min = Number.POSITIVE_INFINITY;

        for(let i=0; i < col; i++){
            for(let j=0; j < row; j++){
                if(node[i][j].dist < min && node[i][j].visited === false){
                    min = node[i][j].dist;
                    x = i;
                    y = j;
                }
            }
        }
        return [x, y];
    }
    
    let x = xStart, y = yStart;
    node[xStart][yStart].dist = 0;
    let neighbor = getNeighbor(x, y);
    let path = [];

    return new Promise((resolve, reject) => {
        intervalID[0] = setInterval(() => { // run dijkstra on interval
            if(x == null || y == null){
                clearInterval(intervalID);
                resolve(path);
            }
            path = runDijkstra();
        }, 5);
    })

    function runDijkstra(){
        const [xm, ym] = getMinNode(node);
        x = xm;
        y = ym;
        if(x != null || y != null){
            neighbor = getNeighbor(x, y);
            node[x][y].visited = true;
        }

        for(let i=0; i < neighbor.length; i++){
            let [xNeighbor, yNeighbor] = neighbor[i];
            let newDist = node[x][y].dist + node[xNeighbor][yNeighbor].weight;
            if(newDist < node[xNeighbor][yNeighbor].dist){
                node[xNeighbor][yNeighbor].dist = newDist;
                node[xNeighbor][yNeighbor].xPath = x;
                node[xNeighbor][yNeighbor].yPath = y;
            }

            if(board[xNeighbor][yNeighbor].property === "end"){                
                // trace back from end to start
                const path = [];
                while(board[xNeighbor][yNeighbor].property !== "start"){                    
                    path.unshift([xNeighbor, yNeighbor]);
                    xTemp = xNeighbor;
                    xNeighbor = node[xNeighbor][yNeighbor].xPath;
                    yNeighbor = node[xTemp][yNeighbor].yPath;
                }
                x = null;
                y = null;
                return path;
            }

            if(node[xNeighbor][yNeighbor].fill === false){
                ctx.fillStyle = "rgba(255, 215, 0, 0.2)";
                ctx.fillRect(board[xNeighbor][yNeighbor].x, board[xNeighbor][yNeighbor].y, nodeLen, nodeLen);
            }
            node[xNeighbor][yNeighbor].fill = true;
        }
    }
}

function drawLine(x, y){
    ctx.lineTo(board[x][y].x + nodeLen/2, board[x][y].y + nodeLen/2);
    ctx.stroke();
}

function drawPath(path, delay, timeout){ // path, timeout array
    if(path.length == 0){
        console.log(path);
    }
    ctx.moveTo(board[xStart][yStart].x + nodeLen/2, board[xStart][yStart].y + nodeLen/2);              
    ctx.lineWidth = nodeLen / 6;
    ctx.strokeStyle = "white";
    
    let i = 0;
    for(p of path){
        timeout.push(setTimeout(drawLine, i*delay, p[0], p[1]));
        i++;
    }
}

runPathfinder();