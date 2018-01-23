/**
 * @description：game
 * @time: 2018-01-23
 */
'use strict';

import Game from 'pages/2048/game.js';
class App{
   constructor(){
      this.init();
   }
   init(){
      //console.log('0000000000000');
      let vendor = Hilo.browser.jsVendor;
      console.log(vendor);
      document.body.style[vendor + 'TouchCallout'] = 'none';
      document.body.style[vendor + 'UserSelect'] = 'none';
      document.body.style[vendor + 'TextSizeAdjust'] = 'none';
      document.body.style[vendor + 'TapHighlightColor'] = 'rgba(0,0,0,0)';
      //禁止页面滚动
      document.body.addEventListener('touchmove', (e)=>{
         e.preventDefault();
      }, false);
      this.initViewport();
   }
   initViewport(){
      let width,
          height,
          winWidth = window.innerWidth,
          winHeight = window.innerHeight,
          winRatio = winWidth/winHeight,
          targetWidth = 360,
          targetHeight = 640,
          targetRatio = targetWidth/targetHeight;
      if(winWidth > targetWidth){
         width = targetWidth;
         height = Math.min(targetHeight, winHeight);
      }else if(winRatio > targetRatio){
         width = winWidth;
         height = winHeight;
      }else{
         width = 320;
         height = 480;
      }

      let container = document.getElementById('container');
      container.innerHTML = '';
      container.style.width = width + 'px';
      container.style.height = height + 'px';
      container.style.overflow = 'hidden';
      new Game({
         container: container,
         width,
         height
      });

   }
}

new App();