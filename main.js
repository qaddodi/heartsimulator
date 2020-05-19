var cavnas = document.getElementById("canvas");
var context = canvas.getContext("2d");

class Cell{
    constructor(size){
        this.REFRACTORY_TIME = 125;
        this.ACTIVE_TIME = 25;
        this.DELAY = 0;
        this.CONDUCTION_VELOCITY=1;
        this.REFRACTORY_VELOCITY=1;
        this.saLeakSlope = 0.2;
        this.avLeakSlope = 0.1;
        this.threshold = 100;
        this.delay = this.DELAY;

        this.pos = new Vector(0,0);
        this.size = size;
        this.border = this.size/10;
        this.vCell = false;
        this.aCell = false;

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
        this.vel = new Vector(0,0);

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
        }
        if(this.avNode){
            this.potential += this.avLeakSlope;
        }

        if(this.potential>this.threshold){
            this.refractory=true;
        }


        if(this.potential>this.threshold){
            this.delay--;
            if(this.delay<0){
                this.state=1;
                this.activeTime-=this.CONDUCTION_VELOCITY;
                if(this.activeTime<0){
                    this.state = 0;
                    this.potential = 0;
                    this.activeTime = this.ACTIVE_TIME;
                    this.delay = this.DELAY;
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
            this.vel.set(0,0);
            this.color= this.inactiveColor;
        }
        if(this.refractory && this.state == 0){
            this.color=this.refractoryColor;
            this.refractoryTime-=this.REFRACTORY_VELOCITY;
        }
        if(this.dead){
            this.color = this.deadColor;
        }
        if(this.refractory && this.delay>0){
            this.color = this.delayColor;
        }
    }
}

class Heart{
    constructor(r,c,size){
        this.AV_DELAY =120;
        this.pos = new Vector(0,0);
        this.cellSize = size;
        this.row = r;
        this.col = c;
        this.totalCells = this.col*this.row;
        this.cells = [];
        this.septum = Math.floor(this.row*0.2);
        this.avNodeJ = Math.floor(this.col*0.3);
        this.vSeptumThickness = 2;
        this.avnode;
        this.sanode;
    }

    createCells(){
        for(var i =0; i<this.row;i++){
            this.cells[i] = [];
            for(var j =0; j<this.col; j++){
                this.cells[i][j] = new Cell(this.cellSize);
                if(i<this.septum){this.cells[i][j].aCell = true;}
                if(i>this.septum){this.cells[i][j].vCell = true;}
                
            }
        }
    }

    createAVnode(){
        for(var i=0; i<this.cells.length;i++){
            for(var j=0; j<this.cells[i].length;j++){
                if(i==this.septum && j==this.avNodeJ){
                    this.cells[i][j].dead = false;
                    this.cells[i][j].avNode = true;
                    this.avnode = this.cells[i][j];
                    this.avnode.delay=this.AV_DELAY;
                    this.avnode.DELAY = this.AV_DELAY;
                }
            }
        }
    }

    createSAnode(){
        this.sanode = this.cells[2][2];
        this.cells[2][2].saNode=true;
    }

    createSeptum(){
        for(var i=0; i<this.cells.length;i++){
            for(var j=0; j<this.cells[i].length;j++){
                var cell = this.cells[i][j];
                if(i==this.septum){
                    cell.dead = true;
                }
            }
        }
    }

    createVentricles(){
        for(var i=0; i<this.cells.length;i++){
            for(var j=0; j<this.cells[i].length;j++){
                var cell = this.cells[i][j];
                if(i>this.septum+1 && i<this.row-2){
                    if(j==this.avNodeJ+this.vSeptumThickness||j==this.avNodeJ-this.vSeptumThickness){
                        cell.dead= true;
                    }
                }
            }
        }
    }

