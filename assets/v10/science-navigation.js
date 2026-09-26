(() => {
'use strict';
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
const header=document.querySelector('.header'),progress=document.querySelector('.reading-progress');
let scrollQueued=false;
function updateScroll(){header.classList.toggle('scrolled',scrollY>40);const max=document.documentElement.scrollHeight-innerHeight;progress.style.transform=`scaleX(${max>0?scrollY/max:0})`;scrollQueued=false}
window.addEventListener('scroll',()=>{if(!scrollQueued){scrollQueued=true;requestAnimationFrame(updateScroll)}},{passive:true});updateScroll();
const toggle=document.querySelector('.index-toggle'),menu=document.getElementById('index-menu');
function closeMenu(restore=false){menu.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.querySelector('span').textContent='+';document.body.classList.remove('menu-open');if(restore)toggle.focus()}
toggle.addEventListener('click',()=>{if(!menu.hidden){closeMenu();return}menu.hidden=false;toggle.setAttribute('aria-expanded','true');toggle.querySelector('span').textContent='−';document.body.classList.add('menu-open');menu.querySelector('a').focus()});
menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>closeMenu()));
document.addEventListener('keydown',e=>{if(menu.hidden)return;if(e.key==='Escape')closeMenu(true);if(e.key==='Tab'){const focusables=[...document.querySelectorAll('.language-switch a'),toggle,...menu.querySelectorAll('a')],first=focusables[0],last=focusables.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});

})();