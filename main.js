var cavnas = document.getElementById("canvas");
var context = canvas.getContext("2d");

class Cell{
    constructor(size){
        this.REFRACTORY_TIME = 150;
        this.ACTIVE_TIME = 50;
        this.AV_DELAY = 100;
        this.CONDUCTION_VELOCITY=1;
        this.REFRACTORY_VELOCITY=1;
        this.saLeakSlope = 0.2;
        this.avLeakSlope = 0.1;
        this.avDelay = this.AV_DELAY;
        this.threshold = 100;
        this.sinusArrhythmia = false;

        this.pos = new Vector(0,0);
        this.size = size;
        this.border = this.size/10;

        this.activeTime = this.ACTIVE_TIME;

        this.saNode = false;
        this.avNode = false;
        this.dead = false;
        this.state = 0;
        this.resting = 0;
        this.refractoryTime = this.REFRACTORY_TIME;
        this.refractory = false;
        this.potential = this.resting;
        this.color = this.inactiveColor;

        this.inactiveColor = "RGB(100,100,100)";
        this.activeColor = "RGB(0,255,0)";
        this.refractoryColor = "RGB(255,0,0)";
        this.delayColor = "RGB(255,255,0)";
        this.deadColor = "RGB(0,0,0)";
    }
    stimulate(n){
        if(!this.refractory && !this.dead){
            this.potential+=n;
            this.refractory = true;
        }
    }

    update(){
        if(this.saNode){
            this.potential +=this.saLeakSlope;
            if(this.sinusArrhythmia){
                this.saLeakSlope = Math.random()*0.3;
            }
        }
        if(this.avNode){
            this.potential += this.avLeakSlope;
        }

        if(this.potential>this.threshold){
            this.refractory=true;
        }


        if(this.potential>this.threshold){
            if(this.avNode){
                this.avDelay--;
                if(this.avDelay<0){
                    this.state = 1;
                    this.activeTime-=this.CONDUCTION_VELOCITY;
                    if(this.activeTime<0){
                        this.state = 0;
                        this.potential = 0;
                        this.activeTime = this.ACTIVE_TIME;
                        this.avDelay = this.AV_DELAY;
                    }
                }
            }else{
                this.state=1;
                this.activeTime-=this.CONDUCTION_VELOCITY;
                if(this.activeTime<0){
                    this.state = 0;
                    this.potential = 0;
                    this.activeTime = this.ACTIVE_TIME;
                }
            } 
            
        }
        if(this.refractoryTime<0){
            this.refractory=false;
            this.refractoryTime = this.REFRACTORY_TIME;
        }

        if(this.state ==1){
            this.color = this.activeColor;
        }
        if(this.state==0 && !this.refractory){
            this.color= this.inactiveColor;
        }
        if(this.refractory && this.state == 0){
            this.color=this.refractoryColor;
            this.refractoryTime-=this.REFRACTORY_VELOCITY;
        }
        if(this.dead){
            this.color = this.deadColor;
        }
        if(this.avNode && this.refractory && this.avDelay>0){
            this.color = this.delayColor;
        }
    }
}

class Heart{
    constructor(r,c,size){
        this.pos = new Vector(0,0);
        this.cellSize = size;
        this.col = c;
        this.row = r;
        this.array = [];
        this.septum = Math.floor(this.col/7);
        this.avNodeJ = Math.floor(this.col/3);
        this.vSeptumThickness = 2;
        this.avnode;
        this.sanode;
    }

    getIndex(i,j){
        var index = this.row*i+j;
        return index;
    }

    getCol(index){
        return index % this.row;
    }
    getRow(index){
        return (index - this.getCol(index))/this.col;
    }
    createCells(){
        for(var i=0; i<this.col;i++){
            for(var j=0; j<this.row;j++){
                var index = this.row*i+j;
                this.array[index] = new Cell(this.cellSize);
            }
        }
    }

    createAVnode(){
        var i = this.septum;
        var j = this.avNodeJ;
        var index = this.col*i+j;
        this.array[index].dead = false;
        this.array[index].avNode = true;
        this.avnode = this.array[index];
    }

    createSAnode(){
        this.sanode = this.array[this.getIndex(2,2)];
        this.array[this.getIndex(2,2)].saNode=true;
    }

    createSeptum(){
        for(var i=0; i<this.col;i++){
            for(var j=0; j<this.row;j++){
                var cell = this.array[this.getIndex(i,j)];
                if(i==this.septum){
                    cell.dead= true;
                }
            }
        }
    }

    createVentricles(){
        for(var i=0; i<this.col;i++){
            for(var j=0; j<this.row;j++){
                var cell = this.array[this.getIndex(i,j)];
                if(i>this.septum && i<this.row-5){
                    if(j==this.avNodeJ+this.vSeptumThickness||j==this.avNodeJ-this.vSeptumThickness){
                        cell.dead= true;
                    }
                }
            }
        }
    }

    neighbors(i,j){
        var neighbors = [];
        var top = this.row*(i-1)+j;
        var bottom = this.row*(i+1)+j;
        var left = this.row*(i)+j-1;
        var right = this.row*(i)+j+1;

        if(left>=0 && j-1>=0){
            neighbors.push(this.array[left]);
        }
        if(right<this.array.length && j+1<this.row){
            neighbors.push(this.array[right]);
        }
        if(top>=0 && i-1 >= 0){
            neighbors.push(this.array[top]);
        }
        if(bottom<this.array.length && i+1 <this.col){
            neighbors.push(this.array[bottom]);
        }
        return neighbors;

    }