    findNeighbors(i,j){
        var neighbors = [];
        var cell = this.cells[i][j];
        if(i>0){
            var top = this.cells[i-1][j];
            if(!top.refractory){top.vel = top.vel.add(new Vector(0,-1));}
            neighbors.push(top);
            if(j>0){
                var topleft = this.cells[i-1][j-1];
                if(!topleft.refractory){topleft.vel = topleft.vel.add(new Vector(-1,-1));}
                neighbors.push(topleft);
            }
            if(j<this.col-1){
                var topright = this.cells[i-1][j+1];
                if(!topright.refractory){topright.vel = topright.vel.add(new Vector(1,-1));}
                neighbors.push(topright);
            }
        }
        if(i<this.row-1){
            var bottom = this.cells[i+1][j];
            if(!bottom.refractory){bottom.vel = bottom.vel.add(new Vector(0,1));}
            neighbors.push(bottom);
            if(j>0){
                var bottomleft = this.cells[i+1][j-1];
                if(!bottomleft.refractory){bottomleft.vel = bottomleft.vel.add(new Vector(-1,1));}
                neighbors.push(bottomleft);
            }
            if(j<this.col-1){
                var topright = this.cells[i+1][j+1];
                if(!topright.refractory){topright.vel = topright.vel.add(new Vector(1,1));}
                neighbors.push(topright);
            }
        }
        if(j>0){
            var left = this.cells[i][j-1];
            if(!left.refractory){left.vel = left.vel.add(new Vector(-1,0));}
            neighbors.push(left);
        }
        if(j<this.col-1){
            var right = this.cells[i][j+1];
            if(!right.refractory){right.vel = right.vel.add(new Vector(1,0));}
            neighbors.push(right);
        }
        
        return neighbors;
    }

    stimulateNeighbors(i,j){
        var neighbors = this.findNeighbors(i,j);
        if(neighbors.length>0){
            for(var x = 0; x<neighbors.length;x++){
                neighbors[x].stimulate(1000);
            }
        }
    }

    update(){
        for(var i=0; i<this.cells.length;i++){
            for(var j=0; j<this.cells[i].length;j++){
                var cell = this.cells[i][j];
                if (cell.state == 1){
                    this.stimulateNeighbors(i,j); 
                }
                cell.update();
            }
        }
    }

    render(context){
        context.fillStyle = "RGB(255,255,255)";
        context.fillRect(0,0,this.col*this.cellSize,this.row*this.cellSize);
        for(var i=0; i<this.cells.length;i++){
            for(var j=0; j<this.cells[i].length;j++){
                var cell = this.cells[i][j];
                cell.pos.x = (j)*cell.size+this.pos.x;
                cell.pos.y = (i)*cell.size+this.pos.y;
                context.fillStyle = cell.color;
                context.fillRect(cell.pos.x,cell.pos.y,cell.size-cell.border,cell.size-cell.border);
            }
        }
    }
}

class Pathology{
    constructor(heart){
        this.heart = heart;
        this.torsade = false;
        this.afib = false;
        this.vfib = false;
        this.vtach = false;

        this.HEARTBLOCK = false;
        this.LBBB = false;
        this.RBBB = false;
        this.WPW = false;
        this.MI = false;
        this.ISCHEMIA = false;

    }
    shock(){
        for(var i=0; i<this.heart.cells.length;i++){
            for(var j=0; j<this.heart.cells[i].length;j++){
                var cell = this.heart.cells[i][j];
                cell.potential = 0;
                cell.state = 0;
                cell.refractory = false;
                cell.activeTime = cell.ACTIVE_TIME;
                cell.refractoryTime = cell.REFRACTORY_TIME;
            }
        }
        this.torsade = false;
        this.afib = false;
        this.vfib = false;
        this.vtach = false;

        this.HEARTBLOCK = false;
        this.LBBB = false;
        this.RBBB = false;
        this.WPW = false;
        this.MI = false;
        this.ISCHEMIA = false;

        this.wpw(false);
        this.lbbb(false);
        this.rbbb(false);
        this.mi(false);
        
    }

