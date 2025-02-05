let board = [];
let [row, col] = [20, 60];

const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth - 2 * (canvas.offsetLeft + 10);
let nodeLen = canvas.width / col;
canvas.height = nodeLen * row + 1;

let start = { x: null, y: null };
let end = { x: null, y: null };
let payload = { x: null, y: null };
let canvasImg; // blank canvas snapshot
let img = new Image();

function main() {
    let intervalID = []; // array pass by reference to clearInterval outside of func
    let timeoutID = [];
    let requestID = []; // array pass by reference to cancelAnimationFrame outside of func
    let running = { bool: false }; // boolean for running animation (pass by reference to modify inside of func)
    let path = []; // path to draw
    const Algo = Object.freeze({
        DIJKS: "Dijkstra's Algorithm",
        ASTAR: "A* Algorithm",
    });
    let currentAlgo = Algo.DIJKS;

    const algoBtn = document.getElementById("algo-btn");
    const mazeBtn = document.getElementById("maze-btn");
    const algoList = document.getElementById("algo");
    const mazeList = document.getElementById("maze");
    let arrowImg = document.createElement("img");
    arrowImg.src = document.getElementById("arrow-down").src;

    resetBoard();
    document.getElementById("overlay").addEventListener("click", () => {
        document
            .querySelectorAll("#tutorial-window, #settings-window, #overlay")
            .forEach((e) => e.classList.add("off"));
    });
    document.getElementById("info").addEventListener("click", () => {
        document
            .querySelectorAll("#tutorial-window, #overlay")
            .forEach((e) => e.classList.remove("off"));
    });
    document.getElementById("reset").addEventListener("click", () => {
        // clear all animation before reset
        for (let id of timeoutID) {
            clearTimeout(id);
        }
        clearInterval(intervalID);
        for (req of requestID) cancelAnimationFrame(req);
        setRunning(running, false);
        resetBoard();
    });

    // ALGORITHM BUTTON LISTENER
    document.getElementById("algo-btn").addEventListener("click", () => {
        algoList.classList.toggle("show");
        mazeList.classList.remove("show");
    });
    document.getElementById("algo-dijks").addEventListener("click", () => {
        algoBtn.textContent = Algo.DIJKS;
        currentAlgo = Algo.DIJKS;
        algoBtn.appendChild(arrowImg.cloneNode(true));
        algoList.classList.toggle("show");
    });
    document.getElementById("algo-astar").addEventListener("click", () => {
        algoBtn.textContent = Algo.ASTAR;
        currentAlgo = Algo.ASTAR;
        algoBtn.appendChild(arrowImg.cloneNode(true));
        algoList.classList.toggle("show");
    });
    // MAZE BUTTON LISTENER
    document.getElementById("maze-btn").addEventListener("click", () => {
        mazeList.classList.toggle("show");
        algoList.classList.remove("show");
    });
    document.getElementById("recursive").addEventListener("click", async () => {
        updateNode();
        mazeBtn.textContent = "Recursive backtracker";
        mazeBtn.appendChild(arrowImg.cloneNode(true));
        mazeList.classList.toggle("show");
        algoList.classList.remove("show");
        await genRandMaze(requestID, running, 1);
        reDrawNode();
        await new Promise((resolve) => setTimeout(resolve, 500));
        recursiveBacktracker(requestID, running);
    });
    document.getElementById("random").addEventListener("click", () => {
        mazeBtn.textContent = "Random wall";
        mazeBtn.appendChild(arrowImg.cloneNode(true));
        mazeList.classList.toggle("show");
        genRandMaze(requestID, running);
    });

    // RUN PATHFINDER LISTENER
    document.getElementById("run").addEventListener("click", async () => {
        if (!running.bool) {
            setRunning(running, true);
            updateNode();
            if (currentAlgo === Algo.DIJKS) {
                path = await aStarAlgo(intervalID, false);
            } else if (currentAlgo === Algo.ASTAR) {
                // if-else prevent astar to run during await
                path = await aStarAlgo(intervalID);
            }
            drawPath(path, 25, timeoutID);
        }
    });
    document.getElementById("clear").addEventListener("click", () => {
        if (!running.bool) {
            for (const i of board) {
                for (const node of i) {
                    if (node.property == "wall") {
                        node.property = null;
                    }
                }
            }
            reDrawNode();
        }
    });
    // SETTINGS LISTENER
    document.getElementById("settings-btn").addEventListener("click", () => {
        document
            .querySelectorAll("#settings-window, #overlay")
            .forEach((e) => e.classList.remove("off"));
    });
    document.querySelector(".settings").addEventListener("click", (event) => {
        const clickedEl = event.target;
        if (!clickedEl.classList.contains("board-size")) return;
        const sizeMap = {
            x: { size: [10, 30], label: "Extra Small", ini: "XS" },
            e: { size: [10, 30], label: "Extra Small", ini: "XS" },
            s: { size: [15, 45], label: "Small", ini: "S" },
            m: { size: [20, 60], label: "Medium", ini: "M" },
            l: { size: [25, 75], label: "Large", ini: "L" },
        };

        const prevSelected = document.querySelector(".board-size.selected");
        if (prevSelected) {
            prevSelected.classList.remove("selected");
            const prevKey = prevSelected.textContent.trim().toLowerCase()[0];
            prevSelected.textContent = sizeMap[prevKey].ini;
        }

        clickedEl.classList.add("selected");
        const selectedKey = clickedEl.textContent.trim().toLowerCase()[0];
        const { size, label } = sizeMap[selectedKey];
        [row, col] = size;
        clickedEl.textContent = label;

        resetBoard();
    });
    // CANVAS LISTENER
    canvas.addEventListener("mousedown", (e) => {
        if (running.bool) return;
        const [x, y] = getMousePos(e);
        let [xTemp, yTemp] = [x, y];
        // check if drag
        if (![null, "wall"].includes(board[x][y].property)) {
            let property = board[x][y].property;

            canvas.onmousemove = (e) => {
                // dragging
                const [x, y] = getMousePos(e);
                if (board[x][y].property === null) {
                    board[x][y].property = property;
                    if (x != xTemp || y != yTemp) {
                        board[xTemp][yTemp].property = null;
                        xTemp = x;
                        yTemp = y;
                    }
                    //reDrawNode(); // redundancy for when highlightNode fail
                }
            };
        } else {
            toggleWall(x, y);
            reDrawNode();
            let [xCur, yCur] = getMousePos(e);
            canvas.onmousemove = (e) => {
                const [x, y] = getMousePos(e);
                if (x == xCur && y == yCur) return;
                toggleWall(x, y);
                xCur = x;
                yCur = y;
                reDrawNode();
            };
        }
    });
    canvas.addEventListener("mousemove", (e) => highlightNode(e));
    canvas.addEventListener("mouseup", () => (canvas.onmousemove = null));
    // canvas.addEventListener("dblclick", (e) => {
    //     const [x, y] = getMousePos(e);
    // });
    canvas.addEventListener("mouseout", () => {
        if (running.bool) return;
        reDrawNode();
        canvas.onmousemove = null;
    });

    function highlightNode(e) {
        if (running.bool) return;
        reDrawNode();
        const [x, y] = getMousePos(e);
        ctx.lineWidth = nodeLen / 5;
        ctx.strokeRect(board[x][y].x, board[x][y].y, nodeLen, nodeLen);
    }
}

