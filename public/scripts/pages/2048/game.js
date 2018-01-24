/**
 * @description：game
 * @time: 2018-01-23
 */
'use strict';
import Tile from 'pages/2048/tile';
import TileMap from 'pages/2048/tileMap';

class Game{
   constructor(config){
      this.container = config.container;
      this.width = config.width;
      this.height = config.height;
      this.loader = null;
      this.score = 0;
      this.best = 0;
      this.lastScore = 0;
      this.movingX = false;
      this.maxNum = 0;
      this.steps = 0;
      this.tileCache = [];
      this.tileMap = null;
      this.loadImages();
   }
   loadImages(){
      this.loader = new Hilo.LoadQueue();
      this.loader.add([
         {id: 'bg', src: '/images/pages/bg.png'},
         {id: 'logo', src: '/images/pages/logo.png'},
         {id: 'restartBtn', src: '/images/pages/btn-restart.png'}
      ]).on('complete', ()=>{
         this.initStage();
      }).start();
   }
   initStage(){
      //舞台
      /*stage:舞台是可视对象树的根，可视对象只有添加到舞台或其子对象后才会被渲染出来。
               创建一个hilo应用一般都是从创建一个stage开始的
         Container是所有容器类的基类。每个Container都可以添加其他可视对象为子级。
         View类是所有可视对象或组件的基类。
      */
      this.stage = new Hilo.Stage({
         canvas: this.container,//舞台所对应的画布，可以是canvas或者是一个普通的div
         width: this.width,
         height: this.height
      });
      //背景
      //DOMElement是dom元素的包装。
      let bg = new Hilo.DOMElement({
         id: 'bg',
         width: this.width,
         height: this.height,
         element: Hilo.createElement('div', {
            style: {
               position: 'absolute',
               background: `url(${this.loader.get('bg').src}) repeat`
            }
         })
      });
      //console.log(bg, this.stage)
      this.stage.addChild(bg);
      //计时
      //Ticker是一个定时器类。它可以按指定帧率重复运行，从而按计划执行代码。
      this.ticker = new Hilo.Ticker(60);
      //添加定时器对象。定时器对象必须实现 tick 方法。
      this.ticker.addTick(Hilo.Tween);
      this.ticker.addTick(this.stage);
      //启动定时器
      this.ticker.start();

      this.bindEvent();
      this.showStartup(true);

   }
   bindEvent(){
      let pointStart = Hilo.event.POINTER_START,
          pointEnd = Hilo.event.POINTER_END;
      //enableDOMEvent(type:String|Array, enabled:Boolean)
      //String|Array表示开启/关闭的事件名称或数组
      //第二个参数为Boolean, 默认为true,表示开启, false表示关闭
      //enableDOMEvent:开启/关闭舞台的DOM事件响应。要让舞台上的可视对象响应用户交互，
      //必须先使用此方法开启舞台的相应事件的响应。
      this.stage.enableDOMEvent([pointStart, pointEnd], true);
      //on(type:String, listener:Function, once:Boolean)
      //增加事件监听
      this.stage.on(pointStart, this.onPointStart);
      this.stage.on(pointEnd, this.onPointEnd);
   }
   onPointStart = (e) => {
      console.log(e)
      this.startX = this.state == 'play' ? e.stageX : -1;
      this.startY = this.state == 'play' ? e.stageY : -1;
      console.log(this.startX)
   }
   onPointEnd = (e) => {
      let minDelta = 2;
      if(this.startX < 0 || this.startY < 0){
         return;
      }
      let deltaX = e.stageX - this.startX, 
          absX = Math.abs(deltaX),
          deltaY = e.stageY - this.startY,
          absY = Math.abs(deltaY);
      if(absX < minDelta && absY < minDelta){
         return;
      }
      var direction;
      if(absX >= absY){
         direction = deltaX > 0 ? 39 : 37;//37：左，39：右
      }else{
         direction = deltaY > 0 ? 40 : 38;//38：上，40：下
      }
      this.moveTiles(direction);
   }
   showStartup(show){
      if(!this.startup){
         this.startup = new Hilo.Container({
            id: 'startup',
            width: this.width,
            height: this.height
         });
         let logo = new Hilo.Bitmap({
            id: 'logo',
            image: this.loader.get('logo').content
         });
         //getScaledWidth:返回可视对象缩放后的宽度。
         //getScaledHeight: 返回可视对象缩放后的高度。
         logo.x = (this.width - logo.getScaledWidth())/2;
         logo.y = (this.height - logo.getScaledHeight())/2;

         let startBtn = new Hilo.DOMElement({
            id: 'startBtn',
            width: logo.getScaledWidth(),
            height: 45,
            element: Hilo.createElement('div', {
               innerHTML: 'Start Game',
               className: 'btn'
            })
         }).on(Hilo.event.POINTER_START, ()=>{
            this.startGame();
         });
         startBtn.x = (this.width - startBtn.getScaledWidth())/2;
         startBtn.y = logo.y + logo.getScaledHeight() + 50;
         this.startup.addChild(logo, startBtn);
      }
      if(show){
         this.stage.addChild(this.startup);
      }else{
         this.stage.removeChild(this.startup);
      }
   }
   
