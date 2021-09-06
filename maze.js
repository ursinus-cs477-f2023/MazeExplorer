BLOCK_WIDTH = 10;

class Maze {
    constructor() {
        this.I = [];
        this.explored = [];
        this.frontier = [];
        this.start = [0, 0];
        this.end = [0, 0];
        this.width = 0;
        this.height = 0;
        this.setupInput();

        this.canvasContainer = document.getElementById("canvasContainer");
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
                    that.explored = [];
                    that.frontier = [];
                    for (let i = 0; i < image.height; i++) {
                        that.I[i] = [];
                        that.explored[i] = [];
                        that.frontier[i] = [];
                        for (let j = 0; j < image.width; j++) {
                            that.explored[i][j] = false;
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
                            }
                        }
                    }
                    // Setup new canvas
                    that.canvasContainer.innerHTML = "";
                    that.canvas = document.createElement("canvas");
                    that.canvasContainer.appendChild(that.canvas);
                    that.context = that.canvas.getContext("2d");
                    that.canvas.width = image.width * BLOCK_WIDTH;
                    that.canvas.height = image.height * BLOCK_HEIGHT;

                    that.repaint.bind(that);
                }
            }
            reader.readAsArrayBuffer(mazeInput.files[0]);
        });
    }

    getNeighbors(i, j) {
        let neighbs = [];
        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (let k = 0; k < dirs.length; k++) {
            i2 = i + dirs[k][0];
            j2 = j + dirs[k][1];
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
        for (let i = 0; i < this.I.length; i++) {
            for (let j = 0; j < this.I[i].length; j++) {
                if (this.explored[i][j]) {

                }
            }
        }
    }

    repaint() {
        for (let i = 0; i < this.I.length; i++) {
            for (let j = 0; j < this.I[i].length; j++) {

            }
        }
    }

}
