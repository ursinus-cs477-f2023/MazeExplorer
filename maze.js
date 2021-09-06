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
    constructor() {
        this.I = [];
        this.visited = [];
        this.frontier = [];
        this.start = [0, 0];
        this.end = [0, 0];
        this.canvasContainer = document.getElementById("canvasContainer");
        this.canvas = null;
        this.ctx = null;
        this.setupInput();
    }

    setupInput() {
        const that = this;
        let mazeInput = document.getElementById('mazeInput');
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
                                that.end = [i, j];
                            }
                            else if (R == 0 && G == 0 && B == 255) {
                                that.start = [i, j];
                                that.visited[i][j] = true;
                            }
                        }
                    }
                    // Setup new canvas
                    that.canvasContainer.innerHTML = "";
                    that.canvas = document.createElement("canvas");
                    that.canvasContainer.appendChild(that.canvas);
                    that.ctx = that.canvas.getContext("2d");
                    that.canvas.width = image.width * BLOCK_WIDTH;
                    that.canvas.height = image.height * BLOCK_WIDTH;
                    that.setupMouseListeners();
                    that.expandFrontier();
                    that.repaint();
                }
            }
            reader.readAsArrayBuffer(mazeInput.files[0]);
        });
    }

    makeClick(e) {
        let evt = (e == null ? event:e);
        evt.preventDefault();
        let mousePos = getMousePos(this.canvas, evt);
        let j = Math.floor(mousePos.X/BLOCK_WIDTH);
        let i = Math.floor(mousePos.Y/BLOCK_WIDTH);
        console.log(i, ",", j);
        if (this.frontier[i][j]) {
            this.frontier[i][j] = false;
            this.visited[i][j] = true;
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
        console.log("Repainting");
        if (!(this.ctx === null)) {
            this.ctx.fillStyle = "black";
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            for (let i = 0; i < this.I.length; i++) {
                for (let j = 0; j < this.I[i].length; j++) {
                    if (this.I[i][j]) {
                        if (this.visited[i][j]) {
                            this.ctx.fillStyle = "white";
                        }
                        else if (this.frontier[i][j]) {
                            this.ctx.fillStyle = "gray";
                        }
                        else if (this.I[i][j]) {
                            this.ctx.fillStyle = "black";
                        }
                        this.ctx.fillRect(j*BLOCK_WIDTH, i*BLOCK_WIDTH, BLOCK_WIDTH, BLOCK_WIDTH);
                    }
                }
            }
        }
    }

}
