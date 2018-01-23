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
   }
   moveTiles(direction, onlyCheck){
      console.log('----------',direction)
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
                  scoreElem.innerHTML = value + 0.5;
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

