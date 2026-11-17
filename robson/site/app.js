const menuButton=document.querySelector('.menu-button');
const navigation=document.querySelector('#navigation');
function closeMenu(){menuButton.setAttribute('aria-expanded','false');navigation.classList.remove('is-open');}
menuButton.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')!=='true';menuButton.setAttribute('aria-expanded',String(open));navigation.classList.toggle('is-open',open);});
navigation.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu();});
document.addEventListener('click',event=>{if(!event.target.closest('.header'))closeMenu();});
const credits=document.querySelector('#credits-dialog');
const gallery=document.querySelector('#gallery-dialog');
function openDialog(dialog){dialog.showModal();document.body.classList.add('is-dialog-open');}
document.querySelector('#open-credits').addEventListener('click',()=>openDialog(credits));
for(const dialog of [credits,gallery]){
  dialog.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>document.body.classList.remove('is-dialog-open'));
  dialog.addEventListener('click',event=>{if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();}});
}
document.querySelectorAll('[data-image]').forEach(button=>button.addEventListener('click',()=>{
 const img=document.querySelector('#gallery-image');img.src=button.dataset.image;img.alt=button.querySelector('img').alt;
 document.querySelector('#gallery-caption').textContent=button.dataset.caption;openDialog(gallery);
}));
