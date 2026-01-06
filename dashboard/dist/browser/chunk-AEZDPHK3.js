import{a as N}from"./chunk-VJCHUUGE.js";import{a as A,d as dt,e as ut,h as st,q as ct}from"./chunk-5TCPJESL.js";import{M as G,N as q,Y as R,ga as U,ha as p,ra as bt,wa as pt}from"./chunk-AILEILVM.js";import{o as P,v as z}from"./chunk-NKSM5XHW.js";import{$a as j,Cb as Q,Db as K,Ec as u,Fc as V,Hb as D,Ib as b,Ka as c,Lb as w,Mb as nt,N as T,Nb as h,O as x,Ob as m,P as $,Pa as f,T as y,Vb as d,Wb as ot,Xb as it,Y as B,Z as E,_a as M,aa as W,cb as L,cc as S,db as X,eb as F,ec as Y,fc as at,ka as g,mb as s,nb as I,ob as O,pc as rt,rb as tt,sb as et,tb as v,ub as _,uc as lt,vb as k,wb as H,xc as C}from"./chunk-73PELQKU.js";var gt=`
    .p-togglebutton {
        display: inline-flex;
        cursor: pointer;
        user-select: none;
        overflow: hidden;
        position: relative;
        color: dt('togglebutton.color');
        background: dt('togglebutton.background');
        border: 1px solid dt('togglebutton.border.color');
        padding: dt('togglebutton.padding');
        font-size: 1rem;
        font-family: inherit;
        font-feature-settings: inherit;
        transition:
            background dt('togglebutton.transition.duration'),
            color dt('togglebutton.transition.duration'),
            border-color dt('togglebutton.transition.duration'),
            outline-color dt('togglebutton.transition.duration'),
            box-shadow dt('togglebutton.transition.duration');
        border-radius: dt('togglebutton.border.radius');
        outline-color: transparent;
        font-weight: dt('togglebutton.font.weight');
    }

    .p-togglebutton-content {
        display: inline-flex;
        flex: 1 1 auto;
        align-items: center;
        justify-content: center;
        gap: dt('togglebutton.gap');
        padding: dt('togglebutton.content.padding');
        background: transparent;
        border-radius: dt('togglebutton.content.border.radius');
        transition:
            background dt('togglebutton.transition.duration'),
            color dt('togglebutton.transition.duration'),
            border-color dt('togglebutton.transition.duration'),
            outline-color dt('togglebutton.transition.duration'),
            box-shadow dt('togglebutton.transition.duration');
    }

    .p-togglebutton:not(:disabled):not(.p-togglebutton-checked):hover {
        background: dt('togglebutton.hover.background');
        color: dt('togglebutton.hover.color');
    }

    .p-togglebutton.p-togglebutton-checked {
        background: dt('togglebutton.checked.background');
        border-color: dt('togglebutton.checked.border.color');
        color: dt('togglebutton.checked.color');
    }

    .p-togglebutton-checked .p-togglebutton-content {
        background: dt('togglebutton.content.checked.background');
        box-shadow: dt('togglebutton.content.checked.shadow');
    }

    .p-togglebutton:focus-visible {
        box-shadow: dt('togglebutton.focus.ring.shadow');
        outline: dt('togglebutton.focus.ring.width') dt('togglebutton.focus.ring.style') dt('togglebutton.focus.ring.color');
        outline-offset: dt('togglebutton.focus.ring.offset');
    }

    .p-togglebutton.p-invalid {
        border-color: dt('togglebutton.invalid.border.color');
    }

    .p-togglebutton:disabled {
        opacity: 1;
        cursor: default;
        background: dt('togglebutton.disabled.background');
        border-color: dt('togglebutton.disabled.border.color');
        color: dt('togglebutton.disabled.color');
    }

    .p-togglebutton-label,
    .p-togglebutton-icon {
        position: relative;
        transition: none;
    }

    .p-togglebutton-icon {
        color: dt('togglebutton.icon.color');
    }

    .p-togglebutton:not(:disabled):not(.p-togglebutton-checked):hover .p-togglebutton-icon {
        color: dt('togglebutton.icon.hover.color');
    }

    .p-togglebutton.p-togglebutton-checked .p-togglebutton-icon {
        color: dt('togglebutton.icon.checked.color');
    }

    .p-togglebutton:disabled .p-togglebutton-icon {
        color: dt('togglebutton.icon.disabled.color');
    }

    .p-togglebutton-sm {
        padding: dt('togglebutton.sm.padding');
        font-size: dt('togglebutton.sm.font.size');
    }

    .p-togglebutton-sm .p-togglebutton-content {
        padding: dt('togglebutton.content.sm.padding');
    }

    .p-togglebutton-lg {
        padding: dt('togglebutton.lg.padding');
        font-size: dt('togglebutton.lg.font.size');
    }

    .p-togglebutton-lg .p-togglebutton-content {
        padding: dt('togglebutton.content.lg.padding');
    }

    .p-togglebutton-fluid {
        width: 100%;
    }
`;var Tt=["icon"],Bt=["content"],mt=e=>({$implicit:e});function Et(e,r){e&1&&Q(0)}function Mt(e,r){if(e&1&&H(0,"span"),e&2){let t=b(3);d(t.cn(t.cx("icon"),t.checked?t.onIcon:t.offIcon,t.iconPos==="left"?t.cx("iconLeft"):t.cx("iconRight"))),s("data-pc-section","icon")}}function Lt(e,r){if(e&1&&I(0,Mt,1,3,"span",1),e&2){let t=b(2);O(t.onIcon||t.offIcon?0:-1)}}function Ft(e,r){e&1&&Q(0)}function It(e,r){if(e&1&&F(0,Ft,1,0,"ng-container",0),e&2){let t=b(2);v("ngTemplateOutlet",t.iconTemplate||t._iconTemplate)("ngTemplateOutletContext",Y(2,mt,t.checked))}}function Ot(e,r){if(e&1&&(I(0,Lt,1,1)(1,It,1,4,"ng-container"),_(2,"span"),ot(3),k()),e&2){let t=b();O(t.iconTemplate?1:0),c(2),d(t.cx("label")),s("data-pc-section","label"),c(),it(t.checked?t.hasOnLabel?t.onLabel:"\xA0":t.hasOffLabel?t.offLabel:"\xA0")}}var Dt=`
    ${gt}

    /* For PrimeNG (iconPos) */
    .p-togglebutton-icon-right {
        order: 1;
    }

    .p-togglebutton.ng-invalid.ng-dirty {
        border-color: dt('togglebutton.invalid.border.color');
    }
`,St={root:({instance:e})=>["p-togglebutton p-component",{"p-togglebutton-checked":e.checked,"p-invalid":e.invalid(),"p-disabled":e.$disabled(),"p-togglebutton-sm p-inputfield-sm":e.size==="small","p-togglebutton-lg p-inputfield-lg":e.size==="large","p-togglebutton-fluid":e.fluid()}],content:"p-togglebutton-content",icon:"p-togglebutton-icon",iconLeft:"p-togglebutton-icon-left",iconRight:"p-togglebutton-icon-right",label:"p-togglebutton-label"},ft=(()=>{class e extends R{name="togglebutton";theme=Dt;classes=St;static \u0275fac=(()=>{let t;return function(o){return(t||(t=g(e)))(o||e)}})();static \u0275prov=x({token:e,factory:e.\u0275fac})}return e})();var Vt={provide:A,useExisting:T(()=>J),multi:!0},J=(()=>{class e extends N{onKeyDown(t){switch(t.code){case"Enter":this.toggle(t),t.preventDefault();break;case"Space":this.toggle(t),t.preventDefault();break}}toggle(t){!this.$disabled()&&!(this.allowEmpty===!1&&this.checked)&&(this.checked=!this.checked,this.writeModelValue(this.checked),this.onModelChange(this.checked),this.onModelTouched(),this.onChange.emit({originalEvent:t,checked:this.checked}),this.cd.markForCheck())}onLabel="Yes";offLabel="No";onIcon;offIcon;ariaLabel;ariaLabelledBy;styleClass;inputId;tabindex=0;iconPos="left";autofocus;size;allowEmpty;fluid=C(void 0,{transform:u});onChange=new f;iconTemplate;contentTemplate;templates;checked=!1;ngOnInit(){super.ngOnInit(),(this.checked===null||this.checked===void 0)&&(this.checked=!1)}_componentStyle=y(ft);onBlur(){this.onModelTouched()}get hasOnLabel(){return this.onLabel&&this.onLabel.length>0}get hasOffLabel(){return this.offLabel&&this.offLabel.length>0}get active(){return this.checked===!0}_iconTemplate;_contentTemplate;ngAfterContentInit(){this.templates.forEach(t=>{switch(t.getType()){case"icon":this._iconTemplate=t.template;break;case"content":this._contentTemplate=t.template;break;default:this._contentTemplate=t.template;break}})}writeControlValue(t,n){this.checked=t,n(t),this.cd.markForCheck()}static \u0275fac=(()=>{let t;return function(o){return(t||(t=g(e)))(o||e)}})();static \u0275cmp=M({type:e,selectors:[["p-toggleButton"],["p-togglebutton"],["p-toggle-button"]],contentQueries:function(n,o,i){if(n&1&&(w(i,Tt,4),w(i,Bt,4),w(i,U,4)),n&2){let a;h(a=m())&&(o.iconTemplate=a.first),h(a=m())&&(o.contentTemplate=a.first),h(a=m())&&(o.templates=a)}},hostVars:7,hostBindings:function(n,o){n&1&&D("keydown",function(a){return o.onKeyDown(a)})("click",function(a){return o.toggle(a)}),n&2&&(s("aria-labelledby",o.ariaLabelledBy)("aria-label",o.ariaLabel)("aria-pressed",o.checked?"true":"false")("role","button")("tabindex",o.tabindex!==void 0?o.tabindex:o.$disabled()?-1:0),d(o.cn(o.cx("root"),o.styleClass)))},inputs:{onLabel:"onLabel",offLabel:"offLabel",onIcon:"onIcon",offIcon:"offIcon",ariaLabel:"ariaLabel",ariaLabelledBy:"ariaLabelledBy",styleClass:"styleClass",inputId:"inputId",tabindex:[2,"tabindex","tabindex",V],iconPos:"iconPos",autofocus:[2,"autofocus","autofocus",u],size:"size",allowEmpty:"allowEmpty",fluid:[1,"fluid"]},outputs:{onChange:"onChange"},features:[S([Vt,ft]),X([pt]),L],decls:3,vars:7,consts:[[4,"ngTemplateOutlet","ngTemplateOutletContext"],[3,"class"]],template:function(n,o){n&1&&(_(0,"span"),F(1,Et,1,0,"ng-container",0),I(2,Ot,4,5),k()),n&2&&(d(o.cx("content")),c(),v("ngTemplateOutlet",o.contentTemplate||o._contentTemplate)("ngTemplateOutletContext",Y(5,mt,o.checked)),c(),O(o.contentTemplate?-1:2))},dependencies:[z,P,p],encapsulation:2,changeDetection:0})}return e})();var yt=`
    .p-selectbutton {
        display: inline-flex;
        user-select: none;
        vertical-align: bottom;
        outline-color: transparent;
        border-radius: dt('selectbutton.border.radius');
    }

    .p-selectbutton .p-togglebutton {
        border-radius: 0;
        border-width: 1px 1px 1px 0;
    }

    .p-selectbutton .p-togglebutton:focus-visible {
        position: relative;
        z-index: 1;
    }

    .p-selectbutton .p-togglebutton:first-child {
        border-inline-start-width: 1px;
        border-start-start-radius: dt('selectbutton.border.radius');
        border-end-start-radius: dt('selectbutton.border.radius');
    }

    .p-selectbutton .p-togglebutton:last-child {
        border-start-end-radius: dt('selectbutton.border.radius');
        border-end-end-radius: dt('selectbutton.border.radius');
    }

    .p-selectbutton.p-invalid {
        outline: 1px solid dt('selectbutton.invalid.border.color');
        outline-offset: 0;
    }

    .p-selectbutton-fluid {
        width: 100%;
    }
    
    .p-selectbutton-fluid .p-togglebutton {
        flex: 1 1 0;
    }
`;var zt=["item"],At=(e,r)=>({$implicit:e,index:r});function Rt(e,r){return this.getOptionLabel(r)}function Nt(e,r){e&1&&Q(0)}function $t(e,r){if(e&1&&F(0,Nt,1,0,"ng-container",3),e&2){let t=b(2),n=t.$implicit,o=t.$index,i=b();v("ngTemplateOutlet",i.itemTemplate||i._itemTemplate)("ngTemplateOutletContext",at(2,At,n,o))}}function jt(e,r){e&1&&F(0,$t,1,5,"ng-template",null,0,rt)}function Qt(e,r){if(e&1){let t=K();_(0,"p-togglebutton",2),D("onChange",function(o){let i=B(t),a=i.$implicit,l=i.$index,Z=b();return E(Z.onOptionSelect(o,a,l))}),I(1,jt,2,0),k()}if(e&2){let t=r.$implicit,n=b();v("autofocus",n.autofocus)("styleClass",n.styleClass)("ngModel",n.isSelected(t))("onLabel",n.getOptionLabel(t))("offLabel",n.getOptionLabel(t))("disabled",n.$disabled()||n.isOptionDisabled(t))("allowEmpty",n.getAllowEmpty())("size",n.size())("fluid",n.fluid()),c(),O(n.itemTemplate||n._itemTemplate?1:-1)}}var qt=`
    ${yt}

    /* For PrimeNG */
    .p-selectbutton.ng-invalid.ng-dirty {
        outline: 1px solid dt('selectbutton.invalid.border.color');
        outline-offset: 0;
    }
`,Ht={root:({instance:e})=>["p-selectbutton p-component",{"p-invalid":e.invalid(),"p-selectbutton-fluid":e.fluid()}]},vt=(()=>{class e extends R{name="selectbutton";theme=qt;classes=Ht;static \u0275fac=(()=>{let t;return function(o){return(t||(t=g(e)))(o||e)}})();static \u0275prov=x({token:e,factory:e.\u0275fac})}return e})();var Kt={provide:A,useExisting:T(()=>_t),multi:!0},_t=(()=>{class e extends N{options;optionLabel;optionValue;optionDisabled;get unselectable(){return this._unselectable}_unselectable=!1;set unselectable(t){this._unselectable=t,this.allowEmpty=!t}tabindex=0;multiple;allowEmpty=!0;styleClass;ariaLabelledBy;dataKey;autofocus;size=C();fluid=C(void 0,{transform:u});onOptionClick=new f;onChange=new f;itemTemplate;_itemTemplate;get equalityKey(){return this.optionValue?null:this.dataKey}value;focusedIndex=0;_componentStyle=y(vt);getAllowEmpty(){return this.multiple?this.allowEmpty||this.value?.length!==1:this.allowEmpty}getOptionLabel(t){return this.optionLabel?G(t,this.optionLabel):t.label!=null?t.label:t}getOptionValue(t){return this.optionValue?G(t,this.optionValue):this.optionLabel||t.value===void 0?t:t.value}isOptionDisabled(t){return this.optionDisabled?G(t,this.optionDisabled):t.disabled!==void 0?t.disabled:!1}onOptionSelect(t,n,o){if(this.$disabled()||this.isOptionDisabled(n))return;let i=this.isSelected(n);if(i&&this.unselectable)return;let a=this.getOptionValue(n),l;if(this.multiple)i?l=this.value.filter(Z=>!q(Z,a,this.equalityKey||void 0)):l=this.value?[...this.value,a]:[a];else{if(i&&!this.allowEmpty)return;l=i?null:a}this.focusedIndex=o,this.value=l,this.writeModelValue(this.value),this.onModelChange(this.value),this.onChange.emit({originalEvent:t,value:this.value}),this.onOptionClick.emit({originalEvent:t,option:n,index:o})}changeTabIndexes(t,n){let o,i;for(let a=0;a<=this.el.nativeElement.children.length-1;a++)this.el.nativeElement.children[a].getAttribute("tabindex")==="0"&&(o={elem:this.el.nativeElement.children[a],index:a});n==="prev"?o.index===0?i=this.el.nativeElement.children.length-1:i=o.index-1:o.index===this.el.nativeElement.children.length-1?i=0:i=o.index+1,this.focusedIndex=i,this.el.nativeElement.children[i].focus()}onFocus(t,n){this.focusedIndex=n}onBlur(){this.onModelTouched()}removeOption(t){this.value=this.value.filter(n=>!q(n,this.getOptionValue(t),this.dataKey))}isSelected(t){let n=!1,o=this.getOptionValue(t);if(this.multiple){if(this.value&&Array.isArray(this.value)){for(let i of this.value)if(q(i,o,this.dataKey)){n=!0;break}}}else n=q(this.getOptionValue(t),this.value,this.equalityKey||void 0);return n}templates;ngAfterContentInit(){this.templates.forEach(t=>{switch(t.getType()){case"item":this._itemTemplate=t.template;break}})}writeControlValue(t,n){this.value=t,n(this.value),this.cd.markForCheck()}static \u0275fac=(()=>{let t;return function(o){return(t||(t=g(e)))(o||e)}})();static \u0275cmp=M({type:e,selectors:[["p-selectButton"],["p-selectbutton"],["p-select-button"]],contentQueries:function(n,o,i){if(n&1&&(w(i,zt,4),w(i,U,4)),n&2){let a;h(a=m())&&(o.itemTemplate=a.first),h(a=m())&&(o.templates=a)}},hostVars:6,hostBindings:function(n,o){n&2&&(s("role","group")("aria-labelledby",o.ariaLabelledBy)("data-pc-section","root")("data-pc-name","selectbutton"),d(o.cx("root")))},inputs:{options:"options",optionLabel:"optionLabel",optionValue:"optionValue",optionDisabled:"optionDisabled",unselectable:[2,"unselectable","unselectable",u],tabindex:[2,"tabindex","tabindex",V],multiple:[2,"multiple","multiple",u],allowEmpty:[2,"allowEmpty","allowEmpty",u],styleClass:"styleClass",ariaLabelledBy:"ariaLabelledBy",dataKey:"dataKey",autofocus:[2,"autofocus","autofocus",u],size:[1,"size"],fluid:[1,"fluid"]},outputs:{onOptionClick:"onOptionClick",onChange:"onChange"},features:[S([Kt,vt]),L],decls:2,vars:0,consts:[["content",""],[3,"autofocus","styleClass","ngModel","onLabel","offLabel","disabled","allowEmpty","size","fluid"],[3,"onChange","autofocus","styleClass","ngModel","onLabel","offLabel","disabled","allowEmpty","size","fluid"],[4,"ngTemplateOutlet","ngTemplateOutletContext"]],template:function(n,o){n&1&&tt(0,Qt,2,10,"p-togglebutton",1,Rt,!0),n&2&&et(o.options)},dependencies:[J,ct,ut,st,z,P,p],encapsulation:2,changeDetection:0})}return e})(),ze=(()=>{class e{static \u0275fac=function(n){return new(n||e)};static \u0275mod=j({type:e});static \u0275inj=$({imports:[_t,p,p]})}return e})();var kt=`
    .p-radiobutton {
        position: relative;
        display: inline-flex;
        user-select: none;
        vertical-align: bottom;
        width: dt('radiobutton.width');
        height: dt('radiobutton.height');
    }

    .p-radiobutton-input {
        cursor: pointer;
        appearance: none;
        position: absolute;
        top: 0;
        inset-inline-start: 0;
        width: 100%;
        height: 100%;
        padding: 0;
        margin: 0;
        opacity: 0;
        z-index: 1;
        outline: 0 none;
        border: 1px solid transparent;
        border-radius: 50%;
    }

    .p-radiobutton-box {
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: 50%;
        border: 1px solid dt('radiobutton.border.color');
        background: dt('radiobutton.background');
        width: dt('radiobutton.width');
        height: dt('radiobutton.height');
        transition:
            background dt('radiobutton.transition.duration'),
            color dt('radiobutton.transition.duration'),
            border-color dt('radiobutton.transition.duration'),
            box-shadow dt('radiobutton.transition.duration'),
            outline-color dt('radiobutton.transition.duration');
        outline-color: transparent;
        box-shadow: dt('radiobutton.shadow');
    }

    .p-radiobutton-icon {
        transition-duration: dt('radiobutton.transition.duration');
        background: transparent;
        font-size: dt('radiobutton.icon.size');
        width: dt('radiobutton.icon.size');
        height: dt('radiobutton.icon.size');
        border-radius: 50%;
        backface-visibility: hidden;
        transform: translateZ(0) scale(0.1);
    }

    .p-radiobutton:not(.p-disabled):has(.p-radiobutton-input:hover) .p-radiobutton-box {
        border-color: dt('radiobutton.hover.border.color');
    }

    .p-radiobutton-checked .p-radiobutton-box {
        border-color: dt('radiobutton.checked.border.color');
        background: dt('radiobutton.checked.background');
    }

    .p-radiobutton-checked .p-radiobutton-box .p-radiobutton-icon {
        background: dt('radiobutton.icon.checked.color');
        transform: translateZ(0) scale(1, 1);
        visibility: visible;
    }

    .p-radiobutton-checked:not(.p-disabled):has(.p-radiobutton-input:hover) .p-radiobutton-box {
        border-color: dt('radiobutton.checked.hover.border.color');
        background: dt('radiobutton.checked.hover.background');
    }

    .p-radiobutton:not(.p-disabled):has(.p-radiobutton-input:hover).p-radiobutton-checked .p-radiobutton-box .p-radiobutton-icon {
        background: dt('radiobutton.icon.checked.hover.color');
    }

    .p-radiobutton:not(.p-disabled):has(.p-radiobutton-input:focus-visible) .p-radiobutton-box {
        border-color: dt('radiobutton.focus.border.color');
        box-shadow: dt('radiobutton.focus.ring.shadow');
        outline: dt('radiobutton.focus.ring.width') dt('radiobutton.focus.ring.style') dt('radiobutton.focus.ring.color');
        outline-offset: dt('radiobutton.focus.ring.offset');
    }

    .p-radiobutton-checked:not(.p-disabled):has(.p-radiobutton-input:focus-visible) .p-radiobutton-box {
        border-color: dt('radiobutton.checked.focus.border.color');
    }

    .p-radiobutton.p-invalid > .p-radiobutton-box {
        border-color: dt('radiobutton.invalid.border.color');
    }

    .p-radiobutton.p-variant-filled .p-radiobutton-box {
        background: dt('radiobutton.filled.background');
    }

    .p-radiobutton.p-variant-filled.p-radiobutton-checked .p-radiobutton-box {
        background: dt('radiobutton.checked.background');
    }

    .p-radiobutton.p-variant-filled:not(.p-disabled):has(.p-radiobutton-input:hover).p-radiobutton-checked .p-radiobutton-box {
        background: dt('radiobutton.checked.hover.background');
    }

    .p-radiobutton.p-disabled {
        opacity: 1;
    }

    .p-radiobutton.p-disabled .p-radiobutton-box {
        background: dt('radiobutton.disabled.background');
        border-color: dt('radiobutton.checked.disabled.border.color');
    }

    .p-radiobutton-checked.p-disabled .p-radiobutton-box .p-radiobutton-icon {
        background: dt('radiobutton.icon.disabled.color');
    }

    .p-radiobutton-sm,
    .p-radiobutton-sm .p-radiobutton-box {
        width: dt('radiobutton.sm.width');
        height: dt('radiobutton.sm.height');
    }

    .p-radiobutton-sm .p-radiobutton-icon {
        font-size: dt('radiobutton.icon.sm.size');
        width: dt('radiobutton.icon.sm.size');
        height: dt('radiobutton.icon.sm.size');
    }

    .p-radiobutton-lg,
    .p-radiobutton-lg .p-radiobutton-box {
        width: dt('radiobutton.lg.width');
        height: dt('radiobutton.lg.height');
    }

    .p-radiobutton-lg .p-radiobutton-icon {
        font-size: dt('radiobutton.icon.lg.size');
        width: dt('radiobutton.icon.lg.size');
        height: dt('radiobutton.icon.lg.size');
    }
`;var Pt=["input"],Gt=`
    ${kt}

    /* For PrimeNG */
    p-radioButton.ng-invalid.ng-dirty .p-radiobutton-box,
    p-radio-button.ng-invalid.ng-dirty .p-radiobutton-box,
    p-radiobutton.ng-invalid.ng-dirty .p-radiobutton-box {
        border-color: dt('radiobutton.invalid.border.color');
    }
`,Ut={root:({instance:e})=>["p-radiobutton p-component",{"p-radiobutton-checked":e.checked,"p-disabled":e.$disabled(),"p-invalid":e.invalid(),"p-variant-filled":e.$variant()==="filled","p-radiobutton-sm p-inputfield-sm":e.size()==="small","p-radiobutton-lg p-inputfield-lg":e.size()==="large"}],box:"p-radiobutton-box",input:"p-radiobutton-input",icon:"p-radiobutton-icon"},Ct=(()=>{class e extends R{name="radiobutton";theme=Gt;classes=Ut;static \u0275fac=(()=>{let t;return function(o){return(t||(t=g(e)))(o||e)}})();static \u0275prov=x({token:e,factory:e.\u0275fac})}return e})();var Zt={provide:A,useExisting:T(()=>xt),multi:!0},Yt=(()=>{class e{accessors=[];add(t,n){this.accessors.push([t,n])}remove(t){this.accessors=this.accessors.filter(n=>n[1]!==t)}select(t){this.accessors.forEach(n=>{this.isSameGroup(n,t)&&n[1]!==t&&n[1].writeValue(t.value)})}isSameGroup(t,n){return t[0].control?t[0].control.root===n.control.control.root&&t[1].name()===n.name():!1}static \u0275fac=function(n){return new(n||e)};static \u0275prov=x({token:e,factory:e.\u0275fac,providedIn:"root"})}return e})(),xt=(()=>{class e extends N{value;tabindex;inputId;ariaLabelledBy;ariaLabel;styleClass;autofocus;binary;variant=C();size=C();onClick=new f;onFocus=new f;onBlur=new f;inputViewChild;$variant=lt(()=>this.variant()||this.config.inputStyle()||this.config.inputVariant());checked;focused;control;_componentStyle=y(Ct);injector=y(W);registry=y(Yt);ngOnInit(){super.ngOnInit(),this.control=this.injector.get(dt),this.registry.add(this.control,this)}onChange(t){this.$disabled()||this.select(t)}select(t){this.$disabled()||(this.checked=!0,this.writeModelValue(this.checked),this.onModelChange(this.value),this.registry.select(this),this.onClick.emit({originalEvent:t,value:this.value}))}onInputFocus(t){this.focused=!0,this.onFocus.emit(t)}onInputBlur(t){this.focused=!1,this.onModelTouched(),this.onBlur.emit(t)}focus(){this.inputViewChild.nativeElement.focus()}writeControlValue(t,n){this.checked=this.binary?!!t:t==this.value,n(this.checked),this.cd.markForCheck()}ngOnDestroy(){this.registry.remove(this),super.ngOnDestroy()}static \u0275fac=(()=>{let t;return function(o){return(t||(t=g(e)))(o||e)}})();static \u0275cmp=M({type:e,selectors:[["p-radioButton"],["p-radiobutton"],["p-radio-button"]],viewQuery:function(n,o){if(n&1&&nt(Pt,5),n&2){let i;h(i=m())&&(o.inputViewChild=i.first)}},hostVars:4,hostBindings:function(n,o){n&2&&(s("data-pc-name","radiobutton")("data-pc-section","root"),d(o.cx("root")))},inputs:{value:"value",tabindex:[2,"tabindex","tabindex",V],inputId:"inputId",ariaLabelledBy:"ariaLabelledBy",ariaLabel:"ariaLabel",styleClass:"styleClass",autofocus:[2,"autofocus","autofocus",u],binary:[2,"binary","binary",u],variant:[1,"variant"],size:[1,"size"]},outputs:{onClick:"onClick",onFocus:"onFocus",onBlur:"onBlur"},features:[S([Zt,Ct]),L],decls:4,vars:19,consts:[["input",""],["type","radio",3,"focus","blur","change","checked","pAutoFocus"]],template:function(n,o){if(n&1){let i=K();_(0,"input",1,0),D("focus",function(l){return B(i),E(o.onInputFocus(l))})("blur",function(l){return B(i),E(o.onInputBlur(l))})("change",function(l){return B(i),E(o.onChange(l))}),k(),_(2,"div"),H(3,"div"),k()}n&2&&(d(o.cx("input")),v("checked",o.checked)("pAutoFocus",o.autofocus),s("id",o.inputId)("name",o.name())("required",o.required()?"":void 0)("disabled",o.$disabled()?"":void 0)("value",o.modelValue())("aria-labelledby",o.ariaLabelledBy)("aria-label",o.ariaLabel)("aria-checked",o.checked)("tabindex",o.tabindex),c(2),d(o.cx("box")),s("data-pc-section","input"),c(),d(o.cx("icon")),s("data-pc-section","icon"))},dependencies:[z,bt,p],encapsulation:2,changeDetection:0})}return e})(),tn=(()=>{class e{static \u0275fac=function(n){return new(n||e)};static \u0275mod=j({type:e});static \u0275inj=$({imports:[xt,p,p]})}return e})();export{ze as a,tn as b};
