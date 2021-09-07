// TODO: Record steps, say when a win happens
BLOCK_WIDTH = 15;

/**
 * Extract x/y position from a mouse event
 * @param {mouse event} evt 
 * @returns {object} The X/Y coordinates
 */
function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    if ('touches' in evt) {
        return {
            X: evt.touches[0].clientX - rect.left,
            Y: evt.touches[1].clientY - rect.top
        }
    }
    return {
        X: evt.clientX - rect.left,
        Y: evt.clientY - rect.top
    };
}

class Maze {
    /**
     * 
     * @param {string} domLoc ID of DOM element in which to place this canvas
     * @param {Image} image An image of a maze to load
     * @param {string} mazeInputStr ID of maze input menu
     * @param {string} exampleMazeStr ID of example maze input
     */
    constructor(domLoc, image, mazeInputStr, exampleMazeStr) {
        if (mazeInputStr === undefined) {
            mazeInputStr = "mazeInput";
        }
        if (exampleMazeStr === undefined) {
            exampleMazeStr = "exampleMazes";
        }
        this.mazeInputStr = mazeInputStr;
        this.exampleMazeStr = exampleMazeStr;
        this.I = [];
        this.visited = [];
        this.frontier = [];
        this.start = [0, 0];
        this.goal = [0, 0];
        this.current = [-1, -1];
        this.next = [-1, -1];
        this.container = document.getElementById(domLoc);
        this.container.innerHTML = "";
        this.mainContainer = document.createElement("div");
        this.container.appendChild(this.mainContainer);
        this.stepsDisp = document.createElement("p");
        this.stepsDisp.innerHTML = "0 Steps";
        this.mainContainer.append(this.stepsDisp);
        this.canvasContainer = document.createElement("div");
        this.container.appendChild(this.canvasContainer);
        this.canvas = null;
        this.ctx = null;
        this.steps = 0;
        this.reachedGoal = false;
        this.setupInput();
        if (!(image === null) && !(image === undefined)) {
            this.finalizeInput(image);
        }
    }

    step() {
        this.steps++;
        this.stepsDisp.innerHTML = this.steps + " steps";
    }

    finishMazeSetup() {
        // Dummy method.  Overridden for specific behavior for inheriting
        // classes that need to set stuff up once a maze is loaded
        this.expandFrontier();
    }

    finalizeInput(image) {
        this.image = image;
        let that = this;
        let canvas = document.createElement("canvas");
        let context = canvas.getContext("2d");
        canvas.width = image.width;
        canvas.height = image.height;
        context.drawImage(image, 0, 0);
        let data = context.getImageData(0, 0, image.width, image.height).data;
        that.I = [];
        that.visited = [];
        that.frontier = [];
        for (let i = 0; i < image.height; i++) {
            that.I[i] = [];
            that.visited[i] = [];
            that.frontier[i] = [];
            for (let j = 0; j < image.width; j++) {
                that.visited[i][j] = false;
                that.frontier[i][j] = false;
                const R = data[(i*(image.width*4)) + j*4];
                const G = data[(i*(image.width*4)) + j*4 + 1];
                const B = data[(i*(image.width*4)) + j*4 + 2];
                that.I[i][j] = true;
                if (R == 0 && G == 0 && B == 0) {
                    that.I[i][j] = false;
                }
                else if (R == 255 && G == 0 && B == 0) {
                    that.goal = [i, j];
                }
                else if (R == 0 && G == 0 && B == 255) {
                    that.start = [i, j];
                    that.visited[i][j] = true;
                }
            }
        }
        // Setup new canvas
        that.canvasContainer.innerHTML = "";
        that.canvasContainer.appendChild(document.createElement("hr"));
        that.canvas = document.createElement("canvas");
        that.canvasContainer.appendChild(that.canvas);
        that.ctx = that.canvas.getContext("2d");
        that.canvas.width = image.width * BLOCK_WIDTH;
        that.canvas.height = image.height * BLOCK_WIDTH;
        that.setupMouseListeners();
        that.finishMazeSetup();
        that.repaint();
    }