function resetBoard() {
    board = [];
    ctx.reset();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    ctx.lineWidth = 0.25;
    nodeLen = canvas.width / col;
    // Init 2d board array
    for (let i = 0; i < col; i++) {
        board[i] = [];
        for (let j = 0; j < row; j++) {
            board[i][j] = {
                x: i * nodeLen,
                y: j * nodeLen,
                property: null,
            };
            ctx.strokeRect(i * nodeLen, j * nodeLen, nodeLen, nodeLen);
        }
    }

    canvasImg = canvas.toDataURL();
    // Start and End
    start.x = 2;
    start.y = 2;
    end.x = col - 3;
    end.y = row - 3;
    board[start.x][start.y].property = "start";
    fillNode(
        board[start.x][start.y].x,
        board[start.x][start.y].y,
        nodeLen,
        "green"
    );
    board[end.x][end.y].property = "end";
    fillNode(board[end.x][end.y].x, board[end.x][end.y].y, nodeLen, "red");
}

// clear board and re draw
function reDrawNode() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    img.src = canvasImg;
    ctx.lineWidth = 1;
    for (let i of board) {
        for (let node of i) {
            switch (node.property) {
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
function getMousePos(event) {
    let x = Math.floor(event.offsetX / nodeLen);
    let y = Math.floor(event.offsetY / nodeLen);

    if (x > col - 1) x = col - 1;
    if (y > row - 1) y = row - 1;
    return [x, y];
}

function toggleWall(x, y) {
    if (board[x][y].property == null) {
        board[x][y].property = "wall";
    } else if (board[x][y].property == "wall") {
        board[x][y].property = null;
    }
}

function updateNode() {
    // update start and end xy coordinate
    for (let i = 0; i < col; i++) {
        for (let j = 0; j < row; j++) {
            if (board[i][j].property === "start") [start.x, start.y] = [i, j];
            else if (board[i][j].property === "end") [end.x, end.y] = [i, j];
        }
    }
}

function setRunning(running, bool) {
    if (running.bool != bool) {
        running.bool = bool;
        document.getElementById("run").classList.toggle("grayout");
        document.getElementById("clear").classList.toggle("grayout");
    }
}

function aStarAlgo(intervalID, heuristic = true, randStep = true) {
    const nodes = [];
    for (let i = 0; i < col; i++) {
        nodes[i] = [];
        for (let j = 0; j < row; j++) {
            nodes[i][j] = {
                // xPath yPath store previous node index to backtrack
                dist: Number.POSITIVE_INFINITY, // dist from start
                distToEnd: heuristic
                    ? Math.abs(end.x - i) + Math.abs(end.y - j)
                    : 0, // no heuristic = dijkstra's algorithm
                visited: false,
                x: i,
                y: j,
                xPath: undefined, // previous node x coordinate
                yPath: undefined, // previous node y coordinate
                weight: 1,
                fill: false,
            };
        }
    }

    // find node with min distance
    function getMinNode(nodesArr) {
        let minNode = null;
        let minTotalDist = Number.POSITIVE_INFINITY;
        let minDistToEnd = 0;

        for (const node of nodesArr.flat()) {
            if (!node.visited) {
                const totalDist = node.dist + node.distToEnd;
                if (
                    totalDist < minTotalDist ||
                    (totalDist === minTotalDist &&
                        node.distToEnd < minDistToEnd)
                ) {
                    minNode = node;
                    minTotalDist = totalDist;
                    minDistToEnd = node.distToEnd;
                }
            }
        }
        return minNode;
    }

    // get neighbor node from x, y (top, left, bot, right) if possible
    function getNeighbor(node, nodes) {
        const neighbor = [];
        const [x, y] = [node.x, node.y];
        const nullProp = [null, "end"];
        const directions = [
            [1, 0],
            [0, 1],
            [-1, 0],
            [0, -1],
        ];
        directions.forEach(([dx, dy]) => {
            const newX = x + dx;
            const newY = y + dy;
            if (newX >= 0 && newX < col && newY >= 0 && newY < row) {
                const curNode = nodes[newX][newY];
                if (
                    !curNode.visited &&
                    nullProp.includes(board[newX][newY].property)
                ) {
                    neighbor.push(curNode);
                }
            }
        });
        return neighbor;
    }

    let x = start.x;
    let y = start.y;
    nodes[x][y].dist = 0;
    nodes[x][y].fill = true;
    let neighbor = getNeighbor(nodes[x][y], nodes);
    let path = [];

    return new Promise((resolve) => {
        intervalID[0] = setInterval(() => {
            // run astar on interval
            if (x == null || y == null) {
                clearInterval(intervalID);
                resolve(path);
            }
            path = runAStar();
        }, 1);
    });

    function runAStar() {
        const curNode = getMinNode(nodes);
        if (curNode != null) {
            neighbor = getNeighbor(curNode, nodes);
            curNode.visited = true;
        }
        for (const curNb of neighbor) {
            let xNb = curNb.x;
            let yNb = curNb.y;
            let newDist = curNode.dist + nodes[xNb][yNb].weight;
            if (newDist < nodes[xNb][yNb].dist) {
                nodes[xNb][yNb].dist = curNode.dist + nodes[xNb][yNb].weight;
                [nodes[xNb][yNb].xPath, nodes[xNb][yNb].yPath] = [
                    curNode.x,
                    curNode.y,
                ];
            }
            if (board[xNb][yNb].property === "end") {
                // trace back from end to start
                const path = [];
                while (board[xNb][yNb].property !== "start") {
                    path.unshift([xNb, yNb]);
                    [xNb, yNb] = [nodes[xNb][yNb].xPath, nodes[xNb][yNb].yPath];
                }
                x = null;
                y = null;
                return path;
            }
            if (!nodes[xNb][yNb].fill) {
                fillNode(
                    board[xNb][yNb].x,
                    board[xNb][yNb].y,
                    nodeLen,
                    "rgba(255, 215, 0, 0.2)"
                );
                nodes[xNb][yNb].fill = true;
            }
        }
    }
}

function drawLine(x, y) {
    ctx.lineTo(board[x][y].x + nodeLen / 2, board[x][y].y + nodeLen / 2);
    ctx.stroke();
}

function drawPath(path, delay, timeout) {
    // path, timeout array
    ctx.moveTo(
        board[start.x][start.y].x + nodeLen / 2,
        board[start.x][start.y].y + nodeLen / 2
    );
    ctx.lineWidth = nodeLen / 6;
    ctx.strokeStyle = "white";

    let i = 0;
    for (p of path) {
        timeout.push(setTimeout(drawLine, i * delay, p[0], p[1]));
        i++;
    }
}

function genRandMaze(requestID, runBool, density = 5) {
    // lower denser
    let walls = [];
    const halfLen = Math.floor(nodeLen / 2);

    for (const cell of board.flat()) {
        if (
            cell.property == null &&
            Math.floor(Math.random() * density + 1) == 1
        ) {
            walls.push({ x: cell.x, y: cell.y });
            cell.property = "wall";
        }
    }

    // shuffle walls
    for (let i = walls.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [walls[i], walls[j]] = [walls[j], walls[i]];
    }
    const drawPos = walls.map((w) => ({ x: w.x + halfLen, y: w.y + halfLen }));
    let speed = 1;

    setRunning(runBool, true);
    return new Promise((resolve) => {
        function draw() {
            if (!walls.length) {
                setRunning(runBool, false);
                resolve();
                return;
            }
            speed = Math.min(walls.length, speed);
            // start drawing 'speed'# of node
            for (let i = 0; i < speed; i++) {
                const len = (walls[i].x + halfLen - drawPos[i].x) * 2;
                fillNode(drawPos[i].x, drawPos[i].y, len, "darkgray");
                drawPos[i].x--;
                drawPos[i].y--;
            }
            // stop drawing above node
            for (let i = 0; i < speed; i++) {
                if (drawPos[0].x < walls[0].x) {
                    drawPos.shift();
                    walls.shift();
                }
            }
            speed += speed / (density * 2 + 1); // go faster after each draw for smooth animation
            requestID[0] = requestAnimationFrame(draw);
        }
        draw();
    });
}

function recursiveBacktracker(requestID, runBool, skipFrame = 0.25) {
    setRunning(runBool, true);
    for (const col of board) {
        for (node of col) {
            node.property = node.property == null ? "wall" : node.property;
        }
    }

    function getRandNeighbor(node) {
        if (!node) return [null, null];
        const [x, y] = node;
        const directions = [
            [2, 0],
            [0, 2],
            [-2, 0],
            [0, -2],
        ];
        const validNeighbors = directions.filter(([dx, dy]) => {
            const newX = x + dx;
            const newY = y + dy;
            return (
                newX >= 0 &&
                newX < col &&
                newY >= 0 &&
                newY < row &&
                ["wall", "end"].includes(board[newX][newY].property)
            );
        });

        if (!validNeighbors.length) return [null, null];
        const [dx, dy] =
            validNeighbors[Math.floor(Math.random() * validNeighbors.length)];
        return [
            [x + dx / 2, y + dy / 2],
            [x + dx, y + dy],
        ];
    }

    const stack = [[start.x, start.y]];
    let frame = 2;
    let backtracking = false; // for animation only
    let reachEnd = false;

    draw();

    function draw() {
        if (frame > 0) {
            // skip frame to slow down (or speed up) animation
            frame--;
            requestID[0] = requestAnimationFrame(draw);
            return;
        }

        const curNode = stack.at(-1);
        let [firstNode, nextNode] = getRandNeighbor(curNode);
        if (
            firstNode == null ||
            (board[nextNode[0]][nextNode[1]].property == "end" && reachEnd)
        ) {
            // backtrack
            if (!backtracking) {
                // slow down animation at dead end before backtracking
                frame += skipFrame * 10 + 1;
                backtracking = true;
            }
            if (stack.length < 2) {
                reDrawNode();
                setRunning(runBool, false);
                return;
            }
            let [x1, y1] = stack.pop();
            let [x2, y2] = stack.pop();

            reDrawNode();
            if (board[x2][y2].property == null) {
                fillNode(
                    board[x1][y1].x,
                    board[x1][y1].y,
                    nodeLen,
                    "rgba(255, 215, 0, .5)"
                );
                fillNode(
                    board[x2][y2].x,
                    board[x2][y2].y,
                    nodeLen,
                    "rgba(255, 215, 0, 1)"
                );
            }
            frame += skipFrame;
            requestID[1] = requestAnimationFrame(draw);
            return;
        }

        backtracking = false;
        let [x1, y1] = firstNode;
        let [x2, y2] = nextNode;
        if (board[x2][y2].property == "end") reachEnd = true;
        if (board[x1][y1].property == "wall") board[x1][y1].property = null;
        if (board[x2][y2].property == "wall") board[x2][y2].property = null;
        stack.push(firstNode, nextNode);

        reDrawNode();
        fillNode(
            board[x1][y1].x,
            board[x1][y1].y,
            nodeLen,
            "rgba(255, 215, 0, .5)"
        );
        fillNode(
            board[x2][y2].x,
            board[x2][y2].y,
            nodeLen,
            "rgba(255, 215, 0, 1)"
        );
        frame += skipFrame;
        requestID[2] = requestAnimationFrame(draw);
    }
}

function fillNode(x, y, len, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, len, len);
}

main();
