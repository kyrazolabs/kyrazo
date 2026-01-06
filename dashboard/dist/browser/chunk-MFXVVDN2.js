import{d as b,s as m}from"./chunk-5TCPJESL.js";import{Y as h,ma as y}from"./chunk-AILEILVM.js";import{$a as p,Ec as a,Hb as f,O as l,P as u,T as o,Vb as g,ab as s,cb as c,cc as x,ka as d,uc as v,xc as r}from"./chunk-73PELQKU.js";var M=`
    .p-inputtext {
        font-family: inherit;
        font-feature-settings: inherit;
        font-size: 1rem;
        color: dt('inputtext.color');
        background: dt('inputtext.background');
        padding-block: dt('inputtext.padding.y');
        padding-inline: dt('inputtext.padding.x');
        border: 1px solid dt('inputtext.border.color');
        transition:
            background dt('inputtext.transition.duration'),
            color dt('inputtext.transition.duration'),
            border-color dt('inputtext.transition.duration'),
            outline-color dt('inputtext.transition.duration'),
            box-shadow dt('inputtext.transition.duration');
        appearance: none;
        border-radius: dt('inputtext.border.radius');
        outline-color: transparent;
        box-shadow: dt('inputtext.shadow');
    }

    .p-inputtext:enabled:hover {
        border-color: dt('inputtext.hover.border.color');
    }

    .p-inputtext:enabled:focus {
        border-color: dt('inputtext.focus.border.color');
        box-shadow: dt('inputtext.focus.ring.shadow');
        outline: dt('inputtext.focus.ring.width') dt('inputtext.focus.ring.style') dt('inputtext.focus.ring.color');
        outline-offset: dt('inputtext.focus.ring.offset');
    }

    .p-inputtext.p-invalid {
        border-color: dt('inputtext.invalid.border.color');
    }

    .p-inputtext.p-variant-filled {
        background: dt('inputtext.filled.background');
    }

    .p-inputtext.p-variant-filled:enabled:hover {
        background: dt('inputtext.filled.hover.background');
    }

    .p-inputtext.p-variant-filled:enabled:focus {
        background: dt('inputtext.filled.focus.background');
    }

    .p-inputtext:disabled {
        opacity: 1;
        background: dt('inputtext.disabled.background');
        color: dt('inputtext.disabled.color');
    }

    .p-inputtext::placeholder {
        color: dt('inputtext.placeholder.color');
    }

    .p-inputtext.p-invalid::placeholder {
        color: dt('inputtext.invalid.placeholder.color');
    }

    .p-inputtext-sm {
        font-size: dt('inputtext.sm.font.size');
        padding-block: dt('inputtext.sm.padding.y');
        padding-inline: dt('inputtext.sm.padding.x');
    }

    .p-inputtext-lg {
        font-size: dt('inputtext.lg.font.size');
        padding-block: dt('inputtext.lg.padding.y');
        padding-inline: dt('inputtext.lg.padding.x');
    }

    .p-inputtext-fluid {
        width: 100%;
    }
`;var F=`
    ${M}

    /* For PrimeNG */
   .p-inputtext.ng-invalid.ng-dirty {
        border-color: dt('inputtext.invalid.border.color');
    }

    .p-inputtext.ng-invalid.ng-dirty::placeholder {
        color: dt('inputtext.invalid.placeholder.color');
    }
`,D={root:({instance:t})=>["p-inputtext p-component",{"p-filled":t.$filled(),"p-inputtext-sm":t.pSize==="small","p-inputtext-lg":t.pSize==="large","p-invalid":t.invalid(),"p-variant-filled":t.$variant()==="filled","p-inputtext-fluid":t.hasFluid}]},k=(()=>{class t extends h{name="inputtext";theme=F;classes=D;static \u0275fac=(()=>{let n;return function(i){return(n||(n=d(t)))(i||t)}})();static \u0275prov=l({token:t,factory:t.\u0275fac})}return t})();var G=(()=>{class t extends m{ngControl=o(b,{optional:!0,self:!0});pcFluid=o(y,{optional:!0,host:!0,skipSelf:!0});pSize;variant=r();fluid=r(void 0,{transform:a});invalid=r(void 0,{transform:a});$variant=v(()=>this.variant()||this.config.inputStyle()||this.config.inputVariant());_componentStyle=o(k);ngAfterViewInit(){super.ngAfterViewInit(),this.writeModelValue(this.ngControl?.value??this.el.nativeElement.value),this.cd.detectChanges()}ngDoCheck(){this.writeModelValue(this.ngControl?.value??this.el.nativeElement.value)}onInput(){this.writeModelValue(this.ngControl?.value??this.el.nativeElement.value)}get hasFluid(){return this.fluid()??!!this.pcFluid}static \u0275fac=(()=>{let n;return function(i){return(n||(n=d(t)))(i||t)}})();static \u0275dir=s({type:t,selectors:[["","pInputText",""]],hostVars:2,hostBindings:function(e,i){e&1&&f("input",function(I){return i.onInput(I)}),e&2&&g(i.cx("root"))},inputs:{pSize:"pSize",variant:[1,"variant"],fluid:[1,"fluid"],invalid:[1,"invalid"]},features:[x([k]),c]})}return t})(),L=(()=>{class t{static \u0275fac=function(e){return new(e||t)};static \u0275mod=p({type:t});static \u0275inj=u({})}return t})();export{G as a,L as b};