    setupInput() {
        const that = this;
        let mazeInput = document.getElementById(this.mazeInputStr);
        if (!(mazeInput === null)) {
            mazeInput.addEventListener('change', function(e) {
                let reader = new FileReader();
                reader.onload = function(e) {
                    let arrayBufferView = new Uint8Array(e.target.result);
                    let blob = new Blob([arrayBufferView], {type: mazeInput.files[0].type});
                    let urlCreator = window.URL || window.webkitURL;
                    let imageUrl = urlCreator.createObjectURL(blob);
                    let image = new Image();
                    image.src = imageUrl;
                    image.onload = function() {
                        that.finalizeInput(image);
                    }
                }
                reader.readAsArrayBuffer(mazeInput.files[0]);
            });
        }
        let exampleMazeMenu = document.getElementById(this.exampleMazeStr);
        if (!(exampleMazeMenu === null)) {
            exampleMazeMenu.addEventListener('change', function(e){
                let image = new Image();
                image.src = e.target.value;
                image.onload = function() {
                    that.finalizeInput(image);
                }
            });
        }
    }

    /**
     * Load a particular maze from a path
     * @param {string} path Path to maze image
     */
    loadMaze(path) {
        const that = this;
        let image = new Image();
        image.src = path;
        image.onload = function() {
            that.finalizeInput(image);
        };
    }
    
    makeClick(e) {
        let evt = (e == null ? event:e);
        evt.preventDefault();
        let mousePos = getMousePos(this.canvas, evt);
        let j = Math.floor(mousePos.X/BLOCK_WIDTH);
        let i = Math.floor(mousePos.Y/BLOCK_WIDTH);
        if (this.frontier[i][j]) {
            this.step();
            this.frontier[i][j] = false;
            this.visited[i][j] = true;
            if (i == this.goal[0] && j == this.goal[1]) {
                this.reachedGoal = true;
                alert("Reached goal!");
            }
            this.expandFrontier();
            this.repaint();
        }
    }

    setupMouseListeners() {
        this.canvas.addEventListener('mousedown', this.makeClick.bind(this));
        this.canvas.addEventListener('touchstart', this.makeClick.bind(this));
    }

    getNeighbors(i, j) {
        let neighbs = [];
        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (let k = 0; k < dirs.length; k++) {
            let i2 = i + dirs[k][0];
            let j2 = j + dirs[k][1];
            if (i2 >= 0 && i2 < this.I.length && j2 >= 0 && j2 < this.I[0].length) {
                // Check to see if this neighbor is occupied
                if (this.I[i2][j2]) {
                    neighbs.push([i2, j2]);
                }
            }
        }
        return neighbs;
    }

    expandFrontier() {
        const that = this;
        for (let i = 0; i < this.I.length; i++) {
            for (let j = 0; j < this.I[i].length; j++) {
                if (this.visited[i][j]) {
                    let neighbs = this.getNeighbors(i, j);
                    // Retain only the neighbors which are not yet on the frontier
                    for (let k = 0; k < neighbs.length; k++) {
                        const n = neighbs[k];
                        if (!that.frontier[n[0]][n[1]] && !that.visited[n[0]][n[1]]) {
                            that.frontier[n[0]][n[1]] = true;
                        }
                    }
                }
            }
        }
    }

    repaint() {
        if (!(this.ctx === null)) {
            this.ctx.fillStyle = "black";
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            for (let i = 0; i < this.I.length; i++) {
                for (let j = 0; j < this.I[i].length; j++) {
                    let toDraw = false;
                    if (this.visited[i][j]) {
                        toDraw = true;
                        this.ctx.fillStyle = "white";
                    }
                    else if (this.frontier[i][j]) {
                        toDraw = true;
                        this.ctx.fillStyle = "gray";
                    }

                    if (i == this.goal[0] && j == this.goal[1] && this.reachedGoal) {
                        toDraw = true;
                        this.ctx.fillStyle = "red";
                    }
                    else if (i == this.current[0] && j == this.current[1]) {
                        toDraw = true;
                        this.ctx.fillStyle = "blue";
                    }
                    else if (i == this.next[0] && j == this.next[1]) {
                        toDraw = true;
                        this.ctx.fillStyle = "cyan";
                    }


                    if (toDraw) {
                        this.ctx.fillRect(j*BLOCK_WIDTH, i*BLOCK_WIDTH, BLOCK_WIDTH, BLOCK_WIDTH);
                    }
                }
            }
        }
    }

}

