(function () {
  'use strict';
  var carousel=document.querySelector('[data-photo-carousel]');
  if(!carousel)return;
  var viewport=carousel.querySelector('.photo-carousel__viewport');
  var slides=Array.from(carousel.querySelectorAll('[data-carousel-slide]'));
  var dots=Array.from(carousel.querySelectorAll('[data-carousel-dot]'));
  var previous=carousel.querySelector('[data-carousel-prev]'),next=carousel.querySelector('[data-carousel-next]');
  var toggle=carousel.querySelector('[data-carousel-play]'),counter=carousel.querySelector('[data-carousel-counter]');
  var status=carousel.querySelector('[data-carousel-status]');
  var motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  var index=0,playing=!motion.matches,hovered=false,onScreen=false,timer,scrollFrame,settling,programmatic=false;
  if(slides.length<2)return;
  carousel.querySelectorAll('[data-carousel-control]').forEach(function(control){control.hidden=false;});
  function render(){
    slides.forEach(function(slide,i){
      slide.setAttribute('aria-hidden',String(i!==index));
      slide.inert=i!==index;
      slide.querySelectorAll('a').forEach(function(a){a.tabIndex=i===index?0:-1;});
    });
    dots.forEach(function(dot,i){dot.setAttribute('aria-current',String(i===index));});
    counter.textContent=String(index+1).padStart(2,'0')+' / '+String(slides.length).padStart(2,'0');
    toggle.setAttribute('aria-label',playing?'Pause slideshow':'Play slideshow');
    toggle.querySelector('[data-carousel-play-label]').textContent=playing?'Pause':'Play';
    toggle.querySelector('[data-icon-pause]').toggleAttribute('hidden',!playing);
    toggle.querySelector('[data-icon-play]').toggleAttribute('hidden',playing);
  }
  function schedule(){
    clearTimeout(timer);
    if(playing&&!hovered&&onScreen&&!document.hidden)timer=setTimeout(function(){go(index+1,false);},6500);
  }
  function pause(){playing=false;render();schedule();}
  function settle(){
    clearTimeout(settling);
    settling=setTimeout(function(){
      programmatic=false;
      index=Math.max(0,Math.min(slides.length-1,Math.round(viewport.scrollLeft/viewport.clientWidth)));
      render();
    },180);
  }
  function go(target,manual){
    if(manual)playing=false;
    var wrapped=target<0||target>=slides.length;
    index=(target+slides.length)%slides.length;
    programmatic=true;
    clearTimeout(settling);
    if(viewport.contains(document.activeElement)&&document.activeElement!==viewport)viewport.focus({preventScroll:true});
    render();
    viewport.scrollTo({left:viewport.clientWidth*index,behavior:motion.matches||wrapped?'auto':'smooth'});
    if(wrapped&&!motion.matches&&viewport.animate)viewport.animate([{opacity:.45},{opacity:1}],{duration:450,easing:'ease-out'});
    if(manual)status.textContent='Photo '+(index+1)+' of '+slides.length+': '+slides[index].dataset.caption;
    settle();schedule();
  }
  previous.addEventListener('click',function(){go(index-1,true);});
  next.addEventListener('click',function(){go(index+1,true);});
  dots.forEach(function(dot,i){dot.addEventListener('click',function(){go(i,true);});});
  toggle.addEventListener('click',function(){playing=!playing;render();schedule();});
  carousel.addEventListener('keydown',function(event){
    var target={ArrowLeft:index-1,ArrowRight:index+1,Home:0,End:slides.length-1}[event.key];
    if(target!==undefined){event.preventDefault();go(target,true);}
  });
  carousel.addEventListener('mouseenter',function(){hovered=true;schedule();});
  carousel.addEventListener('mouseleave',function(){hovered=false;schedule();});
  carousel.addEventListener('focusin',function(event){if(!toggle.contains(event.target))pause();});
  viewport.addEventListener('pointerdown',function(){pause();programmatic=false;clearTimeout(settling);},{passive:true});
  viewport.addEventListener('wheel',function(event){if(Math.abs(event.deltaX)>Math.abs(event.deltaY))pause();},{passive:true});
  viewport.addEventListener('scroll',function(){
    if(scrollFrame)return;
    scrollFrame=requestAnimationFrame(function(){
      scrollFrame=null;
      var visible=Math.max(0,Math.min(slides.length-1,Math.round(viewport.scrollLeft/viewport.clientWidth)));
      if(!programmatic&&visible!==index){index=visible;render();}
      settle();
    });
  },{passive:true});
  function resize(){viewport.scrollTo({left:viewport.clientWidth*index,behavior:'auto'});}
  if('ResizeObserver' in window)new ResizeObserver(resize).observe(viewport);
  else window.addEventListener('resize',resize);
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(entries){onScreen=entries[0].isIntersecting;schedule();},{threshold:.25}).observe(viewport);
  }else{onScreen=true;}
  document.addEventListener('visibilitychange',schedule);
  if(motion.addEventListener)motion.addEventListener('change',function(){if(motion.matches)playing=false;render();schedule();});
  render();schedule();
})();