    update(){
        if(this.vtach == true){
            var focus = heart.cells[25][25];
            if(Math.random()>0.9){
                focus.stimulate(1000);
            }
        }
        if(this.vfib==true){
            for(var i=0; i<this.heart.cells.length;i++){
                for(var j=0; j<this.heart.cells[i].length;j++){
                    var cell = this.heart.cells[i][j];
                    if(cell.vCell){
                        if(cell.REFRACTORY_TIME >1){
                            cell.REFRACTORY_TIME = 1;
                            cell.refractoryTime = 1;
                            cell.ACTIVE_TIME = 30;
                            cell.activeTime = 30;
                        }
                        if(Math.random()>0.999){
                            cell.stimulate(1000);
                        }
                    }
                }
            }
        }
        if(this.vfib==false){
            for(var i=0; i<this.heart.cells.length;i++){
                for(var j=0; j<this.heart.cells[i].length;j++){
                    var cell = this.heart.cells[i][j];
                    if(cell.vCell){
                        if(cell.REFRACTORY_TIME == 1){
                            cell.REFRACTORY_TIME = 125;
                            cell.refractoryTime = 125;
                            cell.ACTIVE_TIME = 25;
                            cell.activeTime = 25;
                        }
                    }
                }
            }
        }
        if(this.afib==true){
            for(var i=0; i<this.heart.cells.length;i++){
                for(var j=0; j<this.heart.cells[i].length;j++){
                    var cell = this.heart.cells[i][j];
                    if(cell.avNode){
                        if(Math.random()>0.7){
                            cell.refractory = true;
                        }
                    }
                    if(cell.aCell){
                        if(cell.REFRACTORY_TIME >1){
                            cell.REFRACTORY_TIME = 1;
                            cell.refractoryTime = 1;
                            cell.ACTIVE_TIME = 10;
                            cell.activeTime = 10;
                        }
                        if(Math.random()>0.999){
                            cell.stimulate(1000);
                        }
                    }
                }
            }
        }
        if(this.afib==false){
            for(var i=0; i<this.heart.cells.length;i++){
                for(var j=0; j<this.heart.cells[i].length;j++){
                    var cell = this.heart.cells[i][j];
                    if(cell.aCell){
                        if(cell.REFRACTORY_TIME == 1){
                            cell.REFRACTORY_TIME = 125;
                            cell.refractoryTime = 125;
                            cell.ACTIVE_TIME = 25;
                            cell.activeTime = 25;
                        }
                    }
                }
            }
        }
    }

    wpw(bool){
        if(bool){
            this.WPW=true;
            var i = this.heart.septum;
            for(var i =this.heart.septum;i<this.heart.row*0.25;i++){
                var j = 0;
                var cell = this.heart.cells[i][j];
                cell.delay = 20;
                cell.DELAY = 20;
                cell.dead = false;
                var j = 1;
                var cell = this.heart.cells[i][j];
                cell.dead=true;
            }
        }      
        if(!bool){
            this.WPW = false;
            var i = this.heart.septum;
            for(var i =this.heart.septum;i<this.heart.row*0.25;i++){
                var j = 0;
                var cell = this.heart.cells[i][j];
                cell.delay = 0;
                cell.DELAY = 0;
                if(i==this.heart.septum){
                    cell.dead = true;
                }
                var j = 1;
                var cell = this.heart.cells[i][j];
                if(i==this.heart.septum){
                    cell.dead = true;
                }else{
                    cell.dead=false;
                }
            }
        }
    }
    lbbb(bool){
        if(bool){
            this.LBBB=true;
            var i = this.heart.septum+1;
            var j1 = this.heart.avNodeJ+this.heart.vSeptumThickness;
            var j2 = this.heart.avNodeJ-this.heart.vSeptumThickness;
            var cell1 = this.heart.cells[i][j1];
            var cell3 = this.heart.cells[i+1][j1];
            cell1.dead=true;cell3.dead=true;
        }
        if(!bool){
            this.LBBB = false;
            var i = this.heart.septum+1;
            var j1 = this.heart.avNodeJ+this.heart.vSeptumThickness;
            var j2 = this.heart.avNodeJ-this.heart.vSeptumThickness;
            var cell1 = this.heart.cells[i][j1];
            var cell3 = this.heart.cells[i+1][j1];
            cell1.dead=false;cell3.dead=false;
        }
    }

