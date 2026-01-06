import{T as N,Y as Z,b as d,c as f,ga as $,ha as M,la as G,w as K}from"./chunk-AILEILVM.js";import{o as W,v as j,x as O}from"./chunk-NKSM5XHW.js";import{$a as F,Cb as R,Db as I,Fc as q,Hb as y,Jb as H,Ka as h,Kb as U,Lb as V,Mb as B,Nb as u,O as E,Ob as p,P as S,Qa as k,T as C,Vb as m,Y as l,Z as a,_a as A,cb as x,cc as Q,eb as X,ka as L,mb as b,nb as Y,ob as P,tb as z,ub as v,vb as g}from"./chunk-73PELQKU.js";var J=`
    .p-scrollpanel-content-container {
        overflow: hidden;
        width: 100%;
        height: 100%;
        position: relative;
        z-index: 1;
        float: left;
    }

    .p-scrollpanel-content {
        height: calc(100% + calc(2 * dt('scrollpanel.bar.size')));
        width: calc(100% + calc(2 * dt('scrollpanel.bar.size')));
        padding-inline: 0 calc(2 * dt('scrollpanel.bar.size'));
        padding-block: 0 calc(2 * dt('scrollpanel.bar.size'));
        position: relative;
        overflow: auto;
        box-sizing: border-box;
        scrollbar-width: none;
    }

    .p-scrollpanel-content::-webkit-scrollbar {
        display: none;
    }

    .p-scrollpanel-bar {
        position: relative;
        border-radius: dt('scrollpanel.bar.border.radius');
        z-index: 2;
        cursor: pointer;
        opacity: 0;
        outline-color: transparent;
        background: dt('scrollpanel.bar.background');
        border: 0 none;
        transition:
            outline-color dt('scrollpanel.transition.duration'),
            opacity dt('scrollpanel.transition.duration');
    }

    .p-scrollpanel-bar:focus-visible {
        box-shadow: dt('scrollpanel.bar.focus.ring.shadow');
        outline: dt('scrollpanel.barfocus.ring.width') dt('scrollpanel.bar.focus.ring.style') dt('scrollpanel.bar.focus.ring.color');
        outline-offset: dt('scrollpanel.barfocus.ring.offset');
    }

    .p-scrollpanel-bar-y {
        width: dt('scrollpanel.bar.size');
        inset-block-start: 0;
    }

    .p-scrollpanel-bar-x {
        height: dt('scrollpanel.bar.size');
        inset-block-end: 0;
    }

    .p-scrollpanel-hidden {
        visibility: hidden;
    }

    .p-scrollpanel:hover .p-scrollpanel-bar,
    .p-scrollpanel:active .p-scrollpanel-bar {
        opacity: 1;
    }

    .p-scrollpanel-grabbed {
        user-select: none;
    }
`;var ee=["content"],oe=["xBar"],re=["yBar"],se=["*"];function le(r,ne){r&1&&U(0)}function ae(r,ne){r&1&&R(0)}var ce=`
    ${J}

    .p-scrollpanel {
        display: block;
    }
`,de={root:"p-scrollpanel p-component",contentContainer:"p-scrollpanel-content-container",content:"p-scrollpanel-content",barX:"p-scrollpanel-bar p-scrollpanel-bar-x",barY:"p-scrollpanel-bar p-scrollpanel-bar-y"},te=(()=>{class r extends Z{name="scrollpanel";theme=ce;classes=de;static \u0275fac=(()=>{let e;return function(t){return(e||(e=L(r)))(t||r)}})();static \u0275prov=E({token:r,factory:r.\u0275fac})}return r})();var he=(()=>{class r extends G{styleClass;step=5;contentViewChild;xBarViewChild;yBarViewChild;contentTemplate;templates;_contentTemplate;scrollYRatio;scrollXRatio;timeoutFrame=e=>setTimeout(e,0);initialized=!1;lastPageY;lastPageX;isXBarClicked=!1;isYBarClicked=!1;lastScrollLeft=0;lastScrollTop=0;orientation="vertical";timer;contentId;windowResizeListener;contentScrollListener;mouseEnterListener;xBarMouseDownListener;yBarMouseDownListener;documentMouseMoveListener;documentMouseUpListener;_componentStyle=C(te);zone=C(k);ngOnInit(){super.ngOnInit(),this.contentId=N("pn_id_")+"_content"}ngAfterViewInit(){super.ngAfterViewInit(),O(this.platformId)&&this.zone.runOutsideAngular(()=>{this.moveBar(),this.moveBar=this.moveBar.bind(this),this.onXBarMouseDown=this.onXBarMouseDown.bind(this),this.onYBarMouseDown=this.onYBarMouseDown.bind(this),this.onDocumentMouseMove=this.onDocumentMouseMove.bind(this),this.onDocumentMouseUp=this.onDocumentMouseUp.bind(this),this.windowResizeListener=this.renderer.listen(window,"resize",this.moveBar),this.contentScrollListener=this.renderer.listen(this.contentViewChild.nativeElement,"scroll",this.moveBar),this.mouseEnterListener=this.renderer.listen(this.contentViewChild.nativeElement,"mouseenter",this.moveBar),this.xBarMouseDownListener=this.renderer.listen(this.xBarViewChild.nativeElement,"mousedown",this.onXBarMouseDown),this.yBarMouseDownListener=this.renderer.listen(this.yBarViewChild.nativeElement,"mousedown",this.onYBarMouseDown),this.calculateContainerHeight(),this.initialized=!0})}ngAfterContentInit(){this.templates.forEach(e=>{switch(e.getType()){case"content":this._contentTemplate=e.template;break;default:this._contentTemplate=e.template;break}})}calculateContainerHeight(){let e=this.el.nativeElement,n=this.contentViewChild.nativeElement,t=this.xBarViewChild.nativeElement,i=this.document.defaultView,o=i.getComputedStyle(e),s=i.getComputedStyle(t),c=K(e)-parseInt(s.height,10);o["max-height"]!="none"&&c==0&&(n.offsetHeight+parseInt(s.height,10)>parseInt(o["max-height"],10)?e.style.height=o["max-height"]:e.style.height=n.offsetHeight+parseFloat(o.paddingTop)+parseFloat(o.paddingBottom)+parseFloat(o.borderTopWidth)+parseFloat(o.borderBottomWidth)+"px")}moveBar(){let e=this.el.nativeElement,n=this.contentViewChild.nativeElement,t=this.xBarViewChild.nativeElement,i=n.scrollWidth,o=n.clientWidth,s=(e.clientHeight-t.clientHeight)*-1;this.scrollXRatio=o/i;let c=this.yBarViewChild.nativeElement,D=n.scrollHeight,T=n.clientHeight,ie=(e.clientWidth-c.clientWidth)*-1;this.scrollYRatio=T/D,this.requestAnimationFrame(()=>{if(this.scrollXRatio>=1)t.setAttribute("data-p-scrollpanel-hidden","true"),d(t,"p-scrollpanel-hidden");else{t.setAttribute("data-p-scrollpanel-hidden","false"),f(t,"p-scrollpanel-hidden");let w=Math.max(this.scrollXRatio*100,10),_=Math.abs(n.scrollLeft*(100-w)/(i-o));t.style.cssText="width:"+w+"%; inset-inline-start:"+_+"%;bottom:"+s+"px;"}if(this.scrollYRatio>=1)c.setAttribute("data-p-scrollpanel-hidden","true"),d(c,"p-scrollpanel-hidden");else{c.setAttribute("data-p-scrollpanel-hidden","false"),f(c,"p-scrollpanel-hidden");let w=Math.max(this.scrollYRatio*100,10),_=n.scrollTop*(100-w)/(D-T);c.style.cssText="height:"+w+"%; top: calc("+_+"% - "+t.clientHeight+"px); inset-inline-end:"+ie+"px;"}}),this.cd.markForCheck()}onScroll(e){this.lastScrollLeft!==e.target.scrollLeft?(this.lastScrollLeft=e.target.scrollLeft,this.orientation="horizontal"):this.lastScrollTop!==e.target.scrollTop&&(this.lastScrollTop=e.target.scrollTop,this.orientation="vertical"),this.moveBar()}onKeyDown(e){if(this.orientation==="vertical")switch(e.code){case"ArrowDown":{this.setTimer("scrollTop",this.step),e.preventDefault();break}case"ArrowUp":{this.setTimer("scrollTop",this.step*-1),e.preventDefault();break}case"ArrowLeft":case"ArrowRight":{e.preventDefault();break}default:break}else if(this.orientation==="horizontal")switch(e.code){case"ArrowRight":{this.setTimer("scrollLeft",this.step),e.preventDefault();break}case"ArrowLeft":{this.setTimer("scrollLeft",this.step*-1),e.preventDefault();break}case"ArrowDown":case"ArrowUp":{e.preventDefault();break}default:break}}onKeyUp(){this.clearTimer()}repeat(e,n){this.contentViewChild?.nativeElement&&(this.contentViewChild.nativeElement[e]+=n),this.moveBar()}setTimer(e,n){this.clearTimer(),this.timer=setTimeout(()=>{this.repeat(e,n)},40)}clearTimer(){this.timer&&clearTimeout(this.timer)}bindDocumentMouseListeners(){this.documentMouseMoveListener||(this.documentMouseMoveListener=e=>{this.onDocumentMouseMove(e)},this.document.addEventListener("mousemove",this.documentMouseMoveListener)),this.documentMouseUpListener||(this.documentMouseUpListener=e=>{this.onDocumentMouseUp(e)},this.document.addEventListener("mouseup",this.documentMouseUpListener))}unbindDocumentMouseListeners(){this.documentMouseMoveListener&&(this.document.removeEventListener("mousemove",this.documentMouseMoveListener),this.documentMouseMoveListener=null),this.documentMouseUpListener&&(document.removeEventListener("mouseup",this.documentMouseUpListener),this.documentMouseUpListener=null)}onYBarMouseDown(e){this.isYBarClicked=!0,this.yBarViewChild?.nativeElement?.focus(),this.lastPageY=e.pageY,this.yBarViewChild?.nativeElement?.setAttribute("data-p-scrollpanel-grabbed","true"),d(this.yBarViewChild.nativeElement,"p-scrollpanel-grabbed"),this.document.body.setAttribute("data-p-scrollpanel-grabbed","true"),d(this.document.body,"p-scrollpanel-grabbed"),this.bindDocumentMouseListeners(),e.preventDefault()}onXBarMouseDown(e){this.isXBarClicked=!0,this.xBarViewChild?.nativeElement?.focus(),this.lastPageX=e.pageX,this.xBarViewChild?.nativeElement?.setAttribute("data-p-scrollpanel-grabbed","false"),d(this.xBarViewChild.nativeElement,"p-scrollpanel-grabbed"),this.document.body.setAttribute("data-p-scrollpanel-grabbed","false"),d(this.document.body,"p-scrollpanel-grabbed"),this.bindDocumentMouseListeners(),e.preventDefault()}onDocumentMouseMove(e){this.isXBarClicked?this.onMouseMoveForXBar(e):this.isYBarClicked?this.onMouseMoveForYBar(e):(this.onMouseMoveForXBar(e),this.onMouseMoveForYBar(e))}onMouseMoveForXBar(e){let n=e.pageX-this.lastPageX;this.lastPageX=e.pageX,this.requestAnimationFrame(()=>{this.contentViewChild.nativeElement.scrollLeft+=n/this.scrollXRatio})}onMouseMoveForYBar(e){let n=e.pageY-this.lastPageY;this.lastPageY=e.pageY,this.requestAnimationFrame(()=>{this.contentViewChild.nativeElement.scrollTop+=n/this.scrollYRatio})}scrollTop(e){let n=this.contentViewChild.nativeElement.scrollHeight-this.contentViewChild.nativeElement.clientHeight;e=e>n?n:e>0?e:0,this.contentViewChild.nativeElement.scrollTop=e}onFocus(e){this.xBarViewChild?.nativeElement?.isSameNode(e.target)?this.orientation="horizontal":this.yBarViewChild?.nativeElement?.isSameNode(e.target)&&(this.orientation="vertical")}onBlur(){this.orientation==="horizontal"&&(this.orientation="vertical")}onDocumentMouseUp(e){this.yBarViewChild?.nativeElement?.setAttribute("data-p-scrollpanel-grabbed","false"),f(this.yBarViewChild.nativeElement,"p-scrollpanel-grabbed"),this.xBarViewChild?.nativeElement?.setAttribute("data-p-scrollpanel-grabbed","false"),f(this.xBarViewChild.nativeElement,"p-scrollpanel-grabbed"),this.document.body.setAttribute("data-p-scrollpanel-grabbed","false"),f(this.document.body,"p-scrollpanel-grabbed"),this.unbindDocumentMouseListeners(),this.isXBarClicked=!1,this.isYBarClicked=!1}requestAnimationFrame(e){(window.requestAnimationFrame||this.timeoutFrame)(e)}unbindListeners(){this.windowResizeListener&&(this.windowResizeListener(),this.windowResizeListener=null),this.contentScrollListener&&(this.contentScrollListener(),this.contentScrollListener=null),this.mouseEnterListener&&(this.mouseEnterListener(),this.mouseEnterListener=null),this.xBarMouseDownListener&&(this.xBarMouseDownListener(),this.xBarMouseDownListener=null),this.yBarMouseDownListener&&(this.yBarMouseDownListener(),this.yBarMouseDownListener=null)}ngOnDestroy(){this.initialized&&this.unbindListeners()}refresh(){this.moveBar()}static \u0275fac=(()=>{let e;return function(t){return(e||(e=L(r)))(t||r)}})();static \u0275cmp=A({type:r,selectors:[["p-scroll-panel"],["p-scrollPanel"],["p-scrollpanel"]],contentQueries:function(n,t,i){if(n&1&&(V(i,ee,4),V(i,$,4)),n&2){let o;u(o=p())&&(t.contentTemplate=o.first),u(o=p())&&(t.templates=o)}},viewQuery:function(n,t){if(n&1&&(B(ee,5),B(oe,5),B(re,5)),n&2){let i;u(i=p())&&(t.contentViewChild=i.first),u(i=p())&&(t.xBarViewChild=i.first),u(i=p())&&(t.yBarViewChild=i.first)}},hostAttrs:["data-pc-name","scrollpanel"],hostVars:2,hostBindings:function(n,t){n&2&&m(t.cn(t.cx("root"),t.styleClass))},inputs:{styleClass:"styleClass",step:[2,"step","step",q]},features:[Q([te]),x],ngContentSelectors:se,decls:9,vars:20,consts:[["content",""],["xBar",""],["yBar",""],[3,"mouseenter","scroll"],[4,"ngTemplateOutlet"],["tabindex","0","role","scrollbar",3,"mousedown","keydown","keyup","focus","blur"],["tabindex","0","role","scrollbar",3,"mousedown","keydown","keyup","focus"]],template:function(n,t){if(n&1){let i=I();H(),v(0,"div")(1,"div",3,0),y("mouseenter",function(){return l(i),a(t.moveBar())})("scroll",function(s){return l(i),a(t.onScroll(s))}),Y(3,le,1,0),X(4,ae,1,0,"ng-container",4),g()(),v(5,"div",5,1),y("mousedown",function(s){return l(i),a(t.onXBarMouseDown(s))})("keydown",function(s){return l(i),a(t.onKeyDown(s))})("keyup",function(){return l(i),a(t.onKeyUp())})("focus",function(s){return l(i),a(t.onFocus(s))})("blur",function(){return l(i),a(t.onBlur())}),g(),v(7,"div",6,2),y("mousedown",function(s){return l(i),a(t.onYBarMouseDown(s))})("keydown",function(s){return l(i),a(t.onKeyDown(s))})("keyup",function(){return l(i),a(t.onKeyUp())})("focus",function(s){return l(i),a(t.onFocus(s))}),g()}n&2&&(m(t.cx("contentContainer")),b("data-pc-section","wrapper"),h(),m(t.cx("content")),b("data-pc-section","content"),h(2),P(!t.contentTemplate&&!t._contentTemplate?3:-1),h(),z("ngTemplateOutlet",t.contentTemplate||t._contentTemplate),h(),m(t.cx("barX")),b("aria-orientation","horizontal")("aria-valuenow",t.lastScrollLeft)("data-pc-section","barx")("aria-controls",t.contentId),h(2),m(t.cx("barY")),b("aria-orientation","vertical")("aria-valuenow",t.lastScrollTop)("data-pc-section","bary")("aria-controls",t.contentId))},dependencies:[j,W,M],encapsulation:2,changeDetection:0})}return r})(),ke=(()=>{class r{static \u0275fac=function(n){return new(n||r)};static \u0275mod=F({type:r});static \u0275inj=S({imports:[he,M,M]})}return r})();export{ke as a};