    heartblock(){
        var i = this.septum-1;
        var j = this.avNodeJ;
        var index = this.col*i+j;
        var cell = this.array[index];
        if(cell.dead){cell.dead=false}else{cell.dead=true};
    }

    update(){
        for(var i=0; i<this.col;i++){
            for(var j=0; j<this.row;j++){
                var index = this.row*i+j;
                var cell = this.array[index];
                if (cell.state == 1){
                    if(this.neighbors(i,j).length>0){
                        var neighbors = this.neighbors(i,j);
                            for(var n = 0; n<neighbors.length;n++){
                                neighbors[n].stimulate(1000);
                            }
                        }
                    }
                cell.update();
            }
        }
    }

    render(context){
        for(var i=0; i<this.col;i++){
            for(var j=0; j<this.row;j++){
                var index = this.row*i+j;
                var cell = this.array[index];
                cell.pos.x = j*cell.size+this.pos.x;
                cell.pos.y = i*cell.size+this.pos.y;
                context.fillStyle = cell.color;
                context.fillRect(cell.pos.x,cell.pos.y,cell.size-cell.border,cell.size-cell.border);
            }
        }
    }
}

class Vector{
	constructor(x,y){this.x = x; this.y = y;}
    set(x,y){this.x=x;this.y=y;}
    normalize(){return new Vector(this.x/this.len(), this.y/this.len());}
    dot(v){return this.x*v.x + this.y+v.y;}
	setLen(n){
		var vN = this.norm();
		return new Vector(vN.x*n,vN.y*n);}
	add(v){return new Vector(this.x+v.x,this.y+v.y);}
	sub(v){return new Vector(this.x-v.x,this.y-v.y);}
	mult(n){return new Vector(this.x*n,this.y*n);}
	div(n){return new Vector(this.x/n,this.y/n);}
	len(){return Math.sqrt((this.x*this.x)+(this.y*this.y));}
	norm(){return this.div(this.len());}
	setAngle(a){
		var x = this.len()*Math.cos(a);
		var y = this.len()*Math.sin(a);
		return new Vector(x,y);
    }
	getAngle(){
		return Math.atan2(this.y,this.x);
	}
	setDir(v){
		this.toAngle(v.findAngle);
	}
}

class EKG{
    constructor(grid){
        this.grid = grid;
        var y = this.grid.array.length/this.grid.row*this.grid.array[0].size;
        this.bgPos = new Vector(0,y);
        this.pos = new Vector(0,0);
        this.indSize = 1.5;
        this.time = 0;
        this.width = this.grid.array.length/this.grid.col*this.grid.array[0].size;
        this.height = 100;
        this.size = new Vector(this.width,this.height);
        this.posArray = [];
        this.reading = 0;
        this.noise = 1000;
        this.resolution = 10;
        this.readingSpeed = 10;
        this.previousX = this.indSize+this.bgPos.x;
        this.previousY = this.size.y/2 - this.indSize/2+this.bgPos.y;
    }

    read(grid,col){
        this.reading = Math.random()*this.noise;
        for(var n=0; n<grid.array.length; n++){
            var cell = grid.array[n];
            var readStrength = grid.cellSize*2;
            if(true){
                if(cell.state==1 && cell.ACTIVE_TIME-cell.activeTime<50){
                    this.reading-=readStrength;
                }
                if(cell.refractory && cell.REFRACTORY_TIME-cell.refractoryTime>cell.REFRACTORY_TIME*0.9){
                    this.reading-=readStrength/2;
                }
            }
        }
        return this.reading/1000;
    }

    update(){
        // this.posArray.push(new Vector(this.time,Math.random()*2));
        var previousX = 0;
        var previousY = 0;
        var x = this.time/this.resolution;
        var y = this.read(this.grid,this.grid.col/2);
        this.pos.set(x,y);
        if(x>this.size.x){
            this.time=0;
        }
        this.time+=1;
    }

    render(context){
        
        
        var x = this.pos.x-this.indSize+this.bgPos.x;
        var y = this.pos.y + this.size.y/2 - this.indSize/2+this.bgPos.y;
        if(this.previousX<0){
            context.fillStyle = "RGB(0,0,0)";
            context.fillRect(this.bgPos.x,this.bgPos.y,this.size.x,this.size.y);
        }
        context.beginPath();
        context.strokeStyle = "RGB(0,255,0)";
        context.lineWidth = 2;
        context.moveTo(this.previousX,this.previousY);
        context.lineTo(x,y);
        context.stroke();
        this.previousX = x;
        this.previousY = y;
    }
}

var heart = new Heart(25,25,20);
heart.createCells();
heart.createSeptum();
heart.createVentricles();
heart.createAVnode();
heart.createSAnode();



var ekg = new EKG(heart);

window.addEventListener("mousedown",mouseDown);

function mouseDown(e){
    var mouseX = e.clientX;
    var mouseY = e.clientY;
    for(var n=0; n<heart.array.length;n++){
        var cell = heart.array[n];
        var diffX = mouseX-cell.pos.x;
        var diffY = mouseX-cell.pos.y;
        if(mouseX>cell.pos.x && mouseY > cell.pos.y && mouseX < cell.pos.x+cell.size && mouseY < cell.pos.y+cell.size){
            cell.stimulate(1000);
            console.log(n,heart.getCol(n),heart.getRow(n));
        }
    }
}

function update(){    
    heart.update();
    ekg.update();
    
}

function render(){
    heart.render(context);
    ekg.render(context);
}

var fps = 60;
var speed = 10;
function loop() {
    setTimeout(function() {
        for(var n=0;n<speed;n++){
            update();
        }
        render();
      requestAnimationFrame(loop);
    }, 1000 / fps);
}
requestAnimationFrame(loop);