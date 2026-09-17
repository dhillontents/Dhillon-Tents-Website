(function () {
  'use strict';
  var M=window.DhillonPlannerModel,root=document.getElementById('layout-editor');
  if(!M||!root)return;
  var $=function(id){return document.getElementById(id);};
  var key='dhillon:layout-v1',state,selected,drag=null,history=[],future=[],storageOK=true;
  try{state=M.restore(sessionStorage.getItem(key));}catch(_){storageOK=false;}
  var fresh=!state;state=state||M.seed();
  var draft={};try{draft=JSON.parse(sessionStorage.getItem('dhillon:event-draft')||'{}')||{};}catch(_){}
  var params=new URLSearchParams(location.search),requested=M.size(params.get('tent'));
  if(requested)$('plan-tent-size').value=requested.id;
  if(fresh||params.has('guests')){
    var guests=Number(params.get('guests')||draft.guests||40);
    state.guests=Number.isInteger(guests)&&guests>0&&guests<=5000?guests:40;
  }
  if(fresh){
    if(requested){
      state.space.w=Math.max(60,requested.w+10);state.space.l=Math.max(60,requested.l+10);
      state.items=[];var added=M.addTent(state,requested.id);if(added.state)state=added.state;
    }
  }
  selected=state.items[0]?state.items[0].id:null;
  var canvas=$('plan-canvas'),layer=$('plan-items'),status=$('plan-status');
  function announce(text,error){status.textContent=text;status.dataset.error=String(!!error);}
  function current(){return state.items.find(function(i){return i.id===selected;});}
  function parentId(){var i=current();return i?i.kind==='tent'?i.id:i.parent:null;}
  function persist(){
    try{sessionStorage.setItem(key,JSON.stringify(state));}catch(_){storageOK=false;}
    $('plan-storage').textContent=storageOK?'Saved in this browser tab':'Browser storage unavailable — keep this page open';
  }
  function snapshot(){return {state:M.copy(state),selected:selected};}
  function commit(result,message){
    if(result.error){announce(result.error,true);renderInspector();return false;}
    history.push(snapshot());if(history.length>30)history.shift();future=[];
    state=result.state;if('selected' in result)selected=result.selected;
    render();persist();announce(message||'Layout updated.');return true;
  }
  function select(id){selected=id;renderCanvas();renderInspector();renderItemList();}
  function renderCanvas(){
    var focus=document.activeElement&&document.activeElement.getAttribute('data-item');
    var w=state.space.w,l=state.space.l,pad=Math.max(w,l)*.055,c=state.space.margin;
    canvas.setAttribute('viewBox',[-pad,-pad,w+pad*2,l+pad*2].join(' '));
    $('plan-ground').setAttribute('width',w);$('plan-ground').setAttribute('height',l);
    var edge=$('plan-edge');edge.setAttribute('x',c);edge.setAttribute('y',c);edge.setAttribute('width',Math.max(0,w-2*c));edge.setAttribute('height',Math.max(0,l-2*c));
    var textSize=Math.max(1.2,Math.max(w,l)/55);
    var widthLabel=$('plan-width-label');widthLabel.setAttribute('x',w/2);widthLabel.setAttribute('y',-pad*.3);widthLabel.setAttribute('font-size',textSize);widthLabel.textContent=w+' ft';
    var lengthLabel=$('plan-length-label');lengthLabel.setAttribute('x',-pad*.3);lengthLabel.setAttribute('y',l/2);lengthLabel.setAttribute('font-size',textSize);lengthLabel.setAttribute('transform','rotate(-90 '+(-pad*.3)+' '+l/2+')');lengthLabel.textContent=l+' ft';
    var problems=M.issues(state),bad=new Set();problems.forEach(function(p){p.ids.forEach(function(id){bad.add(id);});});
    var ordered=state.items.filter(function(i){return i.kind==='tent';}).concat(state.items.filter(function(i){return i.kind==='table';}));
    layer.innerHTML=ordered.map(function(i){
      var d=M.dimensions(i),isTent=i.kind==='tent',round=!isTent&&i.table==='round';
      var shape=round?'<circle class="plan-footprint" cx="'+(i.x+d.w/2)+'" cy="'+(i.y+d.l/2)+'" r="'+d.w/2+'" fill="#eadbc3" stroke="#a67e3f"/>':'<rect class="plan-footprint" x="'+i.x+'" y="'+i.y+'" width="'+d.w+'" height="'+d.l+'" rx="'+(isTent?.3:.15)+'" fill="'+(isTent?'#dce9eb':'#decda9')+'" fill-opacity="'+(isTent?'.62':'1')+'" stroke="'+(isTent?'#365e6c':'#947436')+'"/>';
      var caption=isTent?'<text x="'+(i.x+d.w/2)+'" y="'+(i.y+Math.min(2.3,d.l/4))+'" text-anchor="middle" font-size="'+Math.min(textSize,1.8)+'">'+M.size(i.size).label+'</text>':'';
      return '<g class="plan-item" data-item="'+i.id+'" data-selected="'+(i.id===selected)+'" data-invalid="'+bad.has(i.id)+'" role="button" tabindex="0" aria-pressed="'+(i.id===selected)+'" aria-label="'+M.label(i)+', item '+i.id.slice(5)+', X '+i.x.toFixed(1)+' feet, Y '+i.y.toFixed(1)+' feet">'+shape+caption+'</g>';
    }).join('');
    if(focus&&!drag){var el=layer.querySelector('[data-item="'+focus+'"]');if(el)el.focus({preventScroll:true});}
  }
  function renderInspector(){
    var i=current(),present=!!i;
    $('plan-selected-name').textContent=present?M.label(i):'Choose an item on the plan';
    $('plan-selected-tools').hidden=!present;$('plan-rotate').disabled=!present;$('plan-remove').disabled=!present;
    if(!present)return;
    $('plan-x').value=Math.round(i.x*100)/100;$('plan-y').value=Math.round(i.y*100)/100;
    $('plan-table-tools').hidden=i.kind!=='tent';
    if(i.kind==='tent')$('plan-table-estimate').textContent='Area estimate: up to '+M.tableLimit(i,'folding')+' folding tables or '+M.tableLimit(i,'round')+' round tables.';
  }
  function renderItemList(){
    $('plan-item-count').textContent=state.items.length;
    var list=$('plan-item-buttons');list.replaceChildren();
    if(!state.items.length){var empty=document.createElement('p');empty.textContent='Your layout is empty. Add a tent to start.';list.appendChild(empty);}
    state.items.forEach(function(i){var b=document.createElement('button');b.type='button';b.textContent=M.label(i)+' · '+i.id.slice(5);b.dataset.choose=i.id;b.setAttribute('aria-pressed',String(i.id===selected));list.appendChild(b);});
  }
  function render(){
    renderCanvas();renderInspector();renderItemList();
    $('plan-width').value=state.space.w;$('plan-length').value=state.space.l;$('plan-margin').value=state.space.margin;
    $('plan-guests').value=state.guests;$('plan-mode').value=state.mode;$('plan-chairs').checked=state.chairs;$('plan-chairs').disabled=state.mode==='standing';$('plan-chair-count').textContent=state.guests;
    $('plan-space-title').textContent=state.space.w+' × '+state.space.l+' ft';
    var cap=M.capacity(state),qty=state.items.filter(function(i){return i.kind==='table';}).length,available=cap[state.mode];
    $('plan-area').textContent=cap.area.toLocaleString()+' sq ft';$('plan-seated').textContent=cap.seated.toLocaleString()+' guests';$('plan-standing').textContent=cap.standing.toLocaleString()+' guests';$('plan-table-count').textContent=qty+' table'+(qty===1?'':'s');
    var note=$('plan-capacity-note');note.dataset.warning=String(available<state.guests);
    note.textContent=cap.area===0?'Add a tent to see capacity estimates.':available<state.guests?'Your '+state.mode+' estimate is '+available+' guests; you are planning for '+state.guests+'. Add more covered space or ask us for help.':'Planning for '+state.guests+' guests '+state.mode+'. Table and guest estimates are checked separately; our team confirms the full layout.';
    var suggestion=M.suggestion(state);$('plan-suggestion').textContent=suggestion?'Starting size for '+state.guests+' '+state.mode+' guests: '+suggestion.label+' ft.':'No single tent fits this guest estimate and space. Add multiple tents or adjust the available space.';
    $('plan-undo').disabled=!history.length;$('plan-redo').disabled=!future.length;
    $('plan-save-quote').disabled=!state.items.length;
  }
  function add(kind,point){
    var result=kind==='tent'?M.addTent(state,$('plan-tent-size').value,point):M.addTable(state,kind,parentId(),point);
    commit(result,kind==='tent'?'Tent added. Select it to arrange tables, or drag it into place.':'Table added. Drag it into place or use the move controls.');
  }
  function coordinates(event){
    var p=canvas.createSVGPoint();p.x=event.clientX;p.y=event.clientY;
    var matrix=canvas.getScreenCTM();return matrix?p.matrixTransform(matrix.inverse()):{x:0,y:0};
  }
  canvas.addEventListener('pointerdown',function(e){
    if(e.button!==0||!e.isPrimary)return;
    var g=e.target.closest('[data-item]');if(!g){select(null);return;}
    e.preventDefault();var id=g.dataset.item,item=state.items.find(function(i){return i.id===id;}),p=coordinates(e);
    selected=id;drag={pointer:e.pointerId,id:id,start:M.copy(state),beforeSelected:id,offsetX:p.x-item.x,offsetY:p.y-item.y,moved:false};
    canvas.setPointerCapture(e.pointerId);renderCanvas();renderInspector();
  });
  canvas.addEventListener('pointermove',function(e){
    if(!drag||drag.pointer!==e.pointerId)return;
    e.preventDefault();var p=coordinates(e),x=Math.round((p.x-drag.offsetX)*2)/2,y=Math.round((p.y-drag.offsetY)*2)/2;
    var original=drag.start.items.find(function(i){return i.id===drag.id;});
    drag.moved=drag.moved||Math.abs(x-original.x)>.01||Math.abs(y-original.y)>.01;
    state=M.tentativeMove(drag.start,drag.id,x,y);renderCanvas();
  });
  function finishDrag(cancel){
    if(!drag)return;
    var d=drag,problems=M.issues(state);drag=null;
    if(cancel||problems.length){state=d.start;announce(cancel?'Move cancelled.':problems[0].message+' The item returned to its previous position.',!!problems.length);}
    else if(d.moved){history.push({state:d.start,selected:d.beforeSelected});if(history.length>30)history.shift();future=[];announce('Item moved.');}
    render();persist();
  }
  canvas.addEventListener('pointerup',function(e){if(drag&&drag.pointer===e.pointerId)finishDrag(false);});
  canvas.addEventListener('pointercancel',function(){finishDrag(true);});
  canvas.addEventListener('lostpointercapture',function(){if(drag)finishDrag(true);});
  canvas.addEventListener('keydown',function(e){
    var g=e.target.closest('[data-item]');if(!g)return;
    selected=g.dataset.item;var i=current(),step=e.shiftKey?5:1,offset={ArrowLeft:[-step,0],ArrowRight:[step,0],ArrowUp:[0,-step],ArrowDown:[0,step]}[e.key];
    if(offset){e.preventDefault();commit(M.move(state,i.id,i.x+offset[0],i.y+offset[1]),'Item moved.');}
    else if(e.key.toLowerCase()==='r'){e.preventDefault();commit(M.rotate(state,i.id),'Item rotated.');}
    else if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();commit(M.remove(state,i.id),'Item removed. Undo restores it.');}
    else if(e.key==='Enter'||e.key===' '){e.preventDefault();select(i.id);}
    else if(e.key==='Escape'){finishDrag(true);select(null);}
  });
  canvas.addEventListener('focusin',function(e){var g=e.target.closest('[data-item]');if(g&&selected!==g.dataset.item){selected=g.dataset.item;renderInspector();}});
  document.querySelectorAll('[data-place]').forEach(function(b){
    b.addEventListener('click',function(){add(b.dataset.place);});
    b.addEventListener('dragstart',function(e){e.dataTransfer.setData('text/plain','dhillon:'+b.dataset.place);e.dataTransfer.effectAllowed='copy';});
  });
  canvas.addEventListener('dragover',function(e){e.preventDefault();e.dataTransfer.dropEffect='copy';});
  canvas.addEventListener('drop',function(e){e.preventDefault();var kind=e.dataTransfer.getData('text/plain').replace(/^dhillon:/,'');if(['tent','folding','round'].includes(kind))add(kind,coordinates(e));});
  $('plan-position-form').addEventListener('submit',function(e){e.preventDefault();var i=current(),x=Number($('plan-x').value),y=Number($('plan-y').value);if(i&&Number.isFinite(x)&&Number.isFinite(y))commit(M.move(state,i.id,x,y),'Item moved.');});
  $('plan-rotate').addEventListener('click',function(){commit(M.rotate(state,selected),'Item rotated with its tables.');});
  $('plan-remove').addEventListener('click',function(){if(current())commit(M.remove(state,selected),'Item removed. Removing a tent also removes its tables. Undo restores them.');});
  document.querySelectorAll('[data-nudge]').forEach(function(b){b.addEventListener('click',function(){var i=current(),d={left:[-1,0],right:[1,0],up:[0,-1],down:[0,1]}[b.dataset.nudge];if(i)commit(M.move(state,i.id,i.x+d[0],i.y+d[1]),'Item moved one foot.');});});
  document.querySelectorAll('[data-arrange]').forEach(function(b){b.addEventListener('click',function(){commit(M.arrange(state,parentId(),b.dataset.arrange),'Tables arranged in the selected tent. Check chair space and aisles with our team.');});});
  $('plan-item-buttons').addEventListener('click',function(e){var b=e.target.closest('[data-choose]');if(b)select(b.dataset.choose);});
  $('plan-space-form').addEventListener('submit',function(e){
    e.preventDefault();if(!this.reportValidity())return;var n=M.copy(state);
    n.space={w:Number($('plan-width').value),l:Number($('plan-length').value),margin:Number($('plan-margin').value)};
    if(n.space.w<=2*n.space.margin||n.space.l<=2*n.space.margin){announce('The edge allowance leaves no room for a tent.',true);return;}
    var problems=M.issues(n);if(problems.length){announce('The existing layout does not fit those dimensions. Move or remove items first, or clear the layout.',true);return;}
    commit({state:n},'Space dimensions updated.');
  });
  function updateEvent(){
    var guests=$('plan-guests');if(!guests.reportValidity())return;
    var n=M.copy(state);n.guests=Number(guests.value);n.mode=$('plan-mode').value;n.chairs=$('plan-chairs').checked;
    commit({state:n},'Guest estimate updated. Your placed items are unchanged.');
  }
  $('plan-guests').addEventListener('change',updateEvent);$('plan-mode').addEventListener('change',updateEvent);$('plan-chairs').addEventListener('change',updateEvent);
  $('plan-recommend').addEventListener('click',function(){
    if(!$('plan-guests').reportValidity())return;
    var n=M.copy(state);n.guests=Number($('plan-guests').value);n.mode=$('plan-mode').value;var suggested=M.suggestion(n);
    if(!suggested){announce('No single tent meets that guest estimate inside this space. Try multiple tents or a larger space.',true);return;}
    n.items=[];var a=M.addTent(n,suggested.id);if(!a.state){announce(a.error,true);return;}
    if(n.mode==='seated')a=M.arrange(a.state,a.selected,'folding');
    $('plan-tent-size').value=suggested.id;commit(a,'Suggested layout created. Move the items to suit your event.');
  });
  $('plan-clear').addEventListener('click',function(){var n=M.copy(state);n.items=[];commit({state:n,selected:null},'Layout cleared. Undo restores it.');});
  $('plan-undo').addEventListener('click',function(){if(!history.length)return;future.push(snapshot());var prev=history.pop();state=prev.state;selected=prev.selected;render();persist();announce('Last change undone.');});
  $('plan-redo').addEventListener('click',function(){if(!future.length)return;history.push(snapshot());var next=future.pop();state=next.state;selected=next.selected;render();persist();announce('Change restored.');});
  function saveQuote(){
    if(!state.items.length){announce('Add a tent before saving the layout.',true);return false;}
    if(!window.DhillonQuote){announce('Your quote could not be updated. Reload this page and try again.',true);return false;}
    var details={guests:String(state.guests),seating:state.mode,layoutSummary:state.space.w+' × '+state.space.l+' ft space; '+state.space.margin+' ft edge allowance; '+state.mode+' layout for '+state.guests+' guests.'};
    window.DhillonQuote.applyPlanner(M.quote(state),details);announce('Layout quantities saved to your quote. You can continue to Inquire now.');return true;
  }
  $('plan-save-quote').addEventListener('click',saveQuote);
  $('plan-inquire').addEventListener('click',function(e){if(state.items.length&&!saveQuote())e.preventDefault();});

  /* A quick estimate is separate from the saved custom layout. */
  var quickState=null,quickConfig=null,customInitialized=!fresh,preferredSize=requested;
  try{quickConfig=JSON.parse(sessionStorage.getItem('dhillon:quick-plan')||'null');}catch(_){}
  if(!quickConfig||!Number.isInteger(quickConfig.guests)||quickConfig.guests<1||quickConfig.guests>5000||!['seated','standing'].includes(quickConfig.mode)||!['none','folding','round'].includes(quickConfig.tables))quickConfig={guests:state.guests,mode:state.mode,tables:'none',chairs:false};
  if(params.has('guests'))quickConfig.guests=state.guests;
  $('quick-guests').value=quickConfig.guests;
  $('quick-'+quickConfig.mode).checked=true;
  $('quick-tables').value=quickConfig.tables;
  $('quick-chairs').checked=!!quickConfig.chairs;
  if(quickConfig.tables!=='none'||quickConfig.chairs)document.querySelector('.quick-extras').open=true;
  function quickDiagram(s){
    var svg=$('quick-canvas'),tent=s.items[0],size=M.size(tent.size);
    svg.setAttribute('viewBox','0 0 '+s.space.w+' '+s.space.l);
    svg.setAttribute('aria-label',size.label+' foot tent, top view, with '+(s.items.length-1)+' tables.');
    svg.innerHTML=s.items.map(function(i){
      var d=M.dimensions(i);
      if(i.kind==='tent')return '<rect x="'+i.x+'" y="'+i.y+'" width="'+d.w+'" height="'+d.l+'" rx=".25" fill="#dde8ec" stroke="#60818d" stroke-width="1.5" vector-effect="non-scaling-stroke"/>';
      if(i.table==='round')return '<circle cx="'+(i.x+d.w/2)+'" cy="'+(i.y+d.l/2)+'" r="'+d.w/2+'" fill="#d9bf8b" stroke="#957438" stroke-width="1" vector-effect="non-scaling-stroke"/>';
      return '<rect x="'+i.x+'" y="'+i.y+'" width="'+d.w+'" height="'+d.l+'" rx=".12" fill="#d9bf8b" stroke="#957438" stroke-width="1" vector-effect="non-scaling-stroke"/>';
    }).join('');
  }
  function renderQuick(){
    var input=$('quick-guests'),valid=input.checkValidity(),guests=Number(input.value),mode=$('quick-standing').checked?'standing':'seated',kind=$('quick-tables').value,chairs=$('quick-chairs').checked&&mode==='seated';
    $('quick-quote').disabled=!valid;$('quick-to-layout').disabled=true;$('quick-error').hidden=true;
    $('quick-chairs').disabled=mode==='standing';$('quick-chair-label').textContent=mode==='standing'?'Chairs are available for seated events':'Include '+(valid?guests:0)+' chairs';
    $('quick-less').disabled=valid&&guests<=1;$('quick-more').disabled=valid&&guests>=5000;
    quickState=null;
    if(!valid){$('quick-result-label').textContent='Your suggested tent';$('quick-size').textContent='How many guests?';$('quick-capacity').textContent='Enter a whole number from 1 to 5,000.';$('quick-includes').textContent='';document.querySelector('.quick-diagram').hidden=true;return;}
    quickConfig={guests:guests,mode:mode,tables:kind,chairs:$('quick-chairs').checked};
    try{sessionStorage.setItem('dhillon:quick-plan',JSON.stringify(quickConfig));}catch(_){}
    var n={version:1,space:{w:600,l:600,margin:5},guests:guests,mode:mode,chairs:chairs,sequence:0,items:[]},tent=M.suggestion(n);
    if(tent&&preferredSize&&preferredSize.area>=tent.area)tent=preferredSize;
    $('quick-result-label').textContent=preferredSize&&tent&&preferredSize.id===tent.id?'Your selected tent':'Your suggested tent';
    document.querySelector('.quick-diagram').hidden=!tent;
    $('quick-tables').disabled=!tent;
    if(!tent){
      $('quick-size').textContent='A little more space.';$('quick-capacity').textContent='For '+guests+' '+mode+' guests, we’ll help you plan multiple tents.';
      $('quick-includes').textContent='Share your guest count with our team.';$('quick-table-estimate').textContent='We’ll work out the tables with your larger setup.';$('quick-quote').textContent='Ask us for a recommendation';
      return;
    }
    n.space={w:tent.w+10,l:tent.l+10,margin:5};var added=M.addTent(n,tent.id);quickState=added.state;
    if(kind!=='none'){
      var arranged=M.arrange(quickState,added.selected,kind);
      if(arranged.state)quickState=arranged.state;
    }
    var capacity=M.capacity(quickState)[mode],tableCount=quickState.items.length-1,folding=M.tableLimit(quickState.items[0],'folding'),round=M.tableLimit(quickState.items[0],'round');
    $('quick-size').textContent=tent.label+' ft';$('quick-capacity').textContent='Up to '+capacity.toLocaleString()+' '+mode+' guests';
    $('quick-table-estimate').textContent=kind==='none'?'Up to '+folding+' folding tables or '+round+' round tables.':tableCount+' '+(kind==='round'?'round':'folding')+' tables included. Chair space and aisles are confirmed with your quote.';
    $('quick-includes').textContent='1 tent'+(tableCount?' · '+tableCount+' '+(kind==='round'?'round':'folding')+' tables':'')+(chairs?' · '+guests+' chairs':'');
    $('quick-diagram-label').textContent=tableCount?'Tent & table footprints · top view':'Tent footprint · top view';
    $('quick-quote').innerHTML='Get a quote <span aria-hidden="true">↗</span>';$('quick-to-layout').disabled=false;
    quickDiagram(quickState);
  }
  $('quick-guests').addEventListener('input',function(){preferredSize=null;renderQuick();});
  ['quick-seated','quick-standing','quick-tables','quick-chairs'].forEach(function(id){$(id).addEventListener('change',function(){preferredSize=null;renderQuick();});});
  [['quick-less',-10],['quick-more',10]].forEach(function(pair){$(pair[0]).addEventListener('click',function(){var val=Number($('quick-guests').value)||40;$('quick-guests').value=Math.max(1,Math.min(5000,val+pair[1]));preferredSize=null;renderQuick();});});
  $('quick-form').addEventListener('submit',function(e){
    e.preventDefault();if(!this.reportValidity())return;renderQuick();
    if(!window.DhillonQuote){$('quick-error').textContent='Please reload the page or contact Dhillon Tents for help.';$('quick-error').hidden=false;return;}
    var details={guests:String(quickConfig.guests),seating:quickConfig.mode,layoutSummary:quickState?'Tent estimate: '+M.size(quickState.items[0].size).label+' ft for '+quickConfig.guests+' '+quickConfig.mode+' guests.':'Multiple tents requested for '+quickConfig.guests+' '+quickConfig.mode+' guests.'};
    window.DhillonQuote.applyPlanner(quickState?M.quote(quickState):{},details);
    location.href='contact.html';
  });
  function useQuickLayout(){
    if(!quickState)return;
    commit({state:M.copy(quickState),selected:quickState.items[0].id},'Your suggested tent is ready to arrange. Undo restores the previous layout.');
    customInitialized=true;$('custom-intro-text').textContent='Move tents and tables to suit your space.';
    $('plan-tent-size').value=quickState.items[0].size;
  }
  $('quick-to-layout').addEventListener('click',useQuickLayout);
  $('planner-custom').addEventListener('toggle',function(){if(this.open){if(!customInitialized)useQuickLayout();renderCanvas();}});
  if(!fresh)$('custom-intro-text').textContent='Your saved layout is here. The quick estimate above leaves it unchanged.';
  renderQuick();
  render();persist();
  if(!fresh&&requested)announce('Your saved layout is restored. '+requested.label+' ft is selected under Add to your layout.');
})();
