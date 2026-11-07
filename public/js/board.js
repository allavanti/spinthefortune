/* board.js - layout adattabile e disegno del tabellone (condiviso da schermo e backoffice) */
(function(g){
'use strict';

var IDEAL_RATIO=3.5;  // rapporto colonne/righe preferito a parita' di dimensione

function norm(ch){
  return ch.normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase();
}
function isLetter(ch){
  return /^[A-Z]$/.test(norm(ch));
}

/* "Categoria | frase" per riga; la categoria e' facoltativa */
function parsePhrases(text){
  var out=[];
  text.split(/\r?\n/).forEach(function(line){
    line=line.trim();
    if(!line)return;
    var cat='',ph=line;
    var p=line.indexOf('|');
    if(p>=0){cat=line.slice(0,p).trim();ph=line.slice(p+1).trim();}
    ph=ph.replace(/\s+/g,' ').toUpperCase();
    if(!/[A-ZÀ-ÿ]/.test(ph))return;
    out.push({cat:cat,text:ph});
  });
  return out;
}

/* caselle di una parola: l'apostrofo dopo una lettera sta nella stessa casella ("C'") */
function cellsOf(w){
  var out=[];
  for(var k=0;k<w.t.length;k++){
    var ch=w.t[k];
    var prev=out.length?out[out.length-1]:null;
    if((ch==="'"||ch==='’')&&prev&&prev.ch.length===1&&isLetter(prev.ch)){
      prev.ch+=ch;
    }else{
      out.push({ch:ch,i:w.i+k});
    }
  }
  return out;
}
function tokenize(phrase){
  var words=[],re=/\S+/g,m;
  while((m=re.exec(phrase))){
    var w={t:m[0],i:m.index};
    w.cells=cellsOf(w);
    w.n=w.cells.length;
    words.push(w);
  }
  return words;
}
function wrap(words,c){
  var lines=[],cur=[],len=0;
  words.forEach(function(w){
    var L=w.n;
    if(cur.length&&len+1+L>c){lines.push(cur);cur=[w];len=L;}
    else{len+=cur.length?1+L:L;cur.push(w);}
  });
  if(cur.length)lines.push(cur);
  return lines;
}
function fitSize(c,r,W,H,cap){
  var a=W/(c*(1+0.08)+0.42);
  var b=H/(r*(1+0.08)+0.42);
  return Math.min(cap,a,b);
}
function chooseLayout(phrase,W,H,cap,minCols){
  var words=tokenize(phrase);
  var maxW=0;
  words.forEach(function(w){if(w.n>maxW)maxW=w.n;});
  var minC=Math.max(maxW,minCols);
  var maxC=Math.max(minC,Math.min(30,phrase.length));
  var best=null;
  for(var c=minC;c<=maxC;c++){
    var lines=wrap(words,c);
    var size=fitSize(c,lines.length,W,H,cap);
    var dist=Math.abs(c/lines.length-IDEAL_RATIO);
    if(!best||size>best.size+0.5||(Math.abs(size-best.size)<=0.5&&dist<best.dist)){
      best={c:c,lines:lines,size:size,dist:dist};
    }
  }
  return best;
}

/*
 * Disegna il tabellone.
 * o.board     elemento .board
 * o.phrase    frase in maiuscolo
 * o.revealed  mappa indice-carattere -> true (lettere scoperte)
 * o.fresh     mappa delle lettere appena scoperte (animate), facoltativa
 * o.width/o.height  spazio disponibile in px
 * o.cap       dimensione massima casella, o.minCols colonne minime
 * Ritorna {complete,total,hidden}.
 */
function renderBoard(o){
  var board=o.board;
  var rev=o.revealed||{};
  var fresh=o.fresh||null;
  var lay=chooseLayout(o.phrase,o.width,o.height,o.cap||120,o.minCols||6);
  var size=Math.max(14,Math.floor(lay.size));
  board.style.setProperty('--cols',lay.c);
  board.style.setProperty('--cell',size+'px');
  board.style.setProperty('--gap',Math.max(2,Math.round(size*0.08))+'px');

  var fc=fresh?Object.keys(fresh).length:0;
  var step=fc>8?0.08:0.45;
  var delayN=0,hidden=0,total=0;
  var frag=document.createDocumentFragment();

  lay.lines.forEach(function(line){
    var cells=[];
    line.forEach(function(w,j){
      if(j)cells.push(null);
      w.cells.forEach(function(x){cells.push(x);});
    });
    var pad=Math.floor((lay.c-cells.length)/2);
    for(var col=0;col<lay.c;col++){
      var cd=cells[col-pad];
      var cell=document.createElement('div');
      if(col<pad||col-pad>=cells.length||!cd){
        cell.className='cell off';
      }else{
        cell.className='cell';
        var tile=document.createElement('div');
        tile.className='tile';
        tile.textContent=cd.ch;
        if(isLetter(cd.ch.charAt(0))){
          total++;
          tile.setAttribute('data-k',norm(cd.ch.charAt(0)));
          tile.setAttribute('data-i',cd.i);
          if(rev[cd.i]){
            tile.classList.add('show');
            if(fresh&&fresh[cd.i]){
              tile.classList.add('anim');
              tile.style.setProperty('--d',(delayN++*step)+'s');
            }
          }else{
            hidden++;
          }
        }else{
          tile.classList.add('show');
        }
        cell.appendChild(tile);
      }
      frag.appendChild(cell);
    }
  });
  board.innerHTML='';
  board.appendChild(frag);
  return {complete:total>0&&hidden===0,total:total,hidden:hidden};
}

g.RuotaBoard={norm:norm,isLetter:isLetter,parsePhrases:parsePhrases,renderBoard:renderBoard};
})(window);