    rbbb(bool){
        if(bool){
            this.RBBB=true;
            var i = this.heart.septum+1;
            var j1 = this.heart.avNodeJ+this.heart.vSeptumThickness;
            var j2 = this.heart.avNodeJ-this.heart.vSeptumThickness;
            var cell2 = this.heart.cells[i][j2];
            var cell4 = this.heart.cells[i+1][j2];
            cell2.dead=true;cell4.dead=true;
        }
        if(!bool){
            this.RBBB=false;
            var i = this.heart.septum+1;
            var j1 = this.heart.avNodeJ+this.heart.vSeptumThickness;
            var j2 = this.heart.avNodeJ-this.heart.vSeptumThickness;
            var cell2 = this.heart.cells[i][j2];
            var cell4 = this.heart.cells[i+1][j2];
            cell2.dead=false;cell4.dead=false;
        }
    }
       
    heartblock(bool){
        if(bool){
            this.HEARTBLOCK=true;
            var i = this.heart.septum-1;
            var j = this.heart.avNodeJ;
            var cell1 = this.heart.cells[i][j];
            var cell2 = this.heart.cells[i][j+1];
            var cell3 = this.heart.cells[i][j-1];
            cell1.dead=true;cell2.dead=true;cell3.dead=true;
        }
        if(!bool){
            this.HEARTBLOCK=false;
            var i = this.heart.septum-1;
            var j = this.heart.avNodeJ;
            var cell1 = this.heart.cells[i][j];
            var cell2 = this.heart.cells[i][j+1];
            var cell3 = this.heart.cells[i][j-1];
            cell1.dead=false;cell2.dead=false;cell3.dead=false;
        }
    }
    mi(bool){
        var top = 15;
        var bottom = this.heart.row;
        var right = this.heart.col;
        var left = 15;
        if(bool){
            this.MI = true;
            for(var i=0; i<this.heart.cells.length;i++){
                for(var j=0; j<this.heart.cells[i].length;j++){
                    var cell = this.heart.cells[i][j];
                    if(i>top  && j>left && i<bottom && j<right){
                        cell.inactiveColor = "RGB(50,50,50)";
                        cell.CONDUCTION_VELOCITY = 0.3;
                        cell.REFRACTORY_TIME = 50;
                    }
                }
            }
        }
        if(!bool){
            this.MI=false;
            for(var i=0; i<this.heart.cells.length;i++){
                for(var j=0; j<this.heart.cells[i].length;j++){
                    var cell = this.heart.cells[i][j];
                    if(i>top  && j>left && i<bottom && j<right){
                        cell.inactiveColor = "RGB(100,100,100)";
                        cell.CONDUCTION_VELOCITY = 1;
                    }
                }
            }
        }
    }
        
}

class Vector{
	constructor(x,y){this.x = x; this.y = y;}
    set(x,y){this.x=x;this.y=y;}
    normalize(){return new Vector(this.x/this.len(), this.y/this.len());}
    dot(v){return this.x*v.x + this.y*v.y;}
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
    render(context,v=new Vector(0,0),color="RGB(0,0,0)"){
        context.strokeStyle = color;
        context.beginPath();
        context.moveTo(v.x,v.y);
        context.lineTo(v.x+this.x,v.y+this.y);
        context.stroke();
    }
}

class Sensor{
    constructor(x,y){
        this.pos = new Vector(x,y);
        this.size = 5;

        this.reading = 0;

        this.stimPos = new Vector(0,0);
        this.oldStimPos = new Vector(0,0);
        this.stimVel = new Vector(0,0);

    }
    
