/* Feet are the source of truth. The diagram and quote both use this model. */
(function (root) {
  'use strict';
  var sizes = [[10,10],[20,20],[20,30],[20,40],[20,60],[20,80],[40,40],[40,60],[40,80],[40,100],[40,120]].map(function (s) {
    return { id:s.join('x'), w:s[0], l:s[1], area:s[0]*s[1], label:s[0]+' × '+s[1] };
  });
  var tables = { folding:{w:6,l:2.5,label:'6 ft folding table'}, round:{w:5,l:5,label:'5 ft round table'} };
  function copy(s) { return JSON.parse(JSON.stringify(s)); }
  function size(id) { return sizes.find(function (s) { return s.id === id; }); }
  function dimensions(item) {
    var d = item.kind === 'tent' ? size(item.size) : tables[item.table];
    return item.rot % 180 ? {w:d.l,l:d.w} : {w:d.w,l:d.l};
  }
  function bounds(item) { var d=dimensions(item); return {x:item.x,y:item.y,w:d.w,l:d.l}; }
  function contains(outer,inner) { return inner.x >= outer.x-.001 && inner.y >= outer.y-.001 && inner.x+inner.w <= outer.x+outer.w+.001 && inner.y+inner.l <= outer.y+outer.l+.001; }
  function intersects(a,b) {
    var A=bounds(a),B=bounds(b);
    if (A.x+A.w <= B.x+.001 || B.x+B.w <= A.x+.001 || A.y+A.l <= B.y+.001 || B.y+B.l <= A.y+.001) return false;
    var ar=a.kind==='table'&&a.table==='round', br=b.kind==='table'&&b.table==='round';
    if (ar && br) return Math.hypot(A.x+A.w/2-B.x-B.w/2,A.y+A.l/2-B.y-B.l/2) < (A.w+B.w)/2-.001;
    if (ar || br) {
      var C=ar?A:B, R=ar?B:A, cx=C.x+C.w/2,cy=C.y+C.l/2;
      return Math.hypot(cx-Math.max(R.x,Math.min(cx,R.x+R.w)),cy-Math.max(R.y,Math.min(cy,R.y+R.l))) < C.w/2-.001;
    }
    return true;
  }
  function label(item) { return item.kind==='tent' ? size(item.size).label+' tent' : tables[item.table].label; }
  function placementFits(s,item) {
    if(item.kind==='tent') {
      var c=s.space.margin;
      return contains({x:c,y:c,w:s.space.w-2*c,l:s.space.l-2*c},bounds(item)) &&
        !s.items.some(function(other){return other.kind==='tent'&&intersects(item,other);});
    }
    var parent=s.items.find(function(other){return other.kind==='tent'&&other.id===item.parent;});
    return !!parent && contains(bounds(parent),bounds(item)) &&
      !s.items.some(function(other){return other.kind==='table'&&intersects(item,other);});
  }
  function issues(s) {
    var out=[], tents=s.items.filter(function(i){return i.kind==='tent';}), ts=s.items.filter(function(i){return i.kind==='table';});
    function flag(a,b,message) { out.push({ids:b?[a.id,b.id]:[a.id],message:message}); }
    tents.forEach(function(t,i){
      var c=s.space.margin;
      if(!contains({x:c,y:c,w:s.space.w-2*c,l:s.space.l-2*c},bounds(t))) flag(t,null,label(t)+' crosses the space boundary or edge allowance.');
      tents.slice(i+1).forEach(function(other){if(intersects(t,other))flag(t,other,'Two tents overlap. Move them apart.');});
    });
    ts.forEach(function(t,i){
      var p=tents.find(function(tent){return tent.id===t.parent;});
      if(!p || !contains(bounds(p),bounds(t))) flag(t,null,'Keep each table fully inside a tent.');
      ts.slice(i+1).forEach(function(other){if(intersects(t,other))flag(t,other,'Two tables overlap. Move them apart.');});
    });
    return out;
  }
  function capacity(s) {
    var area=s.items.filter(function(i){return i.kind==='tent';}).reduce(function(n,t){return n+size(t.size).area;},0);
    return {area:area,seated:Math.floor(area/10),standing:Math.floor(area*60/400)};
  }
  function tableLimit(t,kind) { return Math.floor(size(t.size).area*(kind==='folding'?9:4)/400); }
  function nextId(s) { s.sequence++; return 'item-'+s.sequence; }
  function newTent(s,id,x,y,rot) { return {id:nextId(s),kind:'tent',size:id,x:x,y:y,rot:rot||0}; }
  function tentativeMove(s,id,x,y) {
    var n=copy(s), item=n.items.find(function(i){return i.id===id;});
    if(!item)return n;
    var dx=x-item.x,dy=y-item.y; item.x=x;item.y=y;
    if(item.kind==='tent') n.items.forEach(function(child){if(child.parent===id){child.x+=dx;child.y+=dy;}});
    else {
      var tent=n.items.find(function(t){return t.kind==='tent'&&contains(bounds(t),bounds(item));});
      item.parent=tent?tent.id:null;
    }
    return n;
  }
  function move(s,id,x,y) {
    var n=tentativeMove(s,id,x,y), problems=issues(n);
    return problems.length?{error:problems[0].message}:{state:n,selected:id};
  }
  function rotate(s,id) {
    var n=copy(s),item=n.items.find(function(i){return i.id===id;});
    if(!item)return {error:'Choose an item first.'};
    var d=dimensions(item), cx=item.x+d.w/2,cy=item.y+d.l/2;
    item.rot=(item.rot+90)%180;
    var next=dimensions(item);item.x=cx-next.w/2;item.y=cy-next.l/2;
    if(item.kind==='tent') n.items.forEach(function(t){if(t.parent===id){var b=dimensions(t),ox=t.x+b.w/2-cx,oy=t.y+b.l/2-cy;t.rot=(t.rot+90)%180;var nd=dimensions(t);t.x=cx-oy-nd.w/2;t.y=cy+ox-nd.l/2;}});
    var problems=issues(n);return problems.length?{error:problems[0].message}:{state:n,selected:id};
  }
  function remove(s,id) { var n=copy(s); n.items=n.items.filter(function(i){return i.id!==id&&i.parent!==id;});return {state:n,selected:null}; }
  function addTent(s,id,point) {
    if(!size(id))return {error:'Choose one of the available tent sizes.'};
    if(s.items.filter(function(i){return i.kind==='tent';}).length>=20)return {error:'This planner supports up to 20 tents. Contact us for a larger layout.'};
    var n=copy(s),t=newTent(n,id,0,0), margin=n.space.margin;
    for(var rotation=0;rotation<=90;rotation+=90){
      t.rot=rotation;var d=dimensions(t);
      if(point){t.x=Math.round((point.x-d.w/2)*2)/2;t.y=Math.round((point.y-d.l/2)*2)/2;if(placementFits(n,t)){n.items.push(t);return {state:n,selected:t.id};}continue;}
      for(var y=margin;y<=s.space.l-margin-d.l;y+=2.5){for(var x=margin;x<=s.space.w-margin-d.w;x+=2.5){t.x=x;t.y=y;if(placementFits(n,t)){n.items.push(t);return {state:n,selected:t.id};}}}
    }
    return {error:point?'The tent does not fit here. Keep it inside the edge allowance and away from other tents.':'There is no free space for this tent. Enlarge the space or move/remove another tent.'};
  }
  function addTable(s,kind,parentId,point) {
    if(!tables[kind])return {error:'Choose a table type.'};
    if(s.items.length>=500)return {error:'This planner supports 500 items. Contact us for a larger layout.'};
    var n=copy(s),parents=n.items.filter(function(i){return i.kind==='tent';});
    if(parentId)parents.sort(function(a,b){return a.id===parentId?-1:b.id===parentId?1:0;});
    if(!parents.length)return {error:'Add a tent first, then place tables inside it.'};
    var t={id:nextId(n),kind:'table',table:kind,rot:0,x:0,y:0,parent:null};
    for(var p=0;p<parents.length;p++){
      var parent=parents[p],b=bounds(parent);t.parent=parent.id;
      for(var rotation=0;rotation<=90;rotation+=90){
        t.rot=rotation;var d=dimensions(t);
        if(point){t.x=Math.round((point.x-d.w/2)*2)/2;t.y=Math.round((point.y-d.l/2)*2)/2;if(placementFits(n,t)){n.items.push(t);return {state:n,selected:t.id};}continue;}
        for(var y=b.y+.5;y<=b.y+b.l-d.l-.5;y+=.5){for(var x=b.x+.5;x<=b.x+b.w-d.w-.5;x+=.5){t.x=x;t.y=y;if(placementFits(n,t)){n.items.push(t);return {state:n,selected:t.id};}}}
      }
    }
    return {error:'There is no clear place for this table. Move a table, choose another tent or add more space.'};
  }
  function arrange(s,parentId,kind) {
    var n=copy(s),t=n.items.find(function(i){return i.id===parentId&&i.kind==='tent';});
    if(!t)return {error:'Select a tent to arrange its tables.'};
    n.items=n.items.filter(function(i){return i.parent!==parentId;});
    var b=bounds(t),count=tableLimit(t,kind),base=tables[kind],best=null;
    if(n.items.length+count>500)return {error:'This arrangement exceeds the 500-item planner limit.'};
    for(var rot=0;rot<=90;rot+=90){
      var w=rot?base.l:base.w,l=rot?base.w:base.l;
      for(var cols=1;cols<=count;cols++){
        var rows=Math.ceil(count/cols),cw=(b.w-1.5)/cols,ch=(b.l-1.5)/rows;
        if(cw<w+.1||ch<l+.1)continue;
        var score=Math.abs(cw-ch)+(cols*rows-count)*.1;
        if(!best||score<best.score)best={cols:cols,rows:rows,cw:cw,ch:ch,w:w,l:l,rot:rot,score:score};
      }
    }
    if(!best)return {error:'The estimated count needs a custom arrangement for this tent.'};
    for(var k=0;k<count;k++){
      var row=Math.floor(k/best.cols),col=k%best.cols,remaining=Math.min(best.cols,count-row*best.cols);
      n.items.push({id:nextId(n),kind:'table',table:kind,rot:best.rot,parent:parentId,
        x:b.x+(b.w-remaining*best.cw)/2+col*best.cw+(best.cw-best.w)/2,
        y:b.y+.75+row*best.ch+(best.ch-best.l)/2});
    }
    var problems=issues(n);return problems.length?{error:problems[0].message}:{state:n,selected:parentId};
  }
  function quote(s) {
    var q={};s.items.forEach(function(i){var key=i.kind==='tent'?i.size:i.table==='round'?'round-tables':'folding-tables';q[key]=(q[key]||0)+1;});
    if(s.chairs && s.mode==='seated' && s.items.some(function(i){return i.kind==='tent';}))q.chairs=s.guests;
    return q;
  }
  function suggestion(s) {
    return sizes.slice().sort(function(a,b){return a.area-b.area;}).find(function(t){
      var fits=(t.w+2*s.space.margin<=s.space.w&&t.l+2*s.space.margin<=s.space.l)||(t.l+2*s.space.margin<=s.space.w&&t.w+2*s.space.margin<=s.space.l);
      return fits && (s.mode==='seated'?t.area/10:t.area*60/400)>=s.guests;
    });
  }
  function seed() {
    var s={version:1,space:{w:60,l:60,margin:5},guests:40,mode:'seated',chairs:true,sequence:1,items:[{id:'item-1',kind:'tent',size:'20x20',x:5,y:5,rot:0}]};
    return arrange(s,'item-1','folding').state;
  }
  function restore(raw) {
    try{
      var s=typeof raw==='string'?JSON.parse(raw):raw;
      if(!s||s.version!==1||!s.space||!Array.isArray(s.items)||s.items.length>500) return null;
      if(!Number.isFinite(s.space.w)||!Number.isFinite(s.space.l)||s.space.w<10||s.space.l<10||s.space.w>600||s.space.l>600||!Number.isFinite(s.space.margin)||s.space.margin<0||s.space.margin>15)return null;
      if(!Number.isInteger(s.guests)||s.guests<1||s.guests>5000||!['seated','standing'].includes(s.mode)||typeof s.chairs!=='boolean')return null;
      if(!Number.isSafeInteger(s.sequence)||s.sequence<0||s.sequence>1000000)return null;
      var ids=new Set();
      for(var i of s.items){
        if(!/^item-\d+$/.test(i.id)||ids.has(i.id)||Number(i.id.slice(5))>s.sequence||!Number.isFinite(i.x)||!Number.isFinite(i.y)||![0,90].includes(i.rot))return null;
        ids.add(i.id);
        if(i.kind==='tent'?!size(i.size):i.kind!=='table'||!tables[i.table])return null;
      }
      return issues(s).length?null:copy(s);
    }catch(_){return null;}
  }
  root.DhillonPlannerModel={sizes:sizes,tables:tables,size:size,copy:copy,dimensions:dimensions,bounds:bounds,contains:contains,label:label,issues:issues,capacity:capacity,tableLimit:tableLimit,move:move,tentativeMove:tentativeMove,rotate:rotate,remove:remove,addTent:addTent,addTable:addTable,arrange:arrange,quote:quote,suggestion:suggestion,seed:seed,restore:restore};
})(typeof window==='undefined'?globalThis:window);