   startGame(){
      this.state = 'play';
      this.showStartup(false);
      //console.log(this.startX, this.startY)
      this.score = 0;
      this.localScore = 0;
      this.steps = 0;
      this.maxNum = 2;
      this.movingX = false;
      this.best = this.saveBestScore();
      this.updateScore(false, true);
      if(this.tileCache.length == 0){
         this.initTiles();
      }
      this.tileCache = this.tileCache.concat(this.tileMap.getAllTiles());
      this.tileMap.reset();
      //初始化格子容器
      if(!this.tileContainer){
         this.tileContainer = new Hilo.Container({
            id: 'tileContainer',
            width: this.width,
            height: this.height
         })
         this.stage.addChild(this.tileContainer);
      }
      this.tileContainer.removeAllChildren();
      this.initToolBar();
      //放置初始格子
      var numStartTiles = 2, startTiles = [];
      //初始化2个格子
      /*步骤：1.生成一个4*4的数组，并创建16个格子放入数组；
               2.初始化时，从数组取出2个，获取空的随机位置，然后放入格子；
               3.获取生成的随机数（2或者4），改变格子的数字；
               4.并在数组中相应的位置放入格子对象；
               5.把此格子加入到父容器中*/
      while(numStartTiles--){
         var tile = this.tileCache.pop();
         var pos = this.tileMap.getRandomEmptyPosition();
         tile.setPosition(pos.x, pos.y);//设置放置格子的位置
         tile.change(Tile.randomNumber(1, 2));//设置放置格子的数字
         this.tileMap.set(pos.x, pos.y, tile);
         this.tileContainer.addChild(tile);
         this.maxNum = Math.max(this.maxNum, tile.number)
      }
   }
   initToolBar(){
      if(!this.toolBar){
         this.toolBar = new Hilo.Container({
            id: 'toolbar',
            width: this.width,
            height: this.height
         });
         var restartBtn = new Hilo.Bitmap({
            id: 'restartBtn',
            image: this.loader.get('restartBtn').content,
            scaleX: 0.4,
            scaleY: 0.4
         }).on(Hilo.event.POINTER_START, ()=>{
            this.startGame();
         })
         restartBtn.x = this.width - restartBtn.getScaledWidth() - Tile.startX;
         restartBtn.y = 20;
         var scoreView = new Hilo.DOMElement({
            id: 'scoreView',
            width: 70,
            height: 45,
            element: Hilo.createElement('div', {
               className: 'info-box',
               innerHTML: '<p class="small-text">SCORE</p><p id="score" class="number">'+ this.score +'</p>'
            })
         });
         scoreView.x = Tile.startX;
         scoreView.y = 20;

         var bestView = new Hilo.DOMElement({
            id: 'bestView',
            width: 70,
            height: 45,
            element: Hilo.createElement('div', {
               className: 'info-box',
               innerHTML: '<p class="small-text">BEST</p><p id="best" class="number">'+ this.best +'</p>',
            })
         });
         bestView.x = scoreView.x + bestView.getScaledWidth() + 20;
         bestView.y = 20;

         this.toolBar.addChild(restartBtn, scoreView, bestView);
      }
      this.stage.addChild(this.toolBar);
      this.updateScore();
   }
   initTiles(){
      let margin = 30, border = 10;
      console.log(Tile.tileGap)
      Tile.tileGap = 8;
      Tile.tileBorder = 10;
      Tile.tileSize = (this.width - margin * 2 - border * 2 - Tile.tileGap * 3)/4;
      Tile.tileSize = Math.min(Tile.tileSize, 65);
      let bgSize = this.width - margin * 2;
      Tile.tileBorder = (bgSize - (Tile.tileSize * 4 + Tile.tileGap * 3))/2;
      //格子背景
      var ninebg = new Hilo.DOMElement({
         id: 'ninebg',
         width: bgSize,
         height: bgSize,
         alpha: 0.4,
         element: Hilo.createElement('div', {
            className: 'ninebg'
         })
      });
      Tile.startX = ninebg.x = (this.width - ninebg.getScaledWidth())/2;
      Tile.startY = ninebg.y = 100;
      this.stage.addChild(ninebg);
      //初始化瓦片格子
      this.tileMap = new TileMap(4, 4);
      var numStartTiles = 2, startTiles = [];
      //创建格子缓存池
      for(var i = 0;i <= this.tileMap.length; i++){
         var tile = new Tile(2, {
            size: Tile.tileSize,
            pivotX: Tile.tileSize * 0.5,
            pivotY: Tile.tileSize * 0.5
         })
         this.tileCache.push(tile);
      }
   }
   moveTiles(direction, onlyCheck){
      //console.log('----------',direction, onlyCheck)
      if(!onlyCheck && this.moving){
         return;
      }
      if(!onlyCheck){
         this.moving = true;
      }
      this.lastScore = this.score;
      var isVertival = direction == 38 || direction == 40;//上或下
      var start = direction == 37 || direction == 38 ? 0 : this.tileMap.width -1;
      var sign = direction == 37 || direction == 38 ? 1 : -1;
      var x, y, tile, lastTile, index, checking, doMoving = false, tweenCount = 0;
      for(var i = 0; i < this.tileMap.width; i++){
         lastTile = null;
         index = 0;
         checking = true;
         //console.log(i,'00000000000000000000')
         for(var j = 0; j < this.tileMap.width; j++){
            x = isVertival ? i : (start + sign * j);
            y = isVertival ? (start + sign * j) : i;
            tile = this.tileMap.get(x, y);
            //console.log(i,j,checking)
            if(checking && tile){
               if(lastTile && lastTile.number == tile.number){
                  //预处理可以合并的相邻格子
                  if(onlyCheck) return true;
                  this.tileMap.set(tile.tileX, tile.tileY, null);
                  this.tileCache.push(tile);
                  lastTile.mergeTile = tile;
                  tile.srcTile = lastTile;
                  lastTile = null;
               }else{
                  //更新格子的位置
                  index++;
                  lastTile = tile;
                  var destX = isVertival ? i : start + sign * (index - 1);
                  var destY = isVertival ? start + sign * (index- 1) : i;
                  if(onlyCheck){
                      if(tile.tileX != destX || tile.tileY != destY) return true;
                  }else{
                     tile.oldX = tile.tileX;
                     tile.oldY = tile.tileY;
                     this.tileMap.move(destX, destY, tile);
                  }
               }
            }else if(!checking && tile){
               //console.log('ooooooooooooooooooo')
               var pos = Tile.getPosition(tile.tileX, tile.tileY);
               if(tile.tileX != tile.oldX || tile.tileY != tile.oldY){
                  //移动格子
                  doMoving = true;
                  tweenCount++;
                  Hilo.Tween.to(tile, {
                     x:pos.x + tile.pivotX, 
                     y:pos.y + tile.pivotY
                  }, {
                     time:100, 
                     onComplete:(tween) => {
                        var target = tween.target;
                        target.oldX = -1;
                        target.oldY = -1;
                        if(!--tweenCount) this.onMoveComplete(true);
                     }
                  });
              }
              
              var mergeTile = tile.mergeTile;
              if(mergeTile){
                  //移动要合并的格子
                  doMoving = true;
                  tweenCount++;
                  //确保移动的格子在最上层
                  if(tile.depth > mergeTile.depth){
                      tile.parent.swapChildren(tile, mergeTile);
                  }
                  Hilo.Tween.to(mergeTile, {
                     x:pos.x + mergeTile.pivotX, 
                     y:pos.y + mergeTile.pivotY
                  }, {
                     time:100, 
                     onComplete:(tween) => {
                        var target = tween.target, srcTile = target.srcTile;
                        target.removeFromParent();
                        target.srcTile = null;
                        //console.log(srcTile)
                        srcTile.change(srcTile.number * 2);
                        srcTile.mergeTile = null;
                        Hilo.Tween.from(srcTile, {
                           scaleX:0.3, 
                           scaleY:0.3
                        }, {
                           time:100, 
                           //ease:bounce, 
                           onComplete:(tween) => {
                              if(!--tweenCount) this.onMoveComplete(true);
                           }
                        });
                     }
                  });
                  //增加分数
                  this.addScore(tile.number);
              }
            }
            //更新完一列(行)格子后，开始移动或合并格子
            //遍历万一遍之后，重置j的值，再遍历一次j,移动格子的位置
            if(!onlyCheck && checking && j >= this.tileMap.width - 1){
               j = -1;
               checking = false;
            }
         }
      }
      //无法移动或合并
      if(!doMoving){
         if(onlyCheck) return false;
         this.onMoveComplete(false);
      }
      return doMoving;
   }
   onMoveComplete(moved){
      this.moving = false;
      if(!moved) return;

      this.steps++;
      this.updateScore(true);
      //this.makeRandomTile();

      var failed = !this.moveTiles(37, true) && !this.moveTiles(38, true) &&  
                     !this.moveTiles(39, true) && !this.moveTiles(40, true);
      if(failed){
         this.showGameOver(true);
      }
   }
   makeRandomTile(){
      //随机获取一个空格位置
      var position = this.tileMap.getRandomEmptyPosition();
      if(!position) return false;

      //随机产生2的指数幂
      var random = Math.random();
      var exponent = random <= 0.75 ? 1 : random > 0.75 && random <= 0.99 ? 2 : 3;
      var randomNumber = Math.pow(2, exponent);

      //复用缓存格子
      var tile = this.tileCache.pop();
      tile.change(randomNumber);
      tile.setPosition(position.x, position.y);
      this.tileMap.set(position.x, position.y, tile);
      this.tileContainer.addChild(tile);
      Hilo.Tween.from(tile, {
         alpha:0
      }, {
         time:100
      });
      return true;
   }
   showGameOver(){
      if(!this.overScene){
         this.overScene = new Hilo.Container({
             id: 'over',
             width: this.width,
             height: this.height
         });

         var bg = new Hilo.DOMElement({
            width: this.width,
            height: this.height,
            alpha: 0.6,
            element: Hilo.createElement('div', {
               style: {
                  position: 'absolute',
                  background: '#000'
               }
            })
         });

         var msg = new Hilo.DOMElement({
            width: this.width,
            height: 50,
            y: 170,
            element: Hilo.createElement('div', {
               innerHTML: 'Game Over',
               className: 'over',
               style: {
                  position: 'absolute'
               }
            })
         });

         var startBtn = new Hilo.DOMElement({
            id: 'startBtn',
            width: 200,
            height: 45,
            element: Hilo.createElement('div', {
               innerHTML: 'Try Again',
               className: 'btn'
            })
         }).on(Hilo.event.POINTER_START, () => {
            this.showGameOver(false);
            this.startGame();
         });
         startBtn.x = (this.width - startBtn.getScaledWidth())/2;
         startBtn.y = msg.y + 100;

         this.overScene.addChild(bg, msg, startBtn);
      }

      if(show){
         this.state = 'over';
         this.stage.addChild(this.overScene);
      }else{
         this.stage.removeChild(this.overScene);
      }
   }
   saveBestScore(){
      let best = 0;
      let canStore = Hilo.browser.supportStorage;//是否支持本地存储localStorage。
      let key = 'hilo-2048-best-score';
      if(canStore){
         best = parseInt(localStorage.getItem(key)) || 0;
      }
      if(this.score > best){
         best = this.score;
         canStore && localStorage.setItem(key, this.score);
      }
      return best;
   }
   updateScore(animate, force){
      let scoreElem = document.getElementById('score'), bestElem = document.getElementById('best');
      let delta = this.score - this.lastScore;
      if(scoreElem && (delta || force)){
         if(animate){
            let time = Math.min(400, delta * 20);
            Hilo.Tween.to({
               value: this.lastScore
            }, {
               value: this.score
            }, {
               time: time,
               onUpdate: function(){
                  console.log(this.target)
                  let value = this.target.value;
                  scoreElem.innerHTML = value //+ 0.5 >> 0;
               }
            })
         }else{
            scoreElem.innerHTML = this.score;
         }
      }
      if(bestElem && (this.score > this.best || force)){
         this.best = Math.max(this.score, this.best);
         this.saveBestScore();
         bestElem.innerHTML = this.best;
      }
   }
   addScore(num){
      this.score += num;
      this.maxNum = Math.max(this.maxNum, num);
   }
}

export default Game;