    read(heart){
        this.reading = new Vector(0,0);
        var stimCount = 0;
        var refrCount = 0;
        this.stimVel.set(0,0);
        for(var i=0;i<heart.cells.length;i++){
            for(var j=0;j<heart.cells[i].length;j++){
                var cell = heart.cells[i][j];
                if(cell.state==1){
                    if(cell.vel.x<0){
                        stimCount--;
                    }
                    if(cell.vel.y<0){
                        stimCount--;
                    }
                    if(cell.vel.x>=0 && cell.vel.y>=0){
                        stimCount++;
                    }
                }
                if(cell.REFRACTORY_TIME-cell.refractoryTime>cell.REFRACTORY_TIME*0.8&&cell.state==0){
                    if(cell.vel.x<0){
                        refrCount-=0.1;
                    }
                    if(cell.vel.y<0){
                        refrCount-=0.1;
                    }
                    if(cell.vel.x>=0 && cell.vel.y>=0){
                        refrCount+=0.1;
                    }
                }
            }
        }
        this.reading = stimCount + refrCount;
        this.reading = this.reading/-30;
        return (this.reading);
    }
    render(context){
        context.fillStyle="RGB(0,0,255)";
        context.fillRect(this.pos.x-this.size/2,this.pos.y-this.size/2,this.size,this.size); 
    }
}

class EKG{
    constructor(heart){
        this.sensor1 = new Sensor(300,400);
        this.sensor2 = new Sensor(300,400);
        this.sensor3 = new Sensor(300,400);

        this.heart = heart;
        var y = this.heart.row*this.heart.cells[0][0].size;
        this.bgPos = new Vector(0,y);
        this.pos = new Vector(0,0);
        this.indSize = 1.5;
        this.time = 0;
        this.width = this.heart.col*this.heart.cells[0][0].size;
        this.height = 100;
        this.size = new Vector(this.width,this.height);
        this.poscells = [];
        this.reading = 0;
        this.noise = 2;
        this.resolution = 10;

        this.readingSpeed = 10;
        this.previousX = this.indSize+this.bgPos.x;
        this.previousY = this.size.y/2 - this.indSize/2+this.bgPos.y;
    }

    read(heart){
        this.reading = 0;
        var s1read = this.sensor1.read(heart);
        var s2read = this.sensor2.read(heart);
        var s3read = this.sensor3.read(heart);
        var lead1 = (s1read+s2read+s3read)/3;
        this.reading+=lead1;
        return this.reading;
    }

    update(){
        var x = this.time/this.resolution;
        var y = this.read(this.heart,this.heart.col/2);
        this.pos.set(x,y);
        if(x>this.size.x){
            this.time=0;
        }
        this.time+=1;
    }

    render(context){
        var x = this.pos.x-this.indSize+this.bgPos.x;
        var y = this.pos.y + this.size.y/2 - this.indSize/2+this.bgPos.y;
        if(this.previousX<this.indSize){
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

var heart = new Heart(50,40,10);
heart.createCells();
heart.createSeptum();
heart.createVentricles();
heart.createAVnode();
heart.createSAnode();

var path = new Pathology(heart);

var ekg = new EKG(heart);

window.addEventListener("mousedown",mouseDown);

function mouseDown(e){
    var mouseX = e.offsetX;
    var mouseY = e.offsetY;
    for(var i=0; i<heart.cells.length;i++){
        for(var j=0; j<heart.cells[i].length;j++){
            var cell = heart.cells[i][j];
            if(mouseX>cell.pos.x && mouseY > cell.pos.y && mouseX < cell.pos.x+cell.size+cell.border && mouseY < cell.pos.y+cell.size+cell.border){
                cell.stimulate(1000);
            }
        }
    }
}

function update(){  
    path.update();  
    heart.update();
    ekg.update();
}

function render(){
    heart.render(context);
    ekg.render(context);
}

var fps = 60;
var speed = 5;
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