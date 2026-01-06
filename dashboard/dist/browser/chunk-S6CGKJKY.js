import{a as ie}from"./chunk-PVQBJB4I.js";import{a as ae}from"./chunk-VJCHUUGE.js";import{a as W,d as Y}from"./chunk-5TCPJESL.js";import{N as ee,O as ne,Y as te,ga as oe,ha as w,ua as ce}from"./chunk-AILEILVM.js";import{i as K,k as X,o as Z,v as J}from"./chunk-NKSM5XHW.js";import{$a as Q,Ab as T,Bb as F,Db as A,Ec as x,Fc as U,Hb as $,Ib as h,Ka as d,Lb as B,Mb as q,N as z,Nb as y,O as E,Ob as I,P as D,Pa as g,T as N,Ub as R,Vb as l,Y as f,Z as m,_ as p,_a as _,cb as v,cc as G,eb as k,fa as O,fc as H,ja as L,ka as u,mb as s,tb as a,ub as V,uc as P,vb as M,wb as C,xc as S,zb as j}from"./chunk-73PELQKU.js";var be=["data-p-icon","minus"],re=(()=>{class e extends ce{static \u0275fac=(()=>{let t;return function(n){return(t||(t=u(e)))(n||e)}})();static \u0275cmp=_({type:e,selectors:[["","data-p-icon","minus"]],features:[v],attrs:be,decls:1,vars:0,consts:[["d","M13.2222 7.77778H0.777778C0.571498 7.77778 0.373667 7.69584 0.227806 7.54998C0.0819442 7.40412 0 7.20629 0 7.00001C0 6.79373 0.0819442 6.5959 0.227806 6.45003C0.373667 6.30417 0.571498 6.22223 0.777778 6.22223H13.2222C13.4285 6.22223 13.6263 6.30417 13.7722 6.45003C13.9181 6.5959 14 6.79373 14 7.00001C14 7.20629 13.9181 7.40412 13.7722 7.54998C13.6263 7.69584 13.4285 7.77778 13.2222 7.77778Z","fill","currentColor"]],template:function(o,n){o&1&&(p(),j(0,"path",0))},encapsulation:2})}return e})();var de=`
    .p-checkbox {
        position: relative;
        display: inline-flex;
        user-select: none;
        vertical-align: bottom;
        width: dt('checkbox.width');
        height: dt('checkbox.height');
    }

    .p-checkbox-input {
        cursor: pointer;
        appearance: none;
        position: absolute;
        inset-block-start: 0;
        inset-inline-start: 0;
        width: 100%;
        height: 100%;
        padding: 0;
        margin: 0;
        opacity: 0;
        z-index: 1;
        outline: 0 none;
        border: 1px solid transparent;
        border-radius: dt('checkbox.border.radius');
    }

    .p-checkbox-box {
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: dt('checkbox.border.radius');
        border: 1px solid dt('checkbox.border.color');
        background: dt('checkbox.background');
        width: dt('checkbox.width');
        height: dt('checkbox.height');
        transition:
            background dt('checkbox.transition.duration'),
            color dt('checkbox.transition.duration'),
            border-color dt('checkbox.transition.duration'),
            box-shadow dt('checkbox.transition.duration'),
            outline-color dt('checkbox.transition.duration');
        outline-color: transparent;
        box-shadow: dt('checkbox.shadow');
    }

    .p-checkbox-icon {
        transition-duration: dt('checkbox.transition.duration');
        color: dt('checkbox.icon.color');
        font-size: dt('checkbox.icon.size');
        width: dt('checkbox.icon.size');
        height: dt('checkbox.icon.size');
    }

    .p-checkbox:not(.p-disabled):has(.p-checkbox-input:hover) .p-checkbox-box {
        border-color: dt('checkbox.hover.border.color');
    }

    .p-checkbox-checked .p-checkbox-box {
        border-color: dt('checkbox.checked.border.color');
        background: dt('checkbox.checked.background');
    }

    .p-checkbox-checked .p-checkbox-icon {
        color: dt('checkbox.icon.checked.color');
    }

    .p-checkbox-checked:not(.p-disabled):has(.p-checkbox-input:hover) .p-checkbox-box {
        background: dt('checkbox.checked.hover.background');
        border-color: dt('checkbox.checked.hover.border.color');
    }

    .p-checkbox-checked:not(.p-disabled):has(.p-checkbox-input:hover) .p-checkbox-icon {
        color: dt('checkbox.icon.checked.hover.color');
    }

    .p-checkbox:not(.p-disabled):has(.p-checkbox-input:focus-visible) .p-checkbox-box {
        border-color: dt('checkbox.focus.border.color');
        box-shadow: dt('checkbox.focus.ring.shadow');
        outline: dt('checkbox.focus.ring.width') dt('checkbox.focus.ring.style') dt('checkbox.focus.ring.color');
        outline-offset: dt('checkbox.focus.ring.offset');
    }

    .p-checkbox-checked:not(.p-disabled):has(.p-checkbox-input:focus-visible) .p-checkbox-box {
        border-color: dt('checkbox.checked.focus.border.color');
    }

    .p-checkbox.p-invalid > .p-checkbox-box {
        border-color: dt('checkbox.invalid.border.color');
    }

    .p-checkbox.p-variant-filled .p-checkbox-box {
        background: dt('checkbox.filled.background');
    }

    .p-checkbox-checked.p-variant-filled .p-checkbox-box {
        background: dt('checkbox.checked.background');
    }

    .p-checkbox-checked.p-variant-filled:not(.p-disabled):has(.p-checkbox-input:hover) .p-checkbox-box {
        background: dt('checkbox.checked.hover.background');
    }

    .p-checkbox.p-disabled {
        opacity: 1;
    }

    .p-checkbox.p-disabled .p-checkbox-box {
        background: dt('checkbox.disabled.background');
        border-color: dt('checkbox.checked.disabled.border.color');
    }

    .p-checkbox.p-disabled .p-checkbox-box .p-checkbox-icon {
        color: dt('checkbox.icon.disabled.color');
    }

    .p-checkbox-sm,
    .p-checkbox-sm .p-checkbox-box {
        width: dt('checkbox.sm.width');
        height: dt('checkbox.sm.height');
    }

    .p-checkbox-sm .p-checkbox-icon {
        font-size: dt('checkbox.icon.sm.size');
        width: dt('checkbox.icon.sm.size');
        height: dt('checkbox.icon.sm.size');
    }

    .p-checkbox-lg,
    .p-checkbox-lg .p-checkbox-box {
        width: dt('checkbox.lg.width');
        height: dt('checkbox.lg.height');
    }

    .p-checkbox-lg .p-checkbox-icon {
        font-size: dt('checkbox.icon.lg.size');
        width: dt('checkbox.icon.lg.size');
        height: dt('checkbox.icon.lg.size');
    }
`;var pe=["icon"],ue=["input"],ke=(e,r)=>({checked:e,class:r});function xe(e,r){if(e&1&&C(0,"span",7),e&2){let t=h(3);l(t.cx("icon")),a("ngClass",t.checkboxIcon),s("data-pc-section","icon")}}function fe(e,r){if(e&1&&(p(),C(0,"svg",8)),e&2){let t=h(3);l(t.cx("icon")),s("data-pc-section","icon")}}function me(e,r){if(e&1&&(T(0),k(1,xe,1,4,"span",5)(2,fe,1,3,"svg",6),F()),e&2){let t=h(2);d(),a("ngIf",t.checkboxIcon),d(),a("ngIf",!t.checkboxIcon)}}function ge(e,r){if(e&1&&(p(),C(0,"svg",9)),e&2){let t=h(2);l(t.cx("icon")),s("data-pc-section","icon")}}function _e(e,r){if(e&1&&(T(0),k(1,me,3,2,"ng-container",2)(2,ge,1,3,"svg",4),F()),e&2){let t=h();d(),a("ngIf",t.checked),d(),a("ngIf",t._indeterminate())}}function ve(e,r){}function Ce(e,r){e&1&&k(0,ve,0,0,"ng-template")}var ye=`
    ${de}

    /* For PrimeNG */
    p-checkBox.ng-invalid.ng-dirty .p-checkbox-box,
    p-check-box.ng-invalid.ng-dirty .p-checkbox-box,
    p-checkbox.ng-invalid.ng-dirty .p-checkbox-box {
        border-color: dt('checkbox.invalid.border.color');
    }
`,Ie={root:({instance:e})=>["p-checkbox p-component",{"p-checkbox-checked p-highlight":e.checked,"p-disabled":e.$disabled(),"p-invalid":e.invalid(),"p-variant-filled":e.$variant()==="filled","p-checkbox-sm p-inputfield-sm":e.size()==="small","p-checkbox-lg p-inputfield-lg":e.size()==="large"}],box:"p-checkbox-box",input:"p-checkbox-input",icon:"p-checkbox-icon"},le=(()=>{class e extends te{name="checkbox";theme=ye;classes=Ie;static \u0275fac=(()=>{let t;return function(n){return(t||(t=u(e)))(n||e)}})();static \u0275prov=E({token:e,factory:e.\u0275fac})}return e})();var we={provide:W,useExisting:z(()=>se),multi:!0},se=(()=>{class e extends ae{value;binary;ariaLabelledBy;ariaLabel;tabindex;inputId;inputStyle;styleClass;inputClass;indeterminate=!1;formControl;checkboxIcon;readonly;autofocus;trueValue=!0;falseValue=!1;variant=S();size=S();onChange=new g;onFocus=new g;onBlur=new g;inputViewChild;get checked(){return this._indeterminate()?!1:this.binary?this.modelValue()===this.trueValue:ne(this.value,this.modelValue())}_indeterminate=O(void 0);checkboxIconTemplate;templates;_checkboxIconTemplate;focused=!1;_componentStyle=N(le);$variant=P(()=>this.variant()||this.config.inputStyle()||this.config.inputVariant());ngAfterContentInit(){this.templates?.forEach(t=>{switch(t.getType()){case"icon":this._checkboxIconTemplate=t.template;break;case"checkboxicon":this._checkboxIconTemplate=t.template;break}})}ngOnChanges(t){super.ngOnChanges(t),t.indeterminate&&this._indeterminate.set(t.indeterminate.currentValue)}updateModel(t){let o,n=this.injector.get(Y,null,{optional:!0,self:!0}),c=n&&!this.formControl?n.value:this.modelValue();this.binary?(o=this._indeterminate()?this.trueValue:this.checked?this.falseValue:this.trueValue,this.writeModelValue(o),this.onModelChange(o)):(this.checked||this._indeterminate()?o=c.filter(i=>!ee(i,this.value)):o=c?[...c,this.value]:[this.value],this.onModelChange(o),this.writeModelValue(o),this.formControl&&this.formControl.setValue(o)),this._indeterminate()&&this._indeterminate.set(!1),this.onChange.emit({checked:o,originalEvent:t})}handleChange(t){this.readonly||this.updateModel(t)}onInputFocus(t){this.focused=!0,this.onFocus.emit(t)}onInputBlur(t){this.focused=!1,this.onBlur.emit(t),this.onModelTouched()}focus(){this.inputViewChild?.nativeElement.focus()}writeControlValue(t,o){o(t),this.cd.markForCheck()}static \u0275fac=(()=>{let t;return function(n){return(t||(t=u(e)))(n||e)}})();static \u0275cmp=_({type:e,selectors:[["p-checkbox"],["p-checkBox"],["p-check-box"]],contentQueries:function(o,n,c){if(o&1&&(B(c,pe,4),B(c,oe,4)),o&2){let i;y(i=I())&&(n.checkboxIconTemplate=i.first),y(i=I())&&(n.templates=i)}},viewQuery:function(o,n){if(o&1&&q(ue,5),o&2){let c;y(c=I())&&(n.inputViewChild=c.first)}},hostVars:6,hostBindings:function(o,n){o&2&&(s("data-pc-name","checkbox")("data-p-highlight",n.checked)("data-p-checked",n.checked)("data-p-disabled",n.$disabled()),l(n.cn(n.cx("root"),n.styleClass)))},inputs:{value:"value",binary:[2,"binary","binary",x],ariaLabelledBy:"ariaLabelledBy",ariaLabel:"ariaLabel",tabindex:[2,"tabindex","tabindex",U],inputId:"inputId",inputStyle:"inputStyle",styleClass:"styleClass",inputClass:"inputClass",indeterminate:[2,"indeterminate","indeterminate",x],formControl:"formControl",checkboxIcon:"checkboxIcon",readonly:[2,"readonly","readonly",x],autofocus:[2,"autofocus","autofocus",x],trueValue:"trueValue",falseValue:"falseValue",variant:[1,"variant"],size:[1,"size"]},outputs:{onChange:"onChange",onFocus:"onFocus",onBlur:"onBlur"},features:[G([we,le]),v,L],decls:5,vars:22,consts:[["input",""],["type","checkbox",3,"focus","blur","change","checked"],[4,"ngIf"],[4,"ngTemplateOutlet","ngTemplateOutletContext"],["data-p-icon","minus",3,"class",4,"ngIf"],[3,"class","ngClass",4,"ngIf"],["data-p-icon","check",3,"class",4,"ngIf"],[3,"ngClass"],["data-p-icon","check"],["data-p-icon","minus"]],template:function(o,n){if(o&1){let c=A();V(0,"input",1,0),$("focus",function(b){return f(c),m(n.onInputFocus(b))})("blur",function(b){return f(c),m(n.onInputBlur(b))})("change",function(b){return f(c),m(n.handleChange(b))}),M(),V(2,"div"),k(3,_e,3,2,"ng-container",2)(4,Ce,1,0,null,3),M()}o&2&&(R(n.inputStyle),l(n.cn(n.cx("input"),n.inputClass)),a("checked",n.checked),s("id",n.inputId)("value",n.value)("name",n.name())("tabindex",n.tabindex)("required",n.required()?"":void 0)("readonly",n.readonly?"":void 0)("disabled",n.$disabled()?"":void 0)("aria-labelledby",n.ariaLabelledBy)("aria-label",n.ariaLabel),d(2),l(n.cx("box")),d(),a("ngIf",!n.checkboxIconTemplate&&!n._checkboxIconTemplate),d(),a("ngTemplateOutlet",n.checkboxIconTemplate||n._checkboxIconTemplate)("ngTemplateOutletContext",H(19,ke,n.checked,n.cx("icon"))))},dependencies:[J,K,X,Z,w,ie,re],encapsulation:2,changeDetection:0})}return e})(),Ze=(()=>{class e{static \u0275fac=function(o){return new(o||e)};static \u0275mod=Q({type:e});static \u0275inj=D({imports:[se,w,w]})}return e})();export{se as a,Ze as b};