class BFSDFS extends Maze {
    /**
     * 
     * @param {string} domLoc ID of DOM element in which to place this canvas
     * @param {Image} image An image of a maze to load
     * @param {boolean} bfs If true, do BFS.  If false, do DFS
     * @param {boolean} tree If true, do tree search.  If false, do graph search
     * @param {string} mazeInputStr ID of maze input menu
     * @param {string} exampleMazeStr ID of example maze input
     */
    constructor(domLoc, image, bfs, tree, mazeInputStr, exampleMazeStr) {
        super(domLoc, image, mazeInputStr, exampleMazeStr);
        const that = this;
        this.bfs = bfs;
        this.tree = tree;
        if (image === undefined || image === null) {
            this.queue = [];
        }
        let button = document.createElement("button");
        button.innerHTML = "Manual Step";
        this.mainContainer.appendChild(button);
        button.onclick = this.step.bind(this);
        // Setup animation buttons
        button = document.createElement("button");
        button.innerHTML = "Animate Slow";
        this.mainContainer.appendChild(button);
        this.animInterval = 100;
        this.animating = false;
        button.onclick = function() {
            that.animating = true;
            that.animInterval = 100;
            that.animate();
        }
        button = document.createElement("button");
        button.innerHTML = "Animate Fast";
        this.mainContainer.appendChild(button);
        button.onclick = function() {
            that.animating = true;
            that.animInterval = 10;
            that.animate();
        }
        button = document.createElement("button");
        button.innerHTML = "Stop Animation";
        this.mainContainer.appendChild(button);
        button.onclick = function() {
            that.animating = false;
        }
        button = document.createElement("button");
        button.innerHTML = "Reset";
        this.mainContainer.appendChild(button);
        button.onclick = this.reset.bind(this);
    }

    reset() {
        this.steps = 0;
        this.reachedGoal = false;
        this.animating = false;
        this.queue = [];
        for (let i = 0; i < this.frontier.length; i++) {
            for (let j = 0; j < this.frontier[i].length; j++) {
                this.visited[i][j] = false;
                this.frontier[i][j] = false;
            }
        }
        this.finishMazeSetup();
        this.repaint();
    }

    animate() {
        if (!this.reachedGoal && this.queue.length > 0 && this.animating) {
            this.step();
            this.repaint();
            if (this.reachedGoal) {
                this.animating = false;
            }
            setTimeout(this.animate.bind(this), this.animInterval);
        }
    }

    finishMazeSetup() {
        this.frontier[this.start[0]][this.start[1]] = true; 
        this.queue = [this.start];
        this.current = this.start;
        this.next = [-1, -1];
        this.numExpanded = 0;
    }

    step() {
        // Remove first element from frontier
        if (this.queue.length > 0 && !this.reachedGoal) {
            let s = null;
            if (this.bfs) { // BFS FIFO
                s = this.queue.shift();
            }
            else { // DFS LIFO
                s = this.queue.pop();
            }
            if (s[0] == this.goal[0] && s[1] == this.goal[1]) {
                this.reachedGoal = true;
            }
            else {
                this.current = [s[0], s[1]];
                if (!this.tree) {
                    // For graph search, remember 
                    this.visited[s[0]][s[1]] = true;
                    this.frontier[s[0]][s[1]] = false;
                }
                else {
                    // Check to see if it's still on the frontier (TODO: This is very inefficient)
                    let stillOn = false;
                    for (let i = 0; i < this.queue.length; i++) {
                        if (this.queue[i][0] == s[0] && this.queue[i][1] == s[1]) {
                            stillOn = true;
                            break;
                        }
                    }
                    if (!stillOn) {
                        this.frontier[s[0]][s[1]] = false;
                    }
                }
                let neighbs = this.getNeighbors(s[0], s[1]);
                for (let k = 0; k < neighbs.length; k++) {
                    let n = neighbs[k];
                    if (!this.visited[n[0]][n[1]] && !this.frontier[n[0]][n[1]]) {
                        this.frontier[n[0]][n[1]] = true;
                        this.queue.push([n[0], n[1]]);
                        this.numExpanded++;
                    }
                }
                if (this.queue.length > 0) {
                    this.next = [this.queue[0][0], this.queue[0][1]];
                }
                super.step();
                this.stepsDisp.innerHTML += ", " + this.queue.length + " nodes on ";
                if (this.bfs) {
                    this.stepsDisp.innerHTML += "queue";
                }
                else {
                    this.stepsDisp.innerHTML += "stack";
                }
                this.stepsDisp.innerHTML += ", " + this.numExpanded + " nodes expanded";
            }
            this.repaint();
        }
        else {
            alert("You already found the goal!");
        }
    }
}