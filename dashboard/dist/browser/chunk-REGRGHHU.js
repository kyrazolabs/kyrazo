import{Y as X,a as J,b as s,c as a,ha as f,l as Q,la as Y,m as _}from"./chunk-AILEILVM.js";import{i as U,k as Z,v as G}from"./chunk-NKSM5XHW.js";import{$a as g,Db as K,Ec as p,Ga as F,Hb as u,Ib as r,Jb as H,Ka as b,Kb as N,O as E,P as d,Pa as I,Qa as A,Rb as w,T as k,Ua as M,Va as h,Vb as v,Wb as P,Xb as W,Y as R,Z as T,_a as S,ab as j,cb as B,cc as q,eb as m,ka as C,ma as D,mb as z,pc as x,tb as o,ub as y,vb as L,wb as V}from"./chunk-73PELQKU.js";var pe=(()=>{class e{el;renderer;zone;constructor(t,i,n){this.el=t,this.renderer=i,this.zone=n}selector;enterFromClass;enterActiveClass;enterToClass;leaveFromClass;leaveActiveClass;leaveToClass;hideOnOutsideClick;toggleClass;hideOnEscape;hideOnResize;resizeSelector;eventListener;documentClickListener;documentKeydownListener;windowResizeListener;resizeObserver;target;enterListener;leaveListener;animating;_enterClass;_leaveClass;_resizeTarget;clickListener(){this.target||=_(this.selector,this.el.nativeElement),this.toggleClass?this.toggle():this.target?.offsetParent===null?this.enter():this.leave()}toggle(){J(this.target,this.toggleClass)?a(this.target,this.toggleClass):s(this.target,this.toggleClass)}enter(){this.enterActiveClass?this.animating||(this.animating=!0,this.enterActiveClass.includes("slidedown")&&(this.target.style.height="0px",a(this.target,this.enterFromClass||"hidden"),this.target.style.maxHeight=this.target.scrollHeight+"px",s(this.target,this.enterFromClass||"hidden"),this.target.style.height=""),s(this.target,this.enterActiveClass),this.enterFromClass&&a(this.target,this.enterFromClass),this.enterListener=this.renderer.listen(this.target,"animationend",()=>{a(this.target,this.enterActiveClass),this.enterToClass&&s(this.target,this.enterToClass),this.enterListener&&this.enterListener(),this.enterActiveClass?.includes("slidedown")&&(this.target.style.maxHeight=""),this.animating=!1})):(this.enterFromClass&&a(this.target,this.enterFromClass),this.enterToClass&&s(this.target,this.enterToClass)),this.hideOnOutsideClick&&this.bindDocumentClickListener(),this.hideOnEscape&&this.bindDocumentKeydownListener(),this.hideOnResize&&this.bindResizeListener()}leave(){this.leaveActiveClass?this.animating||(this.animating=!0,s(this.target,this.leaveActiveClass),this.leaveFromClass&&a(this.target,this.leaveFromClass),this.leaveListener=this.renderer.listen(this.target,"animationend",()=>{a(this.target,this.leaveActiveClass),this.leaveToClass&&s(this.target,this.leaveToClass),this.leaveListener&&this.leaveListener(),this.animating=!1})):(this.leaveFromClass&&a(this.target,this.leaveFromClass),this.leaveToClass&&s(this.target,this.leaveToClass)),this.hideOnOutsideClick&&this.unbindDocumentClickListener(),this.hideOnEscape&&this.unbindDocumentKeydownListener(),this.hideOnResize&&this.unbindResizeListener()}bindDocumentClickListener(){this.documentClickListener||(this.documentClickListener=this.renderer.listen(this.el.nativeElement.ownerDocument,"click",t=>{!this.isVisible()||getComputedStyle(this.target).getPropertyValue("position")==="static"?this.unbindDocumentClickListener():this.isOutsideClick(t)&&this.leave()}))}bindDocumentKeydownListener(){this.documentKeydownListener||this.zone.runOutsideAngular(()=>{this.documentKeydownListener=this.renderer.listen(this.el.nativeElement.ownerDocument,"keydown",t=>{let{key:i,keyCode:n,which:l,type:O}=t;(!this.isVisible()||getComputedStyle(this.target).getPropertyValue("position")==="static")&&this.unbindDocumentKeydownListener(),this.isVisible()&&i==="Escape"&&n===27&&l===27&&this.leave()})})}isVisible(){return this.target.offsetParent!==null}isOutsideClick(t){return!this.el.nativeElement.isSameNode(t.target)&&!this.el.nativeElement.contains(t.target)&&!this.target.contains(t.target)}unbindDocumentClickListener(){this.documentClickListener&&(this.documentClickListener(),this.documentClickListener=null)}unbindDocumentKeydownListener(){this.documentKeydownListener&&(this.documentKeydownListener(),this.documentKeydownListener=null)}bindResizeListener(){this._resizeTarget=_(this.resizeSelector),Q(this._resizeTarget)?this.bindElementResizeListener():this.bindWindowResizeListener()}unbindResizeListener(){this.unbindWindowResizeListener(),this.unbindElementResizeListener()}bindWindowResizeListener(){this.windowResizeListener||this.zone.runOutsideAngular(()=>{this.windowResizeListener=this.renderer.listen(window,"resize",()=>{this.isVisible()?this.leave():this.unbindWindowResizeListener()})})}unbindWindowResizeListener(){this.windowResizeListener&&(this.windowResizeListener(),this.windowResizeListener=null)}bindElementResizeListener(){if(!this.resizeObserver&&this._resizeTarget){let t=!0;this.resizeObserver=new ResizeObserver(()=>{if(t){t=!1;return}this.isVisible()&&this.leave()}),this.resizeObserver.observe(this._resizeTarget)}}unbindElementResizeListener(){this.resizeObserver&&(this.resizeObserver.disconnect(),this.resizeObserver=void 0)}ngOnDestroy(){this.target=null,this._resizeTarget=null,this.eventListener&&this.eventListener(),this.unbindDocumentClickListener(),this.unbindDocumentKeydownListener(),this.unbindResizeListener()}static \u0275fac=function(i){return new(i||e)(h(D),h(M),h(A))};static \u0275dir=j({type:e,selectors:[["","pStyleClass",""]],hostBindings:function(i,n){i&1&&u("click",function(O){return n.clickListener(O)})},inputs:{selector:[0,"pStyleClass","selector"],enterFromClass:"enterFromClass",enterActiveClass:"enterActiveClass",enterToClass:"enterToClass",leaveFromClass:"leaveFromClass",leaveActiveClass:"leaveActiveClass",leaveToClass:"leaveToClass",hideOnOutsideClick:[2,"hideOnOutsideClick","hideOnOutsideClick",p],toggleClass:"toggleClass",hideOnEscape:[2,"hideOnEscape","hideOnEscape",p],hideOnResize:[2,"hideOnResize","hideOnResize",p],resizeSelector:"resizeSelector"}})}return e})(),fe=(()=>{class e{static \u0275fac=function(i){return new(i||e)};static \u0275mod=g({type:e});static \u0275inj=d({})}return e})();var $=`
    .p-avatar {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: dt('avatar.width');
        height: dt('avatar.height');
        font-size: dt('avatar.font.size');
        background: dt('avatar.background');
        color: dt('avatar.color');
        border-radius: dt('avatar.border.radius');
    }

    .p-avatar-image {
        background: transparent;
    }

    .p-avatar-circle {
        border-radius: 50%;
    }

    .p-avatar-circle img {
        border-radius: 50%;
    }

    .p-avatar-icon {
        font-size: dt('avatar.icon.size');
        width: dt('avatar.icon.size');
        height: dt('avatar.icon.size');
    }

    .p-avatar img {
        width: 100%;
        height: 100%;
    }

    .p-avatar-lg {
        width: dt('avatar.lg.width');
        height: dt('avatar.lg.width');
        font-size: dt('avatar.lg.font.size');
    }

    .p-avatar-lg .p-avatar-icon {
        font-size: dt('avatar.lg.icon.size');
        width: dt('avatar.lg.icon.size');
        height: dt('avatar.lg.icon.size');
    }

    .p-avatar-xl {
        width: dt('avatar.xl.width');
        height: dt('avatar.xl.width');
        font-size: dt('avatar.xl.font.size');
    }

    .p-avatar-xl .p-avatar-icon {
        font-size: dt('avatar.xl.icon.size');
        width: dt('avatar.xl.icon.size');
        height: dt('avatar.xl.icon.size');
    }

    .p-avatar-group {
        display: flex;
        align-items: center;
    }

    .p-avatar-group .p-avatar + .p-avatar {
        margin-inline-start: dt('avatar.group.offset');
    }

    .p-avatar-group .p-avatar {
        border: 2px solid dt('avatar.group.border.color');
    }

    .p-avatar-group .p-avatar-lg + .p-avatar-lg {
        margin-inline-start: dt('avatar.lg.group.offset');
    }

    .p-avatar-group .p-avatar-xl + .p-avatar-xl {
        margin-inline-start: dt('avatar.xl.group.offset');
    }
`;var ie=["*"];function ne(e,c){if(e&1&&(y(0,"span"),P(1),L()),e&2){let t=r();v(t.cx("label")),b(),W(t.label)}}function se(e,c){if(e&1&&V(0,"span",4),e&2){let t=r(2);v(t.icon),o("ngClass",t.cx("icon"))}}function ae(e,c){if(e&1&&m(0,se,1,3,"span",3),e&2){let t=r(),i=w(5);o("ngIf",t.icon)("ngIfElse",i)}}function re(e,c){if(e&1){let t=K();y(0,"img",6),u("error",function(n){R(t);let l=r(2);return T(l.imageError(n))}),L()}if(e&2){let t=r(2);o("src",t.image,F),z("aria-label",t.ariaLabel)}}function le(e,c){if(e&1&&m(0,re,1,2,"img",5),e&2){let t=r();o("ngIf",t.image)}}var oe={root:({instance:e})=>["p-avatar p-component",{"p-avatar-image":e.image!=null,"p-avatar-circle":e.shape==="circle","p-avatar-lg":e.size==="large","p-avatar-xl":e.size==="xlarge"}],label:"p-avatar-label",icon:"p-avatar-icon"},ee=(()=>{class e extends X{name="avatar";theme=$;classes=oe;static \u0275fac=(()=>{let t;return function(n){return(t||(t=C(e)))(n||e)}})();static \u0275prov=E({token:e,factory:e.\u0275fac})}return e})();var ce=(()=>{class e extends Y{label;icon;image;size="normal";shape="square";styleClass;ariaLabel;ariaLabelledBy;onImageError=new I;_componentStyle=k(ee);imageError(t){this.onImageError.emit(t)}static \u0275fac=(()=>{let t;return function(n){return(t||(t=C(e)))(n||e)}})();static \u0275cmp=S({type:e,selectors:[["p-avatar"]],hostVars:5,hostBindings:function(i,n){i&2&&(z("data-pc-name","avatar")("aria-label",n.ariaLabel)("aria-labelledby",n.ariaLabelledBy),v(n.cn(n.cx("root"),n.styleClass)))},inputs:{label:"label",icon:"icon",image:"image",size:"size",shape:"shape",styleClass:"styleClass",ariaLabel:"ariaLabel",ariaLabelledBy:"ariaLabelledBy"},outputs:{onImageError:"onImageError"},features:[q([ee]),B],ngContentSelectors:ie,decls:6,vars:2,consts:[["iconTemplate",""],["imageTemplate",""],[3,"class",4,"ngIf","ngIfElse"],[3,"class","ngClass",4,"ngIf","ngIfElse"],[3,"ngClass"],[3,"src","error",4,"ngIf"],[3,"error","src"]],template:function(i,n){if(i&1&&(H(),N(0),m(1,ne,2,3,"span",2)(2,ae,1,2,"ng-template",null,0,x)(4,le,1,1,"ng-template",null,1,x)),i&2){let l=w(3);b(),o("ngIf",n.label)("ngIfElse",l)}},dependencies:[G,U,Z,f],encapsulation:2,changeDetection:0})}return e})(),Ae=(()=>{class e{static \u0275fac=function(i){return new(i||e)};static \u0275mod=g({type:e});static \u0275inj=d({imports:[ce,f,f]})}return e})();export{pe as a,fe as b,ce as c,Ae as d};
